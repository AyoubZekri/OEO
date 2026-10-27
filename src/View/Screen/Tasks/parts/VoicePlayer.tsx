import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const clock = (s: number) => {
  const t = Number.isFinite(s) ? Math.max(0, Math.floor(s)) : 0;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
};

/**
 * A voice note's recording: a round play / pause button, its bars filling as it plays (a tap on them goes there), and
 * its time — instead of the browser's own player
 */
export const VoicePlayer: React.FC<{ src: string }> = ({ src }) => {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [length, setLength] = useState(0);

  // Another recording: from its start
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new recording starts stopped
    setPlaying(false);
    setAt(0);
    setLength(0);
  }, [src]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };

  // A recording made in the browser may not know its length until it has been read once
  const onMeta = () => {
    const a = audio.current;
    if (!a) return;
    if (Number.isFinite(a.duration)) return setLength(a.duration);
    a.currentTime = 1e9;
    a.ontimeupdate = () => {
      a.ontimeupdate = null;
      setLength(a.duration);
      a.currentTime = 0;
    };
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audio.current;
    if (!a || !length) return;
    const box = e.currentTarget.getBoundingClientRect();
    // Right to left, as the page reads
    const part = (box.right - e.clientX) / box.width;
    a.currentTime = Math.min(Math.max(part, 0), 1) * length;
    setAt(a.currentTime);
  };

  const done = length ? Math.min(at / length, 1) : 0;

  return (
    <div className={`tsk-player ${playing ? 'playing' : ''}`} onClick={e => e.stopPropagation()}>
      <button type="button" className="tsk-player-btn" onClick={toggle} aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل التسجيل'}>
        {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
      </button>
      <div className="tsk-player-bars" onClick={seek} role="slider" aria-label="موضع التسجيل" aria-valuemin={0} aria-valuemax={Math.round(length)} aria-valuenow={Math.round(at)}>
        {Array.from({ length: 32 }, (_, i) => (
          <span key={i} className={i / 32 < done ? 'on' : ''} style={{ height: `${30 + ((i * 37) % 70)}%` }} />
        ))}
      </div>
      <span className="tsk-player-time" dir="ltr">{clock(playing || at ? at : length)}</span>
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={onMeta}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={e => { if (playing) setAt(e.currentTarget.currentTime); }}
        onEnded={() => { setPlaying(false); setAt(0); }}
      />
    </div>
  );
};
