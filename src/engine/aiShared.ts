/**
 * Shared Gemini request logic: used by the browser (direct mode),
 * the Vercel function (api/guide.ts) and the Vite dev middleware.
 * Keep this file free of browser-only or Node-only APIs.
 */

export const ILLUSTRATION_KEYS = [
  'none', 'phone', 'cpr', 'cpr-baby', 'recovery', 'pressure', 'cool',
  'backblows', 'backblows-baby', 'thrusts', 'chest-baby', 'sitting', 'legs', 'pen', 'fast',
] as const;

export const AI_CATEGORIES = [
  'unconscious', 'bleeding', 'burn', 'choking', 'circulation',
  'stroke', 'seizure', 'allergy', 'poisoning', 'unknown',
] as const;

export const MAX_QUESTIONS = 2;

export function systemPrompt(languageName: string, emergencyNumber: string) {
  return `You are CalmAid, a calm first-aid guide for panicking lay people with no medical training.
Hard rules:
- Reply in ${languageName}. Simple everyday words a 12-year-old understands.
- Output exactly ONE thing per reply: either one yes/no question, or one single action.
- Ask at most ${MAX_QUESTIONS} yes/no questions in the whole conversation. After that, only give actions.
- "text": max 15 words, imperative, no medical jargon, no lists.
- "detail": optional, max 20 words, one short clarification (how / why).
- The local emergency number is ${emergencyNumber}. Use it whenever you mention calling for help.
- If the person is unresponsive AND not breathing normally: first a step to call ${emergencyNumber} (call_emergency true), then reply type "cpr".
- Set call_emergency true on the step where the user should call ${emergencyNumber}.
- Respect the patient age group (adult / child / baby): child and baby CPR and choking techniques differ (ERC paediatric guidance; baby: two-finger compressions, back blows on forearm and chest thrusts, never abdominal thrusts).
- Follow current lay first-aid guidance (ERC / AHA / Red Cross). Hands-only CPR is fine for adults.
- Never tell anyone to induce vomiting, remove embedded objects, put things in a seizing person's mouth, use butter/ice on burns, give food or drink, or delay calling for help.
- Never diagnose. Never suggest medication doses (except "use their own adrenaline pen").
- If the description is unclear or not about a specific emergency, your first reply must be the question "Is the person awake and breathing normally?". If they are awake, the next step is to call ${emergencyNumber} and describe what you see (call_emergency true).
- When an action has a fixed duration, say it in the text AND set timer_seconds: cooling a burn under running water = 1200, firm pressure on a bleeding wound = 600, timing a seizure = 300.
- Use type "done" when the remaining task is to stay with the person until help arrives.
- "illustration": the best matching drawing key for the step, or "none".
- "category": the best matching emergency category.
- "log": max 10 words, factual note for the paramedics' handover report.
- If a photo is attached: in your FIRST reply fill "photo_note" with max 12 neutral words on what you see (e.g. "Burn about palm-sized on the forearm, blistering"). Never graphic. Otherwise leave it empty.`;
}

export const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    type: { type: 'STRING', enum: ['question', 'step', 'cpr', 'done'] },
    text: { type: 'STRING' },
    detail: { type: 'STRING' },
    call_emergency: { type: 'BOOLEAN' },
    timer_seconds: { type: 'INTEGER' },
    category: { type: 'STRING', enum: [...AI_CATEGORIES] },
    illustration: { type: 'STRING', enum: [...ILLUSTRATION_KEYS] },
    photo_note: { type: 'STRING' },
    log: { type: 'STRING' },
  },
  required: ['type', 'text', 'call_emergency', 'category', 'log'],
};

export interface AiReply {
  type: 'question' | 'step' | 'cpr' | 'done';
  text: string;
  detail?: string;
  call_emergency: boolean;
  timer_seconds?: number;
  category: (typeof AI_CATEGORIES)[number];
  illustration?: (typeof ILLUSTRATION_KEYS)[number];
  photo_note?: string;
  log: string;
}

export type Part = { text: string } | { inline_data: { mime_type: string; data: string } };
export type Turn = { role: 'user' | 'model'; parts: Part[] };

export interface AiRequest {
  turns: Turn[];
  languageName: string;
  emergencyNumber: string;
}

export function isValidReply(r: unknown): r is AiReply {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return (
    ['question', 'step', 'cpr', 'done'].includes(o.type as string) &&
    typeof o.text === 'string' &&
    o.text.trim().length > 0 &&
    o.text.length < 240
  );
}

/** Basic sanity limits so a public proxy can't be abused for arbitrary prompts. */
export function validateRequest(body: unknown): body is AiRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    Array.isArray(b.turns) &&
    b.turns.length > 0 &&
    b.turns.length <= 40 &&
    typeof b.languageName === 'string' &&
    b.languageName.length < 40 &&
    typeof b.emergencyNumber === 'string' &&
    b.emergencyNumber.length < 8
  );
}

/** Gemini 3.x models "think" before answering; for a panicking user we want the fastest answer. */
export const DEFAULT_THINKING = 'minimal';

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });

/** Splits GEMINI_API_KEY="key1,key2" into distinct keys (commas, spaces or newlines). */
export function parseKeys(raw: string | undefined): string[] {
  return [...new Set((raw ?? '').split(/[\s,;]+/).map((k) => k.trim()).filter(Boolean))];
}

/** Statuses where another key may succeed: invalid/blocked key, quota, overload. */
const KEY_SWITCH = new Set([401, 403, 429, 500, 502, 503, 504]);

/** Tries each key in order; switches on key/quota/overload errors, rethrows anything else. */
export async function withKeyFallback<T>(keys: string[], fn: (key: string) => Promise<T>): Promise<T> {
  let lastErr: unknown = new Error('No API key');
  for (const key of keys) {
    try {
      return await fn(key);
    } catch (e) {
      lastErr = e;
      const status = (e as { status?: number }).status;
      if (!status || !KEY_SWITCH.has(status)) throw e;
    }
  }
  throw lastErr;
}

/**
 * Gemini call with up to 2 quick retries on overload (429/5xx).
 * The caller's AbortSignal still caps the total time, so the user never waits longer than the timeout.
 */
export async function callGemini(
  req: AiRequest,
  apiKey: string,
  model: string,
  signal?: AbortSignal,
  thinkingLevel: string = DEFAULT_THINKING,
): Promise<AiReply> {
  let lastErr: unknown;
  for (const delay of [0, 600, 1500]) {
    if (delay) await wait(delay, signal);
    try {
      return await callGeminiOnce(req, apiKey, model, signal, thinkingLevel);
    } catch (e) {
      lastErr = e;
      const status = (e as { status?: number }).status;
      if (!status || !RETRYABLE.has(status)) throw e;
    }
  }
  throw lastErr;
}

export async function callGeminiOnce(
  req: AiRequest,
  apiKey: string,
  model: string,
  signal?: AbortSignal,
  thinkingLevel: string = DEFAULT_THINKING,
): Promise<AiReply> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(req.languageName, req.emergencyNumber) }] },
        contents: req.turns,
        generationConfig: {
          // Deterministic decoding: same input → same decision (repeatability, R2).
          temperature: 0,
          topK: 1,
          seed: 42,
          ...(thinkingLevel && thinkingLevel !== 'off' ? { thinkingConfig: { thinkingLevel } } : {}),
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    },
  );
  if (!res.ok) throw Object.assign(new Error(`Gemini HTTP ${res.status}`), { status: res.status });
  const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed: unknown = JSON.parse(raw ?? "");
  if (!isValidReply(parsed)) throw new Error('invalid AI response');
  return parsed;
}
