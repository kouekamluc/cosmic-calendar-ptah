import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { gfmt, pkStr, toPK, ymd } from './engine';
import { PEvent, upcomingOccurrences } from './events';
import { NO_ALERTS, skyAlertItems, SkyAlertPrefs } from './skyAlerts';

const CHANNEL = 'reminders';
const REMIND_HOUR = 8;      // reminders fire at 08:00 local time on the day of the event
const MAX_SCHEDULED = 60;   // iOS keeps at most 64 pending local notifications
const PER_EVENT = 12;

const supported = Platform.OS === 'android' || Platform.OS === 'ios';

export async function initReminders() {
  if (!supported) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
    });
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'Event reminders', importance: Notifications.AndroidImportance.HIGH });
    }
  } catch { /* notifications unavailable: the calendar still works */ }
}

/** Ask for permission (only when the user turns a reminder on). Returns true if reminders can be shown. */
export async function ensureReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: false, allowSound: true } });
    return req.granted;
  } catch {
    return false;
  }
}

/** Replace all scheduled reminders with the next occurrences of every event that has remind on. */
export async function syncReminders(events: PEvent[], today: number, sky: SkyAlertPrefs = NO_ALERTS) {
  if (!supported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const wanted = events.filter(e => e.remind);
    const skyItems = skyAlertItems(today, sky);
    if (!wanted.length && !skyItems.length) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    const now = Date.now();
    const items: { at: Date; title: string; body: string }[] = [];
    for (const e of wanted) {
      for (const n of upcomingOccurrences(e, today, PER_EVENT)) {
        const g = ymd(n);
        const at = new Date(g.y, g.m - 1, g.d, REMIND_HOUR, 0, 0);
        if (at.getTime() <= now) continue;
        items.push({ at, title: e.title, body: `${pkStr(toPK(n))} · ${gfmt(n, true)}` });
      }
    }
    for (const s of skyItems) {
      const g = ymd(s.n);
      const at = new Date(g.y, g.m - 1, g.d, REMIND_HOUR, 0, 0);
      if (at.getTime() > now) items.push({ at, title: s.title, body: s.body });
    }
    items.sort((a, b) => a.at.getTime() - b.at.getTime());
    for (const it of items.slice(0, MAX_SCHEDULED)) {
      await Notifications.scheduleNotificationAsync({
        content: { title: it.title, body: it.body },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: it.at, channelId: CHANNEL },
      });
    }
  } catch { /* scheduling failed: ignore, will retry on next change */ }
}
