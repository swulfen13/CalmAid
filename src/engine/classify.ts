import type { Category } from '../types';

/** Ordered: the most life-threatening match wins. */
const RULES: [Category, RegExp][] = [
  [
    'unconscious',
    /(not breathing|isn'?t breathing|no breath|stopped breathing|unconscious|unresponsive|not respond|won'?t wake|not waking|passed out|collapsed|no pulse|cardiac arrest)/i,
  ],
  ['stroke', /(stroke|face droop|drooping|slurred|one side|can'?t (move|lift) (his|her|their|one) arm|numb (arm|face))/i],
  ['seizure', /(seizure|fit\b|convuls|shaking|jerking|epilep)/i],
  ['allergy', /(allerg|anaphyla|swelling|swollen (face|lip|tongue|throat)|hives|epipen|bee sting|wasp|peanut)/i],
  ['poisoning', /(poison|overdose|swallowed (pills|tablets|chemical|bleach|cleaner)|took too many|toxic|drank (bleach|cleaner))/i],
  ['choking', /(chok|stuck in (the |his |her |their )?throat|swallowed|can'?t (breathe|cough) .*(eat|food)|food .*(throat|stuck))/i],
  ['bleeding', /(bleed|blood|cut|wound|stab|laceration|gash|knife)/i],
  ['burn', /(burn|scald|boiling|hot water|fire|flame|hot oil|steam)/i],
  [
    'circulation',
    /(chest pain|chest pressure|heart|faint|dizzy|light.?headed|pale|sweat|circulation|blood pressure|weak|short of breath|breathless)/i,
  ],
];

export function classify(text: string): Category {
  for (const [cat, re] of RULES) if (re.test(text)) return cat;
  return 'unknown';
}

export const CATEGORY_LABEL: Record<Category, string> = {
  unconscious: 'Unconscious',
  bleeding: 'Heavy bleeding',
  burn: 'Burn',
  choking: 'Choking',
  circulation: 'Fainting / chest pain',
  stroke: 'Stroke signs',
  seizure: 'Seizure',
  allergy: 'Allergic reaction',
  poisoning: 'Poisoning',
  unknown: 'Other emergency',
};
