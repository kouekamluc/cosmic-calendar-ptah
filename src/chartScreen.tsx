import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { Card, Kicker } from './components';
import { Birth, Chart, fmtLon, SIGN_NAMES, signOf } from './chart';
import { searchCities, City } from './cities';
import { dn, gfmt, pkShort, pkStr, toPK, ymd } from './engine';
import { ANIMAL_KEYS, buildPassport, nextBirthdays, PATH_KEYS, Passport, shareText, SIGN_KEYS } from './passport';
import { glyph } from './sky';
import { Profile } from './profile';
import type { Nav } from './screens';
import { C, F } from './theme';

const dim = 'rgba(255,255,255,0.62)';
const ELEM_COLOR: Record<string, string> = { Fire: '#E0705A', Earth: '#7FA33A', Air: '#6FB4D9', Water: '#7B7FE0' };
const ASPECT_COLOR = { soft: '#6FBF8E', hard: '#E0705A', conj: '#D9A441' } as const;

// ------------------------------------------------------------------ wheel
function ChartWheel({ chart, size }: { chart: Chart; size: number }) {
  const cx = size / 2, cy = size / 2, R1 = size / 2 - 4, R2 = R1 - 36, R3 = R2 - 50;
  const rot = chart.asc ?? 0;
  const ang = (lon: number) => Math.PI + ((lon - rot) * Math.PI) / 180;
  const pt = (lon: number, r: number) => ({ x: cx + r * Math.cos(ang(lon)), y: cy - r * Math.sin(ang(lon)) });
  const pl = chart.points.filter(p => p.key !== 'node');
  // spread glyphs so they don't overlap
  const disp = useMemo(() => {
    const a = pl.map(p => ({ k: p.key, lon: p.lon, d: p.lon })).sort((x, y) => x.lon - y.lon);
    for (let it = 0; it < 40; it++) {
      for (let i = 0; i < a.length; i++) {
        const j = (i + 1) % a.length;
        let gap = a[j].d - a[i].d; if (gap < 0) gap += 360;
        if (gap < 9) { const push = (9 - gap) / 2; a[i].d -= push; a[j].d += push; }
      }
    }
    return Object.fromEntries(a.map(x => [x.k, x.d]));
  }, [chart]);
  const lonOf: Record<string, number> = Object.fromEntries(chart.points.map(p => [p.name, p.lon]));
  if (chart.asc !== null && chart.mc !== null) { lonOf.Ascendant = chart.asc; lonOf.Midheaven = chart.mc; }
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={R1} stroke={C.gold} strokeWidth={1.2} fill={C.night2} />
      <Circle cx={cx} cy={cy} r={R2} stroke={C.pattern} strokeWidth={0.8} fill={C.night} />
      <Circle cx={cx} cy={cy} r={R3} stroke={C.pattern} strokeWidth={0.8} fill="none" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = pt(i * 30, R2), b = pt(i * 30, R1), m = pt(i * 30 + 15, (R1 + R2) / 2);
        return (
          <G key={i}>
            <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.pattern} strokeWidth={0.8} />
            <SvgText x={m.x} y={m.y + 6} fontSize={17} fill={ELEM_COLOR[['Fire', 'Earth', 'Air', 'Water'][i % 4]]} textAnchor="middle">{glyph(i)}</SvgText>
          </G>
        );
      })}
      {chart.asc !== null && chart.mc !== null && (
        <G>
          {[['AC', chart.asc], ['MC', chart.mc]].map(([nm, l]) => {
            const a = pt(l as number, R3), b = pt(l as number, R1 + 0), t = pt(l as number, R3 - 14);
            return (
              <G key={nm as string}>
                <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.gold} strokeWidth={1.6} />
                <SvgText x={t.x} y={t.y + 4} fontSize={11} fontWeight="bold" fill={C.gold} textAnchor="middle">{nm as string}</SvgText>
              </G>
            );
          })}
        </G>
      )}
      {chart.aspects.filter(a => lonOf[a.a] !== undefined && lonOf[a.b] !== undefined && a.a !== 'Ascendant' && a.a !== 'Midheaven' && a.b !== 'Ascendant' && a.b !== 'Midheaven').map((a, i) => {
        const p = pt(lonOf[a.a], R3), q = pt(lonOf[a.b], R3);
        return <Line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={ASPECT_COLOR[a.kind]} strokeWidth={1} opacity={0.65} />;
      })}
      {pl.map(p => {
        const tick1 = pt(p.lon, R2), tick2 = pt(p.lon, R2 - 7), g = pt(disp[p.key], R2 - 24);
        return (
          <G key={p.key}>
            <Line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke={C.goldLt} strokeWidth={1} />
            <SvgText x={g.x} y={g.y + 6} fontSize={17} fill={C.goldLt} textAnchor="middle">{p.glyph + '︎'}</SvgText>
            {p.retro && <SvgText x={g.x + 9} y={g.y + 14} fontSize={8} fill="#E0705A" textAnchor="middle">R</SvgText>}
          </G>
        );
      })}
    </Svg>
  );
}

// ------------------------------------------------------------------ form
export function Input({ label, value, onChange, w, ph, numeric = true }: { label: string; value: string; onChange: (s: string) => void; w?: number; ph?: string; numeric?: boolean }) {
  return (
    <View style={{ marginRight: 10, marginTop: 10, width: w }}>
      <Text style={{ fontFamily: F.sansB, color: C.goldLt, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' }}>{label}</Text>
      <TextInput value={value} onChangeText={s => onChange(numeric ? s.replace(/[^0-9.\-]/g, '') : s)} keyboardType={numeric ? 'numbers-and-punctuation' : 'default'}
        placeholder={ph} placeholderTextColor="rgba(255,255,255,0.3)"
        style={{ marginTop: 4, backgroundColor: C.night3, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, fontFamily: F.sansM, fontSize: 16, color: C.white }} />
    </View>
  );
}
export const Chip = ({ on, label, f }: { on: boolean; label: string; f: () => void }) => (
  <Pressable onPress={f} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: on ? C.gold : C.night3, marginRight: 8, marginTop: 8 }}>
    <Text style={{ fontFamily: F.sansB, fontSize: 12, color: on ? C.night : dim }}>{label}</Text>
  </Pressable>
);

function BirthForm({ initial, onSave, onCancel }: { initial: Profile | null; onSave: (p: Profile) => void; onCancel?: () => void }) {
  const b0 = initial?.birth, g0 = b0 ? ymd(b0.date) : null;
  const [name, setName] = useState(initial?.name ?? '');
  const [d, setD] = useState(g0 ? String(g0.d) : ''), [m, setM] = useState(g0 ? String(g0.m) : ''), [y, setY] = useState(g0 ? String(g0.y) : '');
  const [known, setKnown] = useState(b0 ? b0.hour !== null : true);
  const [hh, setHh] = useState(b0 && b0.hour !== null ? String(b0.hour) : ''), [mm, setMm] = useState(b0 && b0.hour !== null ? String(b0.minute) : '');
  const [q, setQ] = useState(initial?.place ?? '');
  const [lat, setLat] = useState(b0 ? String(b0.lat) : ''), [lon, setLon] = useState(b0 ? String(b0.lon) : ''), [tz, setTz] = useState(b0 ? String(b0.utcOffset) : '');
  const [dst, setDst] = useState(b0?.dst ?? false);
  const [manual, setManual] = useState(false);
  const hits = useMemo(() => (manual ? [] : searchCities(q)), [q, manual]);
  const pick = (c: City) => { setQ(`${c.name}, ${c.cc}`); setLat(String(c.lat)); setLon(String(c.lon)); setTz(String(c.tz)); };

  const submit = () => {
    const D = +d, M = +m, Y = +y;
    const n = dn(Y, M, D);
    if (!(Y >= 1800 && Y <= 2100 && M >= 1 && M <= 12 && D >= 1 && ymd(n).d === D && ymd(n).m === M)) return Alert.alert('Birth date', 'Please enter a valid day, month and year (1800–2100).');
    let hour: number | null = null, minute = 0;
    if (known) {
      hour = +hh; minute = +mm || 0;
      if (hh === '' || !(hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)) return Alert.alert('Birth time', 'Enter hour 0–23 and minute 0–59, or choose "I don\'t know the time".');
    }
    const la = parseFloat(lat), lo = parseFloat(lon), off = parseFloat(tz);
    if (known && !(la >= -66 && la <= 66 && lo >= -180 && lo <= 180 && !isNaN(off))) return Alert.alert('Birthplace', 'Pick a city from the list, or enter latitude (−66 to 66), longitude and UTC offset.');
    onSave({
      name: name.trim(), place: q.trim(),
      birth: { date: n, hour, minute, lat: isNaN(la) ? 0 : la, lon: isNaN(lo) ? 0 : lo, utcOffset: isNaN(off) ? 0 : off, dst },
    });
  };
  return (
    <View>
      <Kicker>Your Cosmic Passport</Kicker>
      <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 24, marginTop: 6 }}>Enter your birth</Text>
      <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12, marginTop: 4 }}>Stored only on this phone. Nothing is sent anywhere.</Text>
      <Input label="Name (optional)" value={name} onChange={setName} numeric={false} ph="e.g. Luc" />
      <View style={{ flexDirection: 'row' }}>
        <Input label="Day" value={d} onChange={setD} w={64} /><Input label="Month" value={m} onChange={setM} w={72} /><Input label="Year" value={y} onChange={setY} w={92} />
      </View>
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Chip on={known} label="I know the time" f={() => setKnown(true)} />
        <Chip on={!known} label="I don't know the time" f={() => setKnown(false)} />
      </View>
      {known && (
        <>
          <View style={{ flexDirection: 'row' }}>
            <Input label="Hour (0–23)" value={hh} onChange={setHh} w={92} /><Input label="Minute" value={mm} onChange={setMm} w={72} />
          </View>
          <Input label="Birth city" value={q} onChange={s => { setQ(s); setManual(false); }} numeric={false} ph="Start typing: Douala, Rome…" />
          {hits.map(c => (
            <Pressable key={c.name + c.cc} onPress={() => pick(c)} style={{ paddingVertical: 9, paddingHorizontal: 10, backgroundColor: C.night2, marginTop: 4, borderRadius: 8 }}>
              <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 14 }}>{c.name}, {c.cc} <Text style={{ color: dim, fontSize: 12 }}>  {c.lat.toFixed(2)}, {c.lon.toFixed(2)} · UTC{c.tz >= 0 ? '+' : ''}{c.tz}</Text></Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setManual(!manual)}><Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 12, marginTop: 10 }}>{manual ? 'Hide' : 'City not listed? Enter coordinates'}</Text></Pressable>
          <View style={{ flexDirection: 'row' }}>
            <Input label="Latitude" value={lat} onChange={setLat} w={104} /><Input label="Longitude" value={lon} onChange={setLon} w={104} /><Input label="UTC offset" value={tz} onChange={setTz} w={84} />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <Chip on={dst} label={dst ? 'Daylight saving: yes (+1h)' : 'Daylight saving: no'} f={() => setDst(!dst)} />
          </View>
          <Text style={{ fontFamily: F.sans, color: dim, fontSize: 11, marginTop: 8 }}>Cameroon is UTC+1 all year. Italy is +1 in winter and +2 in summer (turn on daylight saving). Without an exact time the Rising sign and houses are left out.</Text>
        </>
      )}
      <Pressable onPress={submit} style={{ marginTop: 20, backgroundColor: C.gold, borderRadius: 10, paddingVertical: 13, alignItems: 'center' }}>
        <Text style={{ fontFamily: F.sansB, color: C.night, fontSize: 14, letterSpacing: 1 }}>CREATE MY PASSPORT</Text>
      </Pressable>
      {onCancel && <Pressable onPress={onCancel} style={{ alignItems: 'center', padding: 12 }}><Text style={{ fontFamily: F.sansB, color: dim, fontSize: 12 }}>Cancel</Text></Pressable>}
    </View>
  );
}

// ------------------------------------------------------------------ passport view
function Big({ label, i, deg }: { label: string; i: number | null; deg?: string }) {
  return (
    <Card style={{ flex: 1, backgroundColor: C.night2, padding: 12 }}>
      <Kicker style={{ fontSize: 9 }}>{label}</Kicker>
      {i === null ? <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12, marginTop: 8 }}>needs birth time</Text> : (
        <>
          <Text style={{ fontFamily: F.sansM, color: C.gold, fontSize: 26, marginTop: 4 }}>{glyph(i)}</Text>
          <Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 14 }}>{SIGN_NAMES[i]}</Text>
          {deg ? <Text style={{ fontFamily: F.sans, color: dim, fontSize: 11 }}>{deg}</Text> : null}
        </>
      )}
    </Card>
  );
}
const Line2 = ({ k, v, sub }: { k: string; v: string; sub?: string }) => (
  <View style={{ marginTop: 10 }}>
    <Text style={{ fontFamily: F.sansB, color: C.goldLt, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' }}>{k}</Text>
    <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 15, marginTop: 2 }}>{v}</Text>
    {sub ? <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12, marginTop: 1 }}>{sub}</Text> : null}
  </View>
);

function PassportView({ profile, nav, onEdit }: { profile: Profile; nav: Nav; onEdit: () => void }) {
  const { width } = useWindowDimensions();
  const b = profile.birth;
  const P: Passport = useMemo(() => buildPassport(b), [b]);
  const ch = P.chart, sun = ch.points[0], moon = ch.points[1];
  const nb = nextBirthdays(b.date, nav.today);
  const wheel = Math.min(width - 40, 380);
  const addBirthdays = () => {
    const title = `${profile.name || 'My'} birthday`;
    nav.events.add({ title, date: b.date, repeat: 'pk', color: '#D9A441' });
    nav.events.add({ title: `${title} (Gregorian)`, date: b.date, repeat: 'greg', color: '#2A9193' });
    Alert.alert('Added', 'Both birthdays now repeat every year in your Events.');
  };
  const del = () => Alert.alert('Delete passport?', 'This removes your birth data from this phone.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => nav.profile.save(null) },
  ]);
  const maxEl = Math.max(...Object.values(ch.elements));
  return (
    <View>
      <Kicker>Cosmic Passport</Kicker>
      <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 24, marginTop: 6 }}>{profile.name || 'Your birth'}</Text>
      <Text style={{ fontFamily: F.sansM, color: C.goldLt, fontSize: 15, marginTop: 4 }}>{P.pkBirth}</Text>
      <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12, marginTop: 2 }}>{P.weekday} {P.greg} · {P.when}{profile.place ? ` · ${profile.place}` : ''}</Text>

      <View style={{ alignItems: 'center', marginTop: 16 }}><ChartWheel chart={ch} size={wheel} /></View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Big label="Sun" i={P.sun} deg={fmtLon(sun.lon).text} />
        <Big label="Moon" i={P.moon} deg={fmtLon(moon.lon).text} />
        <Big label="Rising" i={P.rising} deg={ch.asc !== null ? fmtLon(ch.asc).text : undefined} />
      </View>
      <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12, marginTop: 8, lineHeight: 17 }}>
        Sun in {SIGN_NAMES[P.sun]}: {SIGN_KEYS[P.sun]}.{'\n'}Moon in {SIGN_NAMES[P.moon]}: {SIGN_KEYS[P.moon]}.
        {P.rising !== null ? `\nRising ${SIGN_NAMES[P.rising]}: ${SIGN_KEYS[P.rising]}.` : ''}
      </Text>
      {!ch.timeKnown && <Text style={{ fontFamily: F.sans, color: C.goldLt, fontSize: 11, marginTop: 6 }}>Without a birth time the Moon is placed at midday and could be off by a few degrees; it may fall in a neighbouring sign on days it changes sign.</Text>}

      <Card style={{ backgroundColor: C.night2, marginTop: 14 }}>
        <Kicker style={{ fontSize: 9 }}>Placements</Kicker>
        {ch.points.map(p => {
          const f = fmtLon(p.lon);
          return (
            <View key={p.key} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 9 }}>
              <Text style={{ width: 28, color: C.gold, fontSize: 17, fontFamily: F.sansB }}>{p.glyph + '︎'}</Text>
              <Text style={{ width: 92, color: C.white, fontFamily: F.sansM, fontSize: 13 }}>{p.name}</Text>
              <Text style={{ flex: 1, color: C.white, fontFamily: F.sans, fontSize: 13 }}>{glyph(f.sign)} {SIGN_NAMES[f.sign]} {f.text}{p.retro ? '  ℞' : ''}</Text>
              <Text style={{ color: dim, fontFamily: F.sans, fontSize: 12 }}>{ch.houses[p.key] ? `house ${ch.houses[p.key]}` : ''}</Text>
            </View>
          );
        })}
        {ch.asc !== null && ch.mc !== null && (
          <Text style={{ fontFamily: F.sans, color: dim, fontSize: 11, marginTop: 10 }}>Ascendant {glyph(signOf(ch.asc))} {fmtLon(ch.asc).text} · Midheaven {glyph(signOf(ch.mc))} {SIGN_NAMES[signOf(ch.mc)]} {fmtLon(ch.mc).text} · whole-sign houses</Text>
        )}
      </Card>

      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        <Kicker style={{ fontSize: 9 }}>Balance of the ten planets</Kicker>
        {Object.entries(ch.elements).map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 9 }}>
            <Text style={{ width: 54, color: C.white, fontFamily: F.sansM, fontSize: 13 }}>{k}</Text>
            <View style={{ flex: 1, height: 8, backgroundColor: C.night3, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ width: `${(v / Math.max(maxEl, 1)) * 100}%`, height: 8, backgroundColor: ELEM_COLOR[k] }} />
            </View>
            <Text style={{ width: 22, textAlign: 'right', color: dim, fontFamily: F.sans, fontSize: 12 }}>{v}</Text>
          </View>
        ))}
        <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12, marginTop: 10 }}>Dominant element {P.dominantElement} · dominant mode {P.dominantMode}</Text>
      </Card>

      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        <Kicker style={{ fontSize: 9 }}>Main aspects</Kicker>
        {ch.aspects.slice(0, 10).map((a, i) => (
          <View key={i} style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ASPECT_COLOR[a.kind], marginRight: 10 }} />
            <Text style={{ flex: 1, color: C.white, fontFamily: F.sans, fontSize: 13 }}>{a.a} {a.type.toLowerCase()} {a.b}</Text>
            <Text style={{ color: dim, fontFamily: F.sans, fontSize: 12 }}>{a.orb.toFixed(1)}°</Text>
          </View>
        ))}
        {ch.aspects.length === 0 && <Text style={{ color: dim, fontFamily: F.sans, fontSize: 12, marginTop: 8 }}>No close aspects.</Text>}
      </Card>

      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        <Kicker style={{ fontSize: 9 }}>Chinese</Kicker>
        <Line2 k="Birth year" v={`${P.polarity} ${P.element} ${P.animal}`} sub={`${ANIMAL_KEYS[P.animal]} · ${P.yearPillar}`} />
        <Line2 k="Birth day" v={P.dayPillar} />
        <Line2 k="Mansion of birth" v={`${P.xiuEn} (${P.xiuPy})`} sub={`${P.xiuLuck} · one of the 28 lunar mansions`} />
      </Card>
      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        <Kicker style={{ fontSize: 9 }}>Vedic</Kicker>
        <Line2 k="Moon star (janma nakshatra)" v={P.nakshatra} sub={`Pada ${P.pada} · sidereal Moon in ${P.siderealMoon}`} />
        <Line2 k="Birth tithi" v={P.tithi} />
      </Card>
      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        <Kicker style={{ fontSize: 9 }}>Number</Kicker>
        <Line2 k="Life path" v={String(P.path)} sub={PATH_KEYS[P.path]} />
      </Card>

      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        <Kicker style={{ fontSize: 9 }}>Next birthdays</Kicker>
        {nb.pk !== null && <Line2 k="Ptah Kamgou birthday" v={`${pkStr(toPK(nb.pk))}`} sub={`${gfmt(nb.pk, true)} · ${nb.pk === nav.today ? 'today!' : `in ${nb.pk - nav.today} days`}`} />}
        {nb.greg !== null && <Line2 k="Gregorian birthday" v={gfmt(nb.greg, true)} sub={nb.greg === nav.today ? 'today!' : `in ${nb.greg - nav.today} days`} />}
        <Pressable onPress={addBirthdays} style={{ marginTop: 14, backgroundColor: C.night3, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 12, letterSpacing: 1 }}>ADD BOTH TO MY EVENTS (YEARLY)</Text>
        </Pressable>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <Pressable onPress={() => Share.share({ message: shareText(profile.name, P) })} style={{ flex: 1, backgroundColor: C.gold, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.sansB, color: C.night, fontSize: 13 }}>SHARE</Text>
        </Pressable>
        <Pressable onPress={onEdit} style={{ flex: 1, backgroundColor: C.night3, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 13 }}>EDIT</Text>
        </Pressable>
        <Pressable onPress={del} style={{ flex: 1, backgroundColor: C.night3, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.sansB, color: '#E0705A', fontSize: 13 }}>DELETE</Text>
        </Pressable>
      </View>
      <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.45)', fontSize: 10.5, marginTop: 14, lineHeight: 15 }}>
        Planet positions are computed on your phone (tropical zodiac, whole-sign houses, mean node). Keywords are traditional descriptions for reflection, not predictions.
      </Text>
    </View>
  );
}

export function MyChart({ nav }: { nav: Nav }) {
  const [editing, setEditing] = useState(false);
  const { profile, ready, save } = nav.profile;
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {!ready ? null : profile && !editing ? (
        <PassportView profile={profile} nav={nav} onEdit={() => setEditing(true)} />
      ) : (
        <BirthForm initial={profile} onSave={p => { save(p); setEditing(false); }} onCancel={profile ? () => setEditing(false) : undefined} />
      )}
    </ScrollView>
  );
}
