/**
 * Natal chart engine: planets, Ascendant, Midheaven, whole-sign houses, aspects, element balance.
 * Uses astronomy-engine (offline). Tropical zodiac, geocentric.
 */
import * as A from 'astronomy-engine';
import { dn, ymd } from './engine';

const norm = (x: number) => ((x % 360) + 360) % 360;
const rad = (x: number) => (x * Math.PI) / 180;
const deg = (x: number) => (x * 180) / Math.PI;

export type Birth = {
  date: number;          // Gregorian day number (local birth date)
  hour: number | null;   // local clock hour (0-23), null = unknown time
  minute: number;
  lat: number;
  lon: number;           // east positive
  utcOffset: number;     // standard-time offset in hours
  dst: boolean;          // daylight saving in effect (+1h)
};

export type Point = { key: string; name: string; glyph: string; lon: number; retro: boolean };
export type Aspect = { a: string; b: string; type: string; orb: number; kind: 'soft' | 'hard' | 'conj' };
export type Chart = {
  utc: Date; timeKnown: boolean;
  points: Point[];          // Sun..Pluto + North Node
  asc: number | null; mc: number | null;
  houses: Record<string, number | null>; // point key -> house 1..12 (whole sign), null if no time
  aspects: Aspect[];
  elements: Record<string, number>; modes: Record<string, number>;
};

export const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const ELEM = ['Fire', 'Earth', 'Air', 'Water'];
const MODE = ['Cardinal', 'Fixed', 'Mutable'];
export const signOf = (lon: number) => Math.floor(norm(lon) / 30);
export const elementOf = (sign: number) => ELEM[sign % 4];
export const modeOf = (sign: number) => MODE[sign % 3];

const BODIES: [string, string, string, A.Body][] = [
  ['sun', 'Sun', '☉', A.Body.Sun], ['moon', 'Moon', '☽', A.Body.Moon], ['mercury', 'Mercury', '☿', A.Body.Mercury],
  ['venus', 'Venus', '♀', A.Body.Venus], ['mars', 'Mars', '♂', A.Body.Mars], ['jupiter', 'Jupiter', '♃', A.Body.Jupiter],
  ['saturn', 'Saturn', '♄', A.Body.Saturn], ['uranus', 'Uranus', '♅', A.Body.Uranus], ['neptune', 'Neptune', '♆', A.Body.Neptune],
  ['pluto', 'Pluto', '♇', A.Body.Pluto],
];

function lonOf(body: A.Body, t: Date) {
  if (body === A.Body.Sun) return A.SunPosition(t).elon;
  if (body === A.Body.Moon) return A.EclipticGeoMoon(t).lon;
  return A.Ecliptic(A.GeoVector(body, t, true)).elon;
}

export function birthInstant(b: Birth) {
  const g = ymd(b.date);
  const h = b.hour ?? 12, m = b.hour === null ? 0 : b.minute;
  return new Date(Date.UTC(g.y, g.m - 1, g.d, h, m) - (b.utcOffset + (b.dst ? 1 : 0)) * 36e5);
}

/** Ascendant and Midheaven (ecliptic longitudes) for a UTC instant and place. */
export function angles(t: Date, lat: number, lon: number) {
  const T = (t.getTime() / 864e5 + 2440587.5 - 2451545) / 36525;
  const eps = rad(23.4392911 - 0.0130042 * T);
  const ramc = rad(norm(A.SiderealTime(t) * 15 + lon));
  const mc = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
  const asc = norm(deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(rad(lat)) * Math.sin(eps)))));
  return { asc, mc };
}

const ASPECTS: [number, string, number, 'soft' | 'hard' | 'conj'][] = [
  [0, 'Conjunction', 8, 'conj'], [60, 'Sextile', 5, 'soft'], [90, 'Square', 7, 'hard'], [120, 'Trine', 7, 'soft'], [180, 'Opposition', 8, 'hard'],
];

export function computeChart(b: Birth): Chart {
  const t = birthInstant(b), timeKnown = b.hour !== null;
  const t2 = new Date(t.getTime() + 36e5);
  const points: Point[] = BODIES.map(([key, name, glyph, body]) => {
    const l1 = lonOf(body, t);
    let d = lonOf(body, t2) - l1;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    return { key, name, glyph, lon: norm(l1), retro: key !== 'sun' && key !== 'moon' && d < 0 };
  });
  // mean North Node
  const T = (t.getTime() / 864e5 + 2440587.5 - 2451545) / 36525;
  points.push({ key: 'node', name: 'North Node', glyph: '☊', lon: norm(125.04452 - 1934.136261 * T), retro: false });

  let asc: number | null = null, mc: number | null = null;
  if (timeKnown) ({ asc, mc } = angles(t, b.lat, b.lon));
  const houses: Record<string, number | null> = {};
  for (const p of points) houses[p.key] = asc === null ? null : ((signOf(p.lon) - signOf(asc) + 12) % 12) + 1;

  const aspects: Aspect[] = [];
  const list: { k: string; lon: number }[] = points.filter(p => p.key !== 'node').map(p => ({ k: p.name, lon: p.lon }));
  if (asc !== null && mc !== null) list.push({ k: 'Ascendant', lon: asc }, { k: 'Midheaven', lon: mc });
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    if (list[i].k === 'Ascendant' && list[j].k === 'Midheaven') continue;
    let d = Math.abs(list[i].lon - list[j].lon) % 360;
    if (d > 180) d = 360 - d;
    for (const [ang, type, orb, kind] of ASPECTS) {
      const o = Math.abs(d - ang);
      if (o <= orb) { aspects.push({ a: list[i].k, b: list[j].k, type, orb: o, kind }); break; }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);

  const elements: Record<string, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modes: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of points) {
    if (p.key === 'node') continue;
    const s = signOf(p.lon);
    elements[elementOf(s)]++; modes[modeOf(s)]++;
  }
  return { utc: t, timeKnown, points, asc, mc, houses, aspects, elements, modes };
}

export const fmtLon = (lon: number) => {
  const s = signOf(lon), d = norm(lon) % 30, w = Math.floor(d), m = Math.floor((d - w) * 60);
  return { sign: s, text: `${w}°${String(m).padStart(2, '0')}'` };
};

/** Pythagorean life path from a Gregorian date. */
export function lifePath(n: number) {
  const g = ymd(n);
  const sum = (x: number) => String(x).split('').reduce((a, c) => a + Number(c), 0);
  const reduce = (x: number): number => (x > 9 && x !== 11 && x !== 22 && x !== 33 ? reduce(sum(x)) : x);
  return reduce(reduce(g.m) + reduce(g.d) + reduce(sum(g.y)));
}

export const birthDn = (y: number, m: number, d: number) => dn(y, m, d);
