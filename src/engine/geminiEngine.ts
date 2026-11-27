import type { Age, Category, GuideEngine, GuideStep, StartInput } from '../types';
import { LocalEngine } from './localEngine';
import { FALLBACK_ENTRY } from './protocols';
import { AI_CATEGORIES, callGemini, isValidReply, MAX_QUESTIONS, type AiReply, type Part, type Turn } from './aiShared';
import { checkStep, isBreathingQuestion } from './safetyGuard';

/**
 * Gemini-powered guide. Two ways to reach the model:
 *  - proxy (recommended): POST /api/guide, the key stays on the server (Vercel function / Vite dev middleware)
 *  - direct: VITE_GEMINI_API_KEY in the browser (quick demos on static hosting)
 *
 * Reliability layers (in this order):
 *  1. JSON schema + validation        → malformed output is rejected
 *  2. Client-side rule checks          → max 2 questions, length limits
 *  3. Safety guard                     → known harmful advice is blocked
 *  4. Critical overrides               → "not breathing" always means CPR, decided by code
 *  5. Timeout (12 s) / any error        → offline protocol takes over
 */

declare const __AI_PROXY__: boolean;

const DIRECT_KEY = (import.meta.env?.VITE_GEMINI_API_KEY as string | undefined)?.trim() ?? '';
export const AI_MODEL = (import.meta.env?.VITE_GEMINI_MODEL as string | undefined)?.trim() || 'gemini-3.5-flash-lite';
const USE_PROXY = typeof __AI_PROXY__ !== 'undefined' && __AI_PROXY__ && !DIRECT_KEY;
const TIMEOUT_MS = 12000;

export const AI_AVAILABLE = DIRECT_KEY.length > 0 || USE_PROXY;
export const AI_MODE: 'direct' | 'proxy' | 'off' = DIRECT_KEY ? 'direct' : USE_PROXY ? 'proxy' : 'off';

export interface AiOptions {
  languageName: string;
  emergencyNumber: string;
  /** For tests: replace the network call. */
  transport?: (turns: Turn[]) => Promise<unknown>;
}

export type EngineEvent =
  | { type: 'fallback'; reason: string }
  | { type: 'guard'; reason: string; blocked: string }
  | { type: 'override'; reason: string };

export class GeminiEngine implements GuideEngine {
  readonly name = 'ai' as const;
  private turns: Turn[] = [];
  private questions = 0;
  private aiSteps = 0;
  private fallback: LocalEngine | null = null;
  private category: Category = 'unknown';
  private age: Age = 'adult';
  private opts: AiOptions;
  private lastQuestion = '';
  /** Last AI log line, read by the UI for the handover protocol. */
  lastLog = '';
  usedFallback = false;
  /** Reliability events since the last step (fallback, guard block, override). */
  events: EngineEvent[] = [];
  /** Latency of the last model call in ms. */
  lastLatency = 0;

  constructor(opts: AiOptions) {
    this.opts = opts;
  }

  async start(input: StartInput) {
    this.events = [];
    this.category = input.category;
    this.age = input.age;
    const parts: Part[] = [
      {
        text:
          `Emergency reported by a bystander: "${input.description || 'no description'}".\n` +
          `Patient age group: ${input.age}.\nQuick-select category hint: ${input.category}.\n` +
          `${input.photo ? 'A photo of the situation is attached.\n' : ''}Give the first question or action.`,
      },
    ];
    if (input.photo) {
      const [meta, data] = input.photo.split(',');
      const mime = /data:(.*?);/.exec(meta)?.[1] ?? 'image/jpeg';
      parts.push({ inline_data: { mime_type: mime, data } });
    }
    this.turns = [{ role: 'user', parts }];
    return this.ask(input);
  }

  async answer(value: 'yes' | 'no') {
    this.events = [];
    if (this.fallback) return this.fallback.answer(value);
    // Critical override: "not breathing" → CPR protocol, never left to the model.
    if (value === 'no' && isBreathingQuestion(this.lastQuestion)) {
      this.events.push({ type: 'override', reason: 'Not breathing normally → CPR protocol (rule-based)' });
      return this.switchToLocal('cpr_call');
    }
    this.turns.push({ role: 'user', parts: [{ text: `Answer: ${value.toUpperCase()}` }] });
    return this.ask();
  }

  async next() {
    this.events = [];
    if (this.fallback) return this.fallback.next();
    this.turns.push({ role: 'user', parts: [{ text: 'Done. Next single step.' }] });
    return this.ask();
  }

  private switchToLocal(nodeId?: string, startInput?: StartInput) {
    this.usedFallback = true;
    this.fallback = new LocalEngine(this.age);
    if (nodeId) return Promise.resolve(this.fallback.startAt(nodeId));
    // The AI already guided the user: continue with the first safe action, don't start over.
    if (this.questions > 0 || this.aiSteps > 0) return Promise.resolve(this.fallback.startAt(FALLBACK_ENTRY[this.category] ?? 'unk_1'));
    return this.fallback.start(startInput ?? { category: this.category, description: '', age: this.age });
  }

  private async ask(startInput?: StartInput): Promise<GuideStep> {
    let reply: AiReply;
    try {
      reply = await this.call();
    } catch (err) {
      const reason = err instanceof Error && err.name === 'AbortError' ? 'AI timeout (12 s)' : `AI unavailable (${String(err).slice(0, 80)})`;
      console.warn('[CalmAid]', reason);
      this.events.push({ type: 'fallback', reason });
      this.lastLog = `${reason}: switched to offline protocol`;
      return this.switchToLocal(undefined, startInput);
    }

    if ((AI_CATEGORIES as readonly string[]).includes(reply.category)) this.category = reply.category;

    if (reply.type === 'question' && this.questions >= MAX_QUESTIONS) {
      this.events.push({ type: 'fallback', reason: 'AI asked more than 2 questions' });
      this.lastLog = 'AI broke the 2-question rule: switched to offline protocol';
      return this.switchToLocal(undefined, startInput);
    }

    const guard = checkStep({ text: reply.text, detail: reply.detail }, this.age);
    if (!guard.ok) {
      this.events.push({ type: 'guard', reason: guard.reason ?? 'unsafe', blocked: reply.text });
      this.lastLog = `Safety guard blocked an AI step (${guard.reason}): switched to offline protocol`;
      return this.switchToLocal(undefined, startInput);
    }

    if (reply.type === 'question') {
      this.questions++;
      this.lastQuestion = reply.text;
    }
    if (reply.type !== 'question') this.aiSteps++;
    this.turns.push({ role: 'model', parts: [{ text: JSON.stringify(reply) }] });
    this.lastLog = reply.log ?? '';
    return {
      kind: reply.type,
      text: reply.text.trim(),
      detail: reply.detail?.trim() || undefined,
      call: reply.call_emergency || undefined,
      timerSec: reply.timer_seconds && reply.timer_seconds > 0 ? Math.min(reply.timer_seconds, 1800) : undefined,
      illustration: reply.illustration && reply.illustration !== 'none' ? reply.illustration : undefined,
      photoNote: reply.photo_note?.trim() || undefined,
      source: 'ai',
    };
  }

  private async call(): Promise<AiReply> {
    const t0 = performance.now();
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const req = { turns: this.turns, languageName: this.opts.languageName, emergencyNumber: this.opts.emergencyNumber };
    try {
      let parsed: unknown;
      if (this.opts.transport) parsed = await this.opts.transport(this.turns);
      else if (DIRECT_KEY) parsed = await callGemini(req, DIRECT_KEY, AI_MODEL, ctrl.signal);
      else {
        const res = await fetch('/api/guide', {
          method: 'POST',
          signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error(`proxy HTTP ${res.status}`);
        parsed = await res.json();
      }
      if (!isValidReply(parsed)) throw new Error('invalid AI response');
      return parsed;
    } finally {
      clearTimeout(timer);
      this.lastLatency = Math.round(performance.now() - t0);
    }
  }
}
