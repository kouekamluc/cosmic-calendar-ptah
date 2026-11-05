import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import {
  dn, eraYearOf, fromPK, gfmt, holidaysFor, MONTHS, monthStart, moonsFor, nextPhaseAfter, PHASE_NAME, pkShort, pkStr,
  toPK, ymd, WEEKDAYS, yearEnd, yearHasLeap, yearLength, yearStart, ERA_OFFSET,
} from './engine';
import { EventsApi, PEvent, Repeat, occursOn } from './events';
import { Ankh, Card, CountryTag, Kicker, MoonIcon, NavArrows, NdopBand, Sparkle, Starfield, YearWheel } from './components';
import { ACCENTS, C, EVENT_COLORS, F } from './theme';

export type Nav = {
  today: number;
  selected: number;
  setSelected: (n: number) => void;
  view: { ey: number; month: number };
  setView: (v: { ey: number; month: number }) => void;
  go: (tab: Tab) => void;
  events: EventsApi;
};
export type Tab = 'today' | 'month' | 'year' | 'convert' | 'events';

const T = StyleSheet.create({
  h1: { fontFamily: F.displayB, color: C.ink, fontSize: 26 },
  body: { fontFamily: F.sans, color: C.ink, fontSize: 14 },
  small: { fontFamily: F.sans, color: C.muted, fontSize: 12 },
  label: { fontFamily: F.sansB, color: C.muted, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase' },
});

function accentOf(n: number) {
  const p = toPK(n);
  return p.kind === 'day' ? ACCENTS[p.month - 1] : C.gold;
}

// ======================================================================== TODAY
export function TodayScreen({ nav }: { nav: Nav }) {
  const { width } = useWindowDimensions();
  const t = nav.today, p = toPK(t), ey = p.year;
  const idx = t - yearStart(ey), len = yearLength(ey);
  const g = ymd(t);
  const nxt = nextPhaseAfter(t - 1);
  const curPhase = moonsFor(ey).get(t);
  const upcoming = useMemo(() => {
    const out: { n: number; name: string; who: string; est?: boolean }[] = [];
    for (let k = 0; k < 400 && out.length < 3; k++) {
      const n = t + k;
      (holidaysFor(eraYearOf(n)).get(n) ?? []).forEach(h => out.length < 3 && out.push({ n, name: h.name, who: h.who, est: h.est }));
    }
    return out;
  }, [t]);
  const todays = nav.events.on(t);
  const wheel = Math.min(width - 48, 360);
  const acc = accentOf(t);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.night }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 28 }}>
        <Starfield w={width} h={900} n={140} seed={ey} />
        <Kicker>Today · Aquarian Era</Kicker>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 14 }}>
          {p.kind === 'day' ? (
            <>
              <Text style={{ fontFamily: F.displayBlk, color: C.gold, fontSize: 92, lineHeight: 96 }}>{p.day}</Text>
              <View style={{ marginLeft: 14, marginBottom: 14 }}>
                <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 28, letterSpacing: 1 }}>{MONTHS[p.month - 1].toUpperCase()}</Text>
                <Text style={{ fontFamily: F.sansL, color: C.goldLt, fontSize: 22 }}>{p.year}</Text>
              </View>
            </>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ankh size={70} color={C.gold} />
              <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 30, marginLeft: 8 }}>{pkStr(p)}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.75)', fontSize: 14 }}>
          {WEEKDAYS[g.wd]} · {gfmt(t)}   ·   <Text style={{ color: C.goldLt }}>{pkShort(p)}</Text>
        </Text>
        <View style={{ alignItems: 'center', marginVertical: 22 }}>
          <YearWheel size={wheel} ey={ey} dayIndex={idx} onMonth={m => { nav.setView({ ey, month: m }); nav.go('month'); }} />
        </View>
        {/* progress */}
        <View style={{ height: 6, backgroundColor: C.night3, borderRadius: 3, overflow: 'hidden' }}>
          <View style={{ width: `${((idx + 1) / len) * 100}%`, height: 6, backgroundColor: acc }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontFamily: F.sansM, color: C.goldLt, fontSize: 12 }}>Day {idx + 1} of {len}</Text>
          <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{len - idx - 1} days to Renewal Day</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <Card style={{ flex: 1, backgroundColor: C.night2 }}>
            <Kicker style={{ fontSize: 9 }}>Moon</Kicker>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <MoonIcon phase={curPhase ?? nxt.phase} r={13} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 14 }}>{curPhase ? PHASE_NAME[curPhase] : PHASE_NAME[nxt.phase]}</Text>
                <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                  {curPhase ? 'today' : `in ${nxt.n - t} day${nxt.n - t === 1 ? '' : 's'} · ${pkShort(toPK(nxt.n))}`}
                </Text>
              </View>
            </View>
          </Card>
          <Card style={{ flex: 1, backgroundColor: C.night2 }}>
            <Kicker style={{ fontSize: 9 }}>Month</Kicker>
            <Text style={{ fontFamily: F.displayB, color: acc, fontSize: 26, marginTop: 6 }}>{p.kind === 'day' ? String(p.month).padStart(2, '0') : '✦'}</Text>
            <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>{p.kind === 'day' ? `${28 - p.day} days left` : 'outside the months'}</Text>
          </Card>
        </View>

        <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
          <Kicker style={{ fontSize: 9 }}>Coming holidays</Kicker>
          {upcoming.map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
              <CountryTag who={h.who} />
              <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 13, flex: 1 }}>{h.name}{h.est ? ' *' : ''}</Text>
              <Text style={{ fontFamily: F.sans, color: C.goldLt, fontSize: 12 }}>{h.n === t ? 'today' : `${pkShort(toPK(h.n))}`}</Text>
            </View>
          ))}
        </Card>

        <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Kicker style={{ fontSize: 9 }}>Your day</Kicker>
            <Pressable onPress={() => { nav.setSelected(t); nav.go('events'); }}>
              <Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 12 }}>+ Add</Text>
            </Pressable>
          </View>
          {todays.length === 0
            ? <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 8 }}>Nothing planned today.</Text>
            : todays.map(e => (
              <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.color, marginRight: 10 }} />
                <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 14 }}>{e.title}</Text>
              </View>
            ))}
        </Card>
      </View>
      <View style={{ marginTop: 24 }}><NdopBand w={width} h={36} rows={2} /></View>
    </ScrollView>
  );
}

// ======================================================================== MONTH
function DayCell({ n, label, w, h, nav }: { n: number; label: string | number; w: number; h: number; nav: Nav }) {
  const ey = eraYearOf(n);
  const hol = holidaysFor(ey).get(n);
  const moon = moonsFor(ey).get(n);
  const ev = nav.events.on(n);
  const isToday = n === nav.today, isSel = n === nav.selected;
  const g = ymd(n), weekend = g.wd === 0 || g.wd === 6;
  const acc = accentOf(n);
  const special = typeof label === 'string';
  const bg = isToday ? C.night : hol ? C.holi : special ? C.special : C.card;
  return (
    <Pressable onPress={() => nav.setSelected(n)} style={{ width: w, height: h, padding: 2 }}>
      <View style={{ flex: 1, backgroundColor: bg, borderRadius: 9, padding: 5, borderWidth: isSel ? 2 : isToday ? 1.2 : 0, borderColor: isSel ? acc : C.gold, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: special ? F.displayB : F.display, fontSize: special ? 10 : 18, lineHeight: special ? 12 : 22, color: isToday ? C.gold : weekend ? acc : C.ink }} numberOfLines={2}>{label}</Text>
          {!special && <Text style={{ fontFamily: F.sansM, fontSize: 7.5, color: isToday ? 'rgba(255,255,255,0.7)' : C.muted }}>{g.d}</Text>}
        </View>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {hol && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#B8831E' }} />}
            {ev.slice(0, 3).map(e => <View key={e.id} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: e.color }} />)}
          </View>
          {moon && <MoonIcon phase={moon} r={4} lit={isToday ? C.goldLt : '#F3D98C'} dark={isToday ? C.night : C.ink} outline={isToday ? C.goldLt : C.ink} />}
        </View>
      </View>
    </Pressable>
  );
}

function DayDetail({ n, nav }: { n: number; nav: Nav }) {
  const ey = eraYearOf(n), p = toPK(n);
  const hol = holidaysFor(ey).get(n) ?? [];
  const moon = moonsFor(ey).get(n);
  const ev = nav.events.on(n);
  const acc = accentOf(n);
  return (
    <Card style={{ marginTop: 14, borderLeftWidth: 4, borderLeftColor: acc }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.displayB, fontSize: 20, color: C.ink }}>{pkStr(p)}</Text>
          <Text style={[T.small, { marginTop: 2 }]}>{gfmt(n, true)} · {pkShort(p)}{n === nav.today ? ' · today' : ''}</Text>
        </View>
        <Pressable onPress={() => nav.go('events')} style={{ backgroundColor: C.night, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 }}>
          <Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 12 }}>+ Event</Text>
        </Pressable>
      </View>
      {moon && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <MoonIcon phase={moon} r={7} lit="#F3D98C" dark={C.ink} outline={C.ink} />
          <Text style={[T.body, { marginLeft: 8 }]}>{PHASE_NAME[moon]}</Text>
        </View>
      )}
      {hol.map((h, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <CountryTag who={h.who} />
          <Text style={T.body}>{h.name}{h.est ? '  (estimated)' : ''}</Text>
        </View>
      ))}
      {ev.map(e => (
        <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: e.color, marginRight: 9 }} />
          <Text style={[T.body, { fontFamily: F.sansM }]}>{e.title}</Text>
          {e.repeat !== 'none' && <Text style={[T.small, { marginLeft: 6 }]}>↻ yearly</Text>}
        </View>
      ))}
      {!moon && hol.length === 0 && ev.length === 0 && <Text style={[T.small, { marginTop: 10 }]}>No holidays or events.</Text>}
    </Card>
  );
}

export function MonthScreen({ nav }: { nav: Nav }) {
  const { width } = useWindowDimensions();
  const { ey, month } = nav.view;
  const acc = ACCENTS[month - 1];
  const start = monthStart(ey, month);
  const cells: { n: number; label: string | number }[] = Array.from({ length: 28 }, (_, i) => ({ n: start + i, label: i + 1 }));
  if (month === 13) {
    if (yearHasLeap(ey)) cells.push({ n: start + 28, label: 'Leap Day' });
    cells.push({ n: yearEnd(ey), label: 'Renewal Day' });
  }
  const step = (d: number) => {
    let m = month + d, y = ey;
    if (m > 13) { m = 1; y++; }
    if (m < 1) { m = 13; y--; }
    nav.setView({ ey: y, month: m });
    nav.setSelected(monthStart(y, m));
  };
  const stepRef = useRef(step);
  stepRef.current = step;
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_, g) => { if (g.dx < -50) stepRef.current(1); else if (g.dx > 50) stepRef.current(-1); },
  })).current;
  const cw = (width - 24) / 7, ch = cw * 1.18;
  const wd0 = ymd(start).wd;
  const a = start, b = start + 27;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={{ backgroundColor: C.night, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18 }}>
        <Starfield w={width} h={220} n={50} seed={ey * 13 + month} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Kicker>Month {String(month).padStart(2, '0')} of 13</Kicker>
          <Pressable onPress={() => { const p = toPK(nav.today); nav.setView({ ey: p.year, month: p.kind === 'day' ? p.month : 13 }); nav.setSelected(nav.today); }}>
            <Text style={{ fontFamily: F.sansB, color: C.goldLt, fontSize: 12 }}>Today</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={{ fontFamily: F.displayBlk, color: acc, fontSize: 64, lineHeight: 70 }}>{String(month).padStart(2, '0')}</Text>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 24, letterSpacing: 1 }}>{MONTHS[month - 1].toUpperCase()}</Text>
            <Text style={{ fontFamily: F.sansL, color: C.goldLt, fontSize: 17 }}>{ey}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['‹', '›'].map((s, i) => (
              <Pressable key={s} onPress={() => step(i ? 1 : -1)} hitSlop={8} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.night3, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: C.white, fontSize: 20, fontFamily: F.sansB, marginTop: -2 }}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 4 }}>Gregorian {gfmt(a)} – {gfmt(b)}</Text>
      </View>
      <View style={{ height: 4, backgroundColor: acc }} />
      <NdopBand w={width} h={14} />
      <View {...pan.panHandlers} style={{ paddingHorizontal: 12, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row' }}>
          {Array.from({ length: 7 }, (_, k) => {
            const wd = (wd0 + k) % 7;
            return <Text key={k} style={{ width: cw, textAlign: 'center', fontFamily: F.sansB, fontSize: 10, letterSpacing: 1, color: wd === 0 || wd === 6 ? acc : C.muted }}>{WEEKDAYS[wd].slice(0, 3).toUpperCase()}</Text>;
          })}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
          {cells.map(c => <DayCell key={c.n} n={c.n} label={c.label} w={cw} h={ch} nav={nav} />)}
        </View>
        <DayDetail n={nav.selected} nav={nav} />
        <Text style={[T.small, { marginTop: 12, fontSize: 10.5 }]}>Swipe to change month · small number = Gregorian day · gold dot = holiday · * Eid estimated</Text>
      </View>
    </ScrollView>
  );
}

// ======================================================================== YEAR
export function YearScreen({ nav }: { nav: Nav }) {
  const { width } = useWindowDimensions();
  const [ey, setEy] = useState(nav.view.ey);
  const hols = holidaysFor(ey), moons = moonsFor(ey);
  const cols = width > 600 ? 3 : 2;
  const bw = (width - 32 - (cols - 1) * 12) / cols;
  const cw = (bw - 12) / 7;
  const wd0 = ymd(yearStart(ey)).wd;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <NavArrows label={`Year ${ey}`} sub={`20 Mar ${ey - ERA_OFFSET} – 19 Mar ${ey - ERA_OFFSET + 1} · ${yearLength(ey)} days`} onPrev={() => setEy(ey - 1)} onNext={() => setEy(ey + 1)} />
      <Text style={[T.small, { textAlign: 'center', marginTop: 6 }]}>Every month starts on a {WEEKDAYS[wd0]}{yearHasLeap(ey) ? ' · Leap year' : ''}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
        {Array.from({ length: 13 }, (_, i) => {
          const s = monthStart(ey, i + 1);
          return (
            <Pressable key={i} onPress={() => { nav.setView({ ey, month: i + 1 }); nav.setSelected(s); nav.go('month'); }} style={{ width: bw, backgroundColor: C.card, borderRadius: 12, overflow: 'hidden' }}>
              <View style={{ backgroundColor: ACCENTS[i], paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: F.displayB, color: '#fff', fontSize: 12 }}>{String(i + 1).padStart(2, '0')} {MONTHS[i].toUpperCase()}</Text>
                <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.85)', fontSize: 8.5 }}>{gfmt(s, false, false)}</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: 6 }}>
                {Array.from({ length: 28 }, (_, d) => {
                  const n = s + d, isT = n === nav.today, h = hols.has(n), full = moons.get(n) === 'full';
                  return (
                    <View key={d} style={{ width: cw, height: cw, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ width: cw - 3, height: cw - 3, borderRadius: cw, alignItems: 'center', justifyContent: 'center', backgroundColor: isT ? C.night : h ? C.holi : 'transparent' }}>
                        <Text style={{ fontFamily: F.sansM, fontSize: cw * 0.4, color: isT ? C.goldLt : C.ink }}>{d + 1}</Text>
                      </View>
                      {full && <View style={{ position: 'absolute', top: 1, right: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: C.gold }} />}
                    </View>
                  );
                })}
              </View>
            </Pressable>
          );
        })}
        <View style={{ width: bw, backgroundColor: C.night, borderRadius: 12, padding: 12, justifyContent: 'center' }}>
          <Kicker style={{ fontSize: 9 }}>Outside the months</Kicker>
          {yearHasLeap(ey) && <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 14, marginTop: 10 }}>Leap Day <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.goldLt }}>{gfmt(yearEnd(ey) - 1)}</Text></Text>}
          <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 14, marginTop: 10 }}>Renewal Day <Text style={{ fontFamily: F.sans, fontSize: 11, color: C.goldLt }}>{gfmt(yearEnd(ey))}</Text></Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ======================================================================== CONVERT
function Field({ value, onChange, w = 64, label }: { value: string; onChange: (s: string) => void; w?: number; label: string }) {
  return (
    <View style={{ marginRight: 10 }}>
      <Text style={T.label}>{label}</Text>
      <TextInput value={value} onChangeText={s => onChange(s.replace(/[^0-9]/g, ''))} keyboardType="number-pad"
        style={{ width: w, marginTop: 4, backgroundColor: C.paper, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontFamily: F.sansM, fontSize: 16, color: C.ink }} />
    </View>
  );
}

export function ConvertScreen({ nav }: { nav: Nav }) {
  const tg = ymd(nav.today), tp = toPK(nav.today);
  const [gd, setGd] = useState(String(tg.d)), [gm, setGm] = useState(String(tg.m)), [gy, setGy] = useState(String(tg.y));
  const [py, setPy] = useState(String(tp.year)), [pm, setPm] = useState(tp.kind === 'day' ? tp.month : 13), [pd, setPd] = useState(String(tp.kind === 'day' ? tp.day : 28));
  const [special, setSpecial] = useState<null | 'leap' | 'renewal'>(null);

  let gRes: { n: number } | null = null;
  const y = +gy, m = +gm, d = +gd;
  if (y > 0 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
    const n = dn(y, m, d);
    if (ymd(n).d === d) gRes = { n };
  }
  let pRes: number | null = null, pErr = '';
  const Y = +py;
  if (Y > ERA_OFFSET) {
    if (special === 'renewal') pRes = yearEnd(Y);
    else if (special === 'leap') { if (yearHasLeap(Y)) pRes = yearEnd(Y) - 1; else pErr = `Year ${Y} has no Leap Day`; }
    else if (+pd >= 1 && +pd <= 28) pRes = fromPK(Y, pm, +pd);
    else pErr = 'Day must be 1–28';
  }
  const open = (n: number) => { const p = toPK(n); nav.setView({ ey: p.year, month: p.kind === 'day' ? p.month : 13 }); nav.setSelected(n); nav.go('month'); };
  const Result = ({ big, sub, n }: { big: string; sub: string; n: number }) => (
    <Pressable onPress={() => open(n)} style={{ backgroundColor: C.night, borderRadius: 12, padding: 14, marginTop: 14 }}>
      <Text style={{ fontFamily: F.displayB, color: C.gold, fontSize: 22 }}>{big}</Text>
      <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3 }}>{sub}   ·   open in month ›</Text>
    </Pressable>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Kicker>Converter</Kicker>
      <Text style={[T.h1, { marginTop: 4, marginBottom: 14 }]}>Between two calendars</Text>
      <Card>
        <Text style={[T.label, { color: C.ink }]}>Gregorian → Ptah Kamgou</Text>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Field label="Day" value={gd} onChange={setGd} /><Field label="Month" value={gm} onChange={setGm} /><Field label="Year" value={gy} onChange={setGy} w={84} />
        </View>
        {gRes ? <Result big={pkStr(toPK(gRes.n))} sub={`${pkShort(toPK(gRes.n))} · ${gfmt(gRes.n, true)}`} n={gRes.n} /> : <Text style={[T.small, { marginTop: 12 }]}>Enter a valid date</Text>}
      </Card>
      <Card style={{ marginTop: 14 }}>
        <Text style={[T.label, { color: C.ink }]}>Ptah Kamgou → Gregorian</Text>
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          {!special && <Field label="Day" value={pd} onChange={setPd} />}
          <Field label="Year" value={py} onChange={setPy} w={84} />
        </View>
        <Text style={[T.label, { marginTop: 12 }]}>Month</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {MONTHS.map((nm, i) => {
            const on = !special && pm === i + 1;
            return (
              <Pressable key={nm} onPress={() => { setPm(i + 1); setSpecial(null); }} style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: on ? ACCENTS[i] : C.paper }}>
                <Text style={{ fontFamily: F.sansM, fontSize: 12, color: on ? '#fff' : C.ink }}>{String(i + 1).padStart(2, '0')} {nm.slice(0, 3)}</Text>
              </Pressable>
            );
          })}
          {(['leap', 'renewal'] as const).map(s => (
            <Pressable key={s} onPress={() => setSpecial(s)} style={{ paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, backgroundColor: special === s ? C.gold : C.paper }}>
              <Text style={{ fontFamily: F.sansM, fontSize: 12, color: special === s ? C.night : C.ink }}>{s === 'leap' ? 'Leap Day' : 'Renewal Day'}</Text>
            </Pressable>
          ))}
        </View>
        {pRes !== null ? <Result big={gfmt(pRes, true)} sub={pkStr(toPK(pRes))} n={pRes} /> : <Text style={[T.small, { marginTop: 12 }]}>{pErr || 'Enter a year'}</Text>}
      </Card>
      <Text style={[T.small, { marginTop: 14 }]}>Era year = Gregorian year in which the year begins + {ERA_OFFSET}. Years start on 20 March.</Text>
    </ScrollView>
  );
}

// ======================================================================== EVENTS
function nextOccurrence(e: PEvent, from: number) {
  if (e.repeat === 'none') return e.date >= from ? e.date : null;
  for (let k = 0; k < 800; k++) if (occursOn(e, from + k)) return from + k;
  return null;
}

export function EventsScreen({ nav }: { nav: Nav }) {
  const [title, setTitle] = useState('');
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const date = nav.selected;
  const list = nav.events.events
    .map(e => ({ e, next: nextOccurrence(e, nav.today) }))
    .sort((a, b) => (a.next ?? 1e9) - (b.next ?? 1e9));
  const submit = () => {
    if (!title.trim()) return;
    nav.events.add({ title: title.trim(), date, repeat, color });
    setTitle('');
  };
  const chip = (on: boolean, label: string, f: () => void) => (
    <Pressable key={label} onPress={f} style={{ paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: on ? C.night : C.paper, marginRight: 6, marginTop: 6 }}>
      <Text style={{ fontFamily: F.sansM, fontSize: 12, color: on ? C.gold : C.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Kicker>Your events</Kicker>
      <Text style={[T.h1, { marginTop: 4, marginBottom: 14 }]}>Plan your year</Text>
      <Card>
        <Text style={[T.label, { color: C.ink }]}>New event</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Digital electronics exam" placeholderTextColor={C.muted} onSubmitEditing={submit}
          style={{ marginTop: 10, backgroundColor: C.paper, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontFamily: F.sansM, fontSize: 15, color: C.ink }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <Pressable onPress={() => nav.setSelected(date - 1)} hitSlop={8} style={{ padding: 6 }}><Text style={{ fontSize: 20, color: C.ink }}>‹</Text></Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: F.displayB, fontSize: 16, color: C.ink }}>{pkStr(toPK(date))}</Text>
            <Text style={T.small}>{gfmt(date, true)}</Text>
          </View>
          <Pressable onPress={() => nav.setSelected(date + 1)} hitSlop={8} style={{ padding: 6 }}><Text style={{ fontSize: 20, color: C.ink }}>›</Text></Pressable>
        </View>
        <Pressable onPress={() => nav.go('month')}><Text style={[T.small, { textAlign: 'center', color: C.gold, fontFamily: F.sansB }]}>pick on calendar</Text></Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
          {chip(repeat === 'none', 'Once', () => setRepeat('none'))}
          {chip(repeat === 'pk', 'Yearly (Ptah Kamgou)', () => setRepeat('pk'))}
          {chip(repeat === 'greg', 'Yearly (Gregorian)', () => setRepeat('greg'))}
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
          {EVENT_COLORS.map(c => (
            <Pressable key={c} onPress={() => setColor(c)} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: C.night }} />
          ))}
        </View>
        <Pressable onPress={submit} style={({ pressed }) => ({ marginTop: 16, backgroundColor: title.trim() ? C.night : C.rule, borderRadius: 10, paddingVertical: 12, alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ fontFamily: F.sansB, color: title.trim() ? C.gold : C.muted, fontSize: 14, letterSpacing: 1 }}>SAVE EVENT</Text>
        </Pressable>
      </Card>
      <Text style={[T.label, { marginTop: 22, marginBottom: 8 }]}>Upcoming</Text>
      {list.length === 0 && <Text style={T.small}>No events yet. Exams, work shifts, birthdays — add them above.</Text>}
      {list.map(({ e, next }) => (
        <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8, opacity: next === null ? 0.5 : 1 }}>
          <View style={{ width: 6, alignSelf: 'stretch', borderRadius: 3, backgroundColor: e.color, marginRight: 12 }} />
          <Pressable style={{ flex: 1 }} onPress={() => { if (next !== null) { const p = toPK(next); nav.setView({ ey: p.year, month: p.kind === 'day' ? p.month : 13 }); nav.setSelected(next); nav.go('month'); } }}>
            <Text style={{ fontFamily: F.sansB, fontSize: 15, color: C.ink }}>{e.title}</Text>
            <Text style={T.small}>
              {next === null ? `passed · ${pkStr(toPK(e.date))}` : `${pkStr(toPK(next))} · ${gfmt(next, true)}`}
              {e.repeat !== 'none' ? '  ↻' : ''}
              {next !== null && next - nav.today <= 30 ? `  ·  ${next === nav.today ? 'today' : `in ${next - nav.today}d`}` : ''}
            </Text>
          </Pressable>
          <Pressable onPress={() => nav.events.remove(e.id)} hitSlop={10} style={{ padding: 6 }}>
            <Text style={{ color: C.muted, fontSize: 16 }}>✕</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}
