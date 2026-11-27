import { Icon } from './Icons';

export type Tab = 'help' | 'learn' | 'settings';

const TABS: { id: Tab; label: string }[] = [
  { id: 'help', label: 'Help now' },
  { id: 'learn', label: 'Learn' },
  { id: 'settings', label: 'Settings' },
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <button key={t.id} className={`tab ${tab === t.id ? 'on' : ''} tab-${t.id}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => onChange(t.id)}>
          <Icon name={t.id} size={26} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
