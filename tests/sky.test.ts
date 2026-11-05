import test from 'node:test';
import assert from 'node:assert/strict';
import { dn } from '../src/engine';
import { skyDay, chineseDay, chineseNewYear, vedicDay, skyEventsFor, SIGNS } from '../src/sky';
import { computeChart, angles, fmtLon, lifePath } from '../src/chart';
import { compatibility } from '../src/insights';

const iso = (n: number) => new Date(n * 864e5).toISOString().slice(0, 10);

test('Sun and Moon on 5 Nov 2026', () => {
  const d = skyDay(dn(2026, 11, 5));
  assert.equal(SIGNS[d.sunSign].name, 'Scorpio');
  assert.equal(SIGNS[d.moonSign].name, 'Virgo');
  assert.ok(d.lit > 0 && d.lit < 0.3);
  assert.deepEqual([...d.retro].sort(), ['Mercury', 'Saturn', 'Venus']);
});

test('Chinese: 2026 is Fire Horse; CNY 2027 is 6 Feb; 28 mansions are distinct', () => {
  const c = chineseDay(dn(2026, 11, 5));
  assert.equal(`${c.element} ${c.animal}`, 'Fire Horse');
  assert.equal(iso(chineseNewYear(2027)), '2027-02-06');
  const seen = new Set<string>();
  for (let i = 0; i < 28; i++) seen.add(chineseDay(dn(2026, 11, 5) + i).xiuEn);
  assert.equal(seen.size, 28);
});

test('Vedic tithi stays in range', () => {
  for (let i = 0; i < 60; i++) { const v = vedicDay(dn(2026, 11, 1) + i); assert.ok(v.tithi >= 1 && v.tithi <= 15 && v.nakshatra); }
});

test('sky events 2537: eclipses, Mercury retrograde, solstice', () => {
  const ev = skyEventsFor(2537).map(e => `${iso(e.n)} ${e.title}`);
  assert.ok(ev.some(s => s.startsWith('2026-08-12') && s.includes('Solar eclipse')));
  assert.ok(ev.some(s => s.startsWith('2026-10-25') && s.includes('Mercury turns retrograde')));
  assert.ok(ev.some(s => s.startsWith('2026-12-21') && s.includes('December solstice')));
  assert.ok(ev.some(s => s.startsWith('2026-10-23') && s.includes('Sun enters Scorpio')));
});

test('chart for J2000 matches published positions', () => {
  const c = computeChart({ date: dn(2000, 1, 1), hour: 12, minute: 0, lat: 51.48, lon: 0, utcOffset: 0, dst: false });
  const at = (k: string) => c.points.find(p => p.key === k)!.lon;
  assert.ok(Math.abs(at('sun') - 280.37) < 0.05);
  assert.ok(Math.abs(at('moon') - 223.32) < 0.2);
  assert.ok(Math.abs(at('mercury') - 271.89) < 0.1);
  assert.ok(c.points.find(p => p.key === 'saturn')!.retro);
  assert.equal(fmtLon(at('sun')).sign, 9); // Capricorn
});

test('Ascendant and Midheaven are valid longitudes', () => {
  const { asc, mc } = angles(new Date('1995-06-15T08:30:00Z'), 4.05, 9.77);
  assert.ok(asc >= 0 && asc < 360 && mc >= 0 && mc < 360);
});

test('life path numbers', () => {
  assert.equal(lifePath(dn(1998, 7, 13)), 2);
  assert.equal(lifePath(dn(2000, 1, 1)), 4);
});

test('compatibility returns a verdict and lines', () => {
  const mk = (y: number, m: number, d: number) => computeChart({ date: dn(y, m, d), hour: null, minute: 0, lat: 0, lon: 0, utcOffset: 1, dst: false });
  const r = compatibility(mk(1995, 6, 15), mk(1992, 3, 2), dn(1995, 6, 15), dn(1992, 3, 2));
  assert.ok(r.verdict.length > 0 && r.lines.length >= 3);
});

import { skyAlertItems } from '../src/skyAlerts';
test('sky alert items follow the preferences', () => {
  const from = dn(2026, 11, 5);
  assert.equal(skyAlertItems(from, { moons: false, retro: false, eclipses: false }).length, 0);
  const moons = skyAlertItems(from, { moons: true, retro: false, eclipses: false }, 60);
  assert.ok(moons.length >= 3 && moons.every(m => /moon/i.test(m.title)));
  assert.equal(moons[0].n, dn(2026, 11, 9)); // next new moon
  const retro = skyAlertItems(from, { moons: false, retro: true, eclipses: false }, 120);
  assert.ok(retro.some(r => r.title.includes('Mercury turns direct')) && retro.every(r => r.title.includes('Mercury')));
  const ecl = skyAlertItems(from, { moons: false, retro: false, eclipses: true }, 120);
  assert.ok(ecl.some(r => r.n === dn(2027, 2, 6) && r.title.includes('Solar eclipse')));
});
