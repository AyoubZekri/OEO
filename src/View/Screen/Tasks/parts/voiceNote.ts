import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * Where a voice note can be made: the Android app and a computer's browser — not a phone's browser (its microphone
 * goes to the writing or to the recording, not to both)
 */
export const VOICE_NOTES = Capacitor.isNativePlatform() || !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

/**
 * The Android app's own voice note (android/…/VoiceNotePlugin.java): written and recorded at once — the words as they
 * are said on Android 13+, or Google's voice window (one phrase, its words and its sound) on any phone
 */
interface VoiceNotePlugin {
  available: () => Promise<{ available: boolean }>;
  start: (o: { language: string; window?: boolean }) => Promise<{ text?: string } | undefined>;
  stop: () => Promise<{ audio: string | null; mime: string }>;
  clear: () => Promise<void>;
  addListener: (event: 'partial' | 'final' | 'end' | 'error', f: (d: { text?: string }) => void) => Promise<PluginListenerHandle>;
  removeAllListeners: () => Promise<void>;
}
export const VoiceNote = registerPlugin<VoiceNotePlugin>('VoiceNote');

/** The recording the app gives (base64) as a file */
export const fromBase64 = (b64: string, type: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
};

/** One voice note in Google's voice window: its words and its recording (nothing said or closed: no words) */
export const recordInWindow = async (): Promise<{ text: string; audio: Blob | null }> => {
  await VoiceNote.removeAllListeners();
  await VoiceNote.clear();
  const answer = await VoiceNote.start({ language: 'ar-DZ', window: true });
  const r = await VoiceNote.stop();
  return { text: (answer?.text || '').trim(), audio: r.audio ? fromBase64(r.audio, r.mime) : null };
};
