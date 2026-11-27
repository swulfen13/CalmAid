import { useCallback, useEffect, useRef, useState } from 'react';
import { useMetronome } from '../hooks/useMetronome';
import { haptic, keepAwake } from '../native';

type Rating = 'idle' | 'slow' | 'good' | 'fast';
const DURATION = 30;

function rate(bpm: number): Rating {
  if (!bpm) return 'idle';
  if (bpm < 100) return 'slow';
  if (bpm > 120) return 'fast';
  return 'good';
}

const LABEL: Record<Rating, string> = {
  idle: 'Tap the pad with every push',
  slow: 'Faster!',
  good: 'Perfect rhythm',
  fast: 'A bit slower',
};

/**
 * CPR rhythm trainer: tap (or press Space) with every push — e.g. while pushing on a pillow.
 * Measures the live rate from the last taps and scores a 30-second round.
 */
export function CprTrainer({ onDone }: { onDone?: (score: number) => void }) {
  const [taps, setTaps] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(DURATION);
  const [result, setResult] = useState<{ score: number; avg: number; count: number } | null>(null);
  const [guide, setGuide] = useState(false);
  const metro = useMetronome(110, false);
  const inRange = useRef({ good: 0, total: 0 });
  const endAt = useRef(0);
  const tapsRef = useRef<number[]>([]);
  tapsRef.current = taps;

  const bpm = (() => {
    const recent = taps.slice(-6);
    if (recent.length < 3) return 0;
    const span = recent[recent.length - 1] - recent[0];
    return Math.round(((recent.length - 1) / span) * 60000);
  })();
  const rating = rate(bpm);

  const finish = useCallback(() => {
    setRunning(false);
    metro.stop();
    const t = tapsRef.current;
    const avg = t.length > 1 ? Math.round(((t.length - 1) / (t[t.length - 1] - t[0])) * 60000) : 0;
    const score = inRange.current.total ? Math.round((inRange.current.good / inRange.current.total) * 100) : 0;
    setResult({ score, avg, count: t.length });
    haptic(score >= 70 ? 'success' : 'warning');
    onDone?.(score);
  }, [metro, onDone]);

  useEffect(() => {
    keepAwake(running);
    return () => keepAwake(false);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const l = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) finish();
    }, 200);
    return () => window.clearInterval(id);
  }, [running, finish]);

  const tap = useCallback(() => {
    const now = performance.now();
    if (!running) {
      // First tap starts the round.
      setResult(null);
      setRunning(true);
      endAt.current = Date.now() + DURATION * 1000;
      setLeft(DURATION);
      inRange.current = { good: 0, total: 0 };
      tapsRef.current = [now];
      setTaps([now]);
      if (guide) metro.start();
      return;
    }
    haptic('tap');
    const next = [...tapsRef.current, now];
    const recent = next.slice(-6);
    if (recent.length >= 3) {
      const r = rate(Math.round(((recent.length - 1) / (recent[recent.length - 1] - recent[0])) * 60000));
      inRange.current.total++;
      if (r === 'good') inRange.current.good++;
    }
    tapsRef.current = next;
    setTaps(next);
  }, [running, guide, metro]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tap]);

  // Gauge: 60–160 BPM mapped to 0–100 %.
  const pos = bpm ? Math.min(100, Math.max(0, ((bpm - 60) / 100) * 100)) : 50;

  return (
    <div className="trainer">
      <div className="gauge" aria-hidden="true">
        <div className="gauge-zone" />
        <div className={`gauge-needle ${rating}`} style={{ left: `${pos}%` }} />
        <span className="gauge-l">60</span>
        <span className="gauge-m">100–120</span>
        <span className="gauge-r">160</span>
      </div>

      <div className={`trainer-readout ${rating}`} aria-live="polite">
        <strong>{bpm || '—'}</strong>
        <span>
          per minute
          <em>{LABEL[rating]}</em>
        </span>
      </div>

      <button className={`tap-pad ${rating} ${running ? 'running' : ''}`} onPointerDown={tap} aria-label="Tap with every push">
        <span key={taps.length} className="tap-ripple" />
        <span className="tap-text">{running ? 'PUSH' : result ? 'Tap to try again' : 'Tap to start'}</span>
        {running && <span className="tap-sub">{left} s left, {taps.length} pushes</span>}
      </button>

      {!running && !result && (
        <label className="check">
          <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
          <span>Play a guide beat (110 / min)</span>
        </label>
      )}

      {result && (
        <div className={`trainer-result ${result.score >= 70 ? 'good' : ''}`}>
          <strong>{result.score}% in the right rhythm</strong>
          <span>
            {result.count} pushes, average {result.avg || '—'} per minute
          </span>
          <span>{result.score >= 70 ? 'Great! You could help someone today.' : 'Try again: aim for 100–120 per minute.'}</span>
        </div>
      )}
      <p className="hint">Tip: push on a firm pillow while tapping, to feel the depth too. On a computer, press Space.</p>
    </div>
  );
}
