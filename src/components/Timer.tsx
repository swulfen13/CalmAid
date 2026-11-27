import { useEffect, useRef, useState } from 'react';

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((d) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + d);
      g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + d);
      o.stop(ctx.currentTime + d + 0.3);
    });
  } catch {
    /* no audio */
  }
}

/** Big, calm countdown, e.g. "cool the burn for 20 minutes". */
export function Timer({ seconds, onFinish }: { seconds: number; onFinish?: () => void }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const endRef = useRef(0);

  useEffect(() => {
    setLeft(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        setRunning(false);
        beep();
        onFinish?.();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, onFinish]);

  const toggle = () => {
    if (running) {
      setRunning(false);
    } else {
      endRef.current = Date.now() + (left === 0 ? seconds : left) * 1000;
      if (left === 0) setLeft(seconds);
      setRunning(true);
    }
  };

  const pct = 1 - left / seconds;
  return (
    <div className="timer">
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="timer-row">
        <span className="timer-digits" aria-live="polite">
          {fmt(left)}
        </span>
        <button className="btn btn-secondary" onClick={toggle}>
          {running ? 'Pause timer' : left === seconds ? 'Start timer' : left === 0 ? 'Restart' : 'Resume'}
        </button>
      </div>
    </div>
  );
}
