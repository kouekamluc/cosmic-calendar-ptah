import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import type { Birth } from './chart';

export type Profile = { name: string; place: string; birth: Birth };
const KEY = 'ptah.profile.v1';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(s => { if (s) try { setProfile(JSON.parse(s)); } catch { /* ignore */ } })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  const save = useCallback((p: Profile | null) => {
    setProfile(p);
    if (p) AsyncStorage.setItem(KEY, JSON.stringify(p)).catch(() => {});
    else AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);
  return { profile, ready, save };
}
export type ProfileApi = ReturnType<typeof useProfile>;
