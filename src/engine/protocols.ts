import type { Age, Category } from '../types';

/**
 * Built-in first-aid protocols for lay rescuers.
 * Based on common lay first-aid guidance (ERC / AHA / Red Cross style), simplified:
 * at most two yes/no questions per path, one action per screen, no jargon.
 * These run fully offline and are the safety net whenever the AI is unavailable.
 */

export type ProtoNode =
  | {
      kind: 'question';
      text: string;
      detail?: string;
      yes: string;
      no: string;
      /** What gets written into the handover log for each answer. */
      logYes: string;
      logNo: string;
    }
  | {
      kind: 'step';
      text: string;
      detail?: string;
      call?: boolean;
      timerSec?: number;
      next: string;
    }
  | { kind: 'cpr' }
  | { kind: 'done'; text: string; detail?: string };

export const START_NODE: Record<Category, string> = {
  unconscious: 'unc_q1',
  bleeding: 'bld_q1',
  burn: 'brn_q1',
  choking: 'chk_q1',
  circulation: 'cir_q1',
  stroke: 'str_q1',
  seizure: 'sei_q1',
  allergy: 'all_q1',
  poisoning: 'poi_q1',
  unknown: 'unk_q1',
};

export const NODES: Record<string, ProtoNode> = {
  // ---------- Shared CPR entry ----------
  cpr_call: {
    kind: 'step',
    text: 'Call 112 / 911 now. Put the phone on speaker.',
    detail: 'Say: "The person is not breathing." Keep the phone next to you.',
    call: true,
    next: 'cpr_aed',
  },
  cpr_aed: {
    kind: 'step',
    text: 'Ask someone to bring a defibrillator (AED).',
    detail: 'If you are alone, do not go looking. Start pushing on the chest.',
    next: 'cpr',
  },
  cpr: { kind: 'cpr' },

  // ---------- Unconscious ----------
  unc_q1: {
    kind: 'question',
    text: 'Does the person react when you tap their shoulders and talk loudly?',
    yes: 'resp_1',
    no: 'unc_q2',
    logYes: 'Responsive to voice / touch',
    logNo: 'Unresponsive',
  },
  unc_q2: {
    kind: 'question',
    text: 'Is the person breathing normally?',
    detail: 'Tilt the head back. Look at the chest for 10 seconds.',
    yes: 'rec_call',
    no: 'cpr_call',
    logYes: 'Breathing normally',
    logNo: 'NOT breathing normally',
  },
  rec_call: {
    kind: 'step',
    text: 'Call 112 / 911 now.',
    detail: 'Say: "Unconscious, but breathing."',
    call: true,
    next: 'rec_1',
  },
  rec_1: {
    kind: 'step',
    text: 'Roll the person onto their side.',
    detail: 'Top leg bent, so they do not roll back.',
    next: 'rec_2',
  },
  rec_2: {
    kind: 'step',
    text: 'Tilt the head back gently, mouth facing down.',
    detail: 'This keeps the airway open.',
    next: 'rec_done',
  },
  rec_done: {
    kind: 'done',
    text: 'Stay with them. Check breathing every minute.',
    detail: 'If breathing stops, press "Not breathing" below.',
  },
  resp_1: {
    kind: 'step',
    text: 'Keep them still and talk to them calmly.',
    detail: 'Ask what happened and where it hurts.',
    next: 'resp_2',
  },
  resp_2: {
    kind: 'done',
    text: 'If they get worse or confused, call 112 / 911.',
    detail: 'Keep them warm. Do not give food or drink.',
  },

  // ---------- Severe bleeding ----------
  bld_q1: {
    kind: 'question',
    text: 'Is blood spurting, or soaking through clothes fast?',
    yes: 'bld_s_call',
    no: 'bld_m_1',
    logYes: 'Heavy / spurting bleeding',
    logNo: 'Moderate bleeding',
  },
  bld_s_call: {
    kind: 'step',
    text: 'Call 112 / 911 now. Put the phone on speaker.',
    detail: 'Say: "Heavy bleeding."',
    call: true,
    next: 'bld_s_1',
  },
  bld_s_1: {
    kind: 'step',
    text: 'Press hard on the wound with a cloth or your hand.',
    detail: 'Use your body weight. Gloves or a plastic bag if you have one.',
    next: 'bld_s_2',
  },
  bld_s_2: {
    kind: 'step',
    text: 'Keep pressing. Do not lift to check.',
    detail: 'If blood soaks through, add more cloth on top.',
    timerSec: 600,
    next: 'bld_s_3',
  },
  bld_s_3: {
    kind: 'step',
    text: 'Help them lie down and keep them warm.',
    detail: 'Keep pressing on the wound the whole time.',
    next: 'bld_s_done',
  },
  bld_s_done: {
    kind: 'done',
    text: 'Keep pressing until help takes over.',
    detail: 'If they stop responding and breathing, press "Not breathing".',
  },
  bld_m_1: {
    kind: 'step',
    text: 'Press a clean cloth firmly on the wound.',
    timerSec: 600,
    detail: 'Hold for 10 minutes without lifting.',
    next: 'bld_m_2',
  },
  bld_m_2: {
    kind: 'step',
    text: 'When the bleeding stops, cover it with a clean bandage.',
    next: 'bld_m_done',
  },
  bld_m_done: {
    kind: 'done',
    text: 'See a doctor if the cut is deep, gaping or keeps bleeding.',
    detail: 'If bleeding gets heavy, call 112 / 911.',
  },

  // ---------- Burn ----------
  brn_q1: {
    kind: 'question',
    text: 'Is the burn bigger than their hand, or on the face, hands or groin?',
    yes: 'brn_call',
    no: 'brn_1',
    logYes: 'Large or critical-area burn',
    logNo: 'Small burn',
  },
  brn_call: {
    kind: 'step',
    text: 'Call 112 / 911 now.',
    detail: 'Say: "Serious burn." Then start cooling.',
    call: true,
    next: 'brn_1',
  },
  brn_1: {
    kind: 'step',
    text: 'Cool the burn under cool running water.',
    detail: 'Not ice. Keep cooling for 20 minutes.',
    timerSec: 1200,
    next: 'brn_2',
  },
  brn_2: {
    kind: 'step',
    text: 'Take off rings, watches or tight clothes near the burn.',
    detail: 'Leave anything that is stuck to the skin.',
    next: 'brn_3',
  },
  brn_3: {
    kind: 'step',
    text: 'Cover the burn loosely with cling film or a clean cloth.',
    detail: 'No butter, creams or ice.',
    next: 'brn_done',
  },
  brn_done: {
    kind: 'done',
    text: 'Keep them warm and watch them.',
    detail: 'Blisters, a child, or a large burn: see a doctor.',
  },

  // ---------- Choking ----------
  chk_q1: {
    kind: 'question',
    text: 'Can the person cough, speak or breathe?',
    yes: 'chk_mild',
    no: 'chk_call',
    logYes: 'Choking — can still cough / breathe',
    logNo: 'Choking — cannot cough or breathe',
  },
  chk_mild: {
    kind: 'step',
    text: 'Tell them to keep coughing hard.',
    detail: 'Do not hit their back while they can cough.',
    next: 'chk_mild_done',
  },
  chk_mild_done: {
    kind: 'done',
    text: 'Stay with them until breathing is normal.',
    detail: 'If they stop coughing or breathing, call 112 / 911.',
  },
  chk_call: {
    kind: 'step',
    text: 'Shout for someone to call 112 / 911.',
    detail: 'Do not leave the person. Act right away.',
    call: true,
    next: 'chk_1',
  },
  chk_1: {
    kind: 'step',
    text: 'Give up to 5 firm back blows.',
    detail: 'Lean them forward. Hit between the shoulder blades with your palm.',
    next: 'chk_2',
  },
  chk_2: {
    kind: 'step',
    text: 'Give up to 5 belly thrusts.',
    detail: 'Stand behind. Fist above the belly button. Pull in and up, hard.',
    next: 'chk_q2',
  },
  chk_q2: {
    kind: 'question',
    text: 'Is the object out, and can they breathe?',
    yes: 'chk_ok',
    no: 'chk_1',
    logYes: 'Airway cleared',
    logNo: 'Airway still blocked — repeated back blows / thrusts',
  },
  chk_ok: {
    kind: 'done',
    text: 'Good. Have a doctor check them today.',
    detail: 'Belly thrusts can cause hidden injuries.',
  },

  // ---------- Circulation / heart ----------
  cir_q1: {
    kind: 'question',
    text: 'Do they have chest pain, chest pressure or trouble breathing?',
    yes: 'cir_h_call',
    no: 'cir_f_1',
    logYes: 'Chest pain / pressure or breathing difficulty',
    logNo: 'Dizzy / faint, no chest pain',
  },
  cir_h_call: {
    kind: 'step',
    text: 'Call 112 / 911 now.',
    detail: 'Say: "Chest pain, possible heart attack."',
    call: true,
    next: 'cir_h_1',
  },
  cir_h_1: {
    kind: 'step',
    text: 'Help them sit, leaning back against something.',
    detail: 'Half sitting makes breathing easier.',
    next: 'cir_h_2',
  },
  cir_h_2: {
    kind: 'step',
    text: 'Open tight clothes at the neck and chest.',
    next: 'cir_h_done',
  },
  cir_h_done: {
    kind: 'done',
    text: 'Stay with them and keep them calm.',
    detail: 'If they stop responding and breathing, press "Not breathing".',
  },
  cir_f_1: {
    kind: 'step',
    text: 'Help them lie down on their back.',
    next: 'cir_f_2',
  },
  cir_f_2: {
    kind: 'step',
    text: 'Raise their legs about 30 cm.',
    detail: 'Rest the legs on a chair or bag.',
    next: 'cir_f_done',
  },
  cir_f_done: {
    kind: 'done',
    text: 'Stay with them for a few minutes.',
    detail: 'Not better, or fainting again: call 112 / 911.',
  },


  // ---------- Stroke (FAST) ----------
  str_q1: {
    kind: 'question',
    text: 'Ask them to smile and raise both arms. Is one side weak or drooping?',
    detail: 'Also listen: is their speech slurred or strange?',
    yes: 'str_call',
    no: 'str_q2',
    logYes: 'FAST positive: face / arm weakness or speech problem',
    logNo: 'FAST check: no clear one-sided weakness',
  },
  str_q2: {
    kind: 'question',
    text: 'Did this start suddenly, like confusion, bad headache or loss of vision?',
    yes: 'str_call',
    no: 'unk_1',
    logYes: 'Sudden neurological symptoms',
    logNo: 'No sudden neurological symptoms',
  },
  str_call: {
    kind: 'step',
    text: 'Call 112 / 911 now. Say: "Possible stroke."',
    detail: 'Every minute counts. Remember the time it started.',
    call: true,
    next: 'str_1',
  },
  str_1: {
    kind: 'step',
    text: 'Keep them sitting or lying, head slightly raised.',
    detail: 'Do not give food, drink or medicine.',
    next: 'str_done',
  },
  str_done: {
    kind: 'done',
    text: 'Stay with them and keep talking calmly.',
    detail: 'If they stop responding and breathing, press "Not breathing".',
  },

  // ---------- Seizure ----------
  sei_q1: {
    kind: 'question',
    text: 'Is the person shaking or jerking right now?',
    yes: 'sei_1',
    no: 'sei_after',
    logYes: 'Active seizure',
    logNo: 'Seizure has stopped',
  },
  sei_1: {
    kind: 'step',
    text: 'Move hard or sharp things away. Protect their head.',
    detail: 'Put something soft under the head. Do not hold them down.',
    next: 'sei_2',
  },
  sei_2: {
    kind: 'step',
    text: 'Do not put anything in their mouth. Time the seizure.',
    detail: 'Longer than 5 minutes: call 112 / 911.',
    timerSec: 300,
    next: 'sei_after',
  },
  sei_after: {
    kind: 'step',
    text: 'When the shaking stops, roll them onto their side.',
    detail: 'Check that they breathe normally.',
    next: 'sei_q2',
  },
  sei_q2: {
    kind: 'question',
    text: 'Is this their first seizure, or are they hurt or not waking up?',
    yes: 'sei_call',
    no: 'sei_done',
    logYes: 'First seizure / injured / not waking',
    logNo: 'Known epilepsy, recovering',
  },
  sei_call: {
    kind: 'step',
    text: 'Call 112 / 911 now.',
    detail: 'Say how long the seizure lasted.',
    call: true,
    next: 'sei_done',
  },
  sei_done: {
    kind: 'done',
    text: 'Stay with them and speak calmly until they are fully awake.',
    detail: 'If breathing stops, press "Not breathing".',
  },

  // ---------- Allergic reaction ----------
  all_q1: {
    kind: 'question',
    text: 'Is their throat, tongue or face swelling, or is breathing hard?',
    yes: 'all_call',
    no: 'all_mild',
    logYes: 'Severe allergic reaction signs (swelling / breathing)',
    logNo: 'Mild allergic reaction',
  },
  all_call: {
    kind: 'step',
    text: 'Call 112 / 911 now. Say: "Severe allergic reaction."',
    call: true,
    next: 'all_pen',
  },
  all_pen: {
    kind: 'step',
    text: 'If they have an adrenaline pen, use it now on the outer thigh.',
    detail: 'Through clothing is fine. Hold it there for a few seconds.',
    next: 'all_pos',
  },
  all_pos: {
    kind: 'step',
    text: 'Let them sit up if breathing is hard, or lie down if dizzy.',
    detail: 'A second pen can be used after 5 minutes if no better.',
    timerSec: 300,
    next: 'all_done',
  },
  all_done: {
    kind: 'done',
    text: 'Stay with them until help arrives.',
    detail: 'If they stop responding and breathing, press "Not breathing".',
  },
  all_mild: {
    kind: 'step',
    text: 'Remove the trigger if you can, like a sting or food.',
    detail: 'Watch them closely for 30 minutes.',
    next: 'all_mild_done',
  },
  all_mild_done: {
    kind: 'done',
    text: 'If swelling or breathing trouble starts, call 112 / 911.',
    detail: 'They can take their usual allergy tablet if they have one.',
  },

  // ---------- Poisoning ----------
  poi_q1: {
    kind: 'question',
    text: 'Is the person sleepy, confused, or having trouble breathing?',
    yes: 'poi_call',
    no: 'poi_1',
    logYes: 'Poisoning with reduced consciousness or breathing trouble',
    logNo: 'Possible poisoning, person alert',
  },
  poi_call: {
    kind: 'step',
    text: 'Call 112 / 911 now.',
    detail: 'Say what they took, how much and when, if you know.',
    call: true,
    next: 'poi_2',
  },
  poi_1: {
    kind: 'step',
    text: 'Call a poison centre or 112 / 911 for advice.',
    detail: 'Have the package or bottle in your hand.',
    call: true,
    next: 'poi_2',
  },
  poi_2: {
    kind: 'step',
    text: 'Do not make them vomit. Do not give milk or salt water.',
    detail: 'Keep the package for the paramedics.',
    next: 'poi_done',
  },
  poi_done: {
    kind: 'done',
    text: 'Stay with them and watch their breathing.',
    detail: 'If they become unconscious but breathe, roll them onto their side.',
  },

  // ---------- Unknown / other ----------
  unk_q1: {
    kind: 'question',
    text: 'Is the person awake and breathing normally?',
    yes: 'unk_1',
    no: 'unc_q2',
    logYes: 'Awake and breathing',
    logNo: 'Not awake or not breathing normally',
  },
  unk_1: {
    kind: 'step',
    text: 'Call 112 / 911 and say what you see.',
    detail: 'They will guide you too. Keep this screen open.',
    call: true,
    next: 'unk_2',
  },
  unk_2: {
    kind: 'step',
    text: 'Keep them still, calm and warm.',
    detail: 'Do not give food or drink.',
    next: 'unk_done',
  },
  unk_done: {
    kind: 'done',
    text: 'Stay with them until help arrives.',
    detail: 'If breathing stops, press "Not breathing".',
  },
};

/** Child (1 year to puberty) and baby (< 1 year) differences, following ERC paediatric lay guidance. */
export const AGE_OVERRIDES: Record<Exclude<Age, 'adult'>, Record<string, ProtoNode>> = {
  child: {
    cpr_aed: { ...(NODES.cpr_aed as Extract<ProtoNode, { kind: 'step' }>), next: 'cpr_breaths' },
    cpr_breaths: {
      kind: 'step',
      text: 'If you know how, give 5 rescue breaths.',
      detail: 'Tilt the head back, pinch the nose, breathe into the mouth. Not sure? Skip and push.',
      next: 'cpr',
    },
    brn_q1: {
      ...(NODES.brn_q1 as Extract<ProtoNode, { kind: 'question' }>),
      detail: 'For children, any burn bigger than a coin counts as Yes.',
    },
  },
  baby: {
    unc_q1: {
      ...(NODES.unc_q1 as Extract<ProtoNode, { kind: 'question' }>),
      text: 'Does the baby react when you tap the foot and talk loudly?',
    },
    unc_q2: {
      ...(NODES.unc_q2 as Extract<ProtoNode, { kind: 'question' }>),
      detail: 'Keep the head straight, not tilted far back. Watch the belly for 10 seconds.',
    },
    rec_1: {
      kind: 'step',
      text: 'Hold the baby in your arms, face tilted down a little.',
      detail: 'Head slightly lower than the body, so the airway stays clear.',
      next: 'rec_done',
    },
    cpr_aed: { ...(NODES.cpr_aed as Extract<ProtoNode, { kind: 'step' }>), next: 'cpr_breaths' },
    cpr_breaths: {
      kind: 'step',
      text: 'If you know how, give 5 gentle rescue breaths.',
      detail: 'Cover the baby\'s mouth AND nose with your mouth. Not sure? Skip and push.',
      next: 'cpr',
    },
    chk_q1: {
      ...(NODES.chk_q1 as Extract<ProtoNode, { kind: 'question' }>),
      text: 'Can the baby cough, cry or breathe?',
    },
    chk_1: {
      kind: 'step',
      text: 'Lay the baby face down along your forearm. Give up to 5 back blows.',
      detail: 'Support the head, head lower than the body. Use the heel of your hand.',
      next: 'chk_2',
    },
    chk_2: {
      kind: 'step',
      text: 'Turn the baby face up. Give up to 5 chest pushes with two fingers.',
      detail: 'Center of the chest. Never squeeze the belly of a baby.',
      next: 'chk_q2',
    },
    chk_mild: {
      kind: 'step',
      text: 'Keep the baby upright and let them cough.',
      detail: 'Do not put your fingers in the mouth blindly.',
      next: 'chk_mild_done',
    },
    brn_q1: {
      ...(NODES.brn_q1 as Extract<ProtoNode, { kind: 'question' }>),
      detail: 'For babies, any burn bigger than a coin counts as Yes.',
    },
    chk_ok: {
      kind: 'done',
      text: 'Good. Have a doctor check the baby today.',
      detail: 'Even if the baby seems fine now.',
    },
    cir_f_2: {
      kind: 'step',
      text: 'Keep the baby lying down, warm and calm.',
      next: 'cir_f_done',
    },
  },
};

export function getNode(id: string, age: Age): ProtoNode | undefined {
  if (age !== 'adult') {
    const o = AGE_OVERRIDES[age][id];
    if (o) return o;
  }
  return NODES[id];
}

/** Drawings for key steps (keys match components/Illustration). */
export const ILLUSTRATION: Record<string, string> = {
  cpr_call: 'phone',
  rec_call: 'phone',
  rec_1: 'recovery',
  bld_s_1: 'pressure',
  bld_m_1: 'pressure',
  brn_1: 'cool',
  chk_1: 'backblows',
  chk_2: 'thrusts',
  cir_h_1: 'sitting',
  cir_f_2: 'legs',
  sei_after: 'recovery',
  all_pen: 'pen',
  str_q1: 'fast',
};

/** Baby overrides that need a different drawing (or none). */
export const BABY_ILLUSTRATION: Record<string, string | undefined> = {
  rec_1: undefined,
  chk_1: 'backblows-baby',
  chk_2: 'chest-baby',
  cir_f_2: undefined,
};

/**
 * Where the offline protocol continues when the AI fails AFTER it already asked questions:
 * skip straight to the first safe action instead of asking again (conservative branch).
 * Categories where the answer changes the technique keep their first question.
 */
export const FALLBACK_ENTRY: Record<Category, string> = {
  bleeding: 'bld_s_call',
  burn: 'brn_1',
  stroke: 'str_call',
  allergy: 'all_call',
  poisoning: 'poi_call',
  circulation: 'cir_h_call',
  seizure: 'sei_q1',
  choking: 'chk_q1',
  unconscious: 'unc_q1',
  unknown: 'unk_1',
};
