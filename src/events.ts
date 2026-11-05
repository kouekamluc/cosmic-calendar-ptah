import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { toPK, ymd } from './engine';

export type Repeat = 'none' | 'pk' | 'greg';
export type PEvent = { id: string; title: string; date: number; repeat: Repeat; color: string; note?: string };

const KEY = 'ptah.events.v1';

export function occursOn(e: PEvent, n: number) {
  if (n < e.date) return false;
  if (e.repeat === 'none') return e.date === n;
  if (e.repeat === 'greg') {
    const a = ymd(e.date), b = ymd(n);
    return a.m === b.m && a.d === b.d;
  }
  const a = toPK(e.date), b = toPK(n);
  if (a.kind !== b.kind) return false;
  if (a.kind === 'day' && b.kind === 'day') return a.month === b.month && a.day === b.day;
  return true;
}

export function useEvents() {
  const [events, setEvents] = useState<PEvent[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(s => { if (s) try { setEvents(JSON.parse(s)); } catch { /* ignore */ } }).catch(() => {});
  }, []);
  const save = useCallback((next: PEvent[]) => {
    setEvents(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);
  const add = useCallback((e: Omit<PEvent, 'id'>) => save([...events, { ...e, id: String(Date.now()) }]), [events, save]);
  const remove = useCallback((id: string) => save(events.filter(e => e.id !== id)), [events, save]);
  const on = useCallback((n: number) => events.filter(e => occursOn(e, n)), [events]);
  return { events, add, remove, on };
}
export type EventsApi = ReturnType<typeof useEvents>;
