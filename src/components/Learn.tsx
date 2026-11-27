import { useEffect, useMemo, useRef, useState } from 'react';
import { LESSONS, SOURCES, type Lesson } from '../learn/lessons';
import { GUIDE_GROUPS, GUIDES } from '../guides/library';
import { ALL_NODES, BADGES, UNITS, type PathNode } from '../learn/path';
import { currentNodeId, isUnlocked, type PathState, type Reward } from '../learn/progress';
import { HANDBOOK, PARTS, type Chapter } from '../learn/handbook';
import { useSettings } from '../settings';
import type { Speech } from '../hooks/useSpeech';
import { Icon } from './Icons';
import { Illustration } from './Illustration';
import { CprTrainer } from './CprTrainer';
import { MythFactEx, OrderEx, RewardView, RhythmEx, ScenarioEx, TapEx, Refresher, type FinishInfo } from './Exercises';

const NODE_ICON: Record<string, string> = { lesson: 'book', order: 'list', mythfact: 'question', tap: 'target', scenario: 'chat', rhythm: 'pulse' };
const nodeIcon = (n: PathNode) => (n.kind === 'lesson' ? 'book' : NODE_ICON[n.exercise.type]);
const today = () => new Date().toLocaleDateString('en-CA');
const LESSON_CHAPTER: Record<string, string> = { 'check-call': 'before' };
export const GUIDE_ICON: Record<string, string> = {
  'learn-cpr': 'circulation', 'learn-cpr-child': 'circulation', 'learn-recovery': 'unconscious', 'learn-aed': 'pulse', 'learn-call': 'phone',
  'small-cut': 'bleeding', nosebleed: 'bleeding', sprain: 'medical', sting: 'allergy', 'small-burn': 'burn',
  panic: 'help', heat: 'burn', cold: 'pulse', 'low-sugar': 'medical', kit: 'medical',
};

interface HomeProps {
  path: PathState;
  onNode: (id: string) => void;
  onRefresher: () => void;
  onTrainer: () => void;
  onGuide: (id: string) => void;
  onHandbook: () => void;
}

/** Learn tab: a Duolingo-style path, daily refresher, handbook and library. */
export function LearnHome({ path, onNode, onRefresher, onTrainer, onGuide, onHandbook }: HomeProps) {
  const [showGuides, setShowGuides] = useState(false);
  const current = currentNodeId(path);
  const doneCount = ALL_NODES.filter((n) => path.done[n.id] !== undefined).length;
  const refreshedToday = path.lastDay === today();
  const currentRef = useRef<HTMLButtonElement>(null);

  return (
    <main className="screen learn">
      <header className="learn-head">
        <h1 className="page-title">Learn first aid</h1>
        <p className="page-sub">A few minutes a day, so you're ready when it counts.</p>
        <div className="stats-row">
          <span className={`stat ${path.streak > 0 ? 'hot' : ''}`} title="Day streak">
            🔥 <strong>{path.streak}</strong> <small>day{path.streak === 1 ? '' : 's'}</small>
          </span>
          <span className="stat" title="Experience points">
            ⚡ <strong>{path.xp}</strong> <small>XP</small>
          </span>
          <span className="stat" title="Badges">
            🏅 <strong>{path.badges.length}</strong>
            <small>/{BADGES.length}</small>
          </span>
          <span className="stat" title="Path progress">
            <strong>{doneCount}</strong>
            <small>/{ALL_NODES.length}</small>
          </span>
        </div>
      </header>

      <button className={`refresher ${refreshedToday ? 'done' : ''}`} onClick={onRefresher}>
        <span className="refresher-icon">{refreshedToday ? '✓' : '⏱'}</span>
        <span>
          <strong>{refreshedToday ? 'Practised today, nice!' : 'Daily 2-minute refresher'}</strong>
          <small>{refreshedToday ? 'Come back tomorrow to keep your streak' : '5 quick questions keep your knowledge fresh'}</small>
        </span>
        <Icon name="chevron" />
      </button>

      {UNITS.map((u) => {
        const unitDone = u.nodes.filter((n) => path.done[n.id] !== undefined).length;
        return (
          <section key={u.id} className="unit">
            <div className="unit-banner" style={{ background: u.color }}>
              <span>
                <strong>{u.title}</strong>
                <small>{u.subtitle}</small>
              </span>
              <span className="unit-count">
                {unitDone}/{u.nodes.length}
              </span>
            </div>
            <div className="path">
              {u.nodes.map((n, i) => {
                const done = path.done[n.id] !== undefined;
                const unlocked = isUnlocked(path, n.id);
                const isCurrent = n.id === current;
                const offset = [0, 1, 2, 1, 0, -1, -2, -1][i % 8];
                return (
                  <div key={n.id} className="node-wrap" style={{ transform: `translateX(${offset * 34}px)` }}>
                    <button
                      ref={isCurrent ? currentRef : undefined}
                      className={`node ${done ? 'done' : ''} ${isCurrent ? 'current' : ''} ${!unlocked ? 'locked' : ''}`}
                      style={done || isCurrent ? { background: u.color, boxShadow: `0 6px 0 color-mix(in srgb, ${u.color} 70%, black)` } : undefined}
                      onClick={() => unlocked && onNode(n.id)}
                      disabled={!unlocked}
                      aria-label={`${n.title}${done ? ', done' : unlocked ? '' : ', locked'}`}
                    >
                      <Icon name={unlocked ? (done ? 'check' : nodeIcon(n)) : 'lock'} size={30} />
                      {isCurrent && <span className="node-start">Start</span>}
                    </button>
                    <span className={`node-label ${!unlocked ? 'muted' : ''}`}>{n.title}</span>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <h2 className="section-title">Library</h2>
      <button className="lib-card" onClick={onHandbook}>
        <span className="lib-icon">
          <Icon name="book" size={28} />
        </span>
        <span>
          <strong>First-aid handbook</strong>
          <small>{HANDBOOK.length} chapters to read at your own pace, offline</small>
        </span>
        <Icon name="chevron" />
      </button>
      <button className="lib-card" onClick={onTrainer}>
        <span className="lib-icon">
          <Icon name="pulse" size={28} />
        </span>
        <span>
          <strong>Free CPR rhythm practice</strong>
          <small>Tap along, live speed feedback</small>
        </span>
        <Icon name="chevron" />
      </button>

      <button className="section-toggle" onClick={() => setShowGuides(!showGuides)} aria-expanded={showGuides}>
        <span>
          <strong>Quick guides</strong>
          <small>Step-by-step for everyday situations</small>
        </span>
        <span>{showGuides ? '▾' : '›'}</span>
      </button>
      {showGuides &&
        GUIDE_GROUPS.map((group) => (
          <section key={group}>
            <h3 className="sub-title">{group}</h3>
            <div className="guide-list">
              {GUIDES.filter((g) => g.group === group).map((g) => (
                <button key={g.id} className="guide-item" onClick={() => onGuide(g.id)}>
                  <span className="guide-icon" aria-hidden="true">
                    <Icon name={GUIDE_ICON[g.id] ?? 'medical'} />
                  </span>
                  <span>
                    <strong>{g.title}</strong>
                    <small>{g.summary}</small>
                  </span>
                  <Icon name="chevron" />
                </button>
              ))}
            </div>
          </section>
        ))}

      <h2 className="section-title">Badges</h2>
      <div className="badges">
        {BADGES.map((b) => {
          const has = path.badges.includes(b.id);
          return (
            <div key={b.id} className={`badge ${has ? 'on' : ''}`} title={b.desc}>
              <span aria-hidden="true">{has ? b.icon : '🔒'}</span>
              <strong>{b.title}</strong>
              <small>{b.desc}</small>
            </div>
          );
        })}
      </div>

      <section className="card sources">
        <h2>Where this comes from</h2>
        <p className="hint">Content follows public lay first-aid guidance. It does not replace a hands-on first-aid course. Book one with your local Red Cross or similar organisation.</p>
        <ul>
          {SOURCES.map((s) => (
            <li key={s.url}>
              <a className="link" href={s.url} target="_blank" rel="noreferrer">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/** Runs one exercise node (or the daily refresher) and shows the reward. */
export function ExerciseScreen({ nodeId, onBack, onComplete }: { nodeId: string | null; onBack: () => void; onComplete: (nodeId: string | null, info: FinishInfo, kind: string) => Reward }) {
  const node = nodeId ? ALL_NODES.find((n) => n.id === nodeId) : null;
  const [result, setResult] = useState<{ reward: Reward; score: number } | null>(null);
  const ex = node?.kind === 'exercise' ? node.exercise : null;
  const finish = (info: FinishInfo) => setResult({ reward: onComplete(nodeId, info, ex?.type ?? 'refresher'), score: info.score });

  return (
    <main className="screen flow">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ✕ Close
        </button>
        <span className="flow-meta">{node ? node.title : 'Daily refresher'}</span>
        <span />
      </div>
      <section className="card step-card ex-card">
        {result ? (
          <RewardView reward={result.reward} score={result.score} onContinue={onBack} />
        ) : !ex ? (
          <Refresher onDone={finish} />
        ) : ex.type === 'order' ? (
          <OrderEx ex={ex} onDone={finish} />
        ) : ex.type === 'mythfact' ? (
          <MythFactEx ex={ex} onDone={finish} />
        ) : ex.type === 'tap' ? (
          <TapEx ex={ex} onDone={finish} />
        ) : ex.type === 'scenario' ? (
          <ScenarioEx ex={ex} onDone={finish} />
        ) : (
          <RhythmEx ex={ex} onDone={finish} />
        )}
      </section>
    </main>
  );
}

/** One lesson: cards (one per screen) → quiz (one question per screen) → result + reward. */
export function LessonReader({
  id,
  speech,
  onBack,
  onSave,
  onTrainer,
  onChapter,
}: {
  id: string;
  speech: Speech;
  onBack: () => void;
  onSave: (id: string, score: number) => Reward;
  onTrainer: () => void;
  onChapter: (id: string) => void;
}) {
  const { localize, number } = useSettings();
  const lesson = LESSONS.find((l) => l.id === id) as Lesson;
  const total = lesson.cards.length + lesson.quiz.length;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [reward, setReward] = useState<Reward | null>(null);
  const stopRef = useRef(speech.stop);
  stopRef.current = speech.stop;
  useEffect(() => () => stopRef.current(), []);

  const inCards = i < lesson.cards.length;
  const qi = i - lesson.cards.length;
  const finished = i >= total;
  const card = inCards ? lesson.cards[i] : null;
  const q = !inCards && !finished ? lesson.quiz[qi] : null;
  const chapter = HANDBOOK.find((c) => c.id === (LESSON_CHAPTER[lesson.id] ?? lesson.id));

  useEffect(() => {
    if (card) speech.speak(localize(`${card.title}. ${card.text}`), false, undefined, 'en-US');
    else if (q) speech.speak(localize(q.q), false, undefined, 'en-US');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(() => {
    if (finished && !reward) setReward(onSave(lesson.id, score));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const pick = (n: number) => {
    if (picked !== null || !q) return;
    setPicked(n);
    if (n === q.correct) setScore((s) => s + 1);
    speech.speak(n === q.correct ? `Correct. ${q.explain}` : `Not quite. ${q.explain}`, false, undefined, 'en-US');
  };

  return (
    <main className="screen flow">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ✕ Close
        </button>
        <span className="flow-meta">{finished ? 'Done' : inCards ? lesson.title : `Quiz ${qi + 1} of ${lesson.quiz.length}`}</span>
        <span />
      </div>
      <div className="progress" aria-hidden="true">
        {Array.from({ length: total }).map((_, n) => (
          <span key={n} className={n < i ? 'on' : n === i ? 'now' : ''} />
        ))}
      </div>

      <section className="card step-card" key={i}>
        {card && (
          <>
            <p className="step-kicker">
              Card {i + 1} of {lesson.cards.length}
            </p>
            <Illustration name={card.illustration} number={number} />
            <h1 className="step-text">{localize(card.title)}</h1>
            <p className="step-detail">{localize(card.text)}</p>
            {card.tip && (
              <p className="lesson-tip">
                <strong>Tip:</strong> {localize(card.tip)}
              </p>
            )}
            <div className="row">
              {i > 0 && (
                <button className="btn btn-secondary" onClick={() => setI(i - 1)}>
                  Back
                </button>
              )}
              <button className="btn btn-primary" onClick={() => setI(i + 1)}>
                {i === lesson.cards.length - 1 ? 'Start the quiz' : 'Next'}
              </button>
            </div>
          </>
        )}

        {q && (
          <>
            <p className="step-kicker">Quick check</p>
            <h1 className="step-text quiz-q">{localize(q.q)}</h1>
            <div className="options">
              {q.options.map((o, n) => (
                <button
                  key={n}
                  className={`option ${picked === null ? '' : n === q.correct ? 'correct' : n === picked ? 'wrong' : 'dim'}`}
                  onClick={() => pick(n)}
                  disabled={picked !== null}
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
                  className="btn btn-primary"
                  onClick={() => {
                    setPicked(null);
                    setI(i + 1);
                  }}
                >
                  {qi === lesson.quiz.length - 1 ? 'See my result' : 'Next question'}
                </button>
              </>
            )}
          </>
        )}

        {finished && reward && (
          <>
            <RewardView reward={reward} score={Math.round((score / lesson.quiz.length) * 100)} onContinue={onBack} />
            {lesson.practice === 'cpr' && (
              <button className="btn btn-secondary" onClick={onTrainer}>
                Practise the CPR rhythm now
              </button>
            )}
            {chapter && (
              <button className="link" onClick={() => onChapter(chapter.id)}>
                <Icon name="book" size={18} /> Read the full handbook chapter
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export function TrainerScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="screen flow">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ‹ Learn
        </button>
        <span className="flow-meta">CPR rhythm practice</span>
        <span />
      </div>
      <section className="card step-card">
        <p className="step-kicker">Practice mode, not an emergency</p>
        <h1 className="step-text">Find the beat: 100–120 pushes a minute</h1>
        <CprTrainer />
      </section>
    </main>
  );
}

// ---------------- Handbook ----------------
export function HandbookHome({ onBack, onChapter }: { onBack: () => void; onChapter: (id: string) => void }) {
  const [q, setQ] = useState('');
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return HANDBOOK;
    return HANDBOOK.filter((c) =>
      [c.title, c.intro, ...(c.recognize ?? []), ...(c.help ?? []), ...(c.never ?? []), ...(c.kids ?? []), ...(c.call ?? []), ...(c.body ?? []).map((b) => `${b.heading} ${b.text}`)].join(' ').toLowerCase().includes(t),
    );
  }, [q]);

  return (
    <main className="screen learn">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ‹ Learn
        </button>
        <span className="flow-meta">Handbook</span>
        <span />
      </div>
      <h1 className="page-title">First-aid handbook</h1>
      <p className="page-sub">Read at your own pace. Works offline.</p>
      <input className="search" placeholder="Search, e.g. burn, baby, nose…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the handbook" />
      {PARTS.map((part) => {
        const items = hits.filter((c) => c.part === part);
        if (!items.length) return null;
        return (
          <section key={part}>
            <h2 className="section-title">{part}</h2>
            <div className="guide-list">
              {items.map((c) => (
                <button key={c.id} className="guide-item" onClick={() => onChapter(c.id)}>
                  <span className="guide-icon">
                    <Icon name={c.icon} />
                  </span>
                  <span>
                    <strong>{c.title}</strong>
                    <small>{c.intro}</small>
                  </span>
                  <Icon name="chevron" />
                </button>
              ))}
            </div>
          </section>
        );
      })}
      {!hits.length && <p className="hint">Nothing found. In an emergency, go to "Help now".</p>}
    </main>
  );
}

export function ChapterReader({ id, speech, onBack, onEmergency }: { id: string; speech: Speech; onBack: () => void; onEmergency: () => void }) {
  const { localize, number } = useSettings();
  const c = HANDBOOK.find((x) => x.id === id) as Chapter;
  const stopRef = useRef(speech.stop);
  stopRef.current = speech.stop;
  useEffect(() => () => stopRef.current(), []);

  const readAll = () => {
    const parts = [c.title, c.intro, ...(c.recognize ?? []), ...(c.help ?? []), ...(c.never ?? []).map((n) => `Never: ${n}`), ...(c.body ?? []).map((b) => `${b.heading}. ${b.text}`)];
    speech.speak(localize(parts.join('. ')), true, undefined, 'en-US');
  };

  const List = ({ title, items, cls }: { title: string; items?: string[]; cls: string }) =>
    items?.length ? (
      <section className={`hb-section ${cls}`}>
        <h2>{title}</h2>
        <ul>
          {items.map((t, i) => (
            <li key={i}>{localize(t)}</li>
          ))}
        </ul>
      </section>
    ) : null;

  return (
    <main className="screen learn">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ‹ Handbook
        </button>
        <span className="flow-meta">{c.part}</span>
        {speech.supported ? (
          <button className="link" onClick={readAll}>
            <Icon name="volume" size={18} /> Read aloud
          </button>
        ) : (
          <span />
        )}
      </div>
      <article className="card chapter">
        <h1 className="page-title">{c.title}</h1>
        <p className="step-detail">{localize(c.intro)}</p>
        <Illustration name={c.illustration} number={number} />
        <List title="How to recognise it" items={c.recognize} cls="recognize" />
        <List title="How to help" items={c.help} cls="help" />
        <List title="Never" items={c.never} cls="never" />
        <List title="Children & babies" items={c.kids} cls="kids" />
        <List title={`Call ${number} if`} items={c.call} cls="call" />
        {c.body?.map((b) => (
          <section key={b.heading} className="hb-section text">
            <h2>{b.heading}</h2>
            <p>{localize(b.text)}</p>
          </section>
        ))}
      </article>
      <button className="btn btn-danger-outline" onClick={onEmergency}>
        It's an emergency now
      </button>
    </main>
  );
}
