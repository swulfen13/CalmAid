/**
 * Vercel serverless function: POST /api/guide
 * Keeps the Gemini key on the server. Set GEMINI_API_KEY (and optionally GEMINI_MODEL)
 * Several keys: GEMINI_API_KEY=key1,key2 (the next key is tried on quota/overload/invalid key).
 * in Vercel → Project → Settings → Environment Variables.
 */
import { callGemini, callGeminiOnce, parseKeys, validateRequest, withKeyFallback } from '../src/engine/aiShared.js';

export async function POST(request: Request): Promise<Response> {
  const keys = parseKeys(process.env.GEMINI_API_KEY);
  if (!keys.length) return Response.json({ error: 'AI not configured' }, { status: 503 });

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 4_000_000) return Response.json({ error: 'Request too large' }, { status: 413 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!validateRequest(body)) return Response.json({ error: 'Invalid request' }, { status: 400 });

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
    const signal = AbortSignal.timeout(11500);
    // One key: quick retries on that key. Several keys: switch keys right away instead of waiting.
    const reply = await withKeyFallback(keys, (k) =>
      keys.length > 1 ? callGeminiOnce(body, k, model, signal) : callGemini(body, k, model, signal),
    );
    return Response.json(reply, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
