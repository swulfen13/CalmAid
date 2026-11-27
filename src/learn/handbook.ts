import type { Category } from '../types';

/**
 * Offline first-aid handbook for reading at your own pace.
 * Every topic uses the same structure: recognise · help · never · call.
 * Based on public lay guidance (ERC Guidelines 2021, AHA, Red Cross).
 */

export interface Chapter {
  id: string;
  title: string;
  icon: string; // Icon name
  part: 'Basics' | 'Emergencies' | 'Everyday' | 'Good to know';
  intro: string;
  illustration?: string;
  recognize?: string[];
  help?: string[];
  never?: string[];
  call?: string[];
  kids?: string[];
  body?: { heading: string; text: string }[];
}

export const HANDBOOK: Chapter[] = [
  // ---------------- Basics ----------------
  {
    id: 'before',
    title: 'Before you help',
    icon: 'shield',
    part: 'Basics',
    intro: 'The first 30 seconds decide a lot. A simple routine keeps you calm.',
    body: [
      { heading: '1. Safety', text: 'Look around. Traffic, fire, smoke, electricity, gas, water? Make the scene safe or keep your distance and call. You can’t help if you get hurt.' },
      { heading: '2. Response', text: 'Kneel down, tap both shoulders and ask loudly: "Are you okay?"' },
      { heading: '3. Airway & breathing', text: 'Tilt the head back gently, lift the chin and look, listen and feel for normal breathing for up to 10 seconds. Rare gasps are not normal breathing.' },
      { heading: '4. Call', text: 'Call 112 / 911, put the phone on speaker and stay with the person. If others are around, point at one person: "You, call an ambulance!"' },
      { heading: '5. Act', text: 'Not breathing → CPR. Breathing but unresponsive → recovery position. Awake → keep them calm, still and warm, and watch them.' },
    ],
  },
  {
    id: 'calling',
    title: 'Calling for help',
    icon: 'phone',
    part: 'Basics',
    intro: 'A good emergency call takes less than a minute and gets the right help to the right place.',
    illustration: 'phone',
    body: [
      { heading: 'Where', text: 'Say the address first, including floor, entrance or a landmark. If the call drops, help can still come.' },
      { heading: 'What', text: 'Describe what happened in one sentence: "A man collapsed and is not breathing."' },
      { heading: 'How many', text: 'Say how many people are hurt.' },
      { heading: 'Wait', text: 'Answer the dispatcher’s questions and don’t hang up first. Many dispatchers will coach you through CPR.' },
      { heading: 'Numbers', text: '112 works across Europe and on most mobile phones worldwide. USA and Canada: 911. UK: 999 or 112. Australia: 000. CalmAid shows your local number in the red banner.' },
    ],
  },
  {
    id: 'cpr',
    title: 'CPR and defibrillators',
    icon: 'circulation',
    part: 'Basics',
    intro: 'When the heart stops, CPR keeps blood flowing to the brain until a defibrillator and paramedics arrive.',
    illustration: 'cpr',
    recognize: ['Does not respond to voice or touch', 'Not breathing, or only gasping'],
    help: [
      'Call 112 / 911 and put the phone on speaker',
      'Send someone for an AED (defibrillator)',
      'Heel of one hand in the middle of the chest, the other on top',
      'Push 5–6 cm deep, 100–120 times a minute, let the chest rise fully',
      'If trained and willing: 2 rescue breaths after every 30 pushes, otherwise push continuously',
      'When the AED arrives: switch it on and follow its voice',
    ],
    never: ['Stop to check for a pulse', 'Wait for the ambulance before starting', 'Worry about hurting them: CPR can only help'],
    kids: ['Child: give 5 rescue breaths first if you can, then push with one or two hands about 5 cm deep', 'Baby: two fingers in the middle of the chest, about 4 cm deep'],
  },
  {
    id: 'recovery',
    title: 'Recovery position',
    icon: 'unconscious',
    part: 'Basics',
    intro: 'Keeps the airway open for someone who is unconscious but breathing.',
    illustration: 'recovery',
    help: [
      'Kneel beside them; near arm at a right angle, palm up',
      'Far hand against their near cheek; hold it there',
      'Bend the far knee, foot flat on the floor',
      'Pull the knee towards you to roll them onto their side',
      'Tilt the head back, mouth facing down',
      'Check breathing every minute; if it stops, start CPR',
    ],
    kids: ['Babies: hold them in your arms, face tilted slightly down, head lower than the body'],
  },

  // ---------------- Emergencies ----------------
  {
    id: 'bleeding',
    title: 'Severe bleeding',
    icon: 'bleeding',
    part: 'Emergencies',
    intro: 'Most bleeding stops with firm, continuous pressure.',
    illustration: 'pressure',
    recognize: ['Blood spurting or pulsing', 'Blood soaking through clothes quickly', 'A pool of blood growing'],
    help: ['Call 112 / 911 for heavy bleeding', 'Protect yourself with gloves or a plastic bag if possible', 'Press hard directly on the wound with a cloth or your hand', 'Keep pressing; add more cloth on top if it soaks through', 'Let them lie down and keep them warm'],
    never: ['Remove objects stuck in the wound (press around them)', 'Lift the cloth to check', 'Give food or drink'],
    call: ['Spurting or heavy bleeding', 'Bleeding that doesn’t stop after 10 minutes of pressure', 'Pale, cold, sweaty or confused person (shock)'],
  },
  {
    id: 'burns',
    title: 'Burns and scalds',
    icon: 'burn',
    part: 'Emergencies',
    intro: 'Cool water for 20 minutes is the single most effective treatment.',
    illustration: 'cool',
    help: ['Cool under cool running water for 20 minutes', 'Remove rings, watches and tight clothing before swelling starts', 'Cover loosely with cling film or a clean, non-fluffy cloth', 'Keep the person warm'],
    never: ['Use ice, butter, oil, toothpaste or creams', 'Pop blisters', 'Pull off clothing stuck to the skin'],
    call: ['Larger than the person’s palm', 'On the face, hands, feet, groin or joints', 'Burns on children or older people', 'Chemical or electrical burns'],
  },
  {
    id: 'choking',
    title: 'Choking',
    icon: 'choking',
    part: 'Emergencies',
    intro: 'A blocked airway is an emergency, but the techniques are simple.',
    illustration: 'backblows',
    recognize: ['Sudden coughing or gagging while eating', 'Hands at the throat', 'Can’t speak, cough or breathe (severe)'],
    help: ['Mild (can cough): encourage coughing, stay with them', 'Severe: lean them forward, up to 5 firm back blows between the shoulder blades', 'Then up to 5 belly thrusts: fist above the belly button, pull in and up', 'Alternate 5 + 5; if they collapse, call 112 / 911 and start CPR'],
    never: ['Hit the back of someone who is coughing well', 'Do blind finger sweeps in the mouth'],
    kids: ['Baby: face down along your forearm, head low, 5 back blows; then face up, 5 chest pushes with two fingers', 'Never use belly thrusts on babies'],
    call: ['Severe choking', 'After belly thrusts, always get a check-up'],
  },
  {
    id: 'heart',
    title: 'Chest pain & fainting',
    icon: 'circulation',
    part: 'Emergencies',
    intro: 'Chest pain can be a heart attack. Fainting is usually harmless, but not always.',
    illustration: 'sitting',
    recognize: ['Pressure, tightness or pain in the chest, possibly spreading to arm, jaw or back', 'Shortness of breath, sweating, nausea', 'Fainting: brief loss of consciousness, quick recovery'],
    help: ['Chest pain: call 112 / 911, help them sit half-upright, loosen tight clothing, stay with them', 'Fainting: lay them on their back and raise the legs about 30 cm', 'If they become unresponsive and stop breathing: CPR'],
    never: ['Let someone with chest pain walk or drive to a doctor', 'Give medication unless a dispatcher tells you to'],
    call: ['Any chest pain or pressure', 'Fainting with chest pain, during exercise, or not waking within a minute'],
  },
  {
    id: 'stroke',
    title: 'Stroke',
    icon: 'stroke',
    part: 'Emergencies',
    intro: 'In a stroke, part of the brain loses blood supply. Fast treatment saves brain function.',
    illustration: 'fast',
    recognize: ['Face: one side droops when smiling', 'Arms: one arm drifts down when both are raised', 'Speech: slurred or strange', 'Also: sudden confusion, severe headache, loss of vision or balance'],
    help: ['Call 112 / 911 immediately and say "possible stroke"', 'Note the time symptoms started', 'Keep them comfortable, head slightly raised'],
    never: ['Give food, drink or medicine (including aspirin)', 'Wait to see if it passes'],
    call: ['Any FAST sign, even if it goes away again'],
  },
  {
    id: 'seizure',
    title: 'Seizures',
    icon: 'seizure',
    part: 'Emergencies',
    intro: 'Most seizures stop on their own within a few minutes. Your job: protect and time.',
    illustration: 'recovery',
    help: ['Move hard objects away, cushion the head', 'Time the seizure', 'When it stops: recovery position, stay and talk calmly'],
    never: ['Put anything in their mouth', 'Hold them down', 'Give food or drink until fully awake'],
    call: ['Longer than 5 minutes', 'First seizure ever', 'Injury, pregnancy, in water, or not waking up', 'Another seizure follows'],
  },
  {
    id: 'allergy',
    title: 'Severe allergic reaction',
    icon: 'allergy',
    part: 'Emergencies',
    intro: 'Anaphylaxis can develop within minutes after food, stings or medicine.',
    illustration: 'pen',
    recognize: ['Swelling of face, lips, tongue or throat', 'Difficulty breathing or wheezing', 'Hives, pale skin, dizziness, collapse'],
    help: ['Call 112 / 911 and say "anaphylaxis"', 'Help them use their adrenaline pen in the outer thigh (through clothing is fine)', 'Breathing difficulty: let them sit up; dizzy: lie down with legs raised', 'A second pen can be used after 5 minutes if there’s no improvement'],
    never: ['Make them stand or walk', 'Wait to see if it gets better'],
  },
  {
    id: 'poisoning',
    title: 'Poisoning',
    icon: 'poisoning',
    part: 'Emergencies',
    intro: 'Medicines, cleaning products, plants or alcohol: act calmly and get expert advice.',
    help: ['Call 112 / 911 or your poison centre', 'Keep the packaging, say what, how much and when', 'Unconscious but breathing: recovery position'],
    never: ['Make them vomit', 'Give milk, salt water or "antidotes"'],
    call: ['Drowsiness, confusion, breathing problems, seizures', 'Any poisoning in a child'],
  },

  // ---------------- Everyday ----------------
  {
    id: 'small',
    title: 'Small cuts & grazes',
    icon: 'bleeding',
    part: 'Everyday',
    intro: 'Clean, cover, watch.',
    help: ['Press until the bleeding stops', 'Rinse with clean running water', 'Cover with a plaster or bandage', 'Check for redness, heat, swelling or pus over the next days'],
    call: ['Deep or gaping wounds', 'Dirty wounds and no tetanus shot in the last 10 years'],
  },
  {
    id: 'nose',
    title: 'Nosebleeds',
    icon: 'bleeding',
    part: 'Everyday',
    intro: 'Lean forward, pinch, wait.',
    illustration: 'nose',
    help: ['Sit and lean forward', 'Pinch the soft part of the nose for 10 minutes without letting go', 'Breathe through the mouth'],
    never: ['Tilt the head back'],
    call: ['Longer than 20 minutes', 'After a head injury'],
  },
  {
    id: 'sprain',
    title: 'Sprains & bumps',
    icon: 'pulse',
    part: 'Everyday',
    intro: 'Protect, raise, cool gently.',
    illustration: 'legs',
    help: ['Stop the activity and protect the injured part', 'Raise it', 'Cool with a wrapped cold pack for 15 minutes', 'Gentle movement after a day or two if pain allows'],
    call: ['Deformed limb, can’t bear weight, numbness or a cold, pale limb'],
  },
  {
    id: 'heatcold',
    title: 'Heat & cold',
    icon: 'pulse',
    part: 'Everyday',
    intro: 'Overheating and hypothermia both affect the brain and heart.',
    body: [
      { heading: 'Too hot', text: 'Move to shade, loosen clothing, cool the skin with wet cloths and a fan, give sips of water if awake. Confusion or hot, dry skin: call 112 / 911 (heat stroke).' },
      { heading: 'Too cold', text: 'Move out of the wind, replace wet clothes, wrap in blankets including the head, give a warm sweet drink if awake. No rubbing, no hot baths, no alcohol.' },
    ],
  },

  // ---------------- Good to know ----------------
  {
    id: 'myths',
    title: 'First-aid myths',
    icon: 'shield',
    part: 'Good to know',
    intro: 'Common advice that does more harm than good.',
    body: [
      { heading: '"Put butter on a burn"', text: 'It traps heat and increases infection risk. Cool running water for 20 minutes.' },
      { heading: '"Tilt the head back for a nosebleed"', text: 'You swallow blood. Lean forward and pinch.' },
      { heading: '"Put something in the mouth during a seizure"', text: 'Nobody swallows their tongue. Objects break teeth or block the airway.' },
      { heading: '"Make them vomit after poisoning"', text: 'Corrosive substances burn twice. Call for advice instead.' },
      { heading: '"Pull out the knife"', text: 'It may be plugging a large vessel. Leave it and press around it.' },
      { heading: '"CPR can hurt someone"', text: 'Without CPR, a person in cardiac arrest dies. Any CPR is better than none.' },
    ],
  },
  {
    id: 'kit',
    title: 'First-aid kit',
    icon: 'medical',
    part: 'Good to know',
    intro: 'What belongs at home, in the car and in your bag.',
    help: ['Disposable gloves', 'Plasters in several sizes', 'Sterile gauze pads and 2 bandage rolls', 'Tape, scissors, tweezers', 'Cold pack and foil blanket', 'A card with emergency numbers and medical info'],
    body: [{ heading: 'Check twice a year', text: 'Replace what you used and anything past its date.' }],
  },
  {
    id: 'allowed',
    title: '"Am I allowed to help?"',
    icon: 'help',
    part: 'Good to know',
    intro: 'Yes, and in many countries you’re expected to.',
    body: [
      { heading: 'Doing something is right', text: 'Calling for help and doing your best in good faith is what matters. Most countries protect helpers who act reasonably (often called "Good Samaritan" rules).' },
      { heading: 'Sometimes it’s a duty', text: 'In some countries, for example Germany, Austria or France, failing to give reasonable help in an emergency is an offence. Calling the emergency number already counts as help.' },
      { heading: 'Your own safety first', text: 'No law expects you to put yourself in danger.' },
      { heading: 'Not legal advice', text: 'Rules differ by country. This is general information only.' },
    ],
  },
];

/** Which chapter to open after an emergency guide ("read more"). */
export const CHAPTER_FOR: Record<Category, string> = {
  unconscious: 'recovery',
  bleeding: 'bleeding',
  burn: 'burns',
  choking: 'choking',
  circulation: 'heart',
  stroke: 'stroke',
  seizure: 'seizure',
  allergy: 'allergy',
  poisoning: 'poisoning',
  unknown: 'before',
};

export const PARTS = ['Basics', 'Emergencies', 'Everyday', 'Good to know'] as const;
