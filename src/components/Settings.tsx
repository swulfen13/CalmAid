import { useEffect, useState } from 'react';
import { AI_MODE } from '../engine';
import { DICTATION_SUPPORTED } from '../hooks/useDictation';
import { COUNTRIES, LANGUAGES, useSettings, type MedicalId } from '../settings';
import { Icon } from './Icons';
import { CAN_VIBRATE, IS_NATIVE } from '../native';

const FIELDS: { key: keyof MedicalId; label: string; placeholder: string; type?: string }[] = [
  { key: 'name', label: 'Name', placeholder: 'Alex Example' },
  { key: 'birthYear', label: 'Year of birth', placeholder: '1990', type: 'number' },
  { key: 'bloodType', label: 'Blood type', placeholder: 'A+' },
  { key: 'allergies', label: 'Allergies', placeholder: 'Penicillin, peanuts' },
  { key: 'medications', label: 'Medications', placeholder: 'Blood thinner, insulin' },
  { key: 'conditions', label: 'Conditions', placeholder: 'Diabetes, epilepsy, asthma' },
  { key: 'contactName', label: 'Emergency contact', placeholder: 'Sam (partner)' },
  { key: 'contactPhone', label: 'Contact phone', placeholder: '+49 170 1234567', type: 'tel' },
];

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

export function SettingsScreen({ onOpen }: { onOpen: (screen: 'ai' | 'tests' | 'judges') => void }) {
  const { settings, update, country, number } = useSettings();
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches;

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const setMed = (key: keyof MedicalId, value: string) => update({ medical: { ...settings.medical, [key]: value } });

  return (
    <main className="screen settings">
      <h1 className="page-title">Settings</h1>

      <section className="card settings-card">
        <h2>Transparency</h2>
        <button className="row-link" onClick={() => onOpen('judges')}>
          <Icon name="phone" />
          <span>
            <strong>For judges</strong>
            <small>3-minute tour, QR codes for phone & app</small>
          </span>
          <Icon name="chevron" />
        </button>
        <button className="row-link" onClick={() => onOpen('ai')}>
          <Icon name="shield" />
          <span>
            <strong>How CalmAid uses AI</strong>
            <small>Model choice, 6 safety layers, known limits</small>
          </span>
          <Icon name="chevron" />
        </button>
        <button className="row-link" onClick={() => onOpen('tests')}>
          <Icon name="flask" />
          <span>
            <strong>Reliability Test Lab</strong>
            <small>Run the jury test cases live</small>
          </span>
          <Icon name="chevron" />
        </button>
      </section>

      <section className="card settings-card">
        <h2>Emergency number</h2>
        <label className="field">
          <span>Country / region</span>
          <select value={settings.country} onChange={(e) => update({ country: e.target.value })}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.number})
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          CalmAid will tell you to call <strong>{number}</strong> ({country.label}).
        </p>
      </section>

      <section className="card settings-card">
        <h2>Guidance language</h2>
        <label className="field">
          <span>AI guidance & voice</span>
          <select value={settings.language} onChange={(e) => update({ language: e.target.value })}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          {AI_MODE === 'off'
            ? 'Offline protocols are in English. With AI turned on, guidance comes in your language.'
            : 'The AI answers and reads aloud in this language. The offline backup is English.'}
        </p>
      </section>

      <section className="card settings-card">
        <h2>Hands & senses</h2>
        <Toggle
          label="Hands-free mode"
          sub={DICTATION_SUPPORTED ? 'Answer "yes", "no", "next", "repeat" by voice' : 'Not supported in this browser'}
          checked={settings.handsFree}
          disabled={!DICTATION_SUPPORTED}
          onChange={(v) => update({ handsFree: v })}
        />
        <Toggle
          label="Vibrate with the CPR beat"
          sub={CAN_VIBRATE ? (IS_NATIVE ? 'Native haptics, helps when it is loud' : 'Helps when it is loud') : 'Not available in this browser (iPhone: use the CalmAid app)'}
          checked={settings.vibration}
          onChange={(v) => update({ vibration: v })}
        />
      </section>

      <section className="card settings-card">
        <h2>Appearance</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {(['auto', 'light', 'dark'] as const).map((t) => (
            <button key={t} role="radio" aria-checked={settings.theme === t} className={settings.theme === t ? 'on' : ''} onClick={() => update({ theme: t })}>
              {t === 'auto' ? 'Auto' : t === 'light' ? 'Light' : 'Dark'}
            </button>
          ))}
        </div>
      </section>

      <section className="card settings-card">
        <h2>My medical ID</h2>
        <p className="hint">
          Helps others help <em>you</em>. Shown on the start screen and optionally in the paramedic report. Stored only on
          this device.
        </p>
        {FIELDS.map((f) => (
          <label key={f.key} className="field">
            <span>{f.label}</span>
            <input
              type={f.type ?? 'text'}
              value={settings.medical[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setMed(f.key, e.target.value)}
            />
          </label>
        ))}
      </section>

      <section className="card settings-card">
        <h2>App</h2>
        {standalone ? (
          <p className="hint">✓ Installed as an app. Works offline.</p>
        ) : install ? (
          <button className="btn btn-primary" onClick={() => install.prompt()}>
            Install CalmAid on this device
          </button>
        ) : (
          <p className="hint">
            Install: in your browser menu choose <strong>"Add to Home Screen"</strong> or <strong>"Install app"</strong>.
            CalmAid then works without internet.
          </p>
        )}
        <p className="hint">
          AI: {AI_MODE === 'off' ? 'off (built-in offline protocols)' : AI_MODE === 'proxy' ? 'on (secure server proxy)' : 'on (direct)'}
        </p>
      </section>
    </main>
  );
}

function Toggle({
  label,
  sub,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`toggle ${disabled ? 'disabled' : ''}`}>
      <span>
        <strong>{label}</strong>
        {sub && <small>{sub}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}
