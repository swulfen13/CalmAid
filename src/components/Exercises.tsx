import { useMemo, useRef, useState } from 'react';
import type { MythFactExercise, OrderExercise, RhythmExercise, ScenarioExercise, TapExercise } from '../learn/path';
import { BADGES } from '../learn/path';
import type { Reward } from '../learn/progress';
import { LESSONS, type QuizQuestion } from '../learn/lessons';
import { useSettings } from '../settings';
import { haptic } from '../native';
import { CprTrainer } from './CprTrainer';

export interface FinishInfo {
  score: number; // 0–100
  mythPerfect?: boolean;
}
type Done = (info: FinishInfo) => void;

/** Deterministic shuffle that never returns the original order. */
function shuffled<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.every((x, i) => x === arr[i])) a.push(a.shift() as T);
  return a;
}

// ---------------- Put in order ----------------
export function OrderEx({ ex, onDone }: { ex: OrderExercise; onDone: Done }) {
  const { localize } = useSettings();
  const pool = useMemo(() => shuffled(ex.steps, ex.steps.join('').length), [ex]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState<string | null>(null);
  const finished = placed.length === ex.steps.length;

  const pick = (s: string) => {
    if (finished || placed.includes(s)) return;
    if (s === ex.steps[placed.length]) {
      haptic('tap');
      setPlaced([...placed, s]);
    } else {
      haptic('warning');
      setMistakes((m) => m + 1);
      setShake(s);
      setTimeout(() => setShake(null), 450);
    }
  };

  return (
    <div className="ex">
      <p className="step-kicker">Put in order</p>
      <h1 className="step-text quiz-q">{localize(ex.prompt)}</h1>
      <ol className="order-slots">
        {ex.steps.map((_, i) => (
          <li key={i} className={placed[i] ? 'filled' : i === placed.length ? 'next' : ''}>
            <span className="slot-n">{i + 1}</span>
            <span>{placed[i] ? localize(placed[i]) : i === placed.length ? 'Tap the next step…' : ''}</span>
          </li>
        ))}
      </ol>
      {!finished && (
        <div className="chips">
          {pool
            .filter((s) => !placed.includes(s))
            .map((s) => (
              <button key={s} className={`chip ${shake === s ? 'shake' : ''}`} onClick={() => pick(s)}>
                {localize(s)}
              </button>
            ))}
        </div>
      )}
      {finished && (
        <>
          <p className={`explain ${mistakes === 0 ? 'good' : 'bad'}`}>
            <strong>{mistakes === 0 ? 'Perfect order!' : `Done, with ${mistakes} wrong tap${mistakes > 1 ? 's' : ''}.`}</strong> {localize(ex.explain)}
          </p>
          <button className="btn btn-primary btn-huge" onClick={() => onDone({ score: Math.max(0, 100 - mistakes * 20) })}>
            Continue
          </button>
        </>
      )}
    </div>
  );
}

// ---------------- Myth or fact ----------------
export function MythFactEx({ ex, onDone }: { ex: MythFactExercise; onDone: Done }) {
  const { localize } = useSettings();
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [right, setRight] = useState(0);
  const item = ex.items[i];
  const correct = answer !== null && answer === item.fact;

  const choose = (v: boolean) => {
    if (answer !== null) return;
    setAnswer(v);
    if (v === item.fact) {
      setRight((r) => r + 1);
      haptic('success');
    } else haptic('warning');
  };

  const next = () => {
    if (i === ex.items.length - 1) {
      const total = right;
      onDone({ score: Math.round((total / ex.items.length) * 100), mythPerfect: total === ex.items.length });
    } else {
      setI(i + 1);
      setAnswer(null);
    }
  };

  return (
    <div className="ex">
      <p className="step-kicker">
        Myth or fact? Statement {i + 1} of {ex.items.length}
      </p>
      <div className={`myth-card ${answer === null ? '' : correct ? 'good' : 'bad'}`} key={i}>
        <p>"{localize(item.statement)}"</p>
      </div>
      <div className="yesno">
        <button className={`btn btn-huge btn-myth ${answer === false ? 'picked' : ''}`} onClick={() => choose(false)} disabled={answer !== null}>
          Myth
        </button>
        <button className={`btn btn-huge btn-fact ${answer === true ? 'picked' : ''}`} onClick={() => choose(true)} disabled={answer !== null}>
          Fact
        </button>
      </div>
      {answer !== null && (
        <>
          <p className={`explain ${correct ? 'good' : 'bad'}`}>
            <strong>
              {correct ? 'Correct' : 'Not quite'}: it's a {item.fact ? 'fact' : 'myth'}.
            </strong>{' '}
            {localize(item.explain)}
          </p>
          <button className="btn btn-primary btn-huge" onClick={next}>
            {i === ex.items.length - 1 ? 'Finish' : 'Next'}
          </button>
        </>
      )}
    </div>
  );
}

// ---------------- Tap the right spot ----------------
function Scene({ scene }: { scene: TapExercise['scene'] }) {
  const body = { fill: 'var(--ill-skin)', stroke: 'var(--ill-body)', strokeWidth: 4 };
  if (scene === 'arm')
    return (
      <g>
        <rect x="30" y="88" width="210" height="44" rx="22" {...body} />
        <path d="M240 96 q34 -6 40 14 q-4 22 -40 18" {...body} />
        <circle cx="60" cy="110" r="10" fill="none" stroke="var(--ill-body)" strokeWidth="3" strokeDasharray="4 4" />
        <text x="44" y="160" fontSize="13" fill="var(--ink-soft)" fontFamily="inherit">elbow</text>
        <text x="250" y="160" fontSize="13" fill="var(--ink-soft)" fontFamily="inherit">hand</text>
        <path d="M164 104 q12 -8 24 2 q4 10 -10 14 q-14 2 -14 -16z" fill="#c0392b" />
        <path d="M178 122 q2 14 -4 26" stroke="#c0392b" strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>
    );
  const baby = scene === 'baby-chest';
  return baby ? (
    <g>
      <circle cx="150" cy="44" r="28" {...body} />
      <rect x="108" y="74" width="84" height="110" rx="34" {...body} />
      <path d="M108 92 l-28 30 M192 92 l28 30" stroke="var(--ill-body)" strokeWidth="10" strokeLinecap="round" />
      <circle cx="133" cy="106" r="3.5" fill="var(--ill-body)" />
      <circle cx="167" cy="106" r="3.5" fill="var(--ill-body)" />
      <circle cx="150" cy="160" r="3" fill="var(--ill-body)" />
    </g>
  ) : (
    <g>
      <circle cx="150" cy="30" r="22" {...body} />
      <path d="M140 52 h20 v8 h-20z" {...body} />
      <rect x="86" y="58" width="128" height="150" rx="40" {...body} />
      <path d="M86 80 l-36 60 M214 80 l36 60" stroke="var(--ill-body)" strokeWidth="14" strokeLinecap="round" />
      <circle cx="124" cy="104" r="4" fill="var(--ill-body)" />
      <circle cx="176" cy="104" r="4" fill="var(--ill-body)" />
      <path d="M150 70 v70" stroke="var(--ill-ground)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="150" cy="178" r="3" fill="var(--ill-body)" />
    </g>
  );
}

export function TapEx({ ex, onDone }: { ex: TapExercise; onDone: Done }) {
  const { localize } = useSettings();
  const svgRef = useRef<SVGSVGElement>(null);
  const [mark, setMark] = useState<{ x: number; y: number; ok: boolean } | null>(null);
  const [tries, setTries] = useState(0);
  const solved = mark?.ok;

  const onTap = (e: React.PointerEvent<SVGSVGElement>) => {
    if (solved || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 300;
    const y = ((e.clientY - r.top) / r.height) * 220;
    const ok = Math.hypot(x - ex.target.x, y - ex.target.y) <= ex.target.r * 1.5;
    setMark({ x, y, ok });
    setTries((t) => t + 1);
    haptic(ok ? 'success' : 'warning');
  };

  return (
    <div className="ex">
      <p className="step-kicker">Tap the right spot</p>
      <h1 className="step-text quiz-q">{localize(ex.prompt)}</h1>
      <svg ref={svgRef} viewBox="0 0 300 220" className="tap-scene" onPointerDown={onTap} role="img" aria-label="Tap target picture">
        <Scene scene={ex.scene} />
        {mark && !mark.ok && <circle cx={mark.x} cy={mark.y} r="12" fill="rgb(192 57 43 / .3)" stroke="#c0392b" strokeWidth="3" />}
        {(solved || tries >= 3) && (
          <circle cx={ex.target.x} cy={ex.target.y} r={ex.target.r} fill="rgb(31 111 102 / .25)" stroke="var(--primary)" strokeWidth="4" className="target-pulse" />
        )}
        {mark?.ok && <circle cx={mark.x} cy={mark.y} r="8" fill="var(--primary)" />}
      </svg>
      {mark && !mark.ok && tries < 3 && <p className="explain bad">Not quite. Try again.</p>}
      {(solved || tries >= 3) && (
        <>
          <p className={`explain ${solved ? 'good' : 'bad'}`}>
            <strong>{solved ? 'Exactly right.' : 'Here it is.'}</strong> {localize(ex.explain)}
          </p>
          <button className="btn btn-primary btn-huge" onClick={() => onDone({ score: solved ? (tries === 1 ? 100 : 60) : 20 })}>
            Continue
          </button>
        </>
      )}
    </div>
  );
}

// ---------------- Scenario ----------------
export function ScenarioEx({ ex, onDone }: { ex: ScenarioExercise; onDone: Done }) {
  const { localize } = useSettings();
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const step = ex.steps[i];
  const opt = picked !== null ? step.options[picked] : null;

  const choose = (n: number) => {
    if (opt?.correct) return;
    setPicked(n);
    if (step.options[n].correct) haptic('success');
    else {
      haptic('warning');
      setMistakes((m) => m + 1);
    }
  };

  return (
    <div className="ex">
      <p className="step-kicker">
        Decision {i + 1} of {ex.steps.length}
      </p>
      {i === 0 && <p className="scene-intro">{localize(ex.intro)}</p>}
      <h1 className="step-text quiz-q">{localize(step.situation)}</h1>
      <div className="options">
        {step.options.map((o, n) => (
          <button
            key={n}
            className={`option ${picked === n ? (o.correct ? 'correct' : 'wrong') : ''}`}
            onClick={() => choose(n)}
            disabled={!!opt?.correct}
          >
            {localize(o.label)}
          </button>
        ))}
      </div>
      {opt && (
        <p className={`explain ${opt.correct ? 'good' : 'bad'}`}>
          <strong>{opt.correct ? 'Good call.' : 'Not that.'}</strong> {localize(opt.feedback)} {!opt.correct && 'Try another option.'}
        </p>
      )}
      {opt?.correct && (
        <button
          className="btn btn-primary btn-huge"
          onClick={() => {
            if (i === ex.steps.length - 1) onDone({ score: Math.max(0, 100 - mistakes * 25) });
            else {
              setI(i + 1);
              setPicked(null);
            }
          }}
        >
          {i === ex.steps.length - 1 ? 'Finish' : 'What happens next?'}
        </button>
      )}
    </div>
  );
}

// ---------------- Rhythm ----------------
export function RhythmEx({ ex, onDone }: { ex: RhythmExercise; onDone: Done }) {
  const [score, setScore] = useState<number | null>(null);
  return (
    <div className="ex">
      <p className="step-kicker">Rhythm challenge</p>
      <h1 className="step-text quiz-q">Keep 100–120 pushes a minute for 30 seconds. Goal: {ex.goal}% in rhythm.</h1>
      <CprTrainer onDone={setScore} />
      {score !== null && (
        <button className="btn btn-primary btn-huge" onClick={() => onDone({ score })}>
          {score >= ex.goal ? 'Challenge passed! Continue' : 'Save & continue (try again later)'}
        </button>
      )}
    </div>
  );
}

// ---------------- Daily refresher ----------------
export function Refresher({ onDone }: { onDone: Done }) {
  const { localize } = useSettings();
  const questions = useMemo<QuizQuestion[]>(() => {
    const all = LESSONS.flatMap((l) => l.quiz);
    const day = Number(new Date().toLocaleDateString('en-CA').replaceAll('-', ''));
    return shuffled(all, day).slice(0, 5);
  }, []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const q = questions[i];

  return (
    <div className="ex">
      <p className="step-kicker">
        Question {i + 1} of {questions.length}
      </p>
      <h1 className="step-text quiz-q">{localize(q.q)}</h1>
      <div className="options">
        {q.options.map((o, n) => (
          <button
            key={n}
            className={`option ${picked === null ? '' : n === q.correct ? 'correct' : n === picked ? 'wrong' : 'dim'}`}
            disabled={picked !== null}
            onClick={() => {
              setPicked(n);
              if (n === q.correct) {
                setRight((r) => r + 1);
                haptic('success');
              } else haptic('warning');
            }}
          >
            {localize(o)}
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <p className={`explain ${picked === q.correct ? 'good' : 'bad'}`}>
            <strong>{picked === q.correct ? 'Correct.' : 'Not quite.'}</strong> {localize(q.explain)}
          </p>
          <button
            className="btn btn-primary btn-huge"
            onClick={() => {
              if (i === questions.length - 1) onDone({ score: Math.round((right / questions.length) * 100) });
              else {
                setI(i + 1);
                setPicked(null);
              }
            }}
          >
            {i === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </>
      )}
    </div>
  );
}

// ---------------- Reward ----------------
export function RewardView({ reward, score, onContinue }: { reward: Reward; score: number; onContinue: () => void }) {
  return (
    <div className="reward">
      <div className="reward-burst" aria-hidden="true">
        {score >= 80 ? '🎉' : score >= 50 ? '👍' : '💪'}
      </div>
      <h1 className="step-text">{score >= 80 ? 'Great job!' : score >= 50 ? 'Nice work!' : 'Keep practising!'}</h1>
      <div className="reward-stats">
        <div>
          <strong>+{reward.xp}</strong>
          <small>XP</small>
        </div>
        <div>
          <strong>{score}%</strong>
          <small>Score</small>
        </div>
        <div className={reward.streakUp ? 'pop' : ''}>
          <strong>🔥 {reward.streak}</strong>
          <small>day streak</small>
        </div>
      </div>
      {reward.newBadges.map((id) => {
        const b = BADGES.find((x) => x.id === id);
        return b ? (
          <div key={id} className="badge-new">
            <span aria-hidden="true">{b.icon}</span>
            <span>
              <strong>New badge: {b.title}</strong>
              <small>{b.desc}</small>
            </span>
          </div>
        ) : null;
      })}
      <button className="btn btn-primary btn-huge" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
