import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Card, Kicker } from './components';
import { computeChart } from './chart';
import { Chip, Input } from './chartScreen';
import { dn, gfmt, pkShort, pkStr, toPK, ymd } from './engine';
import { compatibility, dailyReading, transitsToNatal } from './insights';
import { JournalKind } from './journal';
import { nextMoonOf, prevMoonOf } from './sky';
import type { Nav } from './screens';
import { C, F } from './theme';

const dim = 'rgba(255,255,255,0.62)';
const TONE = { good: '#6FBF8E', mixed: '#D9A441', tense: '#E0705A' } as const;
const KIND_LABEL: Record<JournalKind, string> = { intention: 'Intention', review: 'Review', note: 'Note' };

function Head({ children }: { children: string }) {
  return <Text style={{ fontFamily: F.displayB, color: C.white, fontSize: 20, marginTop: 26, marginBottom: 2 }}>{children}</Text>;
}

// ------------------------------------------------------------------ your day
function YourDay({ nav }: { nav: Nav }) {
  const n = nav.today;
  const read = useMemo(() => dailyReading(n), [n]);
  const p = nav.profile.profile;
  const chart = useMemo(() => (p ? computeChart(p.birth) : null), [p]);
  const tr = useMemo(() => (chart ? transitsToNatal(n, chart) : []), [chart, n]);
  return (
    <View>
      <Head>Your day</Head>
      <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12 }}>{pkStr(toPK(n))} · {gfmt(n, true)}</Text>
      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        {read.map((r, i) => (
          <View key={i} style={{ marginTop: i ? 12 : 0 }}>
            <Kicker style={{ fontSize: 9 }}>{r.title}</Kicker>
            <Text style={{ fontFamily: F.sans, color: C.white, fontSize: 14, lineHeight: 20, marginTop: 4 }}>{r.text}</Text>
          </View>
        ))}
      </Card>
      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        <Kicker style={{ fontSize: 9 }}>Today and your chart</Kicker>
        {!chart && <Text style={{ fontFamily: F.sans, color: dim, fontSize: 13, marginTop: 8 }}>Create your passport in “My chart” to see how today’s sky touches your own birth chart.</Text>}
        {chart && tr.length === 0 && <Text style={{ fontFamily: F.sans, color: dim, fontSize: 13, marginTop: 8 }}>No close contacts to your chart today: a quiet day astrologically.</Text>}
        {tr.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', marginTop: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 10, backgroundColor: t.kind === 'hard' ? TONE.tense : t.kind === 'soft' ? TONE.good : TONE.mixed }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 14 }}>{t.headline}</Text>
              <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12.5, marginTop: 2, lineHeight: 18 }}>{t.text}</Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

// ------------------------------------------------------------------ moon journal
function MoonJournal({ nav }: { nav: Nav }) {
  const t = nav.today;
  const lastNew = prevMoonOf(t, 'new'), lastFull = prevMoonOf(t, 'full'), nextNew = nextMoonOf(t, 'new'), nextFull = nextMoonOf(t, 'full');
  const sinceNew = t - lastNew, sinceFull = t - lastFull;
  const suggest: JournalKind = sinceNew <= 3 ? 'intention' : sinceFull <= 3 ? 'review' : 'note';
  const [kind, setKind] = useState<JournalKind>(suggest);
  const [text, setText] = useState('');
  const J = nav.journal;
  const prompt = suggest === 'intention' ? 'The Moon is new: what do you want to begin or grow this cycle?'
    : suggest === 'review' ? 'The Moon is full: what has come to light, and what are you ready to release?'
      : sinceNew < sinceFull ? 'The Moon is waxing: note how your intention is growing.' : 'The Moon is waning: note what you are letting go.';
  const save = () => { if (!text.trim()) return; J.add({ date: t, kind, text: text.trim() }); setText(''); };
  return (
    <View>
      <Head>Moon journal</Head>
      <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12 }}>
        Next new moon {gfmt(nextNew, true)} (in {nextNew - t}d) · next full moon {gfmt(nextFull, true)} (in {nextFull - t}d)
      </Text>
      <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
        <Text style={{ fontFamily: F.sansM, color: C.goldLt, fontSize: 13, lineHeight: 19 }}>{prompt}</Text>
        <View style={{ flexDirection: 'row' }}>
          {(Object.keys(KIND_LABEL) as JournalKind[]).map(k => <Chip key={k} on={kind === k} label={KIND_LABEL[k]} f={() => setKind(k)} />)}
        </View>
        <TextInput value={text} onChangeText={setText} multiline placeholder="Write here…" placeholderTextColor="rgba(255,255,255,0.3)"
          style={{ marginTop: 12, minHeight: 80, backgroundColor: C.night3, borderRadius: 8, padding: 12, fontFamily: F.sans, fontSize: 15, color: C.white, textAlignVertical: 'top' }} />
        <Pressable onPress={save} style={{ marginTop: 12, backgroundColor: text.trim() ? C.gold : C.night3, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}>
          <Text style={{ fontFamily: F.sansB, color: text.trim() ? C.night : dim, fontSize: 13, letterSpacing: 1 }}>SAVE ENTRY</Text>
        </Pressable>
      </Card>
      {J.entries.map(e => (
        <Card key={e.id} style={{ backgroundColor: C.night2, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: F.sansB, color: C.gold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' }}>{KIND_LABEL[e.kind]} · {pkShort(toPK(e.date))}</Text>
            <Pressable hitSlop={10} onPress={() => Alert.alert('Delete entry?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => J.remove(e.id) }])}>
              <Text style={{ color: dim, fontSize: 15 }}>✕</Text>
            </Pressable>
          </View>
          <Text style={{ fontFamily: F.sans, color: dim, fontSize: 11, marginTop: 2 }}>{gfmt(e.date, true)}</Text>
          <Text style={{ fontFamily: F.sans, color: C.white, fontSize: 14, lineHeight: 20, marginTop: 6 }}>{e.text}</Text>
        </Card>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ compatibility
function AddPerson({ nav, onDone }: { nav: Nav; onDone: () => void }) {
  const [name, setName] = useState(''), [d, setD] = useState(''), [m, setM] = useState(''), [y, setY] = useState('');
  const [known, setKnown] = useState(false), [hh, setHh] = useState(''), [mm, setMm] = useState(''), [tz, setTz] = useState('1');
  const submit = () => {
    const D = +d, M = +m, Y = +y, n = dn(Y, M, D);
    if (!name.trim()) return Alert.alert('Name', 'Please enter a name.');
    if (!(Y >= 1800 && Y <= 2100 && M >= 1 && M <= 12 && D >= 1 && ymd(n).d === D && ymd(n).m === M)) return Alert.alert('Birth date', 'Please enter a valid day, month and year.');
    let hour: number | null = null, minute = 0;
    if (known) { hour = +hh; minute = +mm || 0; if (hh === '' || !(hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)) return Alert.alert('Birth time', 'Enter hour 0–23 and minute 0–59.'); }
    nav.people.add({ name: name.trim(), birth: { date: n, hour, minute, lat: 0, lon: 0, utcOffset: parseFloat(tz) || 0, dst: false } });
    onDone();
  };
  return (
    <Card style={{ backgroundColor: C.night2, marginTop: 10 }}>
      <Kicker style={{ fontSize: 9 }}>Add a person</Kicker>
      <Input label="Name" value={name} onChange={setName} numeric={false} />
      <View style={{ flexDirection: 'row' }}>
        <Input label="Day" value={d} onChange={setD} w={64} /><Input label="Month" value={m} onChange={setM} w={72} /><Input label="Year" value={y} onChange={setY} w={92} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Chip on={known} label="I know the time" f={() => setKnown(true)} /><Chip on={!known} label="Time unknown" f={() => setKnown(false)} />
      </View>
      {known && (
        <View style={{ flexDirection: 'row' }}>
          <Input label="Hour" value={hh} onChange={setHh} w={72} /><Input label="Minute" value={mm} onChange={setMm} w={72} /><Input label="UTC offset" value={tz} onChange={setTz} w={84} />
        </View>
      )}
      <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
        <Pressable onPress={submit} style={{ flex: 1, backgroundColor: C.gold, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}><Text style={{ fontFamily: F.sansB, color: C.night, fontSize: 13 }}>SAVE</Text></Pressable>
        <Pressable onPress={onDone} style={{ flex: 1, backgroundColor: C.night3, borderRadius: 10, paddingVertical: 11, alignItems: 'center' }}><Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 13 }}>CANCEL</Text></Pressable>
      </View>
    </Card>
  );
}

function Compatibility({ nav }: { nav: Nav }) {
  const me = nav.profile.profile;
  const { people, remove } = nav.people;
  const [adding, setAdding] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const person = people.find(p => p.id === sel) ?? null;
  const result = useMemo(() => {
    if (!me || !person) return null;
    return compatibility(computeChart(me.birth), computeChart(person.birth), me.birth.date, person.birth.date);
  }, [me, person]);
  return (
    <View>
      <Head>Compatibility</Head>
      {!me ? <Text style={{ fontFamily: F.sans, color: dim, fontSize: 13, marginTop: 6 }}>Create your passport in “My chart” first, then compare yourself with someone.</Text> : (
        <>
          <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12 }}>Compare yourself with family, friends or a partner. A conversation starter, not a verdict.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {people.map(p => <Chip key={p.id} on={sel === p.id} label={p.name} f={() => setSel(sel === p.id ? null : p.id)} />)}
            <Chip on={false} label="+ Add person" f={() => setAdding(true)} />
          </View>
          {adding && <AddPerson nav={nav} onDone={() => setAdding(false)} />}
          {person && result && (
            <Card style={{ backgroundColor: C.night2, marginTop: 12 }}>
              <Kicker style={{ fontSize: 9 }}>{me.name || 'You'} & {person.name}</Kicker>
              <Text style={{ fontFamily: F.displayB, color: C.gold, fontSize: 20, marginTop: 6 }}>{result.verdict}</Text>
              {result.lines.map((l, i) => (
                <View key={i} style={{ flexDirection: 'row', marginTop: 11 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 6, marginRight: 10, backgroundColor: TONE[l.tone] }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.sansB, color: C.white, fontSize: 13 }}>{l.label}</Text>
                    <Text style={{ fontFamily: F.sans, color: dim, fontSize: 12.5, marginTop: 1, lineHeight: 18 }}>{l.text}</Text>
                  </View>
                </View>
              ))}
              {person.birth.hour === null && <Text style={{ fontFamily: F.sans, color: dim, fontSize: 11, marginTop: 12 }}>{person.name}'s birth time is unknown, so their Moon is approximate.</Text>}
              <Pressable onPress={() => Alert.alert(`Remove ${person.name}?`, undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => { remove(person.id); setSel(null); } }])} style={{ marginTop: 14 }}>
                <Text style={{ fontFamily: F.sansB, color: '#E0705A', fontSize: 12 }}>Remove {person.name}</Text>
              </Pressable>
            </Card>
          )}
        </>
      )}
    </View>
  );
}

export function Insights({ nav }: { nav: Nav }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Kicker>Insights</Kicker>
      <YourDay nav={nav} />
      <MoonJournal nav={nav} />
      <Compatibility nav={nav} />
      <Text style={{ fontFamily: F.sans, color: 'rgba(255,255,255,0.45)', fontSize: 10.5, marginTop: 24, lineHeight: 15 }}>
        Readings are assembled from traditional meanings (Western, Chinese almanac) for reflection, not prediction. Everything stays on your phone.
      </Text>
    </ScrollView>
  );
}
