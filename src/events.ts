import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { toPK, ymd } from './engine';

export type Repeat = 'none' | 'pk' | 'greg';
export type PEvent = { id: string; title: string; date: number; repeat: Repeat; color: string; note?: string; remind?: boolean };
export type NewEvent = Omit<PEvent, 'id'>;

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

/** First day >= from on which the event occurs, or null. Leap-day events can be 4 years apart. */
export function nextOccurrence(e: PEvent, from: number): number | null {
  if (e.repeat === 'none') return e.date >= from ? e.date : null;
  for (let k = 0; k < 1500; k++) if (occursOn(e, from + k)) return from + k;
  return null;
}

/** Up to `max` upcoming occurrences, starting at `from`, no further than `horizon` days ahead. */
export function upcomingOccurrences(e: PEvent, from: number, max: number, horizon = 1100): number[] {
  if (e.repeat === 'none') return e.date >= from && e.date - from <= horizon ? [e.date] : [];
  const out: number[] = [];
  for (let k = 0; k <= horizon && out.length < max; k++) if (occursOn(e, from + k)) out.push(from + k);
  return out;
}

function sanitize(raw: unknown): PEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: PEvent[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    if (typeof o.title !== 'string' || !o.title.trim()) continue;
    if (typeof o.date !== 'number' || !Number.isFinite(o.date)) continue;
    out.push({
      id: typeof o.id === 'string' && o.id ? o.id : makeId(),
      title: o.title.trim().slice(0, 120),
      date: Math.round(o.date),
      repeat: o.repeat === 'pk' || o.repeat === 'greg' ? o.repeat : 'none',
      color: typeof o.color === 'string' ? o.color : '#C9A24B',
      note: typeof o.note === 'string' ? o.note : undefined,
      remind: o.remind === true,
    });
  }
  return out;
}

const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export function useEvents() {
  const [events, setEvents] = useState<PEvent[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(s => { if (s) try { setEvents(sanitize(JSON.parse(s))); } catch { /* corrupt data: start empty */ } })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // persist only after the initial load, so an early change can never overwrite stored data
  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(events)).catch(() => {});
  }, [events, ready]);

  const add = useCallback((e: NewEvent) => setEvents(prev => [...prev, { ...e, id: makeId() }]), []);
  const update = useCallback((id: string, e: NewEvent) => setEvents(prev => prev.map(x => (x.id === id ? { ...e, id } : x))), []);
  const remove = useCallback((id: string) => setEvents(prev => prev.filter(e => e.id !== id)), []);
  const on = useCallback((n: number) => events.filter(e => occursOn(e, n)), [events]);

  /** Backup as JSON text. */
  const exportJson = useCallback(() => JSON.stringify({ app: 'ptah-kamgou', version: 1, events }, null, 2), [events]);
  /** Merge events from backup text; returns how many valid events it held, or -1 if unreadable. */
  const importJson = useCallback((text: string) => {
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return -1; }
    const list = sanitize(Array.isArray(parsed) ? parsed : (parsed as { events?: unknown })?.events);
    if (!list.length) return 0;
    setEvents(prev => {
      const next = [...prev];
      for (const e of list) {
        if (next.some(x => x.id === e.id || (x.title === e.title && x.date === e.date && x.repeat === e.repeat))) continue;
        next.push(e);
      }
      return next;
    });
    return list.length; // valid events found in the backup (already-present ones are skipped)
  }, []);

  return { events, ready, add, update, remove, on, exportJson, importJson };
}
export type EventsApi = ReturnType<typeof useEvents>;
