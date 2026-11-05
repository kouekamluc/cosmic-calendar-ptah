import test from 'node:test';
import assert from 'node:assert/strict';
import { dn, toPK, fromPK, yearStart, yearEnd, yearLength, yearHasLeap, eraYearOf, pkStr, ymd, holidaysFor, moonsFor, monthStart } from '../src/engine';
import { nextOccurrence, occursOn, PEvent } from '../src/events';

const iso = (n: number) => new Date(n * 864e5).toISOString().slice(0, 10);

test('20 March starts the era year (Gregorian + 511)', () => {
  assert.equal(eraYearOf(dn(2026, 3, 20)), 2537);
  assert.equal(eraYearOf(dn(2026, 3, 19)), 2536);
  assert.equal(eraYearOf(dn(2027, 3, 19)), 2537);
  const p = toPK(dn(2026, 3, 20));
  assert.deepEqual(p, { year: 2537, month: 1, day: 1, kind: 'day' });
});

test('today example: 5 Nov 2026 is 7 November 2537', () => {
  assert.equal(pkStr(toPK(dn(2026, 11, 5))), '7 November 2537');
});

test('Renewal Day is 19 March every year', () => {
  for (const y of [2025, 2026, 2027, 2028, 2029]) {
    const p = toPK(dn(y, 3, 19));
    assert.equal(p.kind, 'renewal', String(y));
  }
});

test('Leap Day is 18 March only in years containing 29 February', () => {
  assert.equal(toPK(dn(2028, 3, 18)).kind, 'leap'); // era 2538 contains 29 Feb 2028
  assert.equal(toPK(dn(2027, 3, 18)).kind, 'day');  // 364th day, last of month 13
  assert.equal(yearHasLeap(2538), true);
  assert.equal(yearHasLeap(2537), false);
});

test('year lengths are 365 or 366 and always 13 x 28 plus specials', () => {
  for (let ey = 2500; ey < 2600; ey++) {
    assert.equal(yearLength(ey), yearHasLeap(ey) ? 366 : 365, String(ey));
    assert.equal(yearEnd(ey) + 1, yearStart(ey + 1));
  }
});

test('every day round-trips and months have 28 days', () => {
  const a = dn(2020, 3, 20), b = dn(2040, 3, 19);
  for (let n = a; n <= b; n++) {
    const p = toPK(n);
    if (p.kind === 'day') {
      assert.ok(p.month >= 1 && p.month <= 13 && p.day >= 1 && p.day <= 28);
      assert.equal(fromPK(p.year, p.month, p.day), n, iso(n));
    }
  }
});

test('every month of a year starts on the same weekday', () => {
  for (const ey of [2537, 2538, 2540]) {
    const wd = ymd(monthStart(ey, 1)).wd;
    for (let m = 2; m <= 13; m++) assert.equal(ymd(monthStart(ey, m)).wd, wd, `${ey} month ${m}`);
  }
});

test('holidays: Easter 2026 and Christmas', () => {
  const h = holidaysFor(2537);
  assert.ok(h.get(dn(2026, 4, 5))?.some(x => x.name === 'Easter Sunday'));
  assert.ok(h.get(dn(2026, 12, 25))?.some(x => x.name === 'Christmas Day'));
  assert.ok(h.get(dn(2027, 1, 1))?.some(x => x.name === "New Year's Day"));
});

test('moon phases: 9 Nov 2026 new, 24 Nov 2026 full', () => {
  const m = moonsFor(2537);
  assert.equal(m.get(dn(2026, 11, 9)), 'new');
  assert.equal(m.get(dn(2026, 11, 24)), 'full');
});

test('events repeat by PK date and by Gregorian date', () => {
  const e: PEvent = { id: '1', title: 'x', date: dn(2026, 11, 5), repeat: 'pk', color: '#fff' };
  const p = toPK(nextOccurrence(e, dn(2026, 11, 6))!);
  assert.ok(p.kind === 'day' && p.month === 9 && p.day === 7);
  const g: PEvent = { ...e, repeat: 'greg' };
  assert.equal(nextOccurrence(g, dn(2026, 11, 6)), dn(2027, 11, 5));
  assert.ok(occursOn(g, dn(2030, 11, 5)));
});

test('Leap Day events repeat on the next Leap Day (up to 4 years)', () => {
  const e: PEvent = { id: '1', title: 'x', date: dn(2028, 3, 18), repeat: 'pk', color: '#fff' };
  assert.equal(nextOccurrence(e, dn(2028, 3, 19)), dn(2032, 3, 18));
});
