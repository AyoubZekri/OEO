import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeech } from '@capacitor-community/speech-recognition';

/* The browser's speech recognition (Chrome, Edge, Safari): not in TypeScript's DOM types */
interface RecognitionAlternative { transcript: string; confidence: number }
interface RecognitionResult { isFinal: boolean; length: number; [i: number]: RecognitionAlternative }
interface RecognitionEvent { resultIndex: number; results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;

const recognitionCtor = (): RecognitionCtor | null => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

// Errors that end the recording, without a word (the others — silence, a cut — only start the next phrase)
const FATAL = ['not-allowed', 'service-not-allowed', 'audio-capture', 'network'];

/**
 * The dialect (ar-DZ) and classical Arabic (ar-SA), chosen by the speech itself: the browser cannot tell them apart,
 * so the first phrase is heard as the dialect, the second as classical Arabic, then each phrase in the one the engine
 * has been surer of so far (its average confidence), weighed again with every phrase.
 */
type Dialect = 'ar-DZ' | 'ar-SA';

/** A result's surest wording (the engine gives several) */
const best = (r: RecognitionResult) => {
  let pick = r[0];
  for (let i = 1; i < r.length; i++) if ((r[i]?.confidence ?? 0) > (pick?.confidence ?? 0)) pick = r[i];
  return { text: (pick?.transcript || '').trim(), confidence: pick?.confidence ?? 0 };
};

/** In the Android app (Capacitor): the phone's own speech recognition (its WebView has none) */
const NATIVE = Capacitor.isNativePlatform();

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * A voice note: spoken into the microphone and written as it is said, in the dialect or classical Arabic as the speech
 * goes (see Dialect). It listens phrase by phrase — each phrase heard once, then the next — so a phone does not repeat
 * what was said; it keeps the engine's surest wording. Once it stops, the text can be corrected by hand; speaking again
 * adds to it, and it can be cleared to record it again. autoStart: it listens as soon as it opens. What is still being
 * heard when it closes is kept. In the Android app it is the phone's own recognition (NATIVE), phrase by phrase too.
 */
export const VoiceInput: React.FC<{ value: string; onChange: (v: string) => void; autoStart?: boolean }> = ({ value, onChange, autoStart }) => {
  const Ctor = recognitionCtor();
  const supported = NATIVE || Boolean(Ctor);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<Recognition | null>(null);
  // The field grows with its text (one line when short)
  const field = useRef<HTMLTextAreaElement>(null);
  // Still wanted: when a phrase ends, the next one starts (until stopped)
  const wanted = useRef(false);
  // How sure the engine was in each (sum of confidences, phrases heard)
  const scores = useRef<Record<Dialect, { sum: number; n: number }>>({ 'ar-DZ': { sum: 0, n: 0 }, 'ar-SA': { sum: 0, n: 0 } });
  // The latest text and what is still being heard (kept when it closes mid-sentence)
  const latest = useRef({ value, interim: '', onChange });
  useLayoutEffect(() => {
    latest.current = { value, interim, onChange };
  });

  // The next phrase starts from here (listen itself, once it is made)
  const next = useRef<() => void>(() => undefined);

  // One phrase: heard, written, then the next one (while still wanted)
  const listen = useCallback(() => {
    if (!Ctor) return;
    // Each dialect tried once, then the surer one so far
    const s = scores.current;
    const lang: Dialect = !s['ar-DZ'].n ? 'ar-DZ' : !s['ar-SA'].n ? 'ar-SA'
      : s['ar-SA'].sum / s['ar-SA'].n > s['ar-DZ'].sum / s['ar-DZ'].n ? 'ar-SA' : 'ar-DZ';
    const r = new Ctor();
    r.lang = lang;
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 3;
    r.onresult = e => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const { text: part, confidence } = best(e.results[i]);
        if (!part) continue;
        if (e.results[i].isFinal) {
          s[lang].sum += confidence || 0.5;
          s[lang].n += 1;
          const { value: text, onChange: save } = latest.current;
          const joined = [text, part].filter(Boolean).join(' ');
          latest.current.value = joined;
          save(joined);
        } else live += `${part} `;
      }
      setInterim(live.trim());
    };
    r.onerror = e => {
      if (FATAL.includes(e.error)) wanted.current = false;
    };
    r.onend = () => {
      setInterim('');
      if (wanted.current) next.current();
      else setListening(false);
    };
    rec.current = r;
    try {
      r.start();
    } catch {
      wanted.current = false;
      setListening(false);
    }
  }, [Ctor]);

  useLayoutEffect(() => {
    next.current = listen;
  }, [listen]);

  // The Android app: the phone's recognition — the phrase so far as it comes, written when the phone stops listening
  const phrase = useRef('');
  const commit = () => {
    const part = phrase.current.trim();
    phrase.current = '';
    setInterim('');
    if (!part) return;
    const { value: text, onChange: save } = latest.current;
    const joined = [text, part].filter(Boolean).join(' ');
    latest.current.value = joined;
    save(joined);
  };
  const nativePhrase = () => {
    NativeSpeech.start({ language: 'ar-DZ', partialResults: true, popup: false, maxResults: 3 }).catch(() => {
      wanted.current = false;
      setListening(false);
    });
  };
  const startNative = async () => {
    try {
      let perm = await NativeSpeech.checkPermissions();
      if (perm.speechRecognition !== 'granted') perm = await NativeSpeech.requestPermissions();
      if (perm.speechRecognition !== 'granted') throw new Error('no microphone');
      await NativeSpeech.removeAllListeners();
      await NativeSpeech.addListener('partialResults', d => {
        phrase.current = (d.matches?.[0] || '').trim();
        setInterim(phrase.current);
      });
      await NativeSpeech.addListener('listeningState', d => {
        if (d.status !== 'stopped') return;
        commit();
        // The next phrase, until stopped
        if (wanted.current) nativePhrase();
        else setListening(false);
      });
      nativePhrase();
    } catch {
      wanted.current = false;
      setListening(false);
    }
  };

  const start = useCallback(() => {
    if (!supported) return;
    setSeconds(0);
    wanted.current = true;
    setListening(true);
    if (NATIVE) startNative();
    else listen();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- startNative reads refs only
  }, [supported, listen]);

  const stop = () => {
    wanted.current = false;
    if (NATIVE) NativeSpeech.stop().catch(() => setListening(false));
    else rec.current?.stop();
  };

  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, listening]);

  // The time it has been listening
  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => setSeconds(x => x + 1), 1000);
    return () => window.clearInterval(id);
  }, [listening]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the listening dialog starts recording at once
    if (autoStart) start();
    return () => {
      wanted.current = false;
      if (NATIVE) {
        NativeSpeech.removeAllListeners().catch(() => undefined);
        NativeSpeech.stop().catch(() => undefined);
        if (phrase.current) latest.current.onChange([latest.current.value, phrase.current].filter(Boolean).join(' '));
        return;
      }
      const r = rec.current;
      if (!r) return;
      r.onresult = null;
      r.onend = null;
      r.abort();
      const { value: text, interim: heard, onChange: save } = latest.current;
      if (heard) save([text, heard].filter(Boolean).join(' '));
    };
  }, [autoStart, start]);


  return (
    <div className={`tsk-rec ${listening ? 'live' : ''}`}>
      <div className="tsk-rec-stage">
        {supported && <div className="tsk-rec-mic-wrap">
          <button type="button" className="tsk-rec-mic" onClick={listening ? stop : start} aria-label={listening ? 'إيقاف التسجيل' : 'بدء التسجيل'}>
            {listening ? <Square size={26} fill="currentColor" /> : <Mic size={34} strokeWidth={1.8} />}
          </button>
        </div>}
        <div className="tsk-rec-wave" aria-hidden="true">
          {Array.from({ length: 21 }, (_, i) => <span key={i} style={{ animationDelay: `${(i % 7) * 0.09}s` }} />)}
        </div>
        <span className="tsk-rec-time" dir="ltr" aria-hidden={!listening}>{clock(seconds)}</span>
      </div>

      {/* The words: as they are heard, then to correct (always there; with no speech in the browser, typed) */}
      <div className="tsk-rec-field">
        {listening ? (
          <p className="tsk-rec-text" aria-live="polite">
            {value}{interim && <span>{value ? ' ' : ''}{interim}</span>}<i className="tsk-rec-caret" />
          </p>
        ) : (
          <textarea ref={field} className="tsk-rec-text" value={value} rows={1} onChange={e => onChange(e.target.value)} aria-label="نص التنبيه" />
        )}
        {value && !listening && (
          <button type="button" className="tsk-rec-clear" onClick={() => { onChange(''); setInterim(''); }} aria-label="إعادة التسجيل" title="إعادة التسجيل">
            <RotateCcw size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
