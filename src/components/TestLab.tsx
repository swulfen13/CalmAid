import { useState } from 'react';
import { AI_AVAILABLE } from '../engine';
import { R2_IDS, runScenario, SCENARIOS, toMarkdown, type Mode, type Result } from '../testlab/scenarios';
import { Icon } from './Icons';

/** Runs the jury test cases (R2) live in the app — easy to show in the demo video. */
export function TestLab({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>('offline');
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async (ids: string[]) => {
    setResults([]);
    const out: Result[] = [];
    for (const id of ids) {
      const sc = SCENARIOS.find((s) => s.id === id)!;
      setRunning(sc.title);
      try {
        out.push(await runScenario(sc, mode));
      } catch (e) {
        out.push({ id, group: sc.group, title: sc.title, input: sc.input.description, expected: sc.expected, checks: [{ label: String(e), pass: false }], pass: false, summary: '', ms: 0, mode });
      }
      setResults([...out]);
    }
    setRunning(null);
  };

  const passed = results.filter((r) => r.pass).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toMarkdown(results));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy:', toMarkdown(results));
    }
  };

  return (
    <main className="screen info">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ‹ Back
        </button>
        <span className="flow-meta">Test Lab</span>
        <span />
      </div>
      <h1 className="page-title">Reliability Test Lab</h1>
      <p className="page-sub">Runs the real guide engine with scripted answers and checks the result. Two standard cases, a repeat check and a hard edge case, plus extra edge cases.</p>

      <div className="segmented two" role="radiogroup" aria-label="Engine">
        <button role="radio" aria-checked={mode === 'offline'} className={mode === 'offline' ? 'on' : ''} onClick={() => setMode('offline')}>
          Offline engine
        </button>
        <button role="radio" aria-checked={mode === 'live-ai'} className={mode === 'live-ai' ? 'on' : ''} onClick={() => setMode('live-ai')} disabled={!AI_AVAILABLE}>
          Live AI {AI_AVAILABLE ? '' : '(no key)'}
        </button>
      </div>

      <div className="row">
        <button className="btn btn-primary" onClick={() => run(R2_IDS)} disabled={!!running}>
          Run 4 jury tests
        </button>
        <button className="btn btn-secondary" onClick={() => run(SCENARIOS.map((s) => s.id))} disabled={!!running}>
          Run all {SCENARIOS.length}
        </button>
      </div>

      {running && (
        <p className="hint running-line">
          <span className="listen-dot on-dot" /> Running: {running}…
        </p>
      )}

      {results.length > 0 && !running && (
        <div className={`lab-summary ${passed === results.length ? 'good' : 'bad'}`}>
          <Icon name={passed === results.length ? 'check' : 'shield'} size={28} />
          <span>
            <strong>
              {passed} / {results.length} passed
            </strong>
            <small>{mode === 'offline' ? 'Offline engine.' : 'Live AI.'} Simulated cases test the AI safety layers without a key.</small>
          </span>
        </div>
      )}

      <div className="lab-list">
        {results.map((r) => (
          <article key={r.id} className={`lab-item ${r.pass ? 'pass' : 'fail'}`}>
            <header>
              <span className="lab-group">{r.group}</span>
              <span className={`lab-badge ${r.pass ? 'pass' : 'fail'}`}>{r.pass ? 'PASS' : 'FAIL'}</span>
            </header>
            <h3>{r.title}</h3>
            <p className="lab-input">"{r.input}"</p>
            <p className="lab-expected">
              <strong>Expected:</strong> {r.expected}
            </p>
            <ul className="lab-checks">
              {r.checks.map((c, i) => (
                <li key={i} className={c.pass ? 'ok' : 'no'}>
                  {c.pass ? '✓' : '✗'} {c.label}
                </li>
              ))}
            </ul>
            {r.summary && (
              <details>
                <summary>Steps shown</summary>
                <p className="lab-steps">{r.summary}</p>
              </details>
            )}
            <p className="lab-meta">
              {r.mode}, {r.ms} ms
            </p>
          </article>
        ))}
      </div>

      {results.length > 0 && !running && (
        <button className="btn btn-ghost" onClick={copy}>
          {copied ? '✓ Copied' : 'Copy results as Markdown table (Devpost)'}
        </button>
      )}
    </main>
  );
}
