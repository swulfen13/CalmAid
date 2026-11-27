/**
 * Duolingo-style learning path: units of nodes, unlocked one after another.
 * Exercise types are chosen to train what matters in a real emergency:
 * the right ORDER of actions, telling MYTHS from facts, WHERE to put your hands,
 * DECISIONS in a realistic scene, and the CPR RHYTHM.
 */

export interface OrderExercise {
  type: 'order';
  prompt: string;
  steps: string[]; // correct order
  explain: string;
}

export interface MythFactExercise {
  type: 'mythfact';
  items: { statement: string; fact: boolean; explain: string }[];
}

export interface TapExercise {
  type: 'tap';
  prompt: string;
  scene: 'chest' | 'arm' | 'baby-chest';
  /** Target in scene coordinates (viewBox 0 0 300 220). */
  target: { x: number; y: number; r: number };
  explain: string;
}

export interface ScenarioExercise {
  type: 'scenario';
  intro: string;
  steps: { situation: string; options: { label: string; correct: boolean; feedback: string }[] }[];
}

export interface RhythmExercise {
  type: 'rhythm';
  goal: number; // % of pushes in 100–120 range
}

export type Exercise = OrderExercise | MythFactExercise | TapExercise | ScenarioExercise | RhythmExercise;

export type PathNode =
  | { id: string; kind: 'lesson'; title: string; lessonId: string; xp: number }
  | { id: string; kind: 'exercise'; title: string; exercise: Exercise; xp: number };

export interface Unit {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  nodes: PathNode[];
}

export const UNITS: Unit[] = [
  {
    id: 'u1',
    title: 'Unit 1: The first minutes',
    subtitle: 'Check, call, push',
    color: '#1f6f66',
    nodes: [
      { id: 'lesson:check-call', kind: 'lesson', title: 'Check & call', lessonId: 'check-call', xp: 20 },
      {
        id: 'u1-order',
        kind: 'exercise',
        title: 'The chain of survival',
        xp: 15,
        exercise: {
          type: 'order',
          prompt: 'Someone collapses in front of you. Put the steps in the right order.',
          steps: ['Make sure it is safe', 'Tap and shout: are you okay?', 'Check breathing (10 s)', 'Call 112 / 911, speaker on', 'Start pushing on the chest'],
          explain: 'Safety first, then check, then call, then CPR. Calling early brings the defibrillator and the ambulance.',
        },
      },
      {
        id: 'u1-myth',
        kind: 'exercise',
        title: 'Myth or fact? CPR',
        xp: 10,
        exercise: {
          type: 'mythfact',
          items: [
            { statement: 'You can hurt someone by doing CPR when they really need it.', fact: false, explain: 'Without CPR they will die. Broken ribs can heal: pushing is always better than doing nothing.' },
            { statement: 'Gasping every few seconds counts as normal breathing.', fact: false, explain: 'Rare gasps are common in cardiac arrest. Treat them as not breathing.' },
            { statement: 'Anyone can use a defibrillator (AED).', fact: true, explain: 'AEDs talk you through every step and only shock when needed.' },
            { statement: 'You should push about 5–6 cm deep on an adult.', fact: true, explain: 'About a third of the chest depth, 100–120 times a minute.' },
          ],
        },
      },
      { id: 'lesson:cpr', kind: 'lesson', title: 'CPR basics', lessonId: 'cpr', xp: 20 },
      {
        id: 'u1-tap',
        kind: 'exercise',
        title: 'Where do your hands go?',
        xp: 10,
        exercise: {
          type: 'tap',
          prompt: 'Tap where you place your hands for CPR.',
          scene: 'chest',
          target: { x: 150, y: 112, r: 26 },
          explain: 'Middle of the chest, on the lower half of the breastbone, between the nipples.',
        },
      },
      { id: 'u1-rhythm', kind: 'exercise', title: 'Rhythm challenge', xp: 20, exercise: { type: 'rhythm', goal: 60 } },
    ],
  },
  {
    id: 'u2',
    title: 'Unit 2: Airway & breathing',
    subtitle: 'Side position and choking',
    color: '#3d5a80',
    nodes: [
      { id: 'lesson:recovery', kind: 'lesson', title: 'Recovery position', lessonId: 'recovery', xp: 20 },
      {
        id: 'u2-scenario',
        kind: 'exercise',
        title: 'Scene: at the bus stop',
        xp: 15,
        exercise: {
          type: 'scenario',
          intro: 'A man is lying on the ground at a bus stop. No traffic nearby.',
          steps: [
            {
              situation: 'What do you do first?',
              options: [
                { label: 'Tap his shoulders and ask loudly if he is okay', correct: true, feedback: 'Right: check if he responds.' },
                { label: 'Give him some water', correct: false, feedback: 'Never give drinks to someone who may be unconscious: risk of choking.' },
                { label: 'Walk on, someone else will help', correct: false, feedback: 'Most people think that. Be the one who helps.' },
              ],
            },
            {
              situation: 'He doesn’t react, but he is breathing normally. Next?',
              options: [
                { label: 'Start chest compressions', correct: false, feedback: 'He is breathing, so no CPR. Keep his airway open instead.' },
                { label: 'Call 112 / 911 and roll him onto his side', correct: true, feedback: 'Exactly: call, then the recovery position.' },
                { label: 'Sit him up against the wall', correct: false, feedback: 'An unconscious person can choke when sitting. Side position keeps the airway open.' },
              ],
            },
            {
              situation: 'While you wait, his breathing stops.',
              options: [
                { label: 'Roll him on his back and start CPR', correct: true, feedback: 'Yes. Tell the dispatcher, push hard and fast.' },
                { label: 'Wait for the ambulance', correct: false, feedback: 'Every minute without CPR costs survival chance. Start pushing.' },
              ],
            },
          ],
        },
      },
      { id: 'lesson:choking', kind: 'lesson', title: 'Choking', lessonId: 'choking', xp: 20 },
      {
        id: 'u2-order',
        kind: 'exercise',
        title: 'Choking: in order',
        xp: 15,
        exercise: {
          type: 'order',
          prompt: 'An adult is choking and can’t cough or speak. Order the steps.',
          steps: ['Shout for someone to call 112 / 911', 'Lean them forward', 'Give up to 5 back blows', 'Give up to 5 belly thrusts', 'Repeat 5 + 5 until it’s out'],
          explain: 'Back blows first, then belly thrusts, and keep alternating. If they collapse: CPR.',
        },
      },
      {
        id: 'u2-tap',
        kind: 'exercise',
        title: 'Baby: where to push?',
        xp: 10,
        exercise: {
          type: 'tap',
          prompt: 'A baby needs chest pushes. Tap where your two fingers go.',
          scene: 'baby-chest',
          target: { x: 150, y: 118, r: 18 },
          explain: 'Center of the chest, just below the nipple line, with two fingers, about 4 cm deep.',
        },
      },
    ],
  },
  {
    id: 'u3',
    title: 'Unit 3: Bleeding & burns',
    subtitle: 'Pressure and cool water',
    color: '#b45309',
    nodes: [
      { id: 'lesson:bleeding', kind: 'lesson', title: 'Stop heavy bleeding', lessonId: 'bleeding', xp: 20 },
      {
        id: 'u3-tap',
        kind: 'exercise',
        title: 'Where do you press?',
        xp: 10,
        exercise: {
          type: 'tap',
          prompt: 'The forearm is bleeding heavily. Tap where you press.',
          scene: 'arm',
          target: { x: 176, y: 110, r: 22 },
          explain: 'Directly on the wound, with a cloth or your hand, as hard as you can.',
        },
      },
      { id: 'lesson:burns', kind: 'lesson', title: 'Burns', lessonId: 'burns', xp: 20 },
      {
        id: 'u3-myth',
        kind: 'exercise',
        title: 'Myth or fact? Kitchen',
        xp: 10,
        exercise: {
          type: 'mythfact',
          items: [
            { statement: 'Butter or oil soothes a burn.', fact: false, explain: 'It traps heat and raises infection risk. Only cool running water.' },
            { statement: 'Cool a burn under running water for 20 minutes.', fact: true, explain: 'Even if you start a bit later, it still reduces damage.' },
            { statement: 'Pull a knife out of a wound to stop the bleeding.', fact: false, explain: 'The object may block a bigger bleed. Leave it and press around it.' },
            { statement: 'If blood soaks through, add more cloth on top.', fact: true, explain: 'Removing the cloth breaks the clot that is forming.' },
          ],
        },
      },
      {
        id: 'u3-scenario',
        kind: 'exercise',
        title: 'Scene: kitchen accident',
        xp: 15,
        exercise: {
          type: 'scenario',
          intro: 'Your flatmate spills boiling water over their forearm and screams.',
          steps: [
            {
              situation: 'What first?',
              options: [
                { label: 'Hold the arm under cool running water', correct: true, feedback: 'Yes: 20 minutes, not ice-cold.' },
                { label: 'Put ice directly on it', correct: false, feedback: 'Ice damages the skin further. Cool water only.' },
                { label: 'Apply toothpaste', correct: false, feedback: 'A myth: it traps heat and can infect the wound.' },
              ],
            },
            {
              situation: 'They wear a watch on that arm.',
              options: [
                { label: 'Take it off now, before swelling starts', correct: true, feedback: 'Right. Leave anything stuck to the skin.' },
                { label: 'Leave it on', correct: false, feedback: 'Swelling can make it cut off blood flow.' },
              ],
            },
            {
              situation: 'The burn is bigger than their palm and blistering.',
              options: [
                { label: 'Cover loosely with cling film and get medical help', correct: true, feedback: 'Correct: big or blistering burns need a doctor.' },
                { label: 'Pop the blisters so it heals faster', correct: false, feedback: 'Never pop blisters: they protect against infection.' },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    id: 'u4',
    title: 'Unit 4: Brain & body',
    subtitle: 'Stroke and seizures',
    color: '#7c3aed',
    nodes: [
      { id: 'lesson:stroke', kind: 'lesson', title: 'Stroke: FAST', lessonId: 'stroke', xp: 20 },
      {
        id: 'u4-order',
        kind: 'exercise',
        title: 'FAST in order',
        xp: 10,
        exercise: {
          type: 'order',
          prompt: 'Put the FAST stroke check in order.',
          steps: ['Face: ask them to smile', 'Arms: raise both arms', 'Speech: repeat a sentence', 'Time: call 112 / 911, note the time'],
          explain: 'F-A-S-T. Any sign means calling immediately. Every minute counts.',
        },
      },
      { id: 'lesson:seizure', kind: 'lesson', title: 'Seizures', lessonId: 'seizure', xp: 20 },
      {
        id: 'u4-myth',
        kind: 'exercise',
        title: 'Myth or fact? Seizures',
        xp: 10,
        exercise: {
          type: 'mythfact',
          items: [
            { statement: 'Put something in their mouth so they don’t swallow their tongue.', fact: false, explain: 'Impossible to swallow the tongue. Objects can break teeth or block the airway.' },
            { statement: 'Hold the person down to stop the shaking.', fact: false, explain: 'This can cause injuries. Protect the head and move hard objects away.' },
            { statement: 'Call 112 / 911 if a seizure lasts longer than 5 minutes.', fact: true, explain: 'Also for a first seizure, an injury, or if they don’t wake up.' },
          ],
        },
      },
      {
        id: 'u4-scenario',
        kind: 'exercise',
        title: 'Scene: in the office',
        xp: 15,
        exercise: {
          type: 'scenario',
          intro: 'A colleague suddenly can’t find words and the left side of her mouth droops.',
          steps: [
            {
              situation: 'What is the most likely problem?',
              options: [
                { label: 'A stroke: check FAST', correct: true, feedback: 'Face drooping + speech problems are classic stroke signs.' },
                { label: 'She is just tired', correct: false, feedback: 'Sudden one-sided signs are an emergency, not tiredness.' },
              ],
            },
            {
              situation: 'Her left arm drifts down when raised.',
              options: [
                { label: 'Call 112 / 911 now and note the time', correct: true, feedback: 'Yes. The time it started decides the treatment.' },
                { label: 'Give her an aspirin and wait', correct: false, feedback: 'Never give medicine: some strokes are bleeds.' },
                { label: 'Drive her to the doctor tomorrow', correct: false, feedback: 'Treatment works best within hours. Call now.' },
              ],
            },
          ],
        },
      },
    ],
  },
];

export const ALL_NODES = UNITS.flatMap((u) => u.nodes);

export interface Badge {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

export const BADGES: Badge[] = [
  { id: 'first', icon: '🌱', title: 'First step', desc: 'Complete your first exercise' },
  { id: 'rhythm', icon: '💓', title: 'Lifesaver rhythm', desc: 'Pass the rhythm challenge' },
  { id: 'myth', icon: '🧠', title: 'Myth buster', desc: 'Get a myth-or-fact round 100 % right' },
  { id: 'perfect', icon: '⭐', title: 'Perfect lesson', desc: 'All quiz answers right in a lesson' },
  { id: 'unit1', icon: '🫀', title: 'First responder', desc: 'Finish Unit 1' },
  { id: 'all', icon: '🏅', title: 'CalmAid graduate', desc: 'Finish all four units' },
  { id: 'streak3', icon: '🔥', title: '3-day streak', desc: 'Practise three days in a row' },
];
