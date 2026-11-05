/**
 * Sky layer: real astronomy (astronomy-engine, offline) + Chinese almanac (lunar-javascript)
 * + Vedic lunar day / star. All days are integer day numbers like engine.ts, evaluated at 12:00 UTC.
 * Times shown to the user use UTC+1 (Cameroon / Italy winter), same as the moon phases.
 */
import * as A from 'astronomy-engine';
import { Lunar, Solar } from 'lunar-javascript';
import { dn, eraYearOf, ERA_OFFSET, moonsFor, yearEnd, yearStart, ymd } from './engine';

const norm = (x: number) => ((x % 360) + 360) % 360;
const noon = (n: number) => new Date(n * 864e5 + 12 * 36e5);
const dayOfMs = (ms: number) => Math.floor((ms + 36e5) / 864e5); // UTC+1 calendar day

// ------------------------------------------------------------------ western zodiac
export const SIGNS = [
  { name: 'Aries', glyph: '♈', element: 'Fire', mode: 'Cardinal' },
  { name: 'Taurus', glyph: '♉', element: 'Earth', mode: 'Fixed' },
  { name: 'Gemini', glyph: '♊', element: 'Air', mode: 'Mutable' },
  { name: 'Cancer', glyph: '♋', element: 'Water', mode: 'Cardinal' },
  { name: 'Leo', glyph: '♌', element: 'Fire', mode: 'Fixed' },
  { name: 'Virgo', glyph: '♍', element: 'Earth', mode: 'Mutable' },
  { name: 'Libra', glyph: '♎', element: 'Air', mode: 'Cardinal' },
  { name: 'Scorpio', glyph: '♏', element: 'Water', mode: 'Fixed' },
  { name: 'Sagittarius', glyph: '♐', element: 'Fire', mode: 'Mutable' },
  { name: 'Capricorn', glyph: '♑', element: 'Earth', mode: 'Cardinal' },
  { name: 'Aquarius', glyph: '♒', element: 'Air', mode: 'Fixed' },
  { name: 'Pisces', glyph: '♓', element: 'Water', mode: 'Mutable' },
];
/** Text-style glyph (avoids colour emoji on Android). */
export const glyph = (i: number) => SIGNS[i].glyph + '︎';

const PLANETS: [string, A.Body][] = [
  ['Mercury', A.Body.Mercury], ['Venus', A.Body.Venus], ['Mars', A.Body.Mars],
  ['Jupiter', A.Body.Jupiter], ['Saturn', A.Body.Saturn],
];

const sunLon = (n: number) => A.SunPosition(noon(n)).elon;
const moonLon = (n: number) => A.EclipticGeoMoon(noon(n)).lon;
const planetLon = (b: A.Body, n: number) => A.Ecliptic(A.GeoVector(b, noon(n), true)).elon;

export type SkyDay = {
  sunLon: number; sunSign: number; sunDeg: number;
  moonLon: number; moonSign: number; moonDeg: number; lit: number;
  retro: string[];
};

const dayCache = new Map<number, SkyDay>();
export function skyDay(n: number): SkyDay {
  const hit = dayCache.get(n);
  if (hit) return hit;
  const s = sunLon(n), m = moonLon(n);
  const lit = A.Illumination(A.Body.Moon, noon(n)).phase_fraction;
  const out: SkyDay = {
    sunLon: s, sunSign: Math.floor(s / 30), sunDeg: Math.floor(s % 30),
    moonLon: m, moonSign: Math.floor(m / 30), moonDeg: Math.floor(m % 30), lit,
    retro: retroYear(eraYearOf(n)).days.get(n) ?? [],
  };
  dayCache.set(n, out);
  return out;
}

// ------------------------------------------------------------------ retrogrades (per era year, cached)
type Station = { n: number; body: string; dir: 'Rx' | 'D' };
type RetroYear = { days: Map<number, string[]>; stations: Station[] };
const retroCache = new Map<number, RetroYear>();
function retroYear(ey: number): RetroYear {
  const hit = retroCache.get(ey);
  if (hit) return hit;
  const first = yearStart(ey), last = yearEnd(ey);
  const days = new Map<number, string[]>(), stations: Station[] = [];
  for (const [name, body] of PLANETS) {
    let prev = planetLon(body, first - 1), prevRx: boolean | null = null;
    for (let n = first; n <= last; n++) {
      const cur = planetLon(body, n);
      let d = cur - prev;
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      const rx = d < 0;
      if (rx) days.set(n, [...(days.get(n) ?? []), name]);
      if (prevRx !== null && rx !== prevRx) stations.push({ n, body: name, dir: rx ? 'Rx' : 'D' });
      prevRx = rx; prev = cur;
    }
  }
  const out = { days, stations };
  retroCache.set(ey, out);
  return out;
}

// ------------------------------------------------------------------ Chinese almanac
const STEMS = '甲乙丙丁戊己庚辛壬癸', BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const STEM_PY = ['Jia', 'Yi', 'Bing', 'Ding', 'Wu', 'Ji', 'Geng', 'Xin', 'Ren', 'Gui'];
const BRANCH_PY = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
const ANIMALS = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
const ELEMENTS = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'];
const XIU: [string, string, string][] = [
  ['角', 'Horn', 'Jiao'], ['亢', 'Neck', 'Kang'], ['氐', 'Root', 'Di'], ['房', 'Room', 'Fang'], ['心', 'Heart', 'Xin'],
  ['尾', 'Tail', 'Wei'], ['箕', 'Winnowing Basket', 'Ji'], ['斗', 'Dipper', 'Dou'], ['牛', 'Ox', 'Niu'], ['女', 'Girl', 'Nü'],
  ['虚', 'Emptiness', 'Xu'], ['危', 'Rooftop', 'Wei'], ['室', 'Encampment', 'Shi'], ['壁', 'Wall', 'Bi'], ['奎', 'Legs', 'Kui'],
  ['娄', 'Bond', 'Lou'], ['胃', 'Stomach', 'Wei'], ['昴', 'Pleiades', 'Mao'], ['毕', 'Net', 'Bi'], ['觜', 'Turtle Beak', 'Zi'],
  ['参', "Orion's Belt", 'Shen'], ['井', 'Well', 'Jing'], ['鬼', 'Ghost', 'Gui'], ['柳', 'Willow', 'Liu'], ['星', 'Star', 'Xing'],
  ['张', 'Extended Net', 'Zhang'], ['翼', 'Wings', 'Yi'], ['轸', 'Chariot', 'Zhen'],
];
const ALIAS: Record<string, string> = { 虛: '虚', 婁: '娄', 畢: '毕', 參: '参', 張: '张', 軫: '轸', 昂: '昴', 滿: '满', 執: '执', 開: '开', 閉: '闭' };
const alias = (c: string) => ALIAS[c] ?? c;
const OFFICERS: Record<string, [string, string]> = {
  建: ['Establish', 'Jian'], 除: ['Remove', 'Chu'], 满: ['Full', 'Man'], 平: ['Balance', 'Ping'], 定: ['Stable', 'Ding'],
  执: ['Initiate', 'Zhi'], 破: ['Destroy', 'Po'], 危: ['Danger', 'Wei'], 成: ['Success', 'Cheng'], 收: ['Receive', 'Shou'],
  开: ['Open', 'Kai'], 闭: ['Close', 'Bi'],
};

export type ChineseDay = {
  lunarMonth: number; lunarDay: number; leap: boolean;
  animal: string; element: string; polarity: 'Yang' | 'Yin'; yearPillar: string;
  dayPillar: string; officer: string; officerPy: string;
  xiu: string; xiuEn: string; xiuPy: string; xiuLuck: string;
};

const cnCache = new Map<number, ChineseDay>();
export function chineseDay(n: number): ChineseDay {
  const hit = cnCache.get(n);
  if (hit) return hit;
  const g = ymd(n);
  const l = Solar.fromYmd(g.y, g.m, g.d).getLunar();
  const yp: string = l.getYearInGanZhi(), dp: string = l.getDayInGanZhi();
  const si = STEMS.indexOf(yp[0]), bi = BRANCHES.indexOf(yp[1]);
  const dsi = STEMS.indexOf(dp[0]), dbi = BRANCHES.indexOf(dp[1]);
  const x = XIU.find(r => r[0] === alias(l.getXiu())) ?? ['', l.getXiu(), ''];
  const off = OFFICERS[alias(l.getZhiXing())] ?? [l.getZhiXing(), ''];
  const lm: number = l.getMonth();
  const out: ChineseDay = {
    lunarMonth: Math.abs(lm), lunarDay: l.getDay(), leap: lm < 0,
    animal: ANIMALS[bi], element: ELEMENTS[si >> 1], polarity: si % 2 === 0 ? 'Yang' : 'Yin',
    yearPillar: `${STEM_PY[si]}-${BRANCH_PY[bi]}`,
    dayPillar: `${STEM_PY[dsi]}-${BRANCH_PY[dbi]}`,
    officer: off[0], officerPy: off[1],
    xiu: x[0], xiuEn: x[1], xiuPy: x[2], xiuLuck: l.getXiuLuck() === '吉' ? 'Auspicious' : 'Inauspicious',
  };
  cnCache.set(n, out);
  return out;
}

/** Chinese New Year (Gregorian day number) of Gregorian year y. */
export function chineseNewYear(y: number) {
  const so = Lunar.fromYmd(y, 1, 1).getSolar();
  return dn(so.getYear(), so.getMonth(), so.getDay());
}

// ------------------------------------------------------------------ Vedic (sidereal, Lahiri)
const NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
  'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];
const TITHIS = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami',
  'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi'];
export const ayanamsa = (n: number) => 23.853 + ((n - dn(2000, 1, 1)) / 365.25) * 0.013969;

export type VedicDay = { tithi: number; tithiName: string; paksha: 'Shukla' | 'Krishna'; nakshatra: string; pada: number; siderealMoon: string };
export function vedicDay(n: number): VedicDay {
  const d = skyDay(n);
  const t = Math.floor(norm(d.moonLon - d.sunLon) / 12); // 0..29
  const paksha = t < 15 ? 'Shukla' : 'Krishna';
  const k = t % 15;
  const tithiName = k === 14 ? (paksha === 'Shukla' ? 'Purnima' : 'Amavasya') : TITHIS[k];
  const sid = norm(d.moonLon - ayanamsa(n));
  const w = 360 / 27;
  const ni = Math.floor(sid / w);
  return {
    tithi: k + 1, tithiName, paksha, nakshatra: NAKSHATRAS[ni], pada: Math.floor((sid % w) / (w / 4)) + 1,
    siderealMoon: SIGNS[Math.floor(sid / 30)].name,
  };
}

// ------------------------------------------------------------------ sky events of an era year
export type SkyEvent = { n: number; kind: 'ingress' | 'station' | 'eclipse' | 'season' | 'chinese' | 'moon'; title: string; detail?: string; icon: string };
const hhmm = (d: Date) => {
  const t = new Date(d.getTime() + 36e5);
  return `${String(t.getUTCHours()).padStart(2, '0')}:${String(t.getUTCMinutes()).padStart(2, '0')}`;
};

export function seasonsOf(gy: number) {
  const s = A.Seasons(gy);
  return [
    { key: 'Spring equinox', d: s.mar_equinox.date }, { key: 'June solstice', d: s.jun_solstice.date },
    { key: 'Autumn equinox', d: s.sep_equinox.date }, { key: 'December solstice', d: s.dec_solstice.date },
  ];
}

const evCache = new Map<number, SkyEvent[]>();
export function skyEventsFor(ey: number): SkyEvent[] {
  const hit = evCache.get(ey);
  if (hit) return hit;
  const first = yearStart(ey), last = yearEnd(ey), g0 = ey - ERA_OFFSET;
  const out: SkyEvent[] = [];
  // Sun ingresses
  let prev = Math.floor(sunLon(first - 1) / 30);
  for (let n = first; n <= last; n++) {
    const s = Math.floor(sunLon(n) / 30);
    if (s !== prev) out.push({ n, kind: 'ingress', title: `Sun enters ${SIGNS[s].name}`, icon: glyph(s) });
    prev = s;
  }
  // stations
  for (const s of retroYear(ey).stations)
    out.push({ n: s.n, kind: 'station', icon: '℞', title: s.dir === 'Rx' ? `${s.body} turns retrograde` : `${s.body} turns direct` });
  // equinoxes & solstices
  for (const y of [g0, g0 + 1]) for (const s of seasonsOf(y)) {
    const n = dayOfMs(s.d.getTime());
    if (n >= first && n <= last) out.push({ n, kind: 'season', icon: '☉FE0E', title: s.key, detail: `${hhmm(s.d)} (UTC+1)` });
  }
  // eclipses
  const t0 = new Date(first * 864e5), t1 = last * 864e5 + 864e5;
  let le = A.SearchLunarEclipse(t0);
  while (le.peak.date.getTime() < t1) {
    const n = dayOfMs(le.peak.date.getTime());
    if (n >= first && n <= last) out.push({ n, kind: 'eclipse', icon: '◐', title: `Lunar eclipse (${le.kind})`, detail: `peak ${hhmm(le.peak.date)}` });
    le = A.NextLunarEclipse(le.peak);
  }
  let se = A.SearchGlobalSolarEclipse(t0);
  while (se.peak.date.getTime() < t1) {
    const n = dayOfMs(se.peak.date.getTime());
    if (n >= first && n <= last) out.push({ n, kind: 'eclipse', icon: '●', title: `Solar eclipse (${se.kind})`, detail: `peak ${hhmm(se.peak.date)}` });
    se = A.NextGlobalSolarEclipse(se.peak);
  }
  // Chinese New Year
  for (const y of [g0, g0 + 1]) {
    const n = chineseNewYear(y);
    if (n >= first && n <= last) {
      const c = chineseDay(n);
      out.push({ n, kind: 'chinese', icon: '福', title: 'Chinese New Year', detail: `${c.element} ${c.animal}` });
    }
  }
  // new & full moons
  moonsFor(ey).forEach((ph, n) => {
    if (ph === 'new' || ph === 'full') {
      const s = Math.floor(moonLon(n) / 30);
      out.push({ n, kind: 'moon', icon: ph === 'new' ? '●' : '○', title: `${ph === 'new' ? 'New' : 'Full'} moon in ${SIGNS[s].name}` });
    }
  });
  out.sort((a, b) => a.n - b.n);
  evCache.set(ey, out);
  return out;
}

export function upcomingSkyEvents(from: number, max = 12): SkyEvent[] {
  const out: SkyEvent[] = [];
  for (let ey = eraYearOf(from); out.length < max && ey <= eraYearOf(from) + 1; ey++)
    for (const e of skyEventsFor(ey)) if (e.n >= from && out.length < max) out.push(e);
  return out;
}

/** Sun-sign spans for a run of days (for the month zodiac strip). */
export function sunSpans(start: number, len: number) {
  const spans: { sign: number; from: number; days: number }[] = [];
  for (let i = 0; i < len; i++) {
    const s = skyDay(start + i).sunSign;
    const last = spans[spans.length - 1];
    if (last && last.sign === s) last.days++;
    else spans.push({ sign: s, from: i, days: 1 });
  }
  return spans;
}
