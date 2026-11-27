/**
 * Bridge between the web app and the CalmAid Expo shell (mobile/).
 * In the Expo app, the page runs inside a WebView and `window.ReactNativeWebView` exists:
 * haptics, keep-awake and speech then use native APIs (works on iPhone, where browsers can't vibrate).
 * In a normal browser, the same calls fall back to Web APIs.
 */

type Rn = { postMessage: (msg: string) => void };
const rn = (): Rn | undefined => (typeof window !== 'undefined' ? (window as unknown as { ReactNativeWebView?: Rn }).ReactNativeWebView : undefined);

export const IS_NATIVE =
  typeof window !== 'undefined' && (!!rn() || !!(window as unknown as { __CALMAID_NATIVE__?: unknown }).__CALMAID_NATIVE__);

function post(type: string, payload: Record<string, unknown> = {}) {
  rn()?.postMessage(JSON.stringify({ type, ...payload }));
}

export type HapticKind = 'beat' | 'tap' | 'success' | 'warning';
const WEB_PATTERN: Record<HapticKind, number | number[]> = { beat: 70, tap: 25, success: [30, 60, 30], warning: [80, 60, 80] };

/** Vibration / haptic feedback. Native on iOS + Android in the app, Vibration API on Android browsers. */
export function haptic(kind: HapticKind) {
  if (IS_NATIVE) return post('haptic', { kind });
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(WEB_PATTERN[kind]);
}

export const CAN_VIBRATE = IS_NATIVE || (typeof navigator !== 'undefined' && 'vibrate' in navigator);

// ---------------- Keep the screen on ----------------
interface Sentinel {
  release: () => Promise<void>;
}
let sentinel: Sentinel | null = null;
let wanted = false;

async function acquire() {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock;
    if (wl && document.visibilityState === 'visible') sentinel = await wl.request('screen');
  } catch {
    /* not allowed / unsupported */
  }
}

if (typeof document !== 'undefined') {
  // Browsers drop the wake lock when the tab is hidden — take it again when we come back.
  document.addEventListener('visibilitychange', () => {
    if (wanted && document.visibilityState === 'visible') void acquire();
  });
}

/** Keep the screen awake during an emergency (a screen turning off mid-CPR is dangerous). */
export function keepAwake(on: boolean) {
  wanted = on;
  if (IS_NATIVE) return post('keepAwake', { on });
  if (on) void acquire();
  else {
    void sentinel?.release();
    sentinel = null;
  }
}

// ---------------- Native speech ----------------
let speechId = 0;
const pending = new Map<number, () => void>();

if (typeof window !== 'undefined') {
  // The Expo shell answers via window.postMessage / custom event.
  window.addEventListener('calmaid-native', (e) => {
    const data = (e as CustomEvent).detail as { type: string; id?: number };
    if (data?.type === 'speechDone' && data.id !== undefined) {
      pending.get(data.id)?.();
      pending.delete(data.id);
    }
  });
}

export function nativeSpeak(text: string, lang: string, onEnd?: () => void) {
  const id = ++speechId;
  if (onEnd) pending.set(id, onEnd);
  post('speak', { text, lang, id });
}

export function nativeStopSpeaking() {
  pending.clear();
  post('stopSpeaking');
}
