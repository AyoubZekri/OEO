import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw, AlertCircle } from 'lucide-react';

/* The browser's speech recognition (Chrome, Edge, Safari): not in TypeScript's DOM types */
interface RecognitionResult { isFinal: boolean; 0: { transcript: string } }
interface RecognitionEvent { results: ArrayLike<RecognitionResult> }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
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

const ERRORS: Record<string, string> = {
  'not-allowed': 'اسمح للتطبيق باستعمال الميكروفون من إعدادات المتصفح',
  'service-not-allowed': 'اسمح للتطبيق باستعمال الميكروفون من إعدادات المتصفح',
  'no-speech': 'لم يُسمع أي كلام، اضغط وتكلم',
  'audio-capture': 'لا يوجد ميكروفون في هذا الجهاز',
  network: 'تحويل الكلام إلى كتابة يحتاج إلى الإنترنت',
};

/**
 * A voice note: spoken into the microphone and written as it is said. Only what was recorded is kept
 * (it cannot be typed); speaking again adds to it, and it can be cleared to record it again.
 * autoStart: it listens as soon as it opens. What is still being heard when it closes is kept.
 */
export const VoiceInput: React.FC<{ value: string; onChange: (v: string) => void; autoStart?: boolean }> = ({ value, onChange, autoStart }) => {
  const Ctor = recognitionCtor();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const rec = useRef<Recognition | null>(null);
  // The text before this recording: what is heard is added to it
  const before = useRef(value);
  // The latest text and what is still being heard (kept when it closes mid-sentence)
  const latest = useRef({ value, interim: '', onChange });
  useLayoutEffect(() => {
    latest.current = { value, interim, onChange };
  });

  const start = useCallback(() => {
    if (!Ctor) return;
    setError('');
    before.current = latest.current.value;
    const r = new Ctor();
    r.lang = 'ar-DZ';
    r.continuous = true;
    r.interimResults = true;
    r.onresult = e => {
      let done = '';
      let live = '';
      for (let i = 0; i < e.results.length; i++) {
        const part = e.results[i][0].transcript;
        if (e.results[i].isFinal) done += part;
        else live += part;
      }
      latest.current.onChange([before.current, done.trim()].filter(Boolean).join(' '));
      setInterim(live.trim());
    };
    r.onerror = e => {
      if (e.error !== 'aborted') setError(ERRORS[e.error] || 'تعذر التسجيل، أعد المحاولة');
    };
    r.onend = () => {
      setListening(false);
      setInterim('');
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setError('تعذر تشغيل الميكروفون');
    }
  }, [Ctor]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the listening dialog starts recording at once
    if (autoStart) start();
    return () => {
      const r = rec.current;
      if (!r) return;
      r.onresult = null;
      r.onend = null;
      r.abort();
      const { value: text, interim: heard, onChange: save } = latest.current;
      if (heard) save([text, heard].filter(Boolean).join(' '));
    };
  }, [autoStart, start]);

  const stop = () => rec.current?.stop();

  if (!Ctor) {
    return <p className="tk-error"><AlertCircle size={15} />هذا المتصفح لا يدعم تحويل الصوت إلى كتابة، استعمل Chrome أو Edge أو Safari</p>;
  }

  return (
    <div className={`tsk-voice ${listening ? 'live' : ''}`}>
      <button
        type="button"
        className="tsk-voice-btn"
        onClick={listening ? stop : start}
        aria-label={listening ? 'إيقاف التسجيل' : 'بدء التسجيل'}
      >
        {listening ? <Square size={26} /> : <Mic size={30} />}
      </button>
      <strong className="tsk-voice-state">{listening ? 'جاري الاستماع...' : value ? 'اضغط لإضافة كلام' : 'اضغط وتكلم'}</strong>
      <div className="tsk-voice-text" aria-live="polite">
        {value || interim ? (
          <p>{value}{interim && <span>{value ? ' ' : ''}{interim}</span>}</p>
        ) : (
          <p className="empty">—</p>
        )}
      </div>
      {value && !listening && (
        <button type="button" className="tk-btn ghost sm tsk-voice-clear" onClick={() => { onChange(''); setInterim(''); }}>
          <RotateCcw size={15} />إعادة التسجيل
        </button>
      )}
      {error && <p className="tk-error"><AlertCircle size={15} />{error}</p>}
    </div>
  );
};
