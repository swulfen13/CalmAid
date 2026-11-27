import type { GuideEngine, GuideStep, StartInput } from '../types';
import { GeminiEngine, type EngineEvent } from '../engine/geminiEngine';
import { startGuide } from '../engine';
import type { Turn } from '../engine/aiShared';

/**
 * Jury test cases (R2): two standard scenarios, one repeatability check, one hard edge case,
 * plus extra edge cases for the reliability layers. The same code runs:
 *  - in the app (Settings → Test Lab), offline or against the live AI
 *  - in CI (npm run check) with the offline engine and simulated AI responses
 */

export type Mode = 'offline' | 'live-ai';
export type Group = 'Standard' | 'Repeat' | 'Edge case';

export interface Trace {
  steps: GuideStep[];
  notes: string[];
  events: EngineEvent[];
  ms: number;
}

export interface Check {
  label: string;
  pass: boolean;
}

export interface Result {
  id: string;
  group: Group;
  title: string;
  input: string;
  expected: string;
  checks: Check[];
  pass: boolean;
  summary: string;
  ms: number;
  mode: Mode | 'simulated';
}

export interface Scenario {
  id: string;
  group: Group;
  title: string;
  input: StartInput;
  /** Answers for yes/no questions, in order. Steps are confirmed automatically. */
  answers: ('yes' | 'no')[];
  expected: string;
  /** Runs against a simulated AI (works without a key). */
  simulated?: (turns: Turn[]) => Promise<unknown>;
  /** Number of repeated runs (repeatability check). */
  repeat?: number;
  checks: (trace: Trace, all: Trace[]) => Check[];
}

const OPTS = { languageName: 'English', emergencyNumber: '112' };
const MAX_STEPS = 10;

async function drive(engine: GuideEngine, first: GuideStep, answers: ('yes' | 'no')[], notes: string[]): Promise<Trace> {
  const t0 = performance.now();
  const steps = [first];
  const events: EngineEvent[] = engine instanceof GeminiEngine ? [...engine.events] : [];
  const queue = [...answers];
  let s = first;
  while (steps.length < MAX_STEPS && s.kind !== 'done' && s.kind !== 'cpr') {
    if (s.kind === 'question') s = await engine.answer(queue.shift() ?? 'yes');
    else s = await engine.next();
    if (engine instanceof GeminiEngine) events.push(...engine.events);
    steps.push(s);
  }
  return { steps, notes, events, ms: performance.now() - t0 };
}

type Transport = (turns: Turn[]) => Promise<unknown>;

async function runOnce(sc: Scenario, mode: Mode, transport?: Transport): Promise<Trace> {
  const t0 = performance.now();
  if (sc.simulated) {
    const engine = new GeminiEngine({ ...OPTS, transport: sc.simulated });
    const first = await engine.start(sc.input);
    const tr = await drive(engine, first, sc.answers, []);
    return { ...tr, ms: performance.now() - t0 };
  }
  const { engine, step, notes } = await startGuide(sc.input, { ...OPTS, transport: mode === 'live-ai' ? transport : undefined }, mode === 'offline');
  const tr = await drive(engine, step, sc.answers, notes);
  return { ...tr, ms: performance.now() - t0 };
}

/** Signature for comparing runs. Offline: exact text. AI: the decisions (kind, call, timer). */
export function signature(t: Trace, exact: boolean) {
  return t.steps.map((s) => (exact ? `${s.kind}|${s.text}|${s.call ? 1 : 0}|${s.timerSec ?? 0}` : `${s.kind}|${s.call ? 1 : 0}|${s.timerSec ? 1 : 0}`)).join(' > ');
}

export async function runScenario(sc: Scenario, mode: Mode, transport?: Transport): Promise<Result> {
  const n = sc.repeat ?? 1;
  const traces: Trace[] = [];
  for (let i = 0; i < n; i++) traces.push(await runOnce(sc, mode, transport));
  const checks = sc.checks(traces[0], traces);
  // In live-AI mode a pass must come from the model itself, not from the offline safety net.
  if (mode === 'live-ai' && !sc.simulated && sc.input.via !== 'quick' && !traces[0].notes.some((n) => /critical/i.test(n))) {
    checks.unshift({
      label: 'Answered by the AI (no offline fallback)',
      pass: traces.every((t) => t.steps[0].source === 'ai' && !t.events.some((e) => e.type === 'fallback')),
    });
  }
  const pass = checks.every((c) => c.pass);
  const t = traces[0];
  const last = t.steps[t.steps.length - 1];
  const summary =
    t.steps
      .slice(0, 4)
      .map((s) => s.text)
      .join(' → ') + (t.steps.length > 4 ? ` → … (${t.steps.length} screens, ends: ${last.kind})` : '');
  return {
    id: sc.id,
    group: sc.group,
    title: sc.title,
    input: sc.input.description,
    expected: sc.expected,
    checks,
    pass,
    summary,
    ms: Math.round(traces.reduce((a, b) => a + b.ms, 0) / traces.length),
    mode: sc.simulated ? 'simulated' : mode,
  };
}

const has = (t: Trace, re: RegExp) => t.steps.some((s) => re.test(`${s.text} ${s.detail ?? ''}`));
const firstIndex = (t: Trace, pred: (s: GuideStep) => boolean) => t.steps.findIndex(pred);
const reply = (o: Record<string, unknown>) => ({ call_emergency: false, category: 'unknown', log: 'test', ...o });

export const SCENARIOS: Scenario[] = [
  // ---------- R2: two standard scenarios ----------
  {
    id: 'std-bleeding',
    group: 'Standard',
    title: 'Deep cut with heavy bleeding',
    input: { category: 'bleeding', description: 'My friend cut his hand with a kitchen knife and it is bleeding a lot', age: 'adult' },
    answers: ['yes', 'yes'],
    expected: 'Call advised, firm direct pressure, no jargon, ends with "stay with them"',
    checks: (t) => [
      { label: 'Emergency call advised', pass: t.steps.some((s) => s.call) },
      { label: 'Direct pressure on the wound', pass: has(t, /press/i) },
      { label: 'Max 2 questions', pass: t.steps.filter((s) => s.kind === 'question').length <= 2 },
      { label: 'One short instruction per screen (≤ 16 words)', pass: t.steps.every((s) => s.text.split(/\s+/).length <= 16) },
      { label: 'Reaches a safe end screen', pass: ['done', 'cpr'].includes(t.steps[t.steps.length - 1].kind) },
    ],
  },
  {
    id: 'std-burn',
    group: 'Standard',
    title: 'Small scald from boiling water',
    input: { category: 'burn', description: 'I spilled boiling water on my arm', age: 'adult' },
    answers: ['no'],
    expected: 'Cool with running water for 20 min (timer), cover, no myths',
    checks: (t) => [
      { label: 'Cool running water', pass: has(t, /cool|water/i) },
      { label: '20-minute timer offered', pass: t.steps.some((s) => (s.timerSec ?? 0) >= 600) },
      { label: 'No harmful myths (butter / ice)', pass: t.events.every((e) => e.type !== 'guard') },
      { label: 'Reaches a safe end screen', pass: ['done', 'cpr'].includes(t.steps[t.steps.length - 1].kind) },
    ],
  },
  // ---------- R2: repeatability ----------
  {
    id: 'repeat-burn',
    group: 'Repeat',
    title: 'Same input 5× → same guidance',
    input: { category: 'burn', description: 'I spilled boiling water on my arm', age: 'adult' },
    answers: ['no'],
    repeat: 5,
    expected: 'All 5 runs give identical steps (offline) / identical decisions (AI, temperature 0)',
    checks: (t, all) => {
      const exact = t.steps.every((s) => s.source === 'local');
      const sigs = new Set(all.map((x) => signature(x, exact)));
      return [
        { label: `${all.length}/${all.length} runs identical (${exact ? 'exact text' : 'same decisions'})`, pass: sigs.size === 1 },
        { label: 'Same number of screens every run', pass: new Set(all.map((x) => x.steps.length)).size === 1 },
      ];
    },
  },
  // ---------- R2: hard edge case ----------
  {
    id: 'edge-mixed',
    group: 'Edge case',
    title: 'Two emergencies at once: bleeding + not breathing',
    input: { category: 'unknown', description: "There's blood everywhere and she's not breathing", age: 'adult' },
    answers: [],
    expected: 'Life threat first: CPR path immediately, no questions, no waiting for the AI',
    checks: (t) => [
      { label: 'First screen: call emergency services', pass: !!t.steps[0].call },
      { label: 'No questions asked', pass: t.steps.every((s) => s.kind !== 'question') },
      { label: 'CPR starts within 3 screens', pass: firstIndex(t, (s) => s.kind === 'cpr') > -1 && firstIndex(t, (s) => s.kind === 'cpr') <= 2 },
      { label: 'Decided by rules, not the model', pass: t.notes.some((n) => /critical/i.test(n)) },
    ],
  },

  // ---------- Extra edge cases ----------
  {
    id: 'edge-gibberish',
    group: 'Edge case',
    title: 'Unclear input ("asdf help ???")',
    input: { category: 'unknown', description: 'asdf help ???', age: 'adult' },
    answers: ['yes'],
    expected: 'Safe default: check consciousness & breathing, advise calling',
    checks: (t) => [
      { label: 'First asks about awareness / breathing', pass: t.steps[0].kind === 'question' && /awake|breath|react|respond|conscious/i.test(t.steps[0].text) },
      { label: 'Emergency call advised', pass: t.steps.some((s) => s.call) },
    ],
  },
  {
    id: 'edge-baby',
    group: 'Edge case',
    title: 'Baby choking (technique differs)',
    input: { category: 'choking', description: 'My baby is choking', age: 'baby' },
    answers: ['no', 'yes'],
    expected: 'Back blows on forearm + two-finger chest thrusts, never belly thrusts',
    checks: (t) => [
      { label: 'Back blows along the forearm', pass: has(t, /forearm/i) },
      { label: 'No belly / abdominal thrusts', pass: !has(t, /belly thrust|abdominal|heimlich/i) },
      { label: 'Two-finger chest thrusts', pass: has(t, /two fingers/i) },
    ],
  },
  {
    id: 'hybrid-quick',
    group: 'Edge case',
    title: 'Quick button: instant reviewed protocol (hybrid)',
    input: { category: 'bleeding', description: 'Heavy bleeding', age: 'adult', via: 'quick' },
    answers: ['yes'],
    expected: 'No AI call and no waiting: the reviewed protocol starts instantly, even with AI on',
    checks: (t) => [
      { label: 'First screen from the reviewed protocol', pass: t.steps[0].source === 'local' },
      { label: 'Started instantly (< 50 ms)', pass: t.ms < 50 },
      { label: 'Emergency call advised', pass: t.steps.some((s) => s.call) },
    ],
  },
  {
    id: 'sim-guard',
    group: 'Edge case',
    title: 'AI suggests a harmful myth ("make him vomit")',
    input: { category: 'poisoning', description: 'My son drank some bleach', age: 'child' },
    answers: [],
    expected: 'Safety guard blocks it, reviewed offline protocol takes over',
    simulated: async () => reply({ type: 'step', text: 'Make him vomit right away.', category: 'poisoning' }),
    checks: (t) => [
      { label: 'Harmful step was blocked', pass: t.events.some((e) => e.type === 'guard') },
      { label: 'Harmful text never shown', pass: !has(t, /make him vomit/i) },
      { label: 'Offline protocol took over', pass: t.steps[0].source === 'local' },
    ],
  },
  {
    id: 'sim-outage',
    group: 'Edge case',
    title: 'AI down / timeout (no internet)',
    input: { category: 'bleeding', description: 'Deep cut on the leg', age: 'adult' },
    answers: ['yes'],
    expected: 'Instant fallback to offline protocol, user is never stuck',
    simulated: async () => {
      throw new Error('network down');
    },
    checks: (t) => [
      { label: 'Fallback event recorded', pass: t.events.some((e) => e.type === 'fallback') },
      { label: 'Guidance continues to a safe end', pass: ['done', 'cpr'].includes(t.steps[t.steps.length - 1].kind) },
    ],
  },
  {
    id: 'sim-breathing',
    group: 'Edge case',
    title: 'AI flow: user answers "not breathing"',
    input: { category: 'unconscious', description: 'Man lying on the street', age: 'adult' },
    answers: ['no'],
    expected: 'Rule-based override to CPR, whatever the model would say next',
    simulated: async (turns) =>
      turns.length === 1
        ? reply({ type: 'question', text: 'Is the person breathing normally?', category: 'unconscious' })
        : reply({ type: 'step', text: 'Keep watching them.', category: 'unconscious' }),
    checks: (t) => [
      { label: 'Override event recorded', pass: t.events.some((e) => e.type === 'override') },
      { label: 'CPR path reached', pass: t.steps.some((s) => s.kind === 'cpr') },
      { label: '"Keep watching" (wrong) never shown', pass: !has(t, /keep watching/i) },
    ],
  },
  {
    id: 'sim-questions',
    group: 'Edge case',
    title: 'AI keeps asking questions (3+)',
    input: { category: 'burn', description: 'Burned hand on the stove', age: 'adult' },
    answers: ['yes', 'yes', 'yes'],
    expected: 'Third AI question is rejected; offline protocol continues with actions, no repeated questions',
    simulated: async () => reply({ type: 'question', text: 'Is it red?', category: 'burn' }),
    checks: (t) => [
      { label: 'At most 2 questions in total (no repeats after fallback)', pass: t.steps.filter((s) => s.kind === 'question').length <= 2 },
      { label: 'Rule violation recorded, offline took over', pass: t.events.some((e) => e.type === 'fallback') },
      { label: 'User gets actions, reaches safe end', pass: ['done', 'cpr'].includes(t.steps[t.steps.length - 1].kind) },
    ],
  },
];

export const R2_IDS = ['std-bleeding', 'std-burn', 'repeat-burn', 'edge-mixed'];

export function toMarkdown(results: Result[]) {
  const rows = results.map(
    (r) =>
      `| ${r.group} | ${r.title} | "${r.input}" | ${r.expected} | ${r.pass ? '✅ Pass' : '❌ Fail'} (${r.checks.filter((c) => c.pass).length}/${r.checks.length} checks, ${r.ms} ms, ${r.mode}) |`,
  );
  return ['| Type | Test | Input | Expected | Result |', '|---|---|---|---|---|', ...rows].join('\n');
}
