/**
 * Insights: daily reading, personal transits, compatibility.
 * All text is rule-based (traditional keywords), assembled on the phone. For reflection, not prediction.
 */
import { Chart, elementOf, signOf, SIGN_NAMES, fmtLon } from './chart';
import { ANIMAL_LIST, chineseDay, planetLons, skyDay } from './sky';

const norm = (x: number) => ((x % 360) + 360) % 360;
const sep = (a: number, b: number) => { const d = Math.abs(norm(a) - norm(b)) % 360; return d > 180 ? 360 - d : d; };

// ------------------------------------------------------------------ transits to natal chart
const THEME: Record<string, string> = {
  sun: 'vitality and focus', moon: 'mood and sensitivity', mercury: 'communication and thinking', venus: 'affection and values',
  mars: 'drive and friction', jupiter: 'growth and opportunity', saturn: 'discipline and limits', uranus: 'change and surprise',
  neptune: 'imagination and doubt', pluto: 'depth and transformation',
};
const NAME: Record<string, string> = {
  sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn',
  uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto',
};
const NATAL_TARGETS: [string, string, string][] = [
  ['sun', 'Sun', 'your sense of self'], ['moon', 'Moon', 'your feelings'], ['venus', 'Venus', 'your relationships'],
  ['mars', 'Mars', 'your energy'], ['asc', 'Ascendant', 'how you show up'], ['mc', 'Midheaven', 'your direction'],
];
const ORB: Record<string, number> = { sun: 2, moon: 3, mercury: 2, venus: 2, mars: 2, jupiter: 2, saturn: 2, uranus: 1.5, neptune: 1.5, pluto: 1.5 };
const ASP: [number, string, 'soft' | 'hard' | 'conj', string][] = [
  [0, 'conjunct', 'conj', 'is strongly emphasised'], [60, 'sextile', 'soft', 'offers an easy opening'], [90, 'square', 'hard', 'brings friction that asks for effort'],
  [120, 'trine', 'soft', 'flows easily'], [180, 'opposite', 'hard', 'pulls in two directions'],
];

export type Transit = { text: string; kind: 'soft' | 'hard' | 'conj'; orb: number; headline: string };

export function transitsToNatal(n: number, chart: Chart): Transit[] {
  const tr = planetLons(n);
  const natal: Record<string, number> = Object.fromEntries(chart.points.map(p => [p.key, p.lon]));
  if (chart.asc !== null && chart.mc !== null) { natal.asc = chart.asc; natal.mc = chart.mc; }
  const out: (Transit & { r: number })[] = [];
  for (const k of Object.keys(tr)) for (const [nk, nname, nmeaning] of NATAL_TARGETS) {
    if (natal[nk] === undefined) continue;
    if (k === nk) continue;
    const d = sep(tr[k], natal[nk]);
    for (const [ang, word, kind, flow] of ASP) {
      const lim = ORB[k] * (ang === 60 ? 0.75 : 1), o = Math.abs(d - ang);
      if (o <= lim) {
        out.push({
          kind, orb: o, r: o / lim,
          headline: `${NAME[k]} ${word} your ${nname}`,
          text: `A time of ${THEME[k]}; the contact ${flow} around ${nmeaning}.`,
        });
        break;
      }
    }
  }
  // slow planets weigh more than the Moon; show tightest first
  return out.sort((a, b) => a.r - b.r).slice(0, 6);
}

// ------------------------------------------------------------------ daily reading
const OFFICER: Record<string, string> = {
  Establish: 'good for starting and setting things in motion', Remove: 'good for clearing, cleaning and health matters',
  Full: 'abundant: gatherings and generosity are favoured', Balance: 'steady: negotiate and keep things even',
  Stable: 'good for commitments and lasting decisions', Initiate: 'act decisively on what you already planned',
  Destroy: 'avoid big new beginnings; fine for ending what no longer works', Danger: 'take care; slow down and double-check',
  Success: 'favourable for finishing and achieving', Receive: 'good for collecting what is owed and harvesting results',
  Open: 'new openings and fresh starts are favoured', Close: 'a day to rest, conclude and keep things quiet',
};
const ELEM_MOOD: Record<string, string> = {
  Fire: 'energetic and quick to act', Earth: 'practical and suited to steady work', Air: 'sociable, talkative and full of ideas',
  Water: 'feeling-led, intuitive and home-oriented',
};
const RETRO_NOTE: Record<string, string> = {
  Mercury: 'Mercury is retrograde: double-check messages, plans and travel details.',
  Venus: 'Venus is retrograde: revisit old relationships and values rather than starting new ones.',
  Mars: 'Mars is retrograde: energy runs inward; avoid forcing conflicts.',
  Jupiter: 'Jupiter is retrograde: review growth plans before expanding.',
  Saturn: 'Saturn is retrograde: review commitments and responsibilities.',
};

export type ReadingLine = { title: string; text: string };
export function dailyReading(n: number): ReadingLine[] {
  const d = skyDay(n), cn = chineseDay(n);
  const waxing = norm(d.moonLon - d.sunLon) < 180;
  const phase = d.lit < 0.04 ? 'A new-moon day: a good moment to begin and set intentions.'
    : d.lit > 0.96 ? 'A full-moon day: things come to a peak; a time to celebrate, complete or release.'
      : waxing ? (d.lit < 0.5 ? 'The Moon is waxing: build slowly and keep adding.' : 'The Moon is growing toward full: push projects toward completion.')
        : (d.lit > 0.5 ? 'The Moon is just past full: share, give back and let go.' : 'The Moon is waning: review, rest and clear space.');
  const el = elementOf(d.moonSign);
  const out: ReadingLine[] = [
    { title: 'Moon', text: `The Moon is in ${SIGN_NAMES[d.moonSign]} (${el}): the mood of the day is ${ELEM_MOOD[el]}. ${phase}` },
    { title: 'Almanac', text: `${cn.officer} day, ${cn.xiuEn} mansion (${cn.xiuLuck.toLowerCase()}): ${OFFICER[cn.officer] ?? ''}.` },
  ];
  for (const r of d.retro) if (RETRO_NOTE[r]) out.push({ title: 'Retrograde', text: RETRO_NOTE[r] });
  return out;
}

// ------------------------------------------------------------------ compatibility
const TRINES = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]];
const SECRET = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const SYN_KEYS: [string, string][] = [['sun', 'Sun'], ['moon', 'Moon'], ['venus', 'Venus'], ['mars', 'Mars']];
const SYN_ASP: [number, string, 'soft' | 'hard' | 'conj', number][] = [
  [0, 'conjunct', 'conj', 6], [60, 'sextile', 'soft', 4], [90, 'square', 'hard', 5], [120, 'trine', 'soft', 6], [180, 'opposite', 'hard', 6],
];
const SYN_TEXT = { soft: 'supports each other', hard: 'creates spark and friction', conj: 'blends strongly' };

export type CompatLine = { label: string; text: string; tone: 'good' | 'mixed' | 'tense' };
export type Compat = { verdict: string; points: number; lines: CompatLine[] };

function elementPair(a: string, b: string): { text: string; tone: CompatLine['tone']; pts: number } {
  if (a === b) return { text: `both ${a}: you share a wavelength`, tone: 'good', pts: 2 };
  const key = [a, b].sort().join('+');
  if (key === 'Air+Fire' || key === 'Earth+Water') return { text: `${a} and ${b} support each other`, tone: 'good', pts: 2 };
  if (key === 'Fire+Water') return { text: 'Fire and Water contrast: steam or storm, depending on care', tone: 'tense', pts: -1 };
  return { text: `${a} and ${b} see things differently and need translation`, tone: 'mixed', pts: 0 };
}

export function compatibility(me: Chart, other: Chart, myBirthDn: number, otherBirthDn: number): Compat {
  const lines: CompatLine[] = [];
  let pts = 0;
  const sunA = signOf(me.points[0].lon), sunB = signOf(other.points[0].lon);
  const moonA = signOf(me.points[1].lon), moonB = signOf(other.points[1].lon);
  const s = elementPair(elementOf(sunA), elementOf(sunB));
  lines.push({ label: `Sun: ${SIGN_NAMES[sunA]} & ${SIGN_NAMES[sunB]}`, text: s.text, tone: s.tone }); pts += s.pts;
  const m = elementPair(elementOf(moonA), elementOf(moonB));
  lines.push({ label: `Moon: ${SIGN_NAMES[moonA]} & ${SIGN_NAMES[moonB]}`, text: `emotionally, ${m.text}`, tone: m.tone }); pts += m.pts;

  const ia = ANIMAL_LIST.indexOf(chineseDay(myBirthDn).animal), ib = ANIMAL_LIST.indexOf(chineseDay(otherBirthDn).animal);
  if (ia >= 0 && ib >= 0) {
    const label = `Chinese: ${ANIMAL_LIST[ia]} & ${ANIMAL_LIST[ib]}`;
    if (ia === ib) { lines.push({ label, text: 'same animal: you understand each other, and share the same blind spots', tone: 'good' }); pts += 1; }
    else if (TRINES.some(t => t.includes(ia) && t.includes(ib))) { lines.push({ label, text: 'a trine: a classic, supportive match', tone: 'good' }); pts += 2; }
    else if (SECRET.some(t => t.includes(ia) && t.includes(ib))) { lines.push({ label, text: 'secret friends: a quiet, natural bond', tone: 'good' }); pts += 2; }
    else if ((ia - ib + 12) % 12 === 6) { lines.push({ label, text: 'opposite animals: they clash, but also complete each other', tone: 'tense' }); pts -= 1; }
    else lines.push({ label, text: 'neutral: the match depends on the people more than the signs', tone: 'mixed' });
  }

  const found: { line: CompatLine; r: number; pts: number }[] = [];
  for (const [ka, na] of SYN_KEYS) for (const [kb, nb] of SYN_KEYS) {
    const pa = me.points.find(p => p.key === ka)!.lon, pb = other.points.find(p => p.key === kb)!.lon;
    const d = sep(pa, pb);
    for (const [ang, word, kind, orb] of SYN_ASP) {
      const o = Math.abs(d - ang);
      if (o <= orb) {
        found.push({
          r: o / orb, pts: kind === 'hard' ? 0 : 1,
          line: { label: `Your ${na} ${word} their ${nb}`, text: SYN_TEXT[kind], tone: kind === 'hard' ? 'tense' : 'good' },
        });
        break;
      }
    }
  }
  found.sort((a, b) => a.r - b.r);
  for (const f of found.slice(0, 5)) { lines.push(f.line); pts += f.pts; }

  const verdict = pts >= 6 ? 'Strong natural harmony' : pts >= 3 ? 'Good harmony with some contrast' : pts >= 1 ? 'Mixed: needs understanding' : 'Challenging, but rich in lessons';
  return { verdict, points: pts, lines };
}

export { fmtLon };
