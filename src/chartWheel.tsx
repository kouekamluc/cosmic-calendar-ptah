import React, { useMemo } from 'react';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { Chart } from './chart';
import { glyph } from './sky';
import { C } from './theme';

export const ELEM_COLOR: Record<string, string> = { Fire: '#E0705A', Earth: '#7FA33A', Air: '#6FB4D9', Water: '#7B7FE0' };
export const ASPECT_COLOR = { soft: '#6FBF8E', hard: '#E0705A', conj: '#D9A441' } as const;
// ------------------------------------------------------------------ wheel
export function ChartWheel({ chart, size }: { chart: Chart; size: number }) {
  const cx = size / 2, cy = size / 2, R1 = size / 2 - 4, R2 = R1 - 36, R3 = R2 - 50;
  const rot = chart.asc ?? 0;
  const ang = (lon: number) => Math.PI + ((lon - rot) * Math.PI) / 180;
  const pt = (lon: number, r: number) => ({ x: cx + r * Math.cos(ang(lon)), y: cy - r * Math.sin(ang(lon)) });
  const pl = chart.points.filter(p => p.key !== 'node');
  // spread glyphs so they don't overlap
  const disp = useMemo(() => {
    const a = pl.map(p => ({ k: p.key, lon: p.lon, d: p.lon })).sort((x, y) => x.lon - y.lon);
    for (let it = 0; it < 40; it++) {
      for (let i = 0; i < a.length; i++) {
        const j = (i + 1) % a.length;
        let gap = a[j].d - a[i].d; if (gap < 0) gap += 360;
        if (gap < 9) { const push = (9 - gap) / 2; a[i].d -= push; a[j].d += push; }
      }
    }
    return Object.fromEntries(a.map(x => [x.k, x.d]));
  }, [chart]);
  const lonOf: Record<string, number> = Object.fromEntries(chart.points.map(p => [p.name, p.lon]));
  if (chart.asc !== null && chart.mc !== null) { lonOf.Ascendant = chart.asc; lonOf.Midheaven = chart.mc; }
  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={R1} stroke={C.gold} strokeWidth={1.2} fill={C.night2} />
      <Circle cx={cx} cy={cy} r={R2} stroke={C.pattern} strokeWidth={0.8} fill={C.night} />
      <Circle cx={cx} cy={cy} r={R3} stroke={C.pattern} strokeWidth={0.8} fill="none" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = pt(i * 30, R2), b = pt(i * 30, R1), m = pt(i * 30 + 15, (R1 + R2) / 2);
        return (
          <G key={i}>
            <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.pattern} strokeWidth={0.8} />
            <SvgText x={m.x} y={m.y + 6} fontSize={17} fill={ELEM_COLOR[['Fire', 'Earth', 'Air', 'Water'][i % 4]]} textAnchor="middle">{glyph(i)}</SvgText>
          </G>
        );
      })}
      {chart.asc !== null && chart.mc !== null && (
        <G>
          {[['AC', chart.asc], ['MC', chart.mc]].map(([nm, l]) => {
            const a = pt(l as number, R3), b = pt(l as number, R1 + 0), t = pt(l as number, R3 - 14);
            return (
              <G key={nm as string}>
                <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.gold} strokeWidth={1.6} />
                <SvgText x={t.x} y={t.y + 4} fontSize={11} fontWeight="bold" fill={C.gold} textAnchor="middle">{nm as string}</SvgText>
              </G>
            );
          })}
        </G>
      )}
      {chart.aspects.filter(a => lonOf[a.a] !== undefined && lonOf[a.b] !== undefined && a.a !== 'Ascendant' && a.a !== 'Midheaven' && a.b !== 'Ascendant' && a.b !== 'Midheaven').map((a, i) => {
        const p = pt(lonOf[a.a], R3), q = pt(lonOf[a.b], R3);
        return <Line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={ASPECT_COLOR[a.kind]} strokeWidth={1} opacity={0.65} />;
      })}
      {pl.map(p => {
        const tick1 = pt(p.lon, R2), tick2 = pt(p.lon, R2 - 7), g = pt(disp[p.key], R2 - 24);
        return (
          <G key={p.key}>
            <Line x1={tick1.x} y1={tick1.y} x2={tick2.x} y2={tick2.y} stroke={C.goldLt} strokeWidth={1} />
            <SvgText x={g.x} y={g.y + 6} fontSize={17} fill={C.goldLt} textAnchor="middle">{p.glyph + '︎'}</SvgText>
            {p.retro && <SvgText x={g.x + 9} y={g.y + 14} fontSize={8} fill="#E0705A" textAnchor="middle">R</SvgText>}
          </G>
        );
      })}
    </Svg>
  );
}

