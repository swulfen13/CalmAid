import { AI_MODE, AI_MODEL } from '../engine';
import { GUARD_RULES } from '../engine/safetyGuard';
import { Icon } from './Icons';

/** In-app transparency page (jury criteria A1–A5): what the AI does, why this model, its limits, how it is checked. */
export function AiInfo({ onBack, onTests }: { onBack: () => void; onTests: () => void }) {
  return (
    <main className="screen info">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ‹ Back
        </button>
        <span className="flow-meta">AI transparency</span>
        <span />
      </div>
      <h1 className="page-title">How CalmAid uses AI</h1>
      <p className="page-sub">
        Status: <strong>{AI_MODE === 'off' ? 'AI off: reviewed offline protocols only' : `AI on (${AI_MODEL}, ${AI_MODE === 'proxy' ? 'key on server' : 'direct'})`}</strong>
      </p>

      <section className="card info-card">
        <h2>
          <Icon name="pulse" /> What the AI adds
        </h2>
        <ul>
          <li><strong>Used where it matters (hybrid).</strong> A tapped quick button starts the reviewed protocol instantly (0 s, works offline). The AI is used for what rules can’t do: free text, speech, photos and other languages.</li>
          <li><strong>Understands chaos.</strong> Free text or speech like "my grandpa fell and talks weird" becomes the right protocol (stroke), in 12 languages.</li>
          <li><strong>Reads photos.</strong> A picture of a wound or burn is described neutrally ("palm-sized burn, blisters") and shapes the next steps and the report.</li>
          <li><strong>Adapts the follow-up.</strong> At most 2 yes/no questions, chosen for this situation, then one plain-language action per screen.</li>
          <li><strong>Writes the handover.</strong> Each step adds a short factual note for the paramedics.</li>
        </ul>
      </section>

      <section className="card info-card">
        <h2>
          <Icon name="flask" /> Why Gemini 3.5 Flash-Lite
        </h2>
        <ul>
          <li><strong>Measured fastest:</strong> in our benchmark it returned correct JSON in ≈ 6.5 s with minimal thinking, while larger Flash models took 30–160 s under load. Speed matters more than eloquence when someone is panicking.</li>
          <li><strong>Structured output:</strong> native JSON schema, so every answer has the exact shape the UI expects.</li>
          <li><strong>Multimodal & multilingual:</strong> one model for text, photos and 12 languages.</li>
          <li><strong>Deterministic settings:</strong> temperature 0, topK 1, fixed seed for repeatable decisions.</li>
        </ul>
      </section>

      <section className="card info-card">
        <h2>
          <Icon name="shield" /> 6 safety layers
        </h2>
        <ol className="layers">
          <li><strong>Life-critical rules first.</strong> "Not breathing" in the text, or a "no" to a breathing question, starts CPR. Decided by code, never by the model.</li>
          <li><strong>Strict prompt + JSON schema.</strong> One action per reply, max 15 words, no diagnosis, no doses.</li>
          <li><strong>Validation.</strong> Malformed or overlong answers are rejected; a 3rd question is refused.</li>
          <li><strong>Safety guard.</strong> Every AI step is scanned for {GUARD_RULES.length} known harmful first-aid myths before it is shown (list below).</li>
          <li><strong>Timeout & fallback.</strong> No answer within 12 s, an error or a blocked step: the reviewed offline protocol takes over instantly.</li>
          <li><strong>Always-visible escape.</strong> "Not breathing? Start CPR" and the emergency number are on every screen.</li>
        </ol>
      </section>

      <section className="card info-card">
        <h2>Guard rules</h2>
        <ul className="rules">
          {GUARD_RULES.map((r) => (
            <li key={r.id}>{r.reason}</li>
          ))}
        </ul>
      </section>

      <section className="card info-card">
        <h2>Known limits</h2>
        <ul>
          <li>The AI can misread a photo or a vague description. That's why it never diagnoses and life-critical paths are rule-based.</li>
          <li>AI needs internet. Offline, CalmAid uses its built-in English protocols.</li>
          <li>Guard rules catch known myths, not every possible error. The offline protocols are the reviewed baseline.</li>
          <li>Content follows public lay guidelines (ERC 2021, AHA, Red Cross) but has not yet been reviewed by a certified trainer.</li>
        </ul>
      </section>

      <section className="card info-card">
        <h2>Built with AI, checked by tests</h2>
        <p className="hint">
          CalmAid was developed with Claude (Anthropic) as coding assistant. Every protocol path, guard rule, voice command and jury test case is verified automatically
          (<code>npm run check</code>), and the full flow was tested in a real browser. Tests caught real errors that were fixed, e.g. a baby-choking screen that still mentioned belly thrusts.
        </p>
      </section>

      <button className="btn btn-primary" onClick={onTests}>
        Open the Test Lab
      </button>
    </main>
  );
}
