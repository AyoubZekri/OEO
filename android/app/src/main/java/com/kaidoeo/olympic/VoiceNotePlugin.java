package com.kaidoeo.olympic;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaCodec;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelFileDescriptor;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.ByteBuffer;
import java.util.ArrayList;

/**
 * A voice note on the phone, written and recorded at once, on every Android version. A phone gives its microphone to
 * one listener (the screen's app wins, Google's recognition is silenced), so:
 * - Android 13 and newer: the app hears the microphone itself (AudioRecord, the recording kept whole) and shares the
 *   same sound with Android's speech recognition (a pipe, EXTRA_AUDIO_SOURCE); the words come as they are said
 *   («partial», then «final» for each phrase, the recognition starting again for the next one);
 * - older ones, or a recognition that will not take the pipe: Google's own voice window hears one phrase and gives
 *   both its words and its sound (GET_AUDIO), the sound decoded into the same recording; it ends after the phrase
 *   («end»), a new start adds the next one.
 * start({ window: true }) asks for the voice window straight away, its answer holding the phrase's words.
 * stop gives the recording (WAV, 16 kHz mono). Started again, it adds to the same recording, until cleared.
 */
@CapacitorPlugin(name = "VoiceNote", permissions = { @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone") })
public class VoiceNotePlugin extends Plugin {

    private static final int RATE = 16000;

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ByteArrayOutputStream pcm = new ByteArrayOutputStream();
    private AudioRecord record;
    private Thread reader;
    // Listening (the words)
    private volatile boolean running;
    // Recording with the app's own microphone (Android 13+)
    private volatile boolean reading;
    // Where the sound goes to the recognition (the current phrase's pipe)
    private volatile OutputStream feed;
    private ParcelFileDescriptor source;
    private SpeechRecognizer recognizer;
    private String language = "ar-DZ";
    // The start waiting for the first words (or for the voice window, if the pipe is refused)
    private PluginCall pending;
    // Phrases with no words while someone was speaking: the pipe is not heard
    private int failures;
    private boolean heardWords;
    // The pipe was refused on this phone: Google's voice window from now on
    private static boolean pipeRefused;
    // The loudest sound recorded
    private volatile int peak;

    @PluginMethod
    public void available(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphoneAnswered");
            return;
        }
        begin(call);
    }

    @PermissionCallback
    private void microphoneAnswered(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) begin(call);
        else call.reject("no microphone");
    }

    private void begin(PluginCall call) {
        if (running) {
            call.resolve();
            return;
        }
        language = call.getString("language", "ar-DZ");
        running = true;
        // Asked for: Google's voice window straight away (one phrase, its words given with the start's answer)
        if (Boolean.TRUE.equals(call.getBoolean("window", false))) {
            window(call);
        } else if (Build.VERSION.SDK_INT >= 33 && !pipeRefused && startReading()) {
            failures = 0;
            heardWords = false;
            pending = call;
            main.post(this::listen);
        } else {
            window(call);
        }
    }

    // ── Android 13+: the app's microphone, shared with the recognition ──

    @SuppressLint("MissingPermission")
    private boolean startReading() {
        int min = AudioRecord.getMinBufferSize(RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        try {
            record = new AudioRecord(MediaRecorder.AudioSource.VOICE_RECOGNITION, RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, Math.max(min, RATE));
            record.startRecording();
        } catch (Exception e) {
            release();
            return false;
        }
        reading = true;
        final AudioRecord rec = record;
        reader = new Thread(() -> {
            byte[] buf = new byte[3200];
            while (reading) {
                int n;
                try {
                    n = rec.read(buf, 0, buf.length);
                } catch (Exception e) {
                    break;
                }
                if (n <= 0) continue;
                keep(buf, n, false);
                OutputStream out = feed;
                if (out == null) continue;
                try {
                    out.write(buf, 0, n);
                } catch (IOException ignored) {
                    // The recognition closed its end: the next phrase opens another
                }
            }
        });
        reader.start();
        return true;
    }

    /** One phrase: the recognition hears the shared sound, then the next one */
    private void listen() {
        if (!running || !reading || Build.VERSION.SDK_INT < 33) return;
        try {
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                recognizer.setRecognitionListener(listener);
            }
            closeFeed();
            ParcelFileDescriptor[] pipe = ParcelFileDescriptor.createPipe();
            source = pipe[0];
            Intent i = recognizeIntent();
            i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, pipe[0]);
            i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, 1);
            i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, AudioFormat.ENCODING_PCM_16BIT);
            i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, RATE);
            feed = new ParcelFileDescriptor.AutoCloseOutputStream(pipe[1]);
            recognizer.startListening(i);
        } catch (Exception e) {
            refusePipe();
        }
    }

    private final RecognitionListener listener = new RecognitionListener() {
        @Override public void onReadyForSpeech(Bundle params) {}
        @Override public void onBeginningOfSpeech() {}
        @Override public void onRmsChanged(float rmsdB) {}
        @Override public void onBufferReceived(byte[] buffer) {}
        @Override public void onEndOfSpeech() {}
        @Override public void onEvent(int eventType, Bundle params) {}

        @Override
        public void onPartialResults(Bundle partial) {
            String text = first(partial);
            if (text.isEmpty()) return;
            heardWords = true;
            settle();
            event("partial", "text", text);
        }

        @Override
        public void onResults(Bundle results) {
            failures = 0;
            String text = first(results);
            if (!text.isEmpty()) {
                heardWords = true;
                settle();
                event("final", "text", text);
            }
            next();
        }

        @Override
        public void onError(int error) {
            boolean quiet = error == SpeechRecognizer.ERROR_NO_MATCH || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT;
            // Nothing understood although someone spoke, or a real error, before any words: the pipe is not heard
            if (running && !heardWords && (!quiet || peak > 1500) && ++failures >= 3) {
                refusePipe();
                return;
            }
            next();
        }
    };

    /** The pipe is not heard on this phone: the recording so far is kept, and Google's voice window takes over */
    private void refusePipe() {
        pipeRefused = true;
        stopReading();
        if (recognizer != null) recognizer.cancel();
        PluginCall call = pending;
        pending = null;
        if (call != null && running) window(call);
        else finish();
    }

    /** While still listening, the next phrase; otherwise it has ended */
    private void next() {
        if (running && reading) main.postDelayed(this::listen, 60);
        else finish();
    }

    /** The start answered once the words come (it was kept for the voice window) */
    private void settle() {
        PluginCall call = pending;
        pending = null;
        if (call != null) call.resolve();
    }

    // ── Older phones: Google's voice window (one phrase, its words and its sound) ──

    private void window(PluginCall call) {
        Intent i = recognizeIntent();
        i.putExtra(RecognizerIntent.EXTRA_PROMPT, "");
        i.putExtra("android.speech.extra.GET_AUDIO_FORMAT", "audio/AMR");
        i.putExtra("android.speech.extra.GET_AUDIO", true);
        try {
            startActivityForResult(call, i, "windowAnswered");
        } catch (Exception e) {
            running = false;
            call.reject("no recognition");
            finish();
        }
    }

    @ActivityCallback
    private void windowAnswered(PluginCall call, ActivityResult result) {
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null) {
            running = false;
            call.resolve();
            finish();
            return;
        }
        ArrayList<String> words = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        String text = words == null || words.isEmpty() || words.get(0) == null ? "" : words.get(0).trim();
        Uri sound = data.getData();
        new Thread(() -> {
            if (sound != null) decode(sound);
            main.post(() -> {
                if (!text.isEmpty()) event("final", "text", text);
                running = false;
                JSObject r = new JSObject();
                r.put("text", text);
                call.resolve(r);
                finish();
            });
        }).start();
    }

    /** The voice window's sound (AMR) into the recording, as 16 kHz PCM */
    private void decode(Uri uri) {
        MediaExtractor ex = new MediaExtractor();
        MediaCodec codec = null;
        try {
            ex.setDataSource(getContext(), uri, null);
            MediaFormat format = null;
            for (int t = 0; t < ex.getTrackCount(); t++) {
                MediaFormat f = ex.getTrackFormat(t);
                String mime = f.getString(MediaFormat.KEY_MIME);
                if (mime != null && mime.startsWith("audio/")) {
                    ex.selectTrack(t);
                    format = f;
                    break;
                }
            }
            if (format == null) return;
            int rate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE);
            codec = MediaCodec.createDecoderByType(format.getString(MediaFormat.KEY_MIME));
            codec.configure(format, null, null, 0);
            codec.start();
            MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();
            boolean inDone = false;
            for (int guard = 0; guard < 200000; guard++) {
                if (!inDone) {
                    int in = codec.dequeueInputBuffer(10000);
                    if (in >= 0) {
                        ByteBuffer b = codec.getInputBuffer(in);
                        int n = b == null ? -1 : ex.readSampleData(b, 0);
                        if (n < 0) {
                            codec.queueInputBuffer(in, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM);
                            inDone = true;
                        } else {
                            codec.queueInputBuffer(in, 0, n, ex.getSampleTime(), 0);
                            ex.advance();
                        }
                    }
                }
                int out = codec.dequeueOutputBuffer(info, 10000);
                if (out == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED) {
                    rate = codec.getOutputFormat().getInteger(MediaFormat.KEY_SAMPLE_RATE);
                } else if (out >= 0) {
                    ByteBuffer b = codec.getOutputBuffer(out);
                    if (b != null && info.size > 0) {
                        byte[] chunk = new byte[info.size];
                        b.position(info.offset);
                        b.get(chunk, 0, info.size);
                        keep(chunk, chunk.length, rate == 8000);
                    }
                    codec.releaseOutputBuffer(out, false);
                    if ((info.flags & MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) break;
                }
            }
        } catch (Exception ignored) {
            // No sound from the window: the words only
        } finally {
            if (codec != null) {
                try {
                    codec.stop();
                } catch (Exception ignored) {
                }
                codec.release();
            }
            ex.release();
        }
    }

    // ── Both ──

    /** Stops listening: the phrase still being heard is finished, and the recording given */
    @PluginMethod
    public void stop(PluginCall call) {
        running = false;
        stopReading();
        main.postDelayed(() -> {
            if (recognizer != null) recognizer.stopListening();
        }, 50);
        settle();
        JSObject r = new JSObject();
        synchronized (pcm) {
            r.put("audio", pcm.size() > 0 && peak > 300 ? Base64.encodeToString(wav(pcm.toByteArray()), Base64.NO_WRAP) : null);
        }
        r.put("mime", "audio/wav");
        call.resolve(r);
    }

    /** Recorded again from nothing */
    @PluginMethod
    public void clear(PluginCall call) {
        synchronized (pcm) {
            pcm.reset();
        }
        peak = 0;
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        running = false;
        stopReading();
        main.post(() -> {
            if (recognizer != null) recognizer.destroy();
            recognizer = null;
        });
    }

    private void finish() {
        closeFeed();
        settle();
        event("end", null, null);
    }

    /** 16-bit PCM into the recording (8 kHz doubled to 16 kHz), its loudest sound noted */
    private void keep(byte[] buf, int n, boolean doubled) {
        for (int i = 0; i + 1 < n; i += 2) {
            int v = Math.abs((short) ((buf[i] & 0xff) | (buf[i + 1] << 8)));
            if (v > peak) peak = v;
        }
        synchronized (pcm) {
            if (!doubled) {
                pcm.write(buf, 0, n);
                return;
            }
            for (int i = 0; i + 1 < n; i += 2) {
                pcm.write(buf[i]);
                pcm.write(buf[i + 1]);
                pcm.write(buf[i]);
                pcm.write(buf[i + 1]);
            }
        }
    }

    private Intent recognizeIntent() {
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        return i;
    }

    /** The app's microphone stops (Android 13+) */
    private void stopReading() {
        reading = false;
        if (reader != null) {
            try {
                reader.join(500);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }
            reader = null;
        }
        closeFeed();
        release();
    }

    private void release() {
        if (record == null) return;
        try {
            record.stop();
        } catch (Exception ignored) {
        }
        record.release();
        record = null;
    }

    private void closeFeed() {
        OutputStream out = feed;
        feed = null;
        if (out != null) {
            try {
                out.close();
            } catch (IOException ignored) {
            }
        }
        if (source != null) {
            try {
                source.close();
            } catch (IOException ignored) {
            }
            source = null;
        }
    }

    private void event(String name, String key, String value) {
        JSObject data = new JSObject();
        if (key != null) data.put(key, value);
        notifyListeners(name, data);
    }

    private static String first(Bundle b) {
        ArrayList<String> list = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        return list == null || list.isEmpty() || list.get(0) == null ? "" : list.get(0).trim();
    }

    /** 16-bit mono PCM at RATE, as a WAV file */
    private static byte[] wav(byte[] data) {
        int byteRate = RATE * 2;
        ByteArrayOutputStream out = new ByteArrayOutputStream(44 + data.length);
        writeAscii(out, "RIFF");
        writeInt(out, 36 + data.length);
        writeAscii(out, "WAVE");
        writeAscii(out, "fmt ");
        writeInt(out, 16);
        writeShort(out, 1);
        writeShort(out, 1);
        writeInt(out, RATE);
        writeInt(out, byteRate);
        writeShort(out, 2);
        writeShort(out, 16);
        writeAscii(out, "data");
        writeInt(out, data.length);
        out.write(data, 0, data.length);
        return out.toByteArray();
    }

    private static void writeAscii(ByteArrayOutputStream out, String s) {
        for (int i = 0; i < s.length(); i++) out.write(s.charAt(i));
    }

    private static void writeInt(ByteArrayOutputStream out, int v) {
        out.write(v & 0xff);
        out.write((v >> 8) & 0xff);
        out.write((v >> 16) & 0xff);
        out.write((v >> 24) & 0xff);
    }

    private static void writeShort(ByteArrayOutputStream out, int v) {
        out.write(v & 0xff);
        out.write((v >> 8) & 0xff);
    }
}
