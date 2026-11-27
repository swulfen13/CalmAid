/**
 * Micro-lessons for lay people: short cards + a 3-question quiz.
 * Content follows public lay first-aid guidance (ERC Guidelines 2021, AHA, Red Cross)
 * and does not replace a certified first-aid course.
 */

export interface LessonCard {
  title: string;
  text: string;
  illustration?: string;
  tip?: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

export interface Lesson {
  id: string;
  title: string;
  icon: string; // Icon name
  minutes: number;
  summary: string;
  cards: LessonCard[];
  quiz: QuizQuestion[];
  practice?: 'cpr';
}

export const LESSONS: Lesson[] = [
  {
    id: 'check-call',
    title: 'Check & call',
    icon: 'phone',
    minutes: 2,
    summary: 'The first 30 seconds: stay safe, check, call.',
    cards: [
      { title: 'Stay safe first', text: 'Look around before you go close. Traffic, fire, electricity or gas? Make it safe or wait for help.', tip: 'You can’t help anyone if you get hurt too.' },
      { title: 'Check: do they react?', text: 'Tap both shoulders and ask loudly: "Are you okay?"' },
      { title: 'Check: are they breathing normally?', text: 'Tilt the head back gently. Look at the chest for up to 10 seconds.', tip: 'Gasping or rare breaths are NOT normal breathing.' },
      { title: 'Call 112 / 911', text: 'Say where you are, what happened and how many people are hurt. Put the phone on speaker.', illustration: 'phone', tip: 'Don’t hang up first. The dispatcher will guide you too.' },
    ],
    quiz: [
      { q: 'What do you do before going close to someone who collapsed?', options: ['Check that the area is safe', 'Run to them immediately', 'Take a photo'], correct: 0, explain: 'Your own safety comes first. Look for traffic, fire, electricity or gas.' },
      { q: 'The person gasps once every few seconds. Is that normal breathing?', options: ['Yes, they are breathing', 'No, treat it as not breathing'], correct: 1, explain: 'Rare gasps are common in cardiac arrest. Treat them as "not breathing" and start CPR.' },
      { q: 'What do you say first when you call?', options: ['Your name', 'Where you are', 'Your phone number'], correct: 1, explain: 'Location first: if the call drops, help can still come.' },
    ],
  },
  {
    id: 'cpr',
    title: 'CPR: push hard, push fast',
    icon: 'circulation',
    minutes: 3,
    summary: 'Hands-only CPR can double someone’s chance of survival.',
    practice: 'cpr',
    cards: [
      { title: 'When?', text: 'The person does not react and is not breathing normally. Call 112 / 911 first.' },
      { title: 'Where to push', text: 'Heel of one hand in the middle of the chest, the other hand on top. Fingers locked.', illustration: 'cpr' },
      { title: 'How deep and how fast', text: 'Arms straight. Push 5–6 cm deep, 100–120 times a minute. Let the chest come all the way up.', tip: 'The beat of "Stayin’ Alive" is the right speed.' },
      { title: 'Don’t stop', text: 'Keep going until help or a defibrillator (AED) takes over. Swap with someone every 2 minutes if you can.' },
      { title: 'You can’t make it worse', text: 'Without CPR, the person will die. Broken ribs can heal. Pushing is always better than doing nothing.' },
    ],
    quiz: [
      { q: 'How fast should you push?', options: ['60 per minute', '100–120 per minute', 'As fast as possible'], correct: 1, explain: '100–120 pushes per minute keeps blood moving. Too fast means too shallow.' },
      { q: 'How deep for an adult?', options: ['1–2 cm', '5–6 cm', '10 cm'], correct: 1, explain: 'About 5–6 cm, roughly a third of the chest depth.' },
      { q: 'When do you stop?', options: ['After 2 minutes', 'When help or an AED takes over', 'When you feel unsure'], correct: 1, explain: 'Only stop when professionals or the AED tell you to, or the person clearly wakes up.' },
    ],
  },
  {
    id: 'recovery',
    title: 'Recovery position',
    icon: 'unconscious',
    minutes: 2,
    summary: 'Unconscious but breathing? Keep the airway open.',
    cards: [
      { title: 'When?', text: 'The person does not react but breathes normally.' },
      { title: 'Roll them onto their side', text: 'Near arm at a right angle, far hand on the cheek, far knee bent. Pull the knee towards you.', illustration: 'recovery' },
      { title: 'Open the airway', text: 'Tilt the head back gently, mouth facing down, so vomit can drain.' },
      { title: 'Keep checking', text: 'Check breathing every minute. If it stops: call again and start CPR.' },
    ],
    quiz: [
      { q: 'Who goes into the recovery position?', options: ['Unconscious and breathing normally', 'Unconscious and not breathing', 'Awake with a headache'], correct: 0, explain: 'Not breathing means CPR, not the recovery position.' },
      { q: 'Why is the mouth facing down?', options: ['It looks better', 'So fluids can drain and not block the airway', 'To stop bleeding'], correct: 1, explain: 'Vomit or blood can drain out instead of blocking the airway.' },
      { q: 'What do you do while waiting?', options: ['Leave to get help', 'Check breathing every minute', 'Give them water'], correct: 1, explain: 'Breathing can stop. Stay and check regularly.' },
    ],
  },
  {
    id: 'bleeding',
    title: 'Stop heavy bleeding',
    icon: 'bleeding',
    minutes: 2,
    summary: 'Firm pressure stops almost every bleeding.',
    cards: [
      { title: 'Call and protect yourself', text: 'Heavy bleeding: call 112 / 911. Use gloves or a plastic bag if you have one.' },
      { title: 'Press hard', text: 'Press directly on the wound with a cloth or your hand. Use your body weight.', illustration: 'pressure' },
      { title: 'Keep pressing', text: 'Don’t lift to check. If blood soaks through, put more cloth on top.' },
      { title: 'Objects stay in', text: 'Never pull out a knife or glass. Press around it.', tip: 'The object may be blocking a bigger bleed.' },
    ],
    quiz: [
      { q: 'Blood soaks through the cloth. What now?', options: ['Remove it and start again', 'Add more cloth on top and keep pressing', 'Stop pressing'], correct: 1, explain: 'Removing the cloth breaks the forming clot. Add more and keep the pressure.' },
      { q: 'There is a piece of glass in the wound.', options: ['Pull it out quickly', 'Leave it, press around it', 'Push it deeper'], correct: 1, explain: 'Objects can block bleeding. Leave them for the paramedics.' },
      { q: 'How long do you press?', options: ['10 seconds', 'Until help takes over or it clearly stops', '1 minute'], correct: 1, explain: 'Pressure must be continuous. At least 10 minutes for moderate bleeding.' },
    ],
  },
  {
    id: 'choking',
    title: 'Choking',
    icon: 'choking',
    minutes: 3,
    summary: 'Back blows and thrusts, and what is different for babies.',
    cards: [
      { title: 'Can they cough?', text: 'If yes: tell them to keep coughing hard. Don’t hit their back yet.' },
      { title: '5 back blows', text: 'Can’t cough or breathe? Lean them forward. Up to 5 firm blows between the shoulder blades.', illustration: 'backblows' },
      { title: '5 belly thrusts', text: 'Stand behind, fist above the belly button, pull in and up. Alternate 5 and 5.', illustration: 'thrusts' },
      { title: 'Babies are different', text: 'Face down on your forearm, 5 back blows. Then face up, 5 chest pushes with two fingers. Never belly thrusts.', illustration: 'backblows-baby' },
      { title: 'Unconscious? Start CPR', text: 'If they collapse: call 112 / 911 and start CPR.' },
    ],
    quiz: [
      { q: 'The person coughs loudly. What do you do?', options: ['Belly thrusts', 'Encourage coughing and stay with them', 'Back blows right away'], correct: 1, explain: 'A strong cough is the best way to clear the airway.' },
      { q: 'What is never used on a baby?', options: ['Back blows', 'Two-finger chest pushes', 'Belly thrusts'], correct: 2, explain: 'Belly thrusts can injure a baby’s organs. Use chest pushes instead.' },
      { q: 'They become unconscious. Next step?', options: ['Call 112 / 911 and start CPR', 'Keep doing belly thrusts', 'Wait'], correct: 0, explain: 'Chest compressions can also push the object out.' },
    ],
  },
  {
    id: 'burns',
    title: 'Burns',
    icon: 'burn',
    minutes: 2,
    summary: '20 minutes of cool water is the best medicine.',
    cards: [
      { title: 'Cool it', text: 'Cool running water for 20 minutes. Not ice-cold.', illustration: 'cool' },
      { title: 'Remove jewellery', text: 'Take off rings and watches near the burn before it swells. Leave anything stuck to the skin.' },
      { title: 'Cover loosely', text: 'Cling film or a clean cloth. No butter, oil, toothpaste or ice.' },
      { title: 'When to call', text: 'Bigger than their palm, on face, hands or groin, a child, or chemical / electrical: get help.' },
    ],
    quiz: [
      { q: 'How long should you cool a burn?', options: ['2 minutes', '20 minutes', 'Until it stops hurting a little'], correct: 1, explain: '20 minutes reduces the damage, even if started later.' },
      { q: 'What goes on a burn?', options: ['Butter', 'Ice', 'Cool running water'], correct: 2, explain: 'Butter traps heat, ice damages the skin. Only cool water.' },
      { q: 'Which burn needs emergency help?', options: ['Small red spot on a finger', 'Burn on a child’s face', 'Sunburn on the arm'], correct: 1, explain: 'Burns on the face, on children, or larger than a palm need a doctor.' },
    ],
  },
  {
    id: 'stroke',
    title: 'Stroke: think FAST',
    icon: 'stroke',
    minutes: 2,
    summary: 'Recognise it in 30 seconds. Every minute counts.',
    cards: [
      { title: 'F: Face', text: 'Ask them to smile. Does one side droop?', illustration: 'fast' },
      { title: 'A: Arms', text: 'Ask them to raise both arms. Does one drift down?' },
      { title: 'S: Speech', text: 'Ask them to repeat a simple sentence. Slurred or strange?' },
      { title: 'T: Time', text: 'Any of these: call 112 / 911 now. Note the time it started.', tip: 'Treatment works best in the first hours.' },
    ],
    quiz: [
      { q: 'What does the "T" in FAST stand for?', options: ['Temperature', 'Time to call', 'Tablets'], correct: 1, explain: 'Time: call immediately and remember when symptoms started.' },
      { q: 'One arm drifts down when raised. What do you do?', options: ['Wait and see', 'Call 112 / 911 now', 'Give aspirin'], correct: 1, explain: 'One-sided weakness is a stroke warning sign. Never give medicine yourself.' },
      { q: 'Why note the time it started?', options: ['For the report only', 'Doctors choose treatment based on it', 'It doesn’t matter'], correct: 1, explain: 'Some treatments are only possible within a few hours.' },
    ],
  },
  {
    id: 'seizure',
    title: 'Seizures',
    icon: 'seizure',
    minutes: 2,
    summary: 'Protect, time it, recovery position.',
    cards: [
      { title: 'Protect', text: 'Move hard objects away. Cushion the head. Don’t hold them down.' },
      { title: 'Nothing in the mouth', text: 'They can’t swallow their tongue. Never put anything between their teeth.' },
      { title: 'Time it', text: 'Longer than 5 minutes, or a first seizure: call 112 / 911.' },
      { title: 'Afterwards', text: 'Roll them onto their side when the shaking stops. Stay and talk calmly.', illustration: 'recovery' },
    ],
    quiz: [
      { q: 'Should you put something in their mouth?', options: ['Yes, so they don’t bite their tongue', 'No, never'], correct: 1, explain: 'It can break teeth or block the airway. It’s a dangerous myth.' },
      { q: 'When do you call 112 / 911?', options: ['Seizure longer than 5 minutes', 'Only if they ask', 'Never'], correct: 0, explain: 'Also call for a first seizure, an injury, or if they don’t wake up.' },
      { q: 'After the shaking stops?', options: ['Make them stand up', 'Recovery position and stay with them', 'Give water'], correct: 1, explain: 'They are often confused and sleepy. Keep the airway open.' },
    ],
  },
];

export const SOURCES = [
  { name: 'European Resuscitation Council: Guidelines 2021 (First Aid, BLS, Paediatric)', url: 'https://www.erc.edu' },
  { name: 'American Heart Association: CPR & First Aid', url: 'https://cpr.heart.org' },
  { name: 'International Federation of Red Cross: First Aid Guidelines', url: 'https://www.ifrc.org' },
];
