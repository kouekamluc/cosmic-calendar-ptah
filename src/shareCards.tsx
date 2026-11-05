import React, { useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Ankh, NdopBand, Starfield } from './components';
import { ChartWheel } from './chartWheel';
import { gfmt, MONTHS, pkShort, pkStr, toPK, WEEKDAYS, ymd } from './engine';
import { ANIMAL_KEYS, buildPassport, SIGN_KEYS, shareText } from './passport';
import { Compat } from './insights';
import { chineseDay, glyph, SIGNS, skyDay } from './sky';
import { SIGN_NAMES } from './chart';
import type { Profile } from './profile';
import { ACCENTS, C, F } from './theme';

const W = 340, H = 440; // card size in layout units; captured at device pixel ratio (about 1080 px wide)

function Frame({ children, seed }: { children: React.ReactNode; seed: number }) {
  return (
    <View style={{ width: W, height: H, backgroundColor: C.night, overflow: 'hidden', borderRadius: 18 }}>
      <Starfield w={W} h={H} n={70} seed={seed} />
      {children}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <NdopBand w={W} h={22} />
        <View style={{ backgroundColor: C.night2, paddingVertical: 5, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.sansB, color: C.goldLt, fontSize: 8.5, letterSpacing: 2 }}>PTAH KAMGOU CALENDAR · KKEVO LABS</Text>
        </View>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ date card
export function DateCard({ n }: { n: number }) {
  const p = toPK(n), g = ymd(n), d = skyDay(n), c = chineseDay(n);
  const acc = p.kind === 'day' ? ACCENTS[p.month - 1] : C.gold;
  return (
    <Frame seed={n}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 10, letterSpacing: 2.4 }}>AQUARIAN ERA</Text>
        {p.kind === 'day' ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 10 }}>
            <Text style={{ fontFamily: F.displayBlk, color: C.gold, fontSize: 96, lineHeight: 100 }}>{p.day}</Text>
            <View style={{ marginLeft: 12, marginBottom: 14 }}>
              <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 22, letterSpacing: 1 }}>{MONTHS[p.month - 1].toUpperCase()}</Text>
              <Text style={{ fontFamily: F.sansL, color: C.goldLt, fontSize: 20 }}>{p.year}</Text>
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
            <Ankh size={64} color={C.gold} />
            <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 26, marginLeft: 10 }}>{pkStr(p)}</Text>
          </View>
        )}
        <View style={{ height: 3, backgroundColor: acc, marginTop: 6, width: 80, borderRadius: 2 }} />
        <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 15, marginTop: 14 }}>{WEEKDAYS[g.wd]} · {gfmt(n)}</Text>
        <Text style={{ fontFamily: F.sans, color: C.goldLt, fontSize: 12, marginTop: 2 }}>{pkShort(p)}</Text>
        <View style={{ marginTop: 22 }}>
          <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 14 }}>
            {'☉ '}{glyph(d.sunSign)} {SIGNS[d.sunSign].name} {d.sunDeg}°   {'☽ '}{glyph(d.moonSign)} {SIGNS[d.moonSign].name}
          </Text>
          <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 5 }}>
            Moon {Math.round(d.lit * 100)}% lit · {c.element} {c.animal} year
          </Text>
          {d.retro.length > 0 && <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 3 }}>℞ {d.retro.join(', ')}</Text>}
        </View>
      </View>
    </Frame>
  );
}

// ------------------------------------------------------------------ passport card
export function PassportCard({ profile }: { profile: Profile }) {
  const P = buildPassport(profile.birth);
  return (
    <Frame seed={profile.birth.date}>
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 10, letterSpacing: 2.4 }}>COSMIC PASSPORT</Text>
        <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 20, marginTop: 6 }} numberOfLines={1}>{profile.name || 'Ptah Kamgou'}</Text>
        <Text style={{ fontFamily: F.sansM, color: C.goldLt, fontSize: 12, marginTop: 2 }}>{P.pkBirth}</Text>
        <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.6)', fontSize: 10.5 }}>{P.weekday} {P.greg}</Text>
        <View style={{ marginTop: 8 }}><ChartWheel chart={P.chart} size={214} /></View>
        <View style={{ flexDirection: 'row', marginTop: 8, gap: 18 }}>
          {([['Sun', P.sun], ['Moon', P.moon], ['Rising', P.rising]] as [string, number | null][]).map(([k, i]) => (
            <View key={k} style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: F.sansB, color: C.goldLt, fontSize: 8.5, letterSpacing: 1.4 }}>{k.toUpperCase()}</Text>
              <Text style={{ fontFamily: F.sansM, color: C.gold, fontSize: 20 }}>{i === null ? '–' : glyph(i)}</Text>
              <Text style={{ fontFamily: F.sansM, color: C.white, fontSize: 11 }}>{i === null ? 'n/a' : SIGN_NAMES[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.7)', fontSize: 10.5, marginTop: 8 }}>
          {P.polarity} {P.element} {P.animal} · {P.nakshatra} · path {P.path}
        </Text>
      </View>
    </Frame>
  );
}

// ------------------------------------------------------------------ compatibility card
export function CompatCard({ a, b, result }: { a: string; b: string; result: Compat }) {
  const tone = { good: '#6FBF8E', mixed: '#D9A441', tense: '#E0705A' } as const;
  return (
    <Frame seed={result.points * 7 + a.length}>
      <View style={{ padding: 24 }}>
        <Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 10, letterSpacing: 2.4 }}>COMPATIBILITY</Text>
        <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 20, marginTop: 8 }} numberOfLines={2}>{a} & {b}</Text>
        <Text style={{ fontFamily: F.displayB, color: C.gold, fontSize: 19, marginTop: 14 }}>{result.verdict}</Text>
        {result.lines.slice(0, 5).map((l, i) => (
          <View key={i} style={{ flexDirection: 'row', marginTop: 11 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: 9, backgroundColor: tone[l.tone] }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 11.5 }}>{l.label}</Text>
              <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.65)', fontSize: 10.5, marginTop: 1 }} numberOfLines={2}>{l.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </Frame>
  );
}

// ------------------------------------------------------------------ share dialog
export function ShareModal({ visible, onClose, children, text }: { visible: boolean; onClose: () => void; children: React.ReactNode; text?: string }) {
  const ref = useRef<any>(null);
  const [busy, setBusy] = useState(false);
  const shareImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share' });
      else Alert.alert('Sharing unavailable', 'This device cannot share images.');
    } catch {
      Alert.alert('Could not create the image', 'Please try again.');
    } finally { setBusy(false); }
  };
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(5,6,20,0.94)' }}>
        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingTop: 48, paddingBottom: 30 }}>
          <View ref={ref} collapsable={false}>{children}</View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, paddingHorizontal: 20 }}>
            <Pressable onPress={shareImage} style={{ backgroundColor: C.gold, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 22, opacity: busy ? 0.6 : 1 }}>
              <Text style={{ fontFamily: F.sansB, color: C.night, fontSize: 13, letterSpacing: 1 }}>{busy ? 'PREPARING…' : 'SHARE IMAGE'}</Text>
            </Pressable>
            {text ? (
              <Pressable onPress={() => Share.share({ message: text })} style={{ backgroundColor: C.night3, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18 }}>
                <Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 13 }}>TEXT</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={onClose} style={{ backgroundColor: C.night3, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18 }}>
              <Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 13 }}>CLOSE</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
export { shareText };
