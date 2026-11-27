import type { Age, GuideEngine, GuideStep, StartInput } from '../types';
import { BABY_ILLUSTRATION, getNode, ILLUSTRATION, NODES, START_NODE, type ProtoNode } from './protocols';

const CPR_STEP: Record<Age, GuideStep> = {
  adult: {
    kind: 'cpr',
    text: 'Push hard and fast in the center of the chest.',
    detail: 'Two hands, arms straight, 5–6 cm deep. Follow the beat. Do not stop.',
    illustration: 'cpr',
    source: 'local',
  },
  child: {
    kind: 'cpr',
    text: 'Push hard and fast in the center of the chest.',
    detail: 'One or two hands, about 5 cm deep (a third of the chest). Follow the beat.',
    illustration: 'cpr',
    source: 'local',
  },
  baby: {
    kind: 'cpr',
    text: 'Push with two fingers in the center of the chest.',
    detail: 'About 4 cm deep, baby on a firm surface. Follow the beat. Do not stop.',
    illustration: 'cpr-baby',
    source: 'local',
  },
};

export function nodeToStep(node: ProtoNode, id = '', age: Age = 'adult'): GuideStep {
  const illustration = age === 'baby' && id in BABY_ILLUSTRATION ? BABY_ILLUSTRATION[id] : ILLUSTRATION[id];
  switch (node.kind) {
    case 'cpr':
      return CPR_STEP[age];
    case 'question':
      return { kind: 'question', text: node.text, detail: node.detail, illustration, source: 'local' };
    case 'step':
      return {
        kind: 'step',
        text: node.text,
        detail: node.detail,
        call: node.call,
        timerSec: node.timerSec,
        illustration,
        source: 'local',
      };
    case 'done':
      return { kind: 'done', text: node.text, detail: node.detail, source: 'local' };
  }
}

/** Deterministic, offline decision tree. Never fails, never waits. */
export class LocalEngine implements GuideEngine {
  readonly name = 'local' as const;
  private current = 'unk_q1';
  private age: Age;
  /** Log line for the last answer, read by the UI for the handover protocol. */
  lastAnswerLog = '';

  constructor(age: Age = 'adult') {
    this.age = age;
  }

  async start(input: StartInput) {
    this.age = input.age ?? this.age;
    this.current = START_NODE[input.category] ?? START_NODE.unknown;
    return this.step();
  }

  startAt(nodeId: string) {
    this.current = nodeId;
    return this.step();
  }

  async answer(value: 'yes' | 'no') {
    const node = getNode(this.current, this.age);
    if (node?.kind === 'question') {
      this.lastAnswerLog = value === 'yes' ? node.logYes : node.logNo;
      this.current = value === 'yes' ? node.yes : node.no;
    }
    return this.step();
  }

  async next() {
    const node = getNode(this.current, this.age);
    if (node?.kind === 'step') this.current = node.next;
    return this.step();
  }

  private step(): GuideStep {
    const node = getNode(this.current, this.age);
    if (!node) return nodeToStep(NODES.unk_done);
    return nodeToStep(node, this.current, this.age);
  }
}
