/**
 * Vercel serverless function: POST /api/guide
 * Keeps the Gemini key on the server. Set GEMINI_API_KEY (and optionally GEMINI_MODEL)
 * in Vercel → Project → Settings → Environment Variables.
 */
import { callGemini, validateRequest } from '../src/engine/aiShared.js';

export async function POST(request: Request): Promise<Response> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'AI not configured' }, { status: 503 });

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
    const reply = await callGemini(body, key, process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite', AbortSignal.timeout(11500));
    return Response.json(reply, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
