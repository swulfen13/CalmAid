import { useEffect, useRef, useState } from 'react';
import { useMetronome } from '../hooks/useMetronome';
import { Illustration } from './Illustration';

interface Props {
  text: string;
  detail?: string;
  illustration?: string;
  vibrate: boolean;
  speak: (t: string) => void;
  onStop: (seconds: number, compressions: number) => void;
}

const ENCOURAGE = [
  'Keep going. You are doing great.',
  'Push hard and fast. Follow the beat.',
  'Let the chest come all the way up.',
  'If someone can help, switch every two minutes.',
];

/** Hands-only CPR coach: visual pulse + Web Audio metronome at 110 BPM. */
export function Cpr({ text, detail, illustration, vibrate, speak, onStop }: Props) {
  const m = useMetronome(110, vibrate);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!m.running) return;
    const id = window.setInterval(() => {
      if (startRef.current) setElapsed(Math.round((Date.now() - startRef.current) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [m.running]);

  // Spoken encouragement every 30 seconds while running.
  useEffect(() => {
    if (!m.running || elapsed === 0 || elapsed % 30 !== 0) return;
    speak(ENCOURAGE[(elapsed / 30 - 1) % ENCOURAGE.length]);
  }, [elapsed, m.running, speak]);

  const start = () => {
    startRef.current = Date.now();
    setElapsed(0);
    m.start();
  };

  const stop = () => {
    m.stop();
    const secs = startRef.current ? Math.round((Date.now() - startRef.current) / 1000) : 0;
    onStop(secs, m.beat);
    startRef.current = null;
  };

  // Auto-stop & record if the user leaves the screen.
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => () => {
    if (startRef.current) stopRef.current();
  }, []);

  const mm = Math.floor(elapsed / 60);
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="cpr">
      <p className="step-kicker">Follow the beat: 110 pushes a minute</p>
      <h1 className="step-text">{text}</h1>
      {detail && <p className="step-detail">{detail}</p>}

      {m.running ? (
        <>
          <div className="cpr-visual" aria-hidden="true">
            <div key={m.beat} className="cpr-pulse on" />
            <div className="cpr-core">PUSH</div>
          </div>
          <div className="cpr-stats">
            <span>
              {mm}:{ss}
            </span>
            <span>{m.beat} pushes</span>
          </div>
          <div className="row">
            <button className="btn btn-secondary" onClick={() => m.setSound(!m.sound)}>
              {m.sound ? 'Mute beat' : 'Beat sound on'}
            </button>
            <button className="btn btn-secondary" onClick={stop}>
              Help took over
            </button>
          </div>
        </>
      ) : (
        <>
          <Illustration name={illustration} />
          <button className="btn btn-primary btn-huge" onClick={start}>
            Start the beat
          </button>
        </>
      )}
      <p className="hint">Defibrillator arrived? Turn it on and follow its voice. Keep pushing until it tells you to stop.</p>
    </div>
  );
}
