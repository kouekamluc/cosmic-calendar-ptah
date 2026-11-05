import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { Birth } from './chart';

// ------------------------------------------------------------------ moon journal
export type JournalKind = 'intention' | 'review' | 'note';
export type JournalEntry = { id: string; date: number; kind: JournalKind; text: string };
const JKEY = 'ptah.journal.v1';

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(JKEY)
      .then(s => { if (s) try { const v = JSON.parse(s); if (Array.isArray(v)) setEntries(v); } catch { /* ignore */ } })
      .catch(() => {}).finally(() => setReady(true));
  }, []);
  const persist = (next: JournalEntry[]) => { AsyncStorage.setItem(JKEY, JSON.stringify(next)).catch(() => {}); return next; };
  const add = useCallback((e: Omit<JournalEntry, 'id'>) => setEntries(prev => persist([{ ...e, id: `${Date.now()}${Math.floor(Math.random() * 1000)}` }, ...prev])), []);
  const remove = useCallback((id: string) => setEntries(prev => persist(prev.filter(e => e.id !== id))), []);
  return { entries, ready, add, remove };
}
export type JournalApi = ReturnType<typeof useJournal>;

// ------------------------------------------------------------------ people (for compatibility)
export type Person = { id: string; name: string; birth: Birth };
const PKEY = 'ptah.people.v1';

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(PKEY).then(s => { if (s) try { const v = JSON.parse(s); if (Array.isArray(v)) setPeople(v); } catch { /* ignore */ } }).catch(() => {});
  }, []);
  const persist = (next: Person[]) => { AsyncStorage.setItem(PKEY, JSON.stringify(next)).catch(() => {}); return next; };
  const add = useCallback((p: Omit<Person, 'id'>) => setPeople(prev => persist([...prev, { ...p, id: `${Date.now()}${Math.floor(Math.random() * 1000)}` }])), []);
  const remove = useCallback((id: string) => setPeople(prev => persist(prev.filter(p => p.id !== id))), []);
  return { people, add, remove };
}
export type PeopleApi = ReturnType<typeof usePeople>;
