import { useRef, useState } from 'react';
import type { Age, Category, StartInput } from '../types';
import { AI_AVAILABLE, CATEGORY_LABEL, classify } from '../engine';
import { useDictation } from '../hooks/useDictation';
import { useSettings } from '../settings';
import { compressImage } from './photo';
import { MedicalCard } from './MedicalCard';
import { Icon } from './Icons';

const QUICK: { cat: Category; label: string; urgent?: boolean }[] = [
  { cat: 'unconscious', label: 'Unconscious', urgent: true },
  { cat: 'bleeding', label: 'Heavy bleeding', urgent: true },
  { cat: 'choking', label: 'Choking', urgent: true },
  { cat: 'circulation', label: 'Chest pain / fainting' },
  { cat: 'stroke', label: 'Stroke signs' },
  { cat: 'burn', label: 'Burn' },
  { cat: 'seizure', label: 'Seizure' },
  { cat: 'allergy', label: 'Allergic reaction' },
  { cat: 'poisoning', label: 'Poisoning' },
];

const AGES: { age: Age; label: string }[] = [
  { age: 'adult', label: 'Adult' },
  { age: 'child', label: 'Child' },
  { age: 'baby', label: 'Baby' },
];

interface Props {
  onStart: (category: Category, description: string, age: Age, photo?: string, via?: StartInput['via']) => void;
  onOpenInfo: (screen: 'ai' | 'tests' | 'judges') => void;
  resumeLabel?: string;
  onResume?: () => void;
}

/** Help tab: one obvious action — tap what is happening. Everything else is secondary. */
export function Home({ onStart, onOpenInfo, resumeLabel, onResume }: Props) {
  const { settings, numberLabel, language, demo } = useSettings();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [age, setAge] = useState<Age>('adult');
  const [photo, setPhoto] = useState<string | undefined>();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const dict = useDictation(AI_AVAILABLE ? language.code : 'en-US');
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const submitText = () => {
    const t = text.trim();
    if (!t && !photo) return;
    if (!t && photo && !AI_AVAILABLE) return; // offline: a photo alone can't be read, ask for a tap
    onStart(t ? classify(t) : 'unknown', t || 'Situation described by photo', age, photo, photo ? 'photo' : 'text');
  };

  const onMic = () => {
    if (dict.listening) return dict.stop();
    setTyping(true);
    dict.start((said, final) => {
      setText(said);
      if (final && said) onStart(classify(said), said, age, photo, photo ? 'photo' : 'voice'); // hands stay free
    });
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      setPhoto(await compressImage(f));
      setPhotoError(null);
      setTyping(true);
    } catch {
      setPhotoError('Could not read this photo. Please describe it instead.');
    }
  };

  return (
    <main className="screen home">
      {resumeLabel && onResume && (
        <button className="resume" onClick={onResume}>
          <span>Continue current emergency</span>
          <small>{resumeLabel}</small>
        </button>
      )}

      <header className="home-head">
        <div className="brand">
          <span className="logo" aria-hidden="true">
            <span>+</span>
          </span>
          <span className="brand-name">CalmAid</span>
        </div>
        <h1 className="home-title">What is happening?</h1>
        <p className="home-sub">Tap one. I'll guide you one calm step at a time.</p>
      </header>

      <div className="age-row" role="radiogroup" aria-label="Who needs help?">
        <span className="age-label">Who?</span>
        {AGES.map((a) => (
          <button key={a.age} role="radio" aria-checked={age === a.age} className={`age ${age === a.age ? 'on' : ''}`} onClick={() => setAge(a.age)}>
            {a.label}
          </button>
        ))}
      </div>

      <div className="quick-grid">
        {QUICK.map((q) => (
          <button
            key={q.cat}
            className={`quick ${q.urgent ? 'urgent' : ''}`}
            onClick={() => onStart(q.cat, text.trim() || CATEGORY_LABEL[q.cat], age, photo, photo ? 'photo' : text.trim() ? 'text' : 'quick')}
          >
            <span className="quick-icon">
              <Icon name={q.cat} size={34} />
            </span>
            <span className="quick-label">{q.label}</span>
          </button>
        ))}
      </div>

      <div className="describe">
        <p className="describe-title">Something else? Describe it</p>
        <div className="describe-actions">
          {dict.supported && (
            <button className={`btn btn-tile ${dict.listening ? 'listening' : ''}`} onClick={onMic}>
              <Icon name="mic" />
              {dict.listening ? 'Listening…' : 'Speak'}
            </button>
          )}
          <button
            className={`btn btn-tile ${typing ? 'active' : ''}`}
            onClick={() => {
              setTyping(true);
              setTimeout(() => textRef.current?.focus(), 30);
            }}
          >
            <Icon name="type" />
            Type
          </button>
          <button className="btn btn-tile" onClick={() => fileRef.current?.click()}>
            <Icon name="camera" />
            {photo ? 'New photo' : 'Photo'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onPhoto} />

        {typing && (
          <div className="describe-box">
            <textarea
              ref={textRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. My dad fell and isn't waking up"
              rows={2}
              aria-label="Describe what is happening"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitText();
                }
              }}
            />
            {photo && (
              <div className="photo-preview">
                <img src={photo} alt="Your photo of the situation" />
                <div>
                  <p>
                    {AI_AVAILABLE ? 'The AI will look at this photo.' : 'Saved for the paramedics. Tap what you see above, or describe it.'}
                  </p>
                  <button className="link" onClick={() => setPhoto(undefined)}>
                    Remove photo
                  </button>
                </div>
              </div>
            )}
            <button className="btn btn-primary" onClick={submitText} disabled={!text.trim() && !(photo && AI_AVAILABLE)}>
              Guide me
            </button>
          </div>
        )}
        {dict.error && <p className="hint warn">{dict.error}</p>}
        {photoError && <p className="hint warn">{photoError}</p>}
      </div>

      <MedicalCard medical={settings.medical} />

      <p className="disclaimer">
        CalmAid gives general first-aid guidance for lay people. It does <strong>not</strong> replace emergency services
        or a doctor. In a life-threatening situation, always call {numberLabel} first.
      </p>
      <div className="home-foot">
        <span className={`mode-badge ${AI_AVAILABLE ? 'ai' : ''}`}>
          <Icon name="shield" size={14} />
          {AI_AVAILABLE ? 'AI guidance on, with offline backup' : 'Offline mode: reviewed protocols'}
        </span>
        {demo && <span className="mode-badge">Demo mode</span>}
        <span className="foot-links">
          <button className="link small" onClick={() => onOpenInfo('judges')}>
            For judges
          </button>
          <button className="link small" onClick={() => onOpenInfo('ai')}>
            How the AI works
          </button>
          <button className="link small" onClick={() => onOpenInfo('tests')}>
            Test Lab
          </button>
        </span>
      </div>
    </main>
  );
}
