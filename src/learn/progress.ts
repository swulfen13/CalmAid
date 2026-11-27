import { useCallback, useState } from 'react';
import { ALL_NODES, UNITS } from './path';

const KEY = 'calmaid.path';

export interface PathState {
  done: Record<string, number>; // nodeId → best score in %
  xp: number;
  streak: number;
  lastDay: string; // YYYY-MM-DD
  badges: string[];
}

const EMPTY: PathState = { done: {}, xp: 0, streak: 0, lastDay: '', badges: [] };

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('en-CA');
};

function load(): PathState {
  try {
    const s = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } as PathState;
    // A missed day breaks the streak (shown as 0 until you practise again).
    if (s.lastDay && s.lastDay !== today() && s.lastDay !== yesterday()) s.streak = 0;
    return s;
  } catch {
    return EMPTY;
  }
}

export interface Reward {
  xp: number;
  streak: number;
  streakUp: boolean;
  newBadges: string[];
}

export function isUnlocked(state: PathState, nodeId: string) {
  const i = ALL_NODES.findIndex((n) => n.id === nodeId);
  return i <= 0 || state.done[ALL_NODES[i - 1].id] !== undefined;
}

export function currentNodeId(state: PathState) {
  return ALL_NODES.find((n) => state.done[n.id] === undefined)?.id ?? null;
}

export function usePath() {
  const [state, setState] = useState<PathState>(load);

  const persist = (s: PathState) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  };

  /** Records a finished node (or the daily refresher) and returns the reward to celebrate. */
  const complete = useCallback((nodeId: string | null, scorePct: number, opts: { kind?: string; mythPerfect?: boolean } = {}): Reward => {
    const s = load();
    const node = nodeId ? ALL_NODES.find((n) => n.id === nodeId) : null;
    const firstTime = nodeId ? s.done[nodeId] === undefined : false;
    let xp = node ? (firstTime ? node.xp : Math.round(node.xp / 2)) : 10;
    if (scorePct === 100) xp += 5;

    const t = today();
    let streakUp = false;
    if (s.lastDay !== t) {
      s.streak = s.lastDay === yesterday() ? s.streak + 1 : 1;
      s.lastDay = t;
      streakUp = true;
    }
    if (nodeId) s.done[nodeId] = Math.max(s.done[nodeId] ?? 0, scorePct);
    s.xp += xp;

    const badges = new Set(s.badges);
    const before = badges.size;
    const earned: string[] = [];
    const give = (id: string) => {
      if (!badges.has(id)) {
        badges.add(id);
        earned.push(id);
      }
    };
    if (Object.keys(s.done).length >= 1) give('first');
    if (opts.kind === 'rhythm' && scorePct >= 60) give('rhythm');
    if (opts.mythPerfect) give('myth');
    if (node?.kind === 'lesson' && scorePct === 100) give('perfect');
    if (UNITS[0].nodes.every((n) => s.done[n.id] !== undefined)) give('unit1');
    if (ALL_NODES.every((n) => s.done[n.id] !== undefined)) give('all');
    if (s.streak >= 3) give('streak3');
    s.badges = [...badges];

    persist(s);
    setState({ ...s });
    return { xp, streak: s.streak, streakUp, newBadges: badges.size > before ? earned : [] };
  }, []);

  const reset = useCallback(() => {
    persist(EMPTY);
    setState(EMPTY);
  }, []);

  return { state, complete, reset };
}
