import { parseKeys } from '../src/engine/aiShared.ts';
/**
 * Live AI test: runs the jury scenarios against the real Gemini API.
 *   1. Put GEMINI_API_KEY into .env.local
 *   2. npm run test:ai
 * Writes test-results-live.md (paste into Devpost). The key is only read locally.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { callGemini, type Turn } from '../src/engine/aiShared.ts';
import { SCENARIOS, runScenario, toMarkdown, type Result } from '../src/testlab/scenarios.ts';

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

loadEnv();
const key = parseKeys(process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY)[0] ?? '';
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
if (!key) {
  console.error('✗ No GEMINI_API_KEY in .env.local');
  process.exit(1);
}

// 1) Connectivity + key check with a clear message.
console.log(`Model: ${model}\nChecking key…`);
const probe = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}`, { headers: { 'x-goog-api-key': key } });
if (!probe.ok) {
  const body = await probe.text();
  console.error(`✗ Gemini answered HTTP ${probe.status}:\n${body.slice(0, 500)}`);
  if (/request blocked|proxy/i.test(body)) console.error('\nHint: your network or a proxy blocks generativelanguage.googleapis.com. Try another network.');
  else console.error('\nHints: 400/401/403 → key invalid or Generative Language API not enabled (create a key in Google AI Studio). 404 → model name, set GEMINI_MODEL in .env.local.');
  process.exit(1);
}
console.log('✓ Key works\n');

// 2) Run all scenarios: real AI for normal cases, simulated replies for the safety-layer cases.
// Free-tier keys allow only a few requests per minute: keep a gap between calls (a real user never hits this).
const GAP_MS = Number(process.env.AI_TEST_GAP_MS ?? 4500);
let calls = 0;
let last = 0;
const transport = async (turns: Turn[]) => {
  const waitMs = last + GAP_MS - Date.now();
  if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
  last = Date.now();
  calls++;
  return callGemini({ turns, languageName: 'English', emergencyNumber: '112' }, key, model, AbortSignal.timeout(20000));
};

const results: Result[] = [];
for (const sc of SCENARIOS) {
  process.stdout.write(`• ${sc.title} … `);
  const r = await runScenario(sc, 'live-ai', transport);
  results.push(r);
  console.log(r.pass ? `PASS (${r.ms} ms)` : `FAIL: ${r.checks.filter((c) => !c.pass).map((c) => c.label).join('; ')}`);
  if (sc.id.startsWith('std') || sc.id === 'repeat-burn') console.log(`    steps: ${r.summary}`);
}

const passed = results.filter((r) => r.pass).length;
const md = `# CalmAid live AI test\n\nModel: \`${model}\` · ${new Date().toISOString()} · ${calls} API calls\n\n${toMarkdown(results)}\n\n**${passed}/${results.length} passed**\n`;
writeFileSync('test-results-live.md', md);
console.log(`\n${passed}/${results.length} passed · ${calls} API calls · written to test-results-live.md`);
process.exit(passed === results.length ? 0 : 1);
