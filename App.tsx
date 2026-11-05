import React, { useEffect, useState } from 'react';
import { AppState, BackHandler, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Cinzel_600SemiBold, Cinzel_700Bold, Cinzel_900Black } from '@expo-google-fonts/cinzel';
import { DMSans_300Light, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { toPK, todayDn } from './src/engine';
import { useEvents } from './src/events';
import { SkyScreen } from './src/skyScreen';
import { useLayers } from './src/layers';
import { useProfile } from './src/profile';
import { useJournal, usePeople } from './src/journal';
import { useSkyAlerts } from './src/skyAlerts';
import { ConvertScreen, EventsScreen, MonthScreen, Nav, Tab, TodayScreen, YearScreen } from './src/screens';
import { Ankh } from './src/components';
import { initReminders, syncReminders } from './src/reminders';
import { C, F } from './src/theme';

initReminders();

function TabIcon({ tab, color }: { tab: Tab; color: string }) {
  const s = 22, sw = 1.7;
  switch (tab) {
    case 'today':
      return <Ankh size={s} color={color} stroke={sw} />;
    case 'month':
      return (
        <Svg width={s} height={s}>
          <Rect x={3} y={4} width={16} height={15} rx={3} stroke={color} strokeWidth={sw} fill="none" />
          <Line x1={3} y1={9} x2={19} y2={9} stroke={color} strokeWidth={sw} />
          {[7, 11, 15].map(x => [12.5, 16].map(y => <Circle key={`${x}${y}`} cx={x} cy={y} r={1} fill={color} />))}
        </Svg>
      );
    case 'year':
      return (
        <Svg width={s} height={s}>
          <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={sw} fill="none" />
          <Circle cx={11} cy={11} r={3.5} stroke={color} strokeWidth={sw} fill="none" />
          {Array.from({ length: 13 }, (_, i) => {
            const a = (i * 2 * Math.PI) / 13;
            return <Line key={i} x1={11 + 3.5 * Math.sin(a)} y1={11 - 3.5 * Math.cos(a)} x2={11 + 8 * Math.sin(a)} y2={11 - 8 * Math.cos(a)} stroke={color} strokeWidth={0.9} />;
          })}
        </Svg>
      );
    case 'sky':
      return (
        <Svg width={s} height={s}>
          <Circle cx={11} cy={11} r={4} stroke={color} strokeWidth={sw} fill="none" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            return <Line key={i} x1={11 + 6.5 * Math.cos(a)} y1={11 + 6.5 * Math.sin(a)} x2={11 + 9 * Math.cos(a)} y2={11 + 9 * Math.sin(a)} stroke={color} strokeWidth={sw} strokeLinecap="round" />;
          })}
        </Svg>
      );
    case 'convert':
      return (
        <Svg width={s} height={s}>
          <Path d="M4 8 H17 M13 4 L17 8 L13 12" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M18 15 H5 M9 11 L5 15 L9 19" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={s} height={s}>
          <Path d="M11 3 L13 9 L19 9 L14.2 12.8 L16 19 L11 15.3 L6 19 L7.8 12.8 L3 9 L9 9 Z" stroke={color} strokeWidth={sw} fill="none" strokeLinejoin="round" />
        </Svg>
      );
  }
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: 'month', label: 'Month' }, { key: 'sky', label: 'Sky' }, { key: 'year', label: 'Year' },
  { key: 'convert', label: 'Convert' }, { key: 'events', label: 'Events' },
];

function Main() {
  const insets = useSafeAreaInsets();
  const [today, setToday] = useState(todayDn());
  const p0 = toPK(today);
  const [tab, setTab] = useState<Tab>('today');
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState({ ey: p0.year, month: p0.kind === 'day' ? p0.month : 13 });
  const events = useEvents();
  const layers = useLayers();
  const profile = useProfile();
  const journal = useJournal();
  const people = usePeople();
  const alerts = useSkyAlerts();
  // keep scheduled reminders in step with the events (and roll the window forward each day)
  useEffect(() => {
    if (events.ready && alerts.ready) syncReminders(events.events, today, alerts.prefs);
  }, [events.events, events.ready, alerts.prefs, alerts.ready, today]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s === 'active') setToday(todayDn()); });
    const iv = setInterval(() => setToday(todayDn()), 60_000);
    return () => { sub.remove(); clearInterval(iv); };
  }, []);
  // Android back button: go back to Today first, exit only from Today
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab !== 'today') { setTab('today'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [tab]);
  const nav: Nav = { today, selected, setSelected, view, setView, go: setTab, events, layers, profile, journal, people, alerts };
  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <StatusBar style="light" />
      <View style={{ height: insets.top, backgroundColor: C.night }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {tab === 'today' && <TodayScreen nav={nav} />}
        {tab === 'month' && <MonthScreen nav={nav} />}
        {tab === 'sky' && <SkyScreen nav={nav} />}
        {tab === 'year' && <YearScreen nav={nav} />}
        {tab === 'convert' && <ConvertScreen nav={nav} />}
        {tab === 'events' && <EventsScreen nav={nav} />}
      </KeyboardAvoidingView>
      <View style={{ flexDirection: 'row', backgroundColor: C.night, paddingBottom: Math.max(insets.bottom, 8), paddingTop: 8, borderTopWidth: 1, borderTopColor: C.night3 }}>
        {TABS.map(t => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
              <TabIcon tab={t.key} color={on ? C.gold : 'rgba(255,255,255,0.5)'} />
              <Text style={{ fontFamily: on ? F.sansB : F.sans, fontSize: 10.5, color: on ? C.gold : 'rgba(255,255,255,0.5)', marginTop: 3 }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ Cinzel_600SemiBold, Cinzel_700Bold, Cinzel_900Black, DMSans_300Light, DMSans_400Regular, DMSans_500Medium, DMSans_700Bold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.night }} />;
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}
