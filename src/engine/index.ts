import type { GuideEngine, GuideStep, StartInput } from '../types';
import { AI_AVAILABLE, GeminiEngine, type AiOptions } from './geminiEngine';
import { LocalEngine } from './localEngine';
import { isCritical } from './safetyGuard';

export { AI_AVAILABLE, AI_MODE, AI_MODEL } from './geminiEngine';
export { classify, CATEGORY_LABEL } from './classify';
export { LocalEngine } from './localEngine';
export { GeminiEngine } from './geminiEngine';

export interface GuideStart {
  engine: GuideEngine;
  step: GuideStep;
  /** Human-readable notes for the handover log / test lab. */
  notes: string[];
}

/**
 * Single entry point for every guide (UI and Test Lab use the same path).
 * 1. Life-critical keywords ("not breathing") → CPR immediately, rule-based.
 * 2. Quick button (no photo) → reviewed offline protocol, instantly.
 * 3. Free text / speech / photo → AI if available, else the offline protocol.
 */
export async function startGuide(input: StartInput, opts: AiOptions, forceLocal = false): Promise<GuideStart> {
  if (isCritical(input.description)) {
    const engine = new LocalEngine(input.age);
    return {
      engine,
      step: engine.startAt('cpr_call'),
      notes: ['Critical keywords detected ("not breathing"): CPR protocol started immediately'],
    };
  }
  // A custom transport (live test script) enables the AI engine even without the Vite/Vercel proxy.
  const useAi = (AI_AVAILABLE || !!opts.transport) && !forceLocal;
  if (input.via === 'quick' && !input.photo) {
    // Hybrid: a tapped category needs no interpretation, so the reviewed protocol starts instantly.
    const engine = new LocalEngine(input.age);
    return { engine, step: await engine.start(input), notes: ['Quick button: reviewed protocol, started instantly'] };
  }
  const engine: GuideEngine = useAi ? new GeminiEngine(opts) : new LocalEngine(input.age);
  const step = await engine.start(input);
  return { engine, step, notes: [] };
}
