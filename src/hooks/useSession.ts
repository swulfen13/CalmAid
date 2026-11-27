import { useCallback, useEffect, useState } from 'react';
import type { Age, Category, LogKind, Session } from '../types';

const KEY = 'calmaid.session';

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** The live handover protocol. Persisted in localStorage so a reload never loses it. */
export function useSession() {
  const [session, setSession] = useState<Session | null>(load);

  useEffect(() => {
    try {
      if (session) localStorage.setItem(KEY, JSON.stringify(session));
      else localStorage.removeItem(KEY);
    } catch {
      /* storage full or blocked — keep working in memory */
    }
  }, [session]);

  const begin = useCallback((category: Category, description: string, hasPhoto: boolean, age: Age) => {
    const now = new Date().toISOString();
    const entries: Session['entries'] = [{ t: now, kind: 'situation', text: description }];
    if (age !== 'adult') entries.push({ t: now, kind: 'note', text: `Patient is a ${age}` });
    if (hasPhoto) entries.push({ t: now, kind: 'note', text: 'Photo of the situation taken' });
    setSession({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      startedAt: now,
      category,
      age,
      description,
      entries,
      cprSeconds: 0,
      compressions: 0,
    });
  }, []);

  const log = useCallback((kind: LogKind, text: string) => {
    if (!text) return;
    setSession((s) => {
      if (!s) return s;
      const last = s.entries[s.entries.length - 1];
      if (last && last.text === text && last.kind === kind) return s; // no duplicates
      return { ...s, entries: [...s.entries, { t: new Date().toISOString(), kind, text }] };
    });
  }, []);

  const setCategory = useCallback((category: Category) => {
    setSession((s) => (s ? { ...s, category } : s));
  }, []);

  const addCpr = useCallback((seconds: number, compressions: number) => {
    setSession((s) =>
      s ? { ...s, cprSeconds: s.cprSeconds + seconds, compressions: s.compressions + compressions } : s,
    );
  }, []);

  const end = useCallback(() => {
    setSession((s) => (s && !s.endedAt ? { ...s, endedAt: new Date().toISOString() } : s));
  }, []);

  const clear = useCallback(() => setSession(null), []);

  return { session, begin, log, setCategory, addCpr, end, clear };
}
