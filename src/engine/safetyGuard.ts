import type { Age, GuideStep } from '../types';

/**
 * Safety guard: every AI step is checked BEFORE it is shown.
 * If a rule fires, the step is discarded and CalmAid switches to the
 * reviewed offline protocol. Rules target well-known harmful first-aid myths.
 *
 * A rule only fires when the sentence is NOT negated
 * ("Do not use butter" is fine, "Put butter on it" is blocked).
 */

interface Rule {
  id: string;
  reason: string;
  pattern: RegExp;
  /** Only for these age groups (default: all). */
  ages?: Age[];
}

export const GUARD_RULES: Rule[] = [
  { id: 'vomit', reason: 'Inducing vomiting after poisoning is dangerous', pattern: /(make (them|him|her|the person) (vomit|throw up)|induce vomiting|finger down (the|their) throat|erbrechen auslösen|zum erbrechen bringen)/i },
  { id: 'burn-myth', reason: 'Butter, oil, toothpaste or ice on burns cause harm', pattern: /(butter|toothpaste|cooking oil|zahnpasta)|(\bice\b.*\bburn|\bburn\b.*\bice\b)/i },
  { id: 'mouth-seizure', reason: 'Never put anything in the mouth during a seizure', pattern: /(put|place|insert|stick) (something|anything|an object|a spoon|your fingers?|a wallet) (in|into|between) (their|his|her) (mouth|teeth)/i },
  { id: 'feed-unconscious', reason: 'No food or drink for someone who may lose consciousness', pattern: /(give|offer) (them |him |her )?(water|food|a drink|something to (eat|drink)|alcohol|coffee)/i },
  { id: 'remove-object', reason: 'Embedded objects must stay in the wound', pattern: /(pull|take|remove|yank) (out )?(the )?(knife|glass|object|shard|stick|nail)( out)?/i },
  { id: 'dose', reason: 'Medication doses are never given by CalmAid', pattern: /\b\d+\s?(mg|milligrams?|ml|tablets?|pills?)\b/i },
  { id: 'slap', reason: 'Slapping or shaking is not first aid', pattern: /(slap (their|his|her) face|shake (them|him|her) (hard|violently)|shake the baby)/i },
  { id: 'baby-abdominal', reason: 'Abdominal thrusts must not be used on babies', pattern: /(abdominal thrusts?|belly thrusts?|heimlich)/i, ages: ['baby'] },
  { id: 'stop-cpr', reason: 'CPR must not be stopped before help or an AED takes over', pattern: /(stop (cpr|compressions|pushing) (after|when|if) (a few|some|\d+)|you can stop pushing)/i },
  { id: 'wait-call', reason: 'Calling emergency services must never be delayed', pattern: /(wait (a few|\d+|some) (minutes?|hours?) before calling|no need to call|don'?t call (112|911|999|000|an ambulance|emergency))/i },
];

const NEGATION = /\b(do not|don'?t|never|no|not|avoid|without|nicht|kein|keine|niemals|nunca|jamais|ne pas)\b/i;

export interface GuardResult {
  ok: boolean;
  ruleId?: string;
  reason?: string;
}

export function checkStep(step: Pick<GuideStep, 'text' | 'detail'>, age: Age = 'adult'): GuardResult {
  const full = `${step.text}. ${step.detail ?? ''}`;
  const sentences = full.split(/(?<=[.!?;])\s+|\n/);
  for (const rule of GUARD_RULES) {
    if (rule.ages && !rule.ages.includes(age)) continue;
    for (const s of sentences) {
      if (!rule.pattern.test(s)) continue;
      // "Do not put butter on it" → allowed. Exception: "wait-call" contains its own negation.
      if (rule.id !== 'wait-call' && NEGATION.test(s)) continue;
      return { ok: false, ruleId: rule.id, reason: rule.reason };
    }
  }
  if (step.text.length > 200) return { ok: false, ruleId: 'length', reason: 'Instruction too long for a stressed reader' };
  return { ok: true };
}

/**
 * Life-critical shortcut: if the description clearly says the person is not breathing,
 * skip every question and start CPR guidance immediately — no model, no waiting.
 */
const CRITICAL = /(not breathing|isn'?t breathing|no breathing|stopped breathing|not breath|no pulse|cardiac arrest|heart (has )?stopped|atmet nicht|keine atmung|no respira|ne respire pas)/i;

export function isCritical(text: string) {
  return CRITICAL.test(text);
}

/** A "no" to any breathing question means CPR — decided by code, not by the model. */
export function isBreathingQuestion(text: string) {
  // "Can they cough, speak or breathe?" (choking) or "Is breathing hard?" are NOT CPR questions.
  return /(breath|atmet|atmung|respir)/i.test(text) && !/(cough|speak|talk|chok|swallow|trouble|hard|difficult|short|husten|sprechen)/i.test(text);
}
