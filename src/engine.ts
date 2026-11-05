/**
 * Ptah Kamgou Calendar engine (Aquarian Era).
 *  Era year    = Gregorian year in which the year begins + 511
 *  New Year    = 20 March;  13 months x 28 days
 *  Leap Day    = 18 March, only when the year contains 29 February
 *  Renewal Day = 19 March, every year
 * Dates are handled as integer day numbers (days since 1970-01-01, UTC) to avoid timezone bugs.
 */
import { UMM_AL_QURA } from './islamicTable';

export const ERA_OFFSET = 511;
export const MONTHS = ['March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December', 'January', 'February', 'Vernuary'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const GMONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------------------------------------------------------------- gregorian helpers
export const dn = (y: number, m: number, d: number) => Math.round(Date.UTC(y, m - 1, d) / 864e5);
export function ymd(n: number) {
  const t = new Date(n * 864e5);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), wd: t.getUTCDay() };
}
export function todayDn() {
  const t = new Date();
  return dn(t.getFullYear(), t.getMonth() + 1, t.getDate());
}
export const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export function gfmt(n: number, weekday = false, year = true) {
  const g = ymd(n);
  const s = `${g.d} ${GMONTHS[g.m - 1]}${year ? ' ' + g.y : ''}`;
  return weekday ? `${WEEKDAYS[g.wd].slice(0, 3)} ${s}` : s;
}
export const isoToDn = (s: string) => { const [y, m, d] = s.split('-').map(Number); return dn(y, m, d); };
export const dnToIso = (n: number) => { const g = ymd(n); return `${g.y}-${String(g.m).padStart(2, '0')}-${String(g.d).padStart(2, '0')}`; };

// ---------------------------------------------------------------- calendar model
export type PKDate =
  | { year: number; month: number; day: number; kind: 'day' }
  | { year: number; kind: 'leap' | 'renewal' };

export const yearStart = (ey: number) => dn(ey - ERA_OFFSET, 3, 20);
export const yearEnd = (ey: number) => dn(ey - ERA_OFFSET + 1, 3, 19);
export const yearHasLeap = (ey: number) => isLeap(ey - ERA_OFFSET + 1);
export const yearLength = (ey: number) => yearEnd(ey) - yearStart(ey) + 1;
export const monthStart = (ey: number, month: number) => yearStart(ey) + (month - 1) * 28;

export function eraYearOf(n: number) {
  const g = ymd(n);
  return n >= dn(g.y, 3, 20) ? g.y + ERA_OFFSET : g.y - 1 + ERA_OFFSET;
}

export function toPK(n: number): PKDate {
  const year = eraYearOf(n);
  const i = n - yearStart(year);
  if (i < 364) return { year, month: Math.floor(i / 28) + 1, day: (i % 28) + 1, kind: 'day' };
  if (n === yearEnd(year)) return { year, kind: 'renewal' };
  return { year, kind: 'leap' };
}

export function fromPK(year: number, month: number, day: number) {
  return monthStart(year, month) + day - 1;
}

export function pkStr(p: PKDate) {
  if (p.kind !== 'day') return `${p.kind === 'leap' ? 'Leap Day' : 'Renewal Day'} ${p.year}`;
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}`;
}
export function pkShort(p: PKDate) {
  if (p.kind !== 'day') return p.kind === 'leap' ? `LD·${p.year}` : `RD·${p.year}`;
  return `${p.day}·${String(p.month).padStart(2, '0')}·${p.year}`;
}

// ---------------------------------------------------------------- holidays
export type Country = 'IT' | 'CM' | 'IT+CM';
export type Holiday = { who: Country; name: string; est?: boolean };

function easter(y: number) { // Anonymous Gregorian algorithm
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return dn(y, month, day);
}

function hijriToDn(hy: number, hm: number, hd: number) { // tabular (arithmetic) Islamic calendar
  const jd = Math.floor((11 * hy + 3) / 30) + 354 * hy + 30 * hm - Math.floor((hm - 1) / 2) + hd + 1948440 - 385;
  return jd - 2440588; // JD -> unix day number (JD 2440587.5 = 1970-01-01)
}

const FIXED: [number, number, Country, string][] = [
  [1, 1, 'IT+CM', "New Year's Day"], [1, 6, 'IT', 'Epiphany'], [2, 11, 'CM', 'Youth Day'],
  [4, 25, 'IT', 'Liberation Day'], [5, 1, 'IT+CM', 'Labour Day'], [5, 20, 'CM', 'National Day'],
  [6, 2, 'IT', 'Republic Day'], [8, 15, 'IT+CM', 'Assumption'], [10, 4, 'IT', 'St Francis of Assisi'],
  [11, 1, 'IT', "All Saints' Day"], [12, 8, 'IT', 'Immaculate Conception'], [12, 25, 'IT+CM', 'Christmas Day'],
  [12, 26, 'IT', "St Stephen's Day"],
];

const holCache = new Map<number, Map<number, Holiday[]>>();
export function holidaysFor(ey: number): Map<number, Holiday[]> {
  const hit = holCache.get(ey);
  if (hit) return hit;
  const g0 = ey - ERA_OFFSET, first = yearStart(ey), last = yearEnd(ey);
  const out = new Map<number, Holiday[]>();
  const add = (n: number, h: Holiday) => {
    if (n < first || n > last) return;
    const a = out.get(n) ?? [];
    a.push(h);
    out.set(n, a);
  };
  for (const y of [g0, g0 + 1]) {
    for (const [m, d, who, name] of FIXED) {
      if (name === 'St Francis of Assisi' && y < 2026) continue;
      add(dn(y, m, d), { who, name });
    }
    const e = easter(y);
    add(e - 2, { who: 'CM', name: 'Good Friday' });
    add(e, { who: 'IT', name: 'Easter Sunday' });
    add(e + 1, { who: 'IT', name: 'Easter Monday' });
    add(e + 39, { who: 'CM', name: 'Ascension Day' });
  }
  const hy0 = Math.floor((g0 - 622) * 1.0307) ;
  for (let hy = hy0 - 2; hy <= hy0 + 3; hy++) {
    const t = UMM_AL_QURA[hy];
    const fitr = t ? isoToDn(t[0]) : hijriToDn(hy, 10, 1);
    const adha = t ? isoToDn(t[1]) : hijriToDn(hy, 12, 10);
    add(fitr, { who: 'CM', name: 'Eid al-Fitr', est: true });
    add(adha, { who: 'CM', name: 'Eid al-Adha', est: true });
  }
  out.forEach(v => v.sort((a, b) => Number(a.who !== 'IT+CM') - Number(b.who !== 'IT+CM')));
  holCache.set(ey, out);
  return out;
}

// ---------------------------------------------------------------- moon phases (Meeus, ch. 49)
export type Phase = 'new' | 'first' | 'full' | 'last';
export const PHASE_NAME: Record<Phase, string> = { new: 'New moon', first: 'First quarter', full: 'Full moon', last: 'Last quarter' };
const rad = (x: number) => (x * Math.PI) / 180;

function phaseJDE(k: number) {
  const T = k / 1236.85, q = Math.round((k - Math.floor(k)) * 4) % 4;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = rad(2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3);
  const Mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4);
  const F = rad(160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4);
  const O = rad(124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3);
  const s = Math.sin;
  if (q === 0 || q === 2) {
    const nw = q === 0;
    jde += (nw ? -0.4072 : -0.40614) * s(Mp) + (nw ? 0.17241 : 0.17302) * E * s(M) + (nw ? 0.01608 : 0.01614) * s(2 * Mp)
      + (nw ? 0.01039 : 0.01043) * s(2 * F) + (nw ? 0.00739 : 0.00734) * E * s(Mp - M) - (nw ? 0.00514 : 0.00515) * E * s(Mp + M)
      + (nw ? 0.00208 : 0.00209) * E * E * s(2 * M) - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F)
      + 0.00056 * E * s(2 * Mp + M) - 0.00042 * s(3 * Mp) + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F)
      - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O) - 0.00007 * s(Mp + 2 * M) + 0.00004 * s(2 * Mp - 2 * F)
      + 0.00004 * s(3 * M) + 0.00003 * s(Mp + M - 2 * F) + 0.00003 * s(2 * Mp + 2 * F) - 0.00003 * s(Mp + M + 2 * F)
      + 0.00003 * s(Mp - M + 2 * F) - 0.00002 * s(Mp - M - 2 * F) - 0.00002 * s(3 * Mp + M) + 0.00002 * s(4 * Mp);
  } else {
    jde += -0.62801 * s(Mp) + 0.17172 * E * s(M) - 0.01183 * E * s(Mp + M) + 0.00862 * s(2 * Mp) + 0.00804 * s(2 * F)
      + 0.00454 * E * s(Mp - M) + 0.00204 * E * E * s(2 * M) - 0.0018 * s(Mp - 2 * F) - 0.0007 * s(Mp + 2 * F)
      - 0.0004 * s(3 * Mp) - 0.00034 * E * s(2 * Mp - M) + 0.00032 * E * s(M + 2 * F) + 0.00032 * E * s(M - 2 * F)
      - 0.00028 * E * E * s(Mp + 2 * M) + 0.00027 * E * s(2 * Mp + M) - 0.00017 * s(O) - 0.00005 * s(Mp - M - 2 * F)
      + 0.00004 * s(2 * Mp + 2 * F) - 0.00004 * s(Mp + M + 2 * F) + 0.00004 * s(Mp - 2 * M) + 0.00003 * s(Mp + M - 2 * F)
      + 0.00003 * s(3 * M) + 0.00002 * s(2 * Mp - 2 * F) + 0.00002 * s(Mp - M + 2 * F) - 0.00002 * s(3 * Mp + M);
    const cos = Math.cos;
    const Wc = 0.00306 - 0.00038 * E * cos(M) + 0.00026 * cos(Mp) - 0.00002 * cos(Mp - M) + 0.00002 * cos(Mp + M) + 0.00002 * cos(2 * F);
    jde += q === 1 ? Wc : -Wc;
  }
  return jde;
}

const moonCache = new Map<number, Map<number, Phase>>();
/** Moon phases (dated in Central European Time) for an era year. */
export function moonsFor(ey: number): Map<number, Phase> {
  const hit = moonCache.get(ey);
  if (hit) return hit;
  const first = yearStart(ey), last = yearEnd(ey), out = new Map<number, Phase>();
  const jdFirst = first + 2440587.5;
  let k = Math.floor((jdFirst - 2451550.09766) / 29.530588861) - 1;
  const names: Phase[] = ['new', 'first', 'full', 'last'];
  for (; ; k++) {
    let done = false;
    for (let q = 0; q < 4; q++) {
      const jde = phaseJDE(k + q / 4);
      const n = Math.floor(jde - 2440587.5 + 1 / 24); // CET = UTC+1
      if (n > last) { done = true; break; }
      if (n >= first) out.set(n, names[q]);
    }
    if (done) break;
  }
  moonCache.set(ey, out);
  return out;
}

export function nextPhaseAfter(n: number): { n: number; phase: Phase } {
  for (let ey = eraYearOf(n); ; ey++) {
    const m = moonsFor(ey);
    const ks = [...m.keys()].filter(x => x > n).sort((a, b) => a - b);
    if (ks.length) return { n: ks[0], phase: m.get(ks[0])! };
  }
}
