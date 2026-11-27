// Run: npm run check  — validates every built-in protocol path.
import { getNode, START_NODE, FALLBACK_ENTRY } from '../src/engine/protocols.ts';
import { ALL_NODES } from '../src/learn/path.ts';
import { LESSONS } from '../src/learn/lessons.ts';
import { HANDBOOK, CHAPTER_FOR } from '../src/learn/handbook.ts';
import { classify } from '../src/engine/classify.ts';
import { parseCommand } from '../src/hooks/useDictation.ts';
import { SCENARIOS, runScenario, toMarkdown } from '../src/testlab/scenarios.ts';
import { checkStep } from '../src/engine/safetyGuard.ts';
import { parseKeys, withKeyFallback } from '../src/engine/aiShared.ts';

let errors = 0;
const fail = (m: string) => { console.error('✗', m); errors++; };

for (const age of ['adult', 'child', 'baby'] as const)
for (const [cat, start] of Object.entries(START_NODE)) {
  let paths = 0;
  const walk = (id: string, questions: number, seen: string[]) => {
    const n = getNode(id, age);
    if (!n) return fail(`${cat}: missing node "${id}" (from ${seen.at(-1)})`);
    if (seen.includes(id)) { paths++; return; } // loop (e.g. choking repeat) is intentional
    const path = [...seen, id];
    if (n.kind === 'question') {
      if (questions + 1 > 2 && !seen.includes(id)) {
        // count only distinct questions on a path
        const distinct = new Set(path.filter((p) => getNode(p, age)?.kind === 'question')).size;
        if (distinct > 2) fail(`${cat}: more than 2 questions on path ${path.join(' → ')}`);
      }
      walk(n.yes, questions + 1, path);
      walk(n.no, questions + 1, path);
    } else if (n.kind === 'step') {
      if (n.text.split(' ').length > 16) fail(`${id}: text too long`);
      walk(n.next, questions, path);
    } else {
      paths++;
    }
  };
  walk(start, 0, []);
  if (age === 'adult' || cat === 'unconscious' || cat === 'choking') console.log(`✓ ${age.padEnd(6)} ${cat.padEnd(12)} ${paths} paths`);
}

const samples: [string, string][] = [
  ['my dad collapsed and is not breathing', 'unconscious'],
  ['she cut her hand with a knife, lots of blood', 'bleeding'],
  ['spilled boiling water on his arm', 'burn'],
  ['he is choking on food', 'choking'],
  ['strong chest pain and sweating', 'circulation'],
  ['her face is drooping and speech slurred', 'stroke'],
  ['he is shaking and jerking on the floor', 'seizure'],
  ['bee sting and lips swollen', 'allergy'],
  ['my kid swallowed pills', 'poisoning'],
  ['something weird happened', 'unknown'],
];
for (const [t, want] of samples) {
  const got = classify(t);
  if (got !== want) fail(`classify("${t}") = ${got}, expected ${want}`);
}
const commands: [string, string | null][] = [
  ['Yes', 'yes'], ['yeah he is', 'yes'], ['no', 'no'], ['nope', 'no'], ['next', 'next'], ['done', 'next'],
  ['can you repeat that', 'repeat'], ['he is not breathing', 'cpr'], ['show the report', 'report'],
  ['ja', 'yes'], ['nein', 'no'], ['weiter', 'next'], ['banana', null],
];
for (const [t, want] of commands) {
  const got = parseCommand(t);
  if (got !== want) fail(`parseCommand("${t}") = ${got}, expected ${want}`);
}
// ---- Content integrity: fallback entries, learning path, lessons, handbook ----
for (const [cat, id] of Object.entries(FALLBACK_ENTRY)) if (!getNode(id, 'adult')) fail(`FALLBACK_ENTRY ${cat} → missing node ${id}`);
const nodeIds = new Set<string>();
for (const n of ALL_NODES) {
  if (nodeIds.has(n.id)) fail(`duplicate path node ${n.id}`);
  nodeIds.add(n.id);
  if (n.kind === 'lesson' && !LESSONS.some((l) => l.id === n.lessonId)) fail(`path node ${n.id}: unknown lesson ${n.lessonId}`);
  if (n.kind === 'exercise') {
    const e = n.exercise;
    if (e.type === 'order' && new Set(e.steps).size !== e.steps.length) fail(`${n.id}: duplicate order steps`);
    if (e.type === 'tap' && (e.target.x < 0 || e.target.x > 300 || e.target.y < 0 || e.target.y > 220)) fail(`${n.id}: tap target outside scene`);
    if (e.type === 'scenario' && e.steps.some((st) => st.options.filter((o) => o.correct).length !== 1)) fail(`${n.id}: each scenario step needs exactly 1 correct option`);
  }
}
for (const l of LESSONS) for (const q of l.quiz) if (q.correct < 0 || q.correct >= q.options.length) fail(`lesson ${l.id}: bad quiz answer index`);
for (const [cat, id] of Object.entries(CHAPTER_FOR)) if (!HANDBOOK.some((c) => c.id === id)) fail(`CHAPTER_FOR ${cat} → missing chapter ${id}`);
console.log(`✓ content: ${ALL_NODES.length} path nodes, ${LESSONS.length} lessons, ${HANDBOOK.length} handbook chapters`);

// ---- Safety guard unit checks ----
const guard: [string, boolean][] = [
  ['Make him vomit now.', false],
  ['Do not make them vomit.', true],
  ['Put butter on the burn.', false],
  ['No butter, creams or ice.', true],
  ['Pull out the knife.', false],
  ['Leave the knife in place. Do not pull it out.', true],
  ['Give 500 mg of aspirin.', false],
  ['Press hard on the wound for 10 minutes.', true],
  ['Wait 10 minutes before calling.', false],
];
for (const [t, ok] of guard) if (checkStep({ text: t }).ok !== ok) fail(`guard("${t}") expected ${ok ? 'allowed' : 'blocked'}`);
if (checkStep({ text: 'Give 5 abdominal thrusts.' }, 'baby').ok) fail('guard: abdominal thrusts on baby not blocked');

// ---- Multiple Gemini keys (GEMINI_API_KEY=key1,key2) ----
{
  const k = parseKeys(' a, b ,,a\nc ');
  if (k.join('|') !== 'a|b|c') fail(`parseKeys → ${k.join('|')}, expected a|b|c`);
  if (parseKeys(undefined).length !== 0) fail('parseKeys(undefined) should be empty');
  const err = (status: number) => Object.assign(new Error('x' + status), { status });
  const used: string[] = [];
  const r = await withKeyFallback(['k1', 'k2'], async (key) => { used.push(key); if (key === 'k1') throw err(429); return 'ok:' + key; });
  if (r !== 'ok:k2' || used.join() !== 'k1,k2') fail(`key fallback on 429: got ${r}, used ${used}`);
  for (const s of [401, 403, 503]) {
    const r2 = await withKeyFallback(['k1', 'k2'], async (key) => { if (key === 'k1') throw err(s); return key; }).catch(() => 'threw');
    if (r2 !== 'k2') fail(`key fallback on ${s}: got ${r2}`);
  }
  const bad = await withKeyFallback(['k1', 'k2'], async () => { throw err(400); }).catch((e) => (e as { status?: number }).status);
  if (bad !== 400) fail('400 (bad request) must not switch keys');
  const used2: string[] = [];
  const allFail = await withKeyFallback(['k1', 'k2'], async (key) => { used2.push(key); throw err(429); }).catch((e) => (e as Error).message);
  if (allFail !== 'x429' || used2.length !== 2) fail('all keys busy should throw last error after trying each');
}

// ---- Jury test cases (R2) + edge cases ----
const results = [];
for (const sc of SCENARIOS) {
  const r = await runScenario(sc, 'offline');
  results.push(r);
  if (!r.pass) fail(`scenario ${sc.id}: ${r.checks.filter((c) => !c.pass).map((c) => c.label).join(', ')}`);
}
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} test scenarios passed`);
if (process.argv.includes('--md')) console.log('\n' + toMarkdown(results));

console.log(errors ? `\n${errors} problem(s)` : '\nAll protocols OK');
process.exit(errors ? 1 : 0);
