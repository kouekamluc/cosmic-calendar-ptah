/** Cosmic Passport: everything about one birth, from the chart + the Chinese, Vedic and number layers. */
import { birthInstant, computeChart, elementOf, lifePath, modeOf, signOf, SIGN_NAMES, Chart, Birth } from './chart';
import { toPK, pkStr, ymd, gfmt, WEEKDAYS } from './engine';
import { nextOccurrence, PEvent } from './events';
import { chineseDay, vedicFrom } from './sky';

export const SIGN_KEYS = [
  'initiative · courage · a pioneer', 'patience · loyalty · a builder of comfort', 'curiosity · wit · a messenger',
  'care · memory · a protector', 'pride · warmth · a natural centre', 'craft · service · an analyst',
  'balance · grace · a peacemaker', 'depth · intensity · a transformer', 'freedom · quest · a seeker',
  'discipline · ambition · a climber', 'vision · independence · a reformer', 'empathy · imagination · a dreamer',
];
export const ANIMAL_KEYS: Record<string, string> = {
  Rat: 'resourceful · quick-minded', Ox: 'steady · patient · hard-working', Tiger: 'bold · magnetic · brave',
  Rabbit: 'gentle · diplomatic · refined', Dragon: 'charismatic · ambitious · lucky', Snake: 'wise · private · intuitive',
  Horse: 'free · energetic · restless', Goat: 'creative · kind · peaceful', Monkey: 'clever · playful · inventive',
  Rooster: 'precise · proud · observant', Dog: 'loyal · honest · protective', Pig: 'generous · warm · sincere',
};
export const PATH_KEYS: Record<number, string> = {
  1: 'the leader · independence', 2: 'the peacemaker · partnership', 3: 'the expresser · creativity', 4: 'the builder · order',
  5: 'the explorer · change', 6: 'the nurturer · responsibility', 7: 'the seeker · inner knowledge', 8: 'the achiever · power with purpose',
  9: 'the humanitarian · completion', 11: 'master number · the intuitive', 22: 'master number · the master builder', 33: 'master number · the master teacher',
};

export type Passport = {
  chart: Chart;
  pkBirth: string; greg: string; weekday: string; when: string;
  sun: number; moon: number; rising: number | null;
  animal: string; element: string; polarity: string; yearPillar: string; dayPillar: string;
  xiuEn: string; xiuPy: string; xiuLuck: string;
  nakshatra: string; pada: number; tithi: string; siderealMoon: string;
  path: number;
  dominantElement: string; dominantMode: string;
};

export function buildPassport(b: Birth): Passport {
  const chart = computeChart(b);
  const sunL = chart.points[0].lon, moonL = chart.points[1].lon;
  const cn = chineseDay(b.date), vd = vedicFrom(sunL, moonL, b.date);
  const g = ymd(b.date);
  const top = (o: Record<string, number>) => Object.entries(o).sort((x, y) => y[1] - x[1])[0][0];
  return {
    chart, pkBirth: pkStr(toPK(b.date)), greg: gfmt(b.date), weekday: WEEKDAYS[g.wd],
    when: b.hour === null ? 'time unknown' : `${String(b.hour).padStart(2, '0')}:${String(b.minute).padStart(2, '0')}`,
    sun: signOf(sunL), moon: signOf(moonL), rising: chart.asc === null ? null : signOf(chart.asc),
    animal: cn.animal, element: cn.element, polarity: cn.polarity, yearPillar: cn.yearPillar, dayPillar: cn.dayPillar,
    xiuEn: cn.xiuEn, xiuPy: cn.xiuPy, xiuLuck: cn.xiuLuck,
    nakshatra: vd.nakshatra, pada: vd.pada, tithi: `${vd.paksha} ${vd.tithiName}`, siderealMoon: vd.siderealMoon,
    path: lifePath(b.date),
    dominantElement: top(chart.elements), dominantMode: top(chart.modes),
  };
}

export function nextBirthdays(date: number, today: number) {
  const mk = (repeat: 'pk' | 'greg'): PEvent => ({ id: 'b', title: '', date, repeat, color: '', });
  return { pk: nextOccurrence(mk('pk'), today), greg: nextOccurrence(mk('greg'), today) };
}

export function shareText(name: string, p: Passport) {
  const s = (i: number) => SIGN_NAMES[i];
  return [
    `✦ Cosmic Passport — ${name || 'Ptah Kamgou'}`,
    `Born ${p.weekday} ${p.greg} · ${p.pkBirth} (Ptah Kamgou)`,
    `Sun ${s(p.sun)} · Moon ${s(p.moon)}${p.rising !== null ? ` · Rising ${s(p.rising)}` : ''}`,
    `Chinese: ${p.polarity} ${p.element} ${p.animal}`,
    `Vedic Moon star: ${p.nakshatra} (pada ${p.pada})`,
    `Life path: ${p.path}`,
    `Mansion of birth: ${p.xiuEn}`,
    '',
    'Made with the Ptah Kamgou calendar · KKEVO Labs',
  ].join('\n');
}
export { birthInstant, elementOf, modeOf };
