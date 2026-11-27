import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface Country {
  code: string;
  label: string;
  number: string;
}

export const COUNTRIES: Country[] = [
  { code: 'EU', label: 'Europe', number: '112' },
  { code: 'US', label: 'United States', number: '911' },
  { code: 'CA', label: 'Canada', number: '911' },
  { code: 'MX', label: 'Mexico', number: '911' },
  { code: 'GB', label: 'United Kingdom', number: '999' },
  { code: 'AU', label: 'Australia', number: '000' },
  { code: 'NZ', label: 'New Zealand', number: '111' },
  { code: 'IN', label: 'India', number: '112' },
  { code: 'JP', label: 'Japan', number: '119' },
  { code: 'CN', label: 'China', number: '120' },
  { code: 'BR', label: 'Brazil', number: '192' },
  { code: 'ZA', label: 'South Africa', number: '112' },
  { code: 'XX', label: 'Other / not sure', number: '112' },
];

export interface Language {
  code: string; // BCP-47 for speech
  label: string;
  name: string; // used in the AI prompt
}

export const LANGUAGES: Language[] = [
  { code: 'en-US', label: 'English', name: 'English' },
  { code: 'de-DE', label: 'Deutsch', name: 'German' },
  { code: 'es-ES', label: 'Español', name: 'Spanish' },
  { code: 'fr-FR', label: 'Français', name: 'French' },
  { code: 'it-IT', label: 'Italiano', name: 'Italian' },
  { code: 'pt-BR', label: 'Português', name: 'Portuguese' },
  { code: 'nl-NL', label: 'Nederlands', name: 'Dutch' },
  { code: 'pl-PL', label: 'Polski', name: 'Polish' },
  { code: 'tr-TR', label: 'Türkçe', name: 'Turkish' },
  { code: 'ar-SA', label: 'العربية', name: 'Arabic' },
  { code: 'hi-IN', label: 'हिन्दी', name: 'Hindi' },
  { code: 'ja-JP', label: '日本語', name: 'Japanese' },
];

export interface MedicalId {
  name: string;
  birthYear: string;
  bloodType: string;
  allergies: string;
  medications: string;
  conditions: string;
  contactName: string;
  contactPhone: string;
}

export const EMPTY_MEDICAL: MedicalId = {
  name: '',
  birthYear: '',
  bloodType: '',
  allergies: '',
  medications: '',
  conditions: '',
  contactName: '',
  contactPhone: '',
};

export interface Settings {
  country: string;
  language: string;
  theme: 'auto' | 'light' | 'dark';
  handsFree: boolean;
  vibration: boolean;
  medical: MedicalId;
}

const KEY = 'calmaid.settings';
const EU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'NO', 'IS', 'TR'];

/**
 * Where is the phone right now? The time zone reflects the physical location far better than
 * the UI language (a Chinese-language phone in Berlin must still dial 112). Language is only a fallback.
 */
function countryFromTimeZone(tz: string): string | null {
  if (!tz) return null;
  if (tz === 'Europe/London' || tz === 'Europe/Belfast') return 'GB';
  if (tz.startsWith('Europe/') || tz === 'Atlantic/Reykjavik' || tz === 'Atlantic/Canary' || tz === 'Atlantic/Madeira') return 'EU';
  if (/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal)/.test(tz)) return 'CA';
  if (/^America\/(Mexico_City|Cancun|Monterrey|Tijuana|Merida|Chihuahua)/.test(tz)) return 'MX';
  if (/^America\/(Sao_Paulo|Fortaleza|Recife|Bahia|Manaus|Belem)/.test(tz)) return 'BR';
  if (/^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Indiana|Kentucky)/.test(tz) || tz === 'Pacific/Honolulu') return 'US';
  if (tz.startsWith('Australia/')) return 'AU';
  if (tz === 'Pacific/Auckland') return 'NZ';
  if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'IN';
  if (tz === 'Asia/Tokyo') return 'JP';
  if (/^Asia\/(Shanghai|Chongqing|Harbin|Urumqi)$/.test(tz)) return 'CN';
  if (tz === 'Africa/Johannesburg') return 'ZA';
  return null;
}

function detectCountry(): string {
  try {
    const byTz = countryFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (byTz) return byTz;
  } catch {
    /* no Intl */
  }
  const region = (navigator.language.split('-')[1] ?? '').toUpperCase();
  if (EU.includes(region)) return 'EU';
  if (COUNTRIES.some((c) => c.code === region)) return region;
  if (navigator.language.startsWith('en')) return 'US';
  return 'XX';
}

function detectLanguage(): string {
  const base = navigator.language.split('-')[0];
  return LANGUAGES.find((l) => l.code.startsWith(base))?.code ?? 'en-US';
}

function load(): Settings {
  const defaults: Settings = {
    country: detectCountry(),
    language: detectLanguage(),
    theme: 'auto',
    handsFree: false,
    vibration: true,
    medical: EMPTY_MEDICAL,
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Partial<Settings>;
    return { ...defaults, ...saved, medical: { ...EMPTY_MEDICAL, ...saved.medical } };
  } catch {
    return defaults;
  }
}

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  country: Country;
  language: Language;
  /** The emergency number to dial. */
  number: string;
  /** The emergency number as shown ("112 / 911" when the region is unknown). */
  numberLabel: string;
  /** Replaces the generic "112 / 911" in built-in texts with the local number. */
  localize: (text: string) => string;
  /** Demo mode (?demo): shortened timers for recording the video. */
  demo: boolean;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load);
  const demo = useMemo(() => new URLSearchParams(window.location.search).has('demo'), []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  // Theme: "auto" follows the OS, otherwise forced.
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const value = useMemo<Ctx>(() => {
    const country = COUNTRIES.find((c) => c.code === settings.country) ?? COUNTRIES[COUNTRIES.length - 1];
    const language = LANGUAGES.find((l) => l.code === settings.language) ?? LANGUAGES[0];
    const number = country.number;
    const numberLabel = country.code === 'XX' ? '112 / 911' : number;
    return {
      settings,
      update: (patch) => setSettings((s) => ({ ...s, ...patch })),
      country,
      language,
      number,
      numberLabel,
      localize: (text) => text.replace(/112 \/ 911/g, numberLabel),
      demo,
    };
  }, [settings, demo]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings outside provider');
  return ctx;
}

export function hasMedicalId(m: MedicalId) {
  return Object.values(m).some((v) => v.trim().length > 0);
}
