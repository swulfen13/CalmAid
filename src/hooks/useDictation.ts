import { useCallback, useEffect, useRef, useState } from 'react';

/* Minimal typings for the Web Speech API (not in lib.dom for all browsers). */
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getCtor(): (new () => Recognition) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => Recognition) | null;
}

export const DICTATION_SUPPORTED = typeof window !== 'undefined' && getCtor() !== null;

/** Speech-to-text via the Web Speech API. */
export function useDictation(lang = 'en-US') {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);

  const start = useCallback(
    (onText: (text: string, final: boolean) => void, opts: { interim?: boolean; onEnd?: () => void } = {}) => {
      const Ctor = getCtor();
      if (!Ctor) return;
      recRef.current?.abort();
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = opts.interim ?? true;
      rec.continuous = false;
      rec.maxAlternatives = 3;
      rec.onresult = (e) => {
        let text = '';
        let final = false;
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
          if (e.results[i].isFinal) final = true;
        }
        onText(text.trim(), final);
      };
      let blocked = false;
      rec.onerror = (e) => {
        blocked = e.error === 'not-allowed' || e.error === 'service-not-allowed';
        setError(blocked ? 'Microphone blocked. Please type or tap instead.' : null);
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
        if (!blocked && recRef.current === rec) opts.onEnd?.();
      };
      setError(null);
      setListening(true);
      try {
        rec.start();
        recRef.current = rec;
      } catch {
        setListening(false);
      }
    },
    [lang],
  );

  const stop = useCallback(() => {
    recRef.current?.abort();
    recRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => () => recRef.current?.abort(), []);

  return { supported: DICTATION_SUPPORTED, listening, error, start, stop };
}

export type VoiceCommand = 'yes' | 'no' | 'next' | 'repeat' | 'cpr' | 'report';

/** Understands short spoken commands in English plus a few common languages. */
export function parseCommand(text: string): VoiceCommand | null {
  const t = ` ${text.toLowerCase().replace(/[.,!?]/g, ' ')} `;
  if (/(not breathing|no breathing|isn'?t breathing|stopped breathing|start cpr|atmet nicht|no respira)/.test(t)) return 'cpr';
  if (/ (report|protocol|bericht) /.test(t)) return 'report';
  if (/ (repeat|again|what|sorry|nochmal|wiederholen|otra vez|repite) /.test(t)) return 'repeat';
  if (/ (no|nope|not|nein|non|nee|nie|hayır|não) /.test(t)) return 'no';
  if (/ (yes|yeah|yep|yup|correct|right|ja|jawohl|sí|si|oui|evet|sim|tak) /.test(t)) return 'yes';
  if (/ (next|done|okay|ok|finished|weiter|fertig|listo|siguiente|suivant) /.test(t)) return 'next';
  return null;
}
