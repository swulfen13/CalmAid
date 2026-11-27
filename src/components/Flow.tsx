import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons';
import type { GuideEngine, GuideStep, LogKind, StartInput } from '../types';
import { AI_AVAILABLE, GeminiEngine, LocalEngine, startGuide } from '../engine';
import type { EngineEvent } from '../engine/geminiEngine';
import { parseCommand, useDictation, type VoiceCommand } from '../hooks/useDictation';
import type { useLocation } from '../hooks/useLocation';
import type { Speech } from '../hooks/useSpeech';
import { useSettings } from '../settings';
import { Cpr } from './Cpr';
import { Illustration } from './Illustration';
import { LocationCard } from './LocationCard';
import { Timer } from './Timer';
import { CHAPTER_FOR } from '../learn/handbook';

interface Props {
  input: StartInput;
  log: (kind: LogKind, text: string) => void;
  addCpr: (seconds: number, compressions: number) => void;
  speech: Speech;
  loc: ReturnType<typeof useLocation>;
  active: boolean;
  onHandover: () => void;
  onHome: () => void;
  onReadMore: (chapterId: string) => void;
}

const HINT: Record<GuideStep['kind'], string> = {
  question: 'Say "yes" or "no"',
  step: 'Say "next" when done',
  done: 'Say "report" for the paramedic report',
  cpr: '',
};

/** The interactive step-by-step guide: exactly one question or action per screen. */
export function Flow({ input, log, addCpr, speech, loc, active, onHandover, onHome, onReadMore }: Props) {
  const { settings, language, number, numberLabel, localize, demo } = useSettings();
  const engineRef = useRef<GuideEngine | null>(null);
  const [step, setStep] = useState<GuideStep | null>(null);
  const [busy, setBusy] = useState(true);
  const [stepNo, setStepNo] = useState(0);
  const [heard, setHeard] = useState('');
  const [fellBack, setFellBack] = useState(false);
  const [notice, setNotice] = useState<EngineEvent | null>(null);
  const startedRef = useRef(false);
  const usesAi = useRef(false);
  // AI speaks the chosen language; the offline protocols are English.
  const stepLang = step?.source === 'ai' ? language.code : 'en-US';
  const dict = useDictation(stepLang);

  const prevSource = useRef<GuideStep['source'] | null>(null);
  const show = useCallback(
    (s: GuideStep, manualSwitch = false) => {
      if (prevSource.current === 'ai' && s.source === 'local' && !manualSwitch) setFellBack(true);
      prevSource.current = s.source;
      setStep(s);
      setBusy(false);
      setHeard('');
      setStepNo((n) => n + 1);
      if (s.call) log('call', `Advised to call emergency services (${numberLabel})`);
      if (s.photoNote) log('observation', `Photo (AI): ${s.photoNote}`);
      if (s.kind === 'done') log('note', 'Guide completed, waiting for help');
    },
    [log, numberLabel],
  );

  const engineLog = () => {
    const e = engineRef.current;
    if (!(e instanceof GeminiEngine)) return;
    // Surface safety events (guard block, override, fallback) on screen and in the report.
    const ev = e.events.find((x) => x.type === 'guard' || x.type === 'override') ?? e.events[0];
    if (ev) {
      setNotice(ev);
      log('note', ev.type === 'guard' ? `Safety guard blocked an AI step (${ev.reason})` : ev.reason);
    } else if (e.lastLog && !e.usedFallback) log('note', `AI: ${e.lastLog}`);
  };

  // Start once (guards against React StrictMode double-run).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startGuide(input, { languageName: language.name, emergencyNumber: numberLabel }).then(({ engine, step: first, notes }) => {
      usesAi.current = engine.name === 'ai';
      engineRef.current = engine;
      notes.forEach((n) => log('note', n));
      if (notes.some((n) => /critical/i.test(n))) setNotice({ type: 'override', reason: 'Not breathing → CPR guidance started right away' });
      show(first);
      engineLog();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get the location ready as soon as calling is advised.
  useEffect(() => {
    if (step?.call) loc.start();
  }, [step, loc]);

  const answer = async (value: 'yes' | 'no') => {
    const e = engineRef.current;
    if (!e || !step || busy || step.kind !== 'question') return;
    setBusy(true);
    setNotice(null);
    dict.stop();
    if (e instanceof LocalEngine) {
      const s = await e.answer(value);
      log('observation', e.lastAnswerLog);
      show(s);
    } else {
      log('observation', `${step.text} → ${value.toUpperCase()}`);
      const s = await e.answer(value);
      show(s);
      engineLog();
    }
  };

  const next = async () => {
    const e = engineRef.current;
    if (!e || !step || busy || step.kind !== 'step') return;
    setBusy(true);
    setNotice(null);
    dict.stop();
    // Call steps are already logged as "call"; avoid a duplicate line in the report.
    if (!step.call) log('action', localize(step.text));
    const s = await e.next();
    show(s);
    engineLog();
  };

  /** Safety override: always available, always offline, jumps straight to CPR. */
  const notBreathing = () => {
    dict.stop();
    const local = new LocalEngine(input.age);
    engineRef.current = local;
    setNotice(null);
    log('observation', 'Person not breathing normally (reported by user)');
    show(local.startAt('cpr_call'), true);
  };

  const say = (s: GuideStep, onEnd?: () => void) =>
    speech.speak(localize(`${s.text} ${s.detail ?? ''}`).trim(), false, onEnd, s.source === 'ai' ? language.code : 'en-US');

  // ---- Hands-free: read the step, then listen for a short command. ----
  const handlersRef = useRef<(c: VoiceCommand) => void>(() => {});
  handlersRef.current = (c) => {
    if (!step) return;
    if (c === 'cpr' && step.kind !== 'cpr') return notBreathing();
    if (c === 'repeat') return say(step, () => listen(stepNo));
    if (c === 'report') return onHandover();
    if ((c === 'yes' || c === 'no') && step.kind === 'question') return void answer(c);
    if (c === 'next' && step.kind === 'step') return void next();
  };
  const tokenRef = useRef(0);
  tokenRef.current = stepNo;
  const restarts = useRef(0);

  const listen = (token: number) => {
    if (!settings.handsFree || !dict.supported || token !== tokenRef.current || !activeRef.current) return;
    if (restarts.current++ > 25) return; // don't keep the mic open forever
    dict.start(
      (text, final) => {
        setHeard(text);
        if (!final) return;
        const cmd = parseCommand(text);
        if (cmd) handlersRef.current(cmd);
      },
      { interim: true, onEnd: () => window.setTimeout(() => listen(token), 250) },
    );
  };
  const activeRef = useRef(active);
  activeRef.current = active;

  // Read every new step aloud (and listen afterwards in hands-free mode).
  useEffect(() => {
    if (!step || !active) return;
    restarts.current = 0;
    const token = stepNo;
    const handsFree = settings.handsFree && step.kind !== 'cpr';
    say(step, handsFree ? () => listen(token) : undefined);
    return () => dict.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, active, settings.handsFree]);

  if (!step) {
    return (
      <main className="screen flow">
        <div className="thinking">
          <div className="breathe" aria-hidden="true" />
          <p>{AI_AVAILABLE && input.via !== 'quick' ? 'Understanding the situation…' : 'Getting your first step…'}</p>
          <p className="hint">Breathe in slowly. Breathe out.</p>
        </div>
      </main>
    );
  }

  const timer = step.timerSec ? (demo ? 10 : step.timerSec) : 0;

  return (
    <main className="screen flow">
      <div className="flow-top">
        <button className="link" onClick={onHome}>
          ‹ Start
        </button>
        <span className="flow-meta">
          {step.kind === 'question' ? 'Quick question' : step.kind === 'cpr' ? 'CPR' : step.kind === 'done' ? 'Stay with them' : 'Next step'}
          {step.source === 'ai' && <span className="pill">AI, safety-checked</span>}
          {input.age !== 'adult' && <span className="pill">{input.age === 'baby' ? 'Baby' : 'Child'}</span>}
        </span>
        {speech.supported && (
          <button className="link" onClick={speech.toggle} aria-label={speech.enabled ? 'Turn voice off' : 'Turn voice on'}>
            <Icon name={speech.enabled ? 'volume' : 'mute'} />
          </button>
        )}
      </div>

      <section className={`card step-card ${busy ? 'busy' : ''}`} key={stepNo} aria-live="assertive">
        {step.kind === 'cpr' ? (
          <Cpr
            text={localize(step.text)}
            detail={step.detail && localize(step.detail)}
            illustration={step.illustration}
            speak={(t) => speech.speak(t, false, undefined, 'en-US')}
            vibrate={settings.vibration}
            onStop={(secs, n) => {
              if (secs > 0) {
                addCpr(secs, n);
                log('cpr', `CPR performed for ${Math.floor(secs / 60)} min ${secs % 60} s (~${n} compressions)`);
              }
            }}
          />
        ) : (
          <>
            {notice?.type === 'guard' && (
              <p className="safety-note">
                <Icon name="shield" size={18} /> <strong>Safety guard:</strong> an AI suggestion was blocked ({notice.reason.toLowerCase()}). Showing the reviewed protocol.
              </p>
            )}
            {notice?.type === 'override' && (
              <p className="safety-note">
                <Icon name="shield" size={18} /> <strong>Safety rule:</strong> {notice.reason}
              </p>
            )}
            {fellBack && step.source === 'local' && notice?.type !== 'guard' && notice?.type !== 'override' && (
              <p className="fallback-note">Connection problem. Switched to the built-in offline guide. You're still safe to continue.</p>
            )}
            {step.photoNote && (
              <p className="photo-note">
                <Icon name="camera" size={18} /> <strong>AI sees:</strong> {step.photoNote}
              </p>
            )}
            {step.kind === 'question' && <p className="step-kicker">Answer yes or no</p>}
            {step.kind === 'done' && <p className="step-kicker">Well done. Last step</p>}
            <Illustration name={step.illustration} number={number} />
            <h1 className="step-text">{localize(step.text)}</h1>
            {step.detail && <p className="step-detail">{localize(step.detail)}</p>}
            {timer > 0 && <Timer seconds={timer} onFinish={() => speech.speak('Time is up.', false, undefined, 'en-US')} />}

            {step.call && (
              <>
                <a className="btn btn-call" href={`tel:${number}`}>
                  <Icon name="phone" /> Call {number}
                </a>
                <LocationCard loc={loc} />
              </>
            )}

            {step.kind === 'question' && (
              <div className="yesno">
                <button className="btn btn-yes btn-huge" onClick={() => answer('yes')} disabled={busy}>
                  Yes
                </button>
                <button className="btn btn-no btn-huge" onClick={() => answer('no')} disabled={busy}>
                  No
                </button>
              </div>
            )}

            {step.kind === 'step' && (
              <button className="btn btn-primary btn-huge" onClick={next} disabled={busy}>
                {busy ? 'One moment…' : 'Done, next step'}
              </button>
            )}

            {step.kind === 'done' && (
              <>
                <button className="btn btn-primary btn-huge" onClick={onHandover}>
                  Show report for paramedics
                </button>
                <button className="link" onClick={() => onReadMore(CHAPTER_FOR[input.category] ?? 'before')}>
                  <Icon name="book" size={18} /> Learn more about this in the handbook
                </button>
              </>
            )}

            {settings.handsFree && dict.supported && (
              <p className={`listen ${dict.listening ? 'on' : ''}`} aria-live="polite">
                <span className="listen-dot" aria-hidden="true" />
                {dict.listening ? HINT[step.kind] : 'Hands-free: waiting…'}
                {heard && <em>"{heard}"</em>}
              </p>
            )}
          </>
        )}
        {speech.supported && step.kind !== 'cpr' && (
          <button className="link repeat" onClick={() => speech.speak(localize(`${step.text} ${step.detail ?? ''}`), true, undefined, stepLang)}>
            ↻ Read again
          </button>
        )}
      </section>

      <div className="flow-escape">
        {step.kind !== 'cpr' && (
          <button className="btn btn-danger-outline" onClick={notBreathing}>
            Not breathing? Start CPR
          </button>
        )}
        <button className="btn btn-ghost" onClick={onHandover}>
          <Icon name="list" /> Report for paramedics
        </button>
      </div>
    </main>
  );
}
