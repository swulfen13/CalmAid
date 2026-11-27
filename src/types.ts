export type Category =
  | 'unconscious'
  | 'bleeding'
  | 'burn'
  | 'choking'
  | 'circulation'
  | 'stroke'
  | 'seizure'
  | 'allergy'
  | 'poisoning'
  | 'unknown';

export type Age = 'adult' | 'child' | 'baby';

/** One screen in the guide. Always exactly one thing for the user to do or answer. */
export interface GuideStep {
  kind: 'question' | 'step' | 'cpr' | 'done';
  /** Main instruction or yes/no question. Short, plain language. */
  text: string;
  /** Optional one-line clarification shown smaller. */
  detail?: string;
  /** Shows the big "Call now" button and logs that emergency services were advised. */
  call?: boolean;
  /** Optional countdown, e.g. cooling a burn for 20 minutes. */
  timerSec?: number;
  /** Key of a simple drawing for this step (see components/Illustration). */
  illustration?: string;
  /** What the AI saw in the photo (first AI step only). */
  photoNote?: string;
  /** Where the step came from — the AI model or the built-in offline protocol. */
  source: 'ai' | 'local';
}

export interface StartInput {
  category: Category;
  /** What the user typed, said or tapped. */
  description: string;
  /** Optional photo (data URL, JPEG) — analysed by the AI when available. */
  photo?: string;
  age: Age;
  /**
   * How the user started. Quick buttons use the reviewed offline protocol instantly (0 s, no quota);
   * free text, speech and photos go to the AI, where understanding is actually needed.
   */
  via?: 'quick' | 'text' | 'voice' | 'photo';
}

export interface GuideEngine {
  readonly name: 'ai' | 'local';
  start(input: StartInput): Promise<GuideStep>;
  answer(value: 'yes' | 'no'): Promise<GuideStep>;
  next(): Promise<GuideStep>;
}

export type LogKind = 'situation' | 'observation' | 'action' | 'call' | 'cpr' | 'note';

export interface LogEntry {
  t: string; // ISO timestamp
  kind: LogKind;
  text: string;
}

export interface Session {
  id: string;
  startedAt: string;
  category: Category;
  age: Age;
  description: string;
  entries: LogEntry[];
  cprSeconds: number;
  compressions: number;
  endedAt?: string;
}
