import { useCallback, useEffect, useRef, useState } from 'react';
import { haptic } from '../native';

/**
 * Precise CPR metronome using the Web Audio API clock (look-ahead scheduling),
 * so the beat stays steady even when the main thread is busy.
 */
export function useMetronome(bpm = 110, vibrate = true) {
  const [running, setRunning] = useState(false);
  const [sound, setSound] = useState(true);
  const [beat, setBeat] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const nextRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const vibrateRef = useRef(vibrate);
  vibrateRef.current = vibrate;
  const buzz = () => {
    if (vibrateRef.current) haptic('beat');
  };

  const click = (ctx: AudioContext, at: number, accent: boolean) => {
    if (!soundRef.current) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1100 : 880;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.5, at + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.1);
  };

  const countRef = useRef(0);

  const start = useCallback(() => {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctxRef.current && Ctx) ctxRef.current = new Ctx();
    const ctx = ctxRef.current;
    if (ctx?.state === 'suspended') void ctx.resume();
    const interval = 60 / bpm;
    if (ctx) nextRef.current = ctx.currentTime + 0.05;
    countRef.current = 0;
    setBeat(0);
    setRunning(true);

    const tick = () => {
      if (ctx) {
        while (nextRef.current < ctx.currentTime + 0.12) {
          const at = nextRef.current;
          const n = countRef.current++;
          click(ctx, at, n % 30 === 0);
          const delay = Math.max(0, (at - ctx.currentTime) * 1000);
          window.setTimeout(() => {
            setBeat((b) => b + 1);
            buzz();
          }, delay);
          nextRef.current += interval;
        }
      }
    };
    if (ctx) {
      tick();
      timerRef.current = window.setInterval(tick, 25);
    } else {
      // No audio support: visual beat only.
      timerRef.current = window.setInterval(() => {
        setBeat((b) => b + 1);
        buzz();
      }, interval * 1000);
    }
  }, [bpm]);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { running, beat, sound, setSound, start, stop };
}
