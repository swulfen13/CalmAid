import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AI_MODE } from '../engine';
import { IS_NATIVE } from '../native';
import { Icon } from './Icons';

// Set at build time: the Expo Go link from `eas update` (e.g. exp://u.expo.dev/... or https://expo.dev/preview/...).
const EXPO_URL = (import.meta.env?.VITE_EXPO_URL as string | undefined)?.trim() ?? '';

function useQr(text: string) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    QRCode.toDataURL(text, { margin: 1, width: 360, errorCorrectionLevel: 'M' }).then(setSrc).catch(() => setSrc(null));
  }, [text]);
  return src;
}

const TOUR: { title: string; text: string }[] = [
  { title: 'Standard case', text: 'Tap "Heavy bleeding", answer Yes, follow the steps, then open "Report for paramedics" and its QR code.' },
  { title: 'Hard edge case', text: 'Type: "There’s blood everywhere and she’s not breathing" CPR starts at once (rule-based). Tap "Start the beat".' },
  { title: 'Feel the haptics', text: 'On a phone: CPR beat vibrates (Android browser or the CalmAid app on iPhone). The screen stays on.' },
  { title: 'Reliability', text: 'In Settings, open the Test Lab and tap "Run all": 2 standard cases, a repeat check and edge cases, including a blocked harmful AI answer.' },
  { title: 'AI transparency', text: 'In Settings, open "How CalmAid uses AI": model choice, 6 safety layers and known limits.' },
  { title: 'Learn', text: 'The Learn tab: a path with lessons, put-in-order, myth or fact, tap-the-spot, scenarios and the CPR rhythm challenge.' },
];

/** One page for judges: how to test in 3 minutes, on web and phone. */
export function ForJudges({ onBack, onTests, onAi }: { onBack: () => void; onTests: () => void; onAi: () => void }) {
  const here = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const webQr = useQr(here);
  const expoQr = useQr(EXPO_URL);

  return (
    <main className="screen info">
      <div className="flow-top">
        <button className="link" onClick={onBack}>
          ‹ Back
        </button>
        <span className="flow-meta">For judges</span>
        <span />
      </div>
      <h1 className="page-title">Test CalmAid in 3 minutes</h1>
      <p className="page-sub">No login, no setup. AI: {AI_MODE === 'off' ? 'off on this build (offline protocols)' : 'on (Gemini, safety-checked)'}.</p>

      <section className="card info-card">
        <h2>
          <Icon name="phone" /> Try it on your phone
        </h2>
        <div className="qr-row">
          {!IS_NATIVE && (
            <div className="qr-box">
              {webQr ? <img src={webQr} alt="QR code to open this web app on a phone" /> : <div className="qr-ph" />}
              <strong>Web app</strong>
              <small>Scan with the camera. Vibration works in Android browsers.</small>
            </div>
          )}
          {EXPO_URL && (
            <div className="qr-box">
              {expoQr ? <img src={expoQr} alt="QR code to open the CalmAid app in Expo Go" /> : <div className="qr-ph" />}
              <strong>CalmAid app (iOS + Android)</strong>
              <small>Install "Expo Go", then scan. Real haptics on iPhone too.</small>
            </div>
          )}
        </div>
      </section>

      <section className="card info-card">
        <h2>
          <Icon name="list" /> Suggested tour
        </h2>
        <ol className="layers">
          {TOUR.map((t) => (
            <li key={t.title}>
              <strong>{t.title}:</strong> {t.text}
            </li>
          ))}
        </ol>
      </section>

      <div className="row">
        <button className="btn btn-primary" onClick={onTests}>
          Open Test Lab
        </button>
        <button className="btn btn-secondary" onClick={onAi}>
          AI & safety
        </button>
      </div>
    </main>
  );
}
