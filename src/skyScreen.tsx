import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { eraYearOf, gfmt, pkShort, pkStr, toPK, ERA_OFFSET } from './engine';
import { Card, Kicker, NavArrows, Starfield } from './components';
import { LayerKey, Layers } from './layers';
import { chineseDay, glyph, seasonsOf, SIGNS, skyDay, sunSpans, upcomingSkyEvents, vedicDay } from './sky';
import type { Nav } from './screens';
import { ACCENTS, C, F } from './theme';
import { MyChart } from './chartScreen';

const dim = 'rgba(255,255,255,0.62)';

function Row({ k, v, sub }: { k: string; v: string; sub?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 }}>
      <Text style={{ fontFamily: F.sansB, color: C.goldLt, fontSize: 10, letterSpacing: 1.4, width: 84, marginTop: 3, textTransform: 'uppercase' }}>{k}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 15 }}>{v}</Text>
        {sub ? <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12, marginTop: 1 }}>{sub}</Text> : null}
      </View>
    </View>
  );
}

export function WesternLines({ n, dark = true }: { n: number; dark?: boolean }) {
  const d = skyDay(n);
  const ink = dark ? C.white : C.ink, sub = dark ? dim : C.muted;
  return (
    <View>
      <Text style={{ fontFamily: F.sansM, color: ink, fontSize: 14, marginTop: 8 }}>
        {'☉ '}{glyph(d.sunSign)} {SIGNS[d.sunSign].name} {d.sunDeg}°{'     ☽ '}{glyph(d.moonSign)} {SIGNS[d.moonSign].name} {d.moonDeg}°
        <Text style={{ fontFamily: F.sans, color: sub }}>  {Math.round(d.lit * 100)}% lit</Text>
      </Text>
      {d.retro.length > 0 && (
        <Text style={{ fontFamily: F.sans, color: sub, fontSize: 12, marginTop: 3 }}>℞ retrograde: {d.retro.join(', ')}</Text>
      )}
    </View>
  );
}

export function ChineseLine({ n, dark = true }: { n: number; dark?: boolean }) {
  const c = chineseDay(n);
  return (
    <Text style={{ fontFamily: F.sans, color: dark ? dim : C.muted, fontSize: 12, marginTop: 4 }}>
      {c.element} {c.animal} year · {c.xiuEn} mansion ({c.xiuLuck.toLowerCase()}) · {c.officer} day
    </Text>
  );
}

export function SkyBrief({ n, layers, dark = true }: { n: number; layers: Layers; dark?: boolean }) {
  if (!layers.western && !layers.chinese) return null;
  return (
    <View>
      {layers.western && <WesternLines n={n} dark={dark} />}
      {layers.chinese && <ChineseLine n={n} dark={dark} />}
    </View>
  );
}

/** Which zodiac sign the Sun is in, across the 28 days of a month. */
export function ZodiacStrip({ start, width }: { start: number; width: number }) {
  const spans = useMemo(() => sunSpans(start, 28), [start]);
  const u = width / 28;
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ fontFamily: F.sansB, color: C.muted, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', marginBottom: 6 }}>Sun in the zodiac</Text>
      <View style={{ flexDirection: 'row', width, height: 34, borderRadius: 8, overflow: 'hidden' }}>
        {spans.map(s => (
          <View key={s.from} style={{ width: s.days * u, backgroundColor: ACCENTS[s.sign], justifyContent: 'center', alignItems: 'center', borderRightWidth: 1, borderRightColor: C.paper }}>
            <Text numberOfLines={1} style={{ fontFamily: F.sansB, color: '#fff', fontSize: s.days >= 5 ? 11 : 15 }}>
              {glyph(s.sign)}{s.days >= 7 ? ' ' + SIGNS[s.sign].name : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const LAYER_LABEL: Record<LayerKey, string> = { western: 'Western', chinese: 'Chinese', vedic: 'Vedic' };

function SkyDaily({ nav }: { nav: Nav }) {
  const { width } = useWindowDimensions();
  const n = nav.selected, p = toPK(n), ey = eraYearOf(n);
  const L = nav.layers.layers;
  const d = skyDay(n), cn = chineseDay(n), vd = vedicDay(n);
  const events = useMemo(() => upcomingSkyEvents(n, 14), [n]);
  const eq = useMemo(() => seasonsOf(ey - ERA_OFFSET)[0], [ey]);
  const open = (x: number) => { const q = toPK(x); nav.setView({ ey: q.year, month: q.kind === 'day' ? q.month : 13 }); nav.setSelected(x); nav.go('month'); };
  const eqDay = Math.floor((eq.d.getTime() + 36e5) / 864e5);
  const eqTime = new Date(eq.d.getTime() + 36e5);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.night }} contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Starfield w={width} h={700} n={110} seed={ey + 5} />
        <Kicker>Sky · real astronomy</Kicker>
        <View style={{ marginTop: 10 }}>
          <NavArrows label={pkStr(p)} sub={`${gfmt(n, true)} · ${pkShort(p)}${n === nav.today ? ' · today' : ''}`}
            onPrev={() => nav.setSelected(n - 1)} onNext={() => nav.setSelected(n + 1)} color={C.white} subColor={dim} />
        </View>
        {n !== nav.today && (
          <Pressable onPress={() => nav.setSelected(nav.today)} style={{ alignSelf: 'center', marginTop: 8 }}>
            <Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 12 }}>Back to today</Text>
          </Pressable>
        )}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {(Object.keys(LAYER_LABEL) as LayerKey[]).map(k => (
            <Pressable key={k} onPress={() => nav.layers.toggle(k)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: L[k] ? C.gold : C.night3 }}>
              <Text style={{ fontFamily: F.sansB, fontSize: 12, color: L[k] ? C.night : dim }}>{LAYER_LABEL[k]}</Text>
            </Pressable>
          ))}
        </View>

        {L.western && (
          <Card style={{ backgroundColor: C.night2, marginTop: 16 }}>
            <Kicker style={{ fontSize: 9 }}>Western · tropical zodiac</Kicker>
            <Row k="Sun" v={`${glyph(d.sunSign)} ${SIGNS[d.sunSign].name} ${d.sunDeg}°`} sub={`${SIGNS[d.sunSign].element} · ${SIGNS[d.sunSign].mode}`} />
            <Row k="Moon" v={`${glyph(d.moonSign)} ${SIGNS[d.moonSign].name} ${d.moonDeg}°`} sub={`${Math.round(d.lit * 100)}% illuminated · ${SIGNS[d.moonSign].element}`} />
            <Row k="Retrograde" v={d.retro.length ? d.retro.map(x => `${x} ℞`).join('  ·  ') : 'None right now'} sub="Mercury, Venus, Mars, Jupiter, Saturn" />
          </Card>
        )}
        {L.chinese && (
          <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
            <Kicker style={{ fontSize: 9 }}>Chinese · almanac</Kicker>
            <Row k="Year" v={`${cn.polarity} ${cn.element} ${cn.animal}`} sub={`${cn.yearPillar} · lunar month ${cn.lunarMonth}${cn.leap ? ' (leap)' : ''}, day ${cn.lunarDay}`} />
            <Row k="Day" v={`${cn.dayPillar} · ${cn.officer} day`} sub={`Day officer ${cn.officerPy}`} />
            <Row k="Mansion" v={`${cn.xiuEn} (${cn.xiuPy})`} sub={`${cn.xiuLuck} · one of the 28 lunar mansions`} />
          </Card>
        )}
        {L.vedic && (
          <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
            <Kicker style={{ fontSize: 9 }}>Vedic · sidereal (Lahiri)</Kicker>
            <Row k="Tithi" v={`${vd.paksha} ${vd.tithiName}`} sub={`Lunar day ${vd.tithi} of the ${vd.paksha === 'Shukla' ? 'waxing' : 'waning'} half`} />
            <Row k="Nakshatra" v={vd.nakshatra} sub={`Pada ${vd.pada} · sidereal Moon in ${vd.siderealMoon}`} />
          </Card>
        )}

        <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
          <Kicker style={{ fontSize: 9 }}>New Year and the equinox</Kicker>
          <Text style={{ fontFamily: F.sans, color: C.white, fontSize: 13, marginTop: 8, lineHeight: 19 }}>
            Year {ey} begins on 20 March. The real spring equinox (Sun at 0° Aries) falls on{' '}
            <Text style={{ fontFamily: F.sansB, color: C.goldLt }}>{gfmt(eqDay)} at {String(eqTime.getUTCHours()).padStart(2, '0')}:{String(eqTime.getUTCMinutes()).padStart(2, '0')}</Text> (UTC+1).
          </Text>
        </Card>

        <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
          <Kicker style={{ fontSize: 9 }}>Coming in the sky</Kicker>
          {events.filter(e => L.western || e.kind === 'chinese').map((e, i) => (
            <Pressable key={i} onPress={() => open(e.n)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 11 }}>
              <Text style={{ width: 26, textAlign: 'center', color: C.gold, fontSize: 16, fontFamily: F.sansB }}>{e.icon}</Text>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 13 }}>{e.title}</Text>
                <Text style={{ fontFamily: F.sans, color: dim, fontSize: 11 }}>{gfmt(e.n, true)}{e.detail ? ` · ${e.detail}` : ''}</Text>
              </View>
              <Text style={{ fontFamily: F.sans, color: C.goldLt, fontSize: 12 }}>{pkShort(toPK(e.n))}</Text>
            </Pressable>
          ))}
        </Card>
        <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.45)', fontSize: 10.5, marginTop: 14, lineHeight: 15 }}>
          Positions are computed on your phone for 12:00 UTC of each day. Zodiac, almanac and lunar-day meanings are traditions for reflection, not predictions.
        </Text>
      </View>
    </ScrollView>
  );
}

export function SkyScreen({ nav }: { nav: Nav }) {
  const [mode, setMode] = useState<'sky' | 'me'>('sky');
  return (
    <View style={{ flex: 1, backgroundColor: C.night }}>
      <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 12, backgroundColor: C.night2, borderRadius: 18, padding: 3 }}>
        {([['sky', "Today's sky"], ['me', 'My chart']] as const).map(([k, label]) => (
          <Pressable key={k} onPress={() => setMode(k)} style={{ flex: 1, paddingVertical: 8, borderRadius: 15, alignItems: 'center', backgroundColor: mode === k ? C.gold : 'transparent' }}>
            <Text style={{ fontFamily: F.sansB, fontSize: 12, color: mode === k ? C.night : dim }}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {mode === 'sky' ? <SkyDaily nav={nav} /> : <MyChart nav={nav} />}
    </View>
  );
}
