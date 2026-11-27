import { useCallback, useEffect, useRef, useState } from 'react';
import { IS_NATIVE, nativeSpeak, nativeStopSpeaking } from '../native';

const KEY = 'calmaid.voice';

/** Text-to-speech via the browser's SpeechSynthesis API. */
export function useSpeech(lang = 'en-US') {
  const supported = IS_NATIVE || (typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(KEY) !== 'off';
    } catch {
      return true;
    }
  });
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const langRef = useRef(lang);

  useEffect(() => {
    if (!supported || IS_NATIVE) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      const base = langRef.current.split('-')[0];
      voiceRef.current =
        voices.find((v) => v.lang === langRef.current && /natural|google|samantha|aria|jenny|neural/i.test(v.name)) ??
        voices.find((v) => v.lang === langRef.current) ??
        voices.find((v) => v.lang.startsWith(base)) ??
        null;
    };
    langRef.current = lang;
    pick();
    window.speechSynthesis.addEventListener('voiceschanged', pick);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pick);
  }, [supported, lang]);

  /**
   * Speaks text. `onEnd` fires when speaking finished — or right away if voice is off,
   * so hands-free listening can start in both cases.
   */
  const speak = useCallback(
    (text: string, force = false, onEnd?: () => void, speechLang?: string) => {
      if (!supported || (!enabled && !force) || !text) {
        onEnd?.();
        return;
      }
      if (IS_NATIVE) return nativeSpeak(text, speechLang ?? langRef.current, onEnd);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const target = speechLang ?? langRef.current;
      u.lang = target;
      u.rate = 0.92;
      const voice =
        target === langRef.current
          ? voiceRef.current
          : (window.speechSynthesis.getVoices().find((v) => v.lang === target) ??
            window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(target.split('-')[0])));
      if (voice) u.voice = voice;
      if (onEnd) {
        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            onEnd();
          }
        };
        u.onend = finish;
        u.onerror = finish;
        // Safety net: some browsers never fire onend.
        window.setTimeout(finish, Math.min(15000, 1500 + text.length * 90));
      }
      window.speechSynthesis.speak(u);
    },
    [enabled, supported],
  );

  const stop = useCallback(() => {
    if (IS_NATIVE) nativeStopSpeaking();
    else if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  const toggle = useCallback(() => {
    setEnabled((e) => {
      const next = !e;
      try {
        localStorage.setItem(KEY, next ? 'on' : 'off');
      } catch {
        /* ignore */
      }
      if (!next && IS_NATIVE) nativeStopSpeaking();
      else if (!next && supported) window.speechSynthesis.cancel();
      return next;
    });
  }, [supported]);

  return { supported, enabled, toggle, speak, stop };
}

export type Speech = ReturnType<typeof useSpeech>;
