import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { eraYearOf, pkStr, toPK } from './engine';
import { skyEventsFor } from './sky';

export type SkyAlertKey = 'moons' | 'retro' | 'eclipses';
export type SkyAlertPrefs = Record<SkyAlertKey, boolean>;
export const NO_ALERTS: SkyAlertPrefs = { moons: false, retro: false, eclipses: false };
const KEY = 'ptah.skyalerts.v1';

export function useSkyAlerts() {
  const [prefs, setPrefs] = useState<SkyAlertPrefs>(NO_ALERTS);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(s => { if (s) try { setPrefs({ ...NO_ALERTS, ...JSON.parse(s) }); } catch { /* ignore */ } })
      .catch(() => {}).finally(() => setReady(true));
  }, []);
  const set = useCallback((k: SkyAlertKey, on: boolean) => {
    setPrefs(prev => {
      const next = { ...prev, [k]: on };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);
  return { prefs, ready, set };
}
export type SkyAlertsApi = ReturnType<typeof useSkyAlerts>;

export type AlertItem = { n: number; title: string; body: string };

/** Notifications wanted for the next `horizon` days (pure; scheduling happens in reminders.ts). */
export function skyAlertItems(from: number, prefs: SkyAlertPrefs, horizon = 120): AlertItem[] {
  if (!prefs.moons && !prefs.retro && !prefs.eclipses) return [];
  const out: AlertItem[] = [];
  const e0 = eraYearOf(from), e1 = eraYearOf(from + horizon);
  for (let ey = e0; ey <= e1; ey++) {
    for (const e of skyEventsFor(ey)) {
      if (e.n < from || e.n > from + horizon) continue;
      const when = pkStr(toPK(e.n));
      if (prefs.moons && e.kind === 'moon') {
        const isNew = e.title.startsWith('New');
        out.push({ n: e.n, title: `${isNew ? '🌑' : '🌕'} ${e.title}`, body: `${isNew ? 'A good day to set an intention.' : 'A good day to review and release.'} · ${when}` });
      } else if (prefs.retro && e.kind === 'station' && e.title.startsWith('Mercury')) {
        out.push({ n: e.n, title: `℞ ${e.title}`, body: e.title.includes('retrograde') ? 'Double-check messages, plans and travel.' : 'Clear sailing again for communication.' });
      } else if (prefs.eclipses && e.kind === 'eclipse') {
        out.push({ n: e.n, title: `${e.icon} ${e.title}`, body: `${e.detail ?? ''} · ${when}` });
      }
    }
  }
  return out.sort((a, b) => a.n - b.n);
}
