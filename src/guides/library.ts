/**
 * Calm, plain-language how-to guides for lay people.
 * Not for acute life-threatening emergencies (those use the emergency flow),
 * but for learning, small injuries and everyday situations.
 */

export interface GuideCard {
  id: string;
  title: string;
  icon: string;
  group: 'Learn the basics' | 'Small injuries' | 'Body & mind' | 'Be prepared';
  summary: string;
  /** Shown as a clear red-flag box before the steps. */
  callIf?: string;
  steps: { text: string; detail?: string; timerSec?: number; illustration?: string }[];
}

export const GUIDES: GuideCard[] = [
  // ---------- Learn the basics ----------
  {
    id: 'learn-cpr',
    title: 'How to do CPR',
    icon: '❤️',
    group: 'Learn the basics',
    summary: 'Hands-only CPR in 5 simple steps. Practise the beat now.',
    callIf: 'Someone is unresponsive and not breathing normally: call 112 / 911 first.',
    steps: [
      { text: 'Kneel next to the person on the floor.', detail: 'CPR needs a hard surface. Not on a bed.' },
      { text: 'Put the heel of one hand in the middle of the chest.', detail: 'On the breastbone, between the nipples.', illustration: 'cpr' },
      { text: 'Put your other hand on top. Lock your fingers.' },
      { text: 'Arms straight, shoulders over your hands.', detail: 'Use your body weight, not your arms.' },
      {
        text: 'Push down 5–6 cm, 100–120 times a minute.',
        detail: 'Let the chest come all the way up. Use the beat on the CPR screen.',
      },
      { text: 'Do not stop until help or a defibrillator takes over.', detail: 'Switch with someone every 2 minutes if you can.' },
    ],
  },
  {
    id: 'learn-cpr-child',
    title: 'CPR for children & babies',
    icon: '👶',
    group: 'Learn the basics',
    summary: 'What is different for kids. Same beat, gentler hands.',
    callIf: 'A child is unresponsive and not breathing normally: call 112 / 911 first, put the phone on speaker.',
    steps: [
      { text: 'If you know how, start with 5 rescue breaths.', detail: 'Child: pinch the nose, mouth to mouth. Baby: cover mouth AND nose.' },
      { text: 'Child: push with one or two hands, about 5 cm deep.', detail: 'Middle of the chest, a third of its depth.', illustration: 'cpr' },
      { text: 'Baby: push with two fingers, about 4 cm deep.', detail: 'Baby lying on a firm surface.', illustration: 'cpr-baby' },
      { text: 'Same beat as adults: 100–120 pushes a minute.', detail: 'If trained: 2 breaths after every 30 pushes.' },
      { text: 'Do not stop until help takes over.' },
    ],
  },
  {
    id: 'learn-recovery',
    title: 'Recovery position',
    icon: '🛌',
    group: 'Learn the basics',
    summary: 'For someone who is unconscious but breathing.',
    steps: [
      { text: 'Kneel beside the person lying on their back.' },
      { text: 'Put the arm nearest you at a right angle, palm up.' },
      { text: 'Put their other hand against their cheek nearest you.' },
      { text: 'Bend their far knee up, foot flat on the floor.' },
      { text: 'Pull the bent knee toward you. Roll them onto their side.', detail: 'Keep their hand under their cheek.' },
      { text: 'Tilt the head back gently, mouth facing down.', detail: 'Check breathing every minute.', illustration: 'recovery' },
    ],
  },
  {
    id: 'learn-aed',
    title: 'Using a defibrillator (AED)',
    icon: '⚡',
    group: 'Learn the basics',
    summary: 'Anyone can use one. It talks you through everything.',
    steps: [
      { text: 'Open the lid or press the green button.', detail: 'The device starts speaking. Follow its voice.' },
      { text: 'Take off or cut clothing on the chest.' },
      { text: 'Stick the pads on, exactly as shown on the pictures.' },
      { text: 'Do not touch the person when the AED says so.' },
      { text: 'Press the shock button only if the AED tells you to.' },
      { text: 'Continue CPR when the AED says to.', detail: 'Leave the pads on until help arrives.' },
    ],
  },
  {
    id: 'learn-call',
    title: 'How to call 112 / 911',
    icon: '📞',
    group: 'Learn the basics',
    summary: 'What to say so help arrives fast.',
    steps: [
      { text: 'Say WHERE you are first.', detail: 'Address, floor, landmarks. CalmAid shows your GPS position on call screens.', illustration: 'phone' },
      { text: 'Say WHAT happened.', detail: 'Example: "A man collapsed and is not breathing."' },
      { text: 'Say HOW MANY people are hurt.' },
      { text: 'Answer their questions calmly.' },
      { text: 'Do not hang up first. Wait for their questions.', detail: 'Put the phone on speaker to keep your hands free.' },
    ],
  },

  // ---------- Small injuries ----------
  {
    id: 'small-cut',
    title: 'Small cut or graze',
    icon: '🩹',
    group: 'Small injuries',
    summary: 'Clean it, cover it, watch it.',
    callIf: 'Deep, gaping, spurting or won’t stop after 10 minutes of pressure: get help.',
    steps: [
      { text: 'Wash your hands, or use gloves.' },
      { text: 'Press with a clean cloth until the bleeding stops.', timerSec: 300, illustration: 'pressure' },
      { text: 'Rinse the wound with clean running water.', detail: 'Remove dirt gently. No cotton wool in the wound.' },
      { text: 'Cover with a plaster or clean bandage.' },
      { text: 'Watch for redness, swelling, heat or pus.', detail: 'Signs of infection: see a doctor.' },
    ],
  },
  {
    id: 'nosebleed',
    title: 'Nosebleed',
    icon: '👃',
    group: 'Small injuries',
    summary: 'Lean forward, pinch, wait.',
    callIf: 'Lasts over 20 minutes, after a head injury, or very heavy: get help.',
    steps: [
      { text: 'Sit down and lean forward.', detail: 'Not backward — that makes you swallow blood.' },
      { text: 'Pinch the soft part of the nose.', detail: 'Just below the bony part. Breathe through the mouth.', illustration: 'nose' },
      { text: 'Keep pinching for 10 minutes without letting go.', timerSec: 600 },
      { text: 'Put something cold on the neck or forehead.', detail: 'Optional. It can help.' },
      { text: 'Rest. Do not blow your nose for a few hours.' },
    ],
  },
  {
    id: 'sprain',
    title: 'Sprain, twist or bump',
    icon: '🦶',
    group: 'Small injuries',
    summary: 'Rest, protect, and let it heal.',
    callIf: 'Bone looks bent, can’t put any weight on it, or numb / cold: see a doctor.',
    steps: [
      { text: 'Stop moving the injured part.' },
      { text: 'Raise it above the level of the heart if you can.', illustration: 'legs' },
      { text: 'Cool it with a cold pack wrapped in a cloth.', detail: 'Never ice directly on the skin.', timerSec: 900 },
      { text: 'A soft bandage can give support.', detail: 'Not too tight. Toes or fingers should stay warm.' },
      { text: 'Start gentle movement after a day or two, if pain allows.' },
    ],
  },
  {
    id: 'sting',
    title: 'Insect sting',
    icon: '🐝',
    group: 'Small injuries',
    summary: 'Remove the stinger, cool, watch.',
    callIf: 'Swelling of face or throat, or trouble breathing: call 112 / 911.',
    steps: [
      { text: 'Scrape the stinger out sideways with a card or nail.', detail: 'Do not squeeze it.' },
      { text: 'Wash the area with soap and water.' },
      { text: 'Cool it with a cold cloth.', timerSec: 600 },
      { text: 'Watch them for 30 minutes.', detail: 'Look for swelling of the face or breathing trouble.' },
    ],
  },
  {
    id: 'small-burn',
    title: 'Small burn at home',
    icon: '🔥',
    group: 'Small injuries',
    summary: 'Cool water for 20 minutes is the best medicine.',
    callIf: 'Bigger than the palm, on face, hands or groin, or a child: get help.',
    steps: [
      { text: 'Cool it under cool running water.', detail: 'Not ice-cold. 20 minutes.', timerSec: 1200, illustration: 'cool' },
      { text: 'Take off rings or tight items nearby.' },
      { text: 'Cover loosely with cling film or a clean cloth.' },
      { text: 'Do not pop blisters. No butter, oil or toothpaste.' },
    ],
  },

  // ---------- Body & mind ----------
  {
    id: 'panic',
    title: 'Panic attack — calm breathing',
    icon: '🌬️',
    group: 'Body & mind',
    summary: 'For you or someone with you. It passes.',
    callIf: 'Chest pain, fainting or first time ever with these feelings: call 112 / 911.',
    steps: [
      { text: 'You are safe. This feeling will pass.', detail: 'Panic is scary but not dangerous.' },
      { text: 'Breathe in slowly through your nose for 4 seconds.' },
      { text: 'Breathe out slowly through your mouth for 6 seconds.' },
      { text: 'Repeat for 2 minutes.', timerSec: 120 },
      { text: 'Name 5 things you can see around you.', detail: 'This brings your mind back to the room.' },
    ],
  },
  {
    id: 'heat',
    title: 'Too much heat',
    icon: '☀️',
    group: 'Body & mind',
    summary: 'Heat exhaustion can turn into heat stroke.',
    callIf: 'Confused, very hot dry skin, or passes out: call 112 / 911.',
    steps: [
      { text: 'Move them to a cool, shaded place.' },
      { text: 'Let them lie down and raise their legs.' },
      { text: 'Loosen or remove extra clothing.' },
      { text: 'Cool the skin with wet cloths and a fan.' },
      { text: 'If awake, give small sips of water.' },
    ],
  },
  {
    id: 'cold',
    title: 'Too cold (hypothermia)',
    icon: '❄️',
    group: 'Body & mind',
    summary: 'Warm slowly, handle gently.',
    callIf: 'Very sleepy, confused or stops shivering: call 112 / 911.',
    steps: [
      { text: 'Move them out of the cold and wind.' },
      { text: 'Replace wet clothes with dry ones.' },
      { text: 'Wrap them in blankets, including the head.' },
      { text: 'If awake, give a warm sweet drink. No alcohol.' },
      { text: 'Do not rub the skin or use hot water.', detail: 'Warm slowly.' },
    ],
  },
  {
    id: 'low-sugar',
    title: 'Low blood sugar',
    icon: '🍬',
    group: 'Body & mind',
    summary: 'For someone with diabetes who feels shaky or confused.',
    callIf: 'Can’t swallow, unconscious, or not better after 15 minutes: call 112 / 911.',
    steps: [
      { text: 'Help them sit down.' },
      { text: 'If awake and able to swallow, give sugar.', detail: 'Juice, regular soda, sweets or glucose tablets.' },
      { text: 'Wait 15 minutes.', timerSec: 900 },
      { text: 'If better, give a snack like bread or a banana.' },
    ],
  },

  // ---------- Be prepared ----------
  {
    id: 'kit',
    title: 'Home first-aid kit',
    icon: '🧰',
    group: 'Be prepared',
    summary: 'What to keep at home and in the car.',
    steps: [
      { text: 'Disposable gloves and plasters in different sizes.' },
      { text: 'Sterile gauze pads and two bandage rolls.' },
      { text: 'Tape, scissors and tweezers.' },
      { text: 'A cold pack and a foil blanket.' },
      { text: 'Your emergency numbers on a card inside the lid.' },
      { text: 'Check dates twice a year. Replace what you used.' },
    ],
  },
];

export const GUIDE_GROUPS = ['Learn the basics', 'Small injuries', 'Body & mind', 'Be prepared'] as const;
