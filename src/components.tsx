import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText, Ellipse } from 'react-native-svg';
import { MONTHS, Phase, yearLength } from './engine';
import { ACCENTS, C, F, TAG } from './theme';

// deterministic pseudo random
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function Starfield({ w, h, n = 60, seed = 1 }: { w: number; h: number; n?: number; seed?: number }) {
  const stars = useMemo(() => {
    const r = rng(seed * 7919 + 13);
    return Array.from({ length: n }, () => ({ x: r() * w, y: r() * h, r: [0.4, 0.5, 0.7, 0.7, 0.9, 1.3][Math.floor(r() * 6)], o: 0.25 + r() * 0.65 }));
  }, [w, h, n, seed]);
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />)}
    </Svg>
  );
}

/** Band of geometric motifs inspired by Bamileke ndop cloth. */
export function NdopBand({ w, h = 18, rows = 1, bg = C.night2, fg = C.pattern }: { w: number; h?: number; rows?: number; bg?: string; fg?: string }) {
  const s = h / rows;
  const n = Math.ceil(w / s);
  const els: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const y = r * s;
    for (let i = 0; i < n; i++) {
      const x = i * s, p = s * 0.18, m = (i + r * 2) % 5, k = `${r}-${i}`;
      if (m === 0) els.push(<G key={k}><Polygon points={`${x + s / 2},${y + p} ${x + s - p},${y + s / 2} ${x + s / 2},${y + s - p} ${x + p},${y + s / 2}`} stroke={fg} strokeWidth={0.9} fill="none" /><Circle cx={x + s / 2} cy={y + s / 2} r={s * 0.06} fill={fg} /></G>);
      else if (m === 1) els.push(<G key={k}><Line x1={x + p} y1={y + p} x2={x + s - p} y2={y + s - p} stroke={fg} strokeWidth={0.9} /><Line x1={x + p} y1={y + s - p} x2={x + s - p} y2={y + p} stroke={fg} strokeWidth={0.9} /></G>);
      else if (m === 2) els.push(<G key={k}><Circle cx={x + s / 2} cy={y + s / 2} r={s * 0.32} stroke={fg} strokeWidth={0.9} fill="none" /><Circle cx={x + s / 2} cy={y + s / 2} r={s * 0.12} fill={fg} /></G>);
      else if (m === 3) {
        const pts = Array.from({ length: 5 }, (_, j) => `${x + p + (j * (s - 2 * p)) / 4},${y + (j % 2 === 0 ? s * 0.7 : s * 0.3)}`).join(' ');
        els.push(<Path key={k} d={`M${pts.split(' ').join(' L')}`} stroke={fg} strokeWidth={0.9} fill="none" />);
      } else els.push(<G key={k}>{[[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]].map(([dx, dy], j) => <Circle key={j} cx={x + s * dx} cy={y + s * dy} r={s * 0.07} fill={fg} />)}</G>);
    }
    els.push(<Line key={`l${r}`} x1={0} y1={y} x2={w} y2={y} stroke={fg} strokeWidth={0.5} />);
  }
  return (
    <Svg width={w} height={h}>
      <Rect x={0} y={0} width={w} height={h} fill={bg} />
      {els}
    </Svg>
  );
}

export function Ankh({ size, color, stroke }: { size: number; color: string; stroke?: number }) {
  const lw = stroke ?? size * 0.09;
  const cx = size / 2, barY = size * 0.42;
  const loopH = size * 0.36, loopW = size * 0.26;
  return (
    <Svg width={size} height={size}>
      <Ellipse cx={cx} cy={barY - lw * 0.6 - loopH / 2} rx={loopW / 2} ry={loopH / 2} stroke={color} strokeWidth={lw} fill="none" />
      <Line x1={cx - size * 0.24} y1={barY} x2={cx + size * 0.24} y2={barY} stroke={color} strokeWidth={lw} strokeLinecap="round" />
      <Line x1={cx} y1={barY} x2={cx} y2={size - lw} stroke={color} strokeWidth={lw} strokeLinecap="round" />
    </Svg>
  );
}

export function MoonIcon({ phase, r = 5, lit = C.goldLt, dark = C.night, outline }: { phase: Phase; r?: number; lit?: string; dark?: string; outline?: string }) {
  const s = r * 2 + 2, c = r + 1;
  const half = phase === 'first'
    ? `M${c},${c - r} A${r},${r} 0 0 1 ${c},${c + r} Z`
    : `M${c},${c - r} A${r},${r} 0 0 0 ${c},${c + r} Z`;
  return (
    <Svg width={s} height={s}>
      <Circle cx={c} cy={c} r={r} fill={phase === 'full' ? lit : dark} stroke={outline ?? lit} strokeWidth={0.8} />
      {(phase === 'first' || phase === 'last') && <Path d={half} fill={lit} />}
    </Svg>
  );
}

export function Sparkle({ size, color }: { size: number; color: string }) {
  const c = size / 2, r = size / 2;
  const pts = Array.from({ length: 8 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 4, rr = i % 2 === 0 ? r : r * 0.28;
    return `${c + rr * Math.cos(a)},${c + rr * Math.sin(a)}`;
  }).join(' ');
  return <Svg width={size} height={size}><Polygon points={pts} fill={color} /></Svg>;
}

/** Year wheel: 13 coloured months, intercalary sliver, ankh centre, today marker. */
export function YearWheel({ size, ey, dayIndex, onMonth }: { size: number; ey: number; dayIndex?: number; onMonth?: (m: number) => void }) {
  const n = yearLength(ey), cx = size / 2, cy = size / 2;
  const R2 = size * 0.44, R1 = size * 0.32;
  const pt = (deg: number, r: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const seg = (a0: number, a1: number) => {
    const [x0, y0] = pt(a0, R2), [x1, y1] = pt(a1, R2), [x2, y2] = pt(a1, R1), [x3, y3] = pt(a0, R1);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M${x0},${y0} A${R2},${R2} 0 ${large} 1 ${x1},${y1} L${x2},${y2} A${R1},${R1} 0 ${large} 0 ${x3},${y3} Z`;
  };
  const ankh = size * 0.22;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={R2 + size * 0.05} stroke="rgba(255,255,255,0.12)" strokeWidth={0.8} fill="none" />
        {Array.from({ length: 13 }, (_, i) => {
          const a0 = (i * 28 * 360) / n, a1 = ((i + 1) * 28 * 360) / n;
          const [tx, ty] = pt((a0 + a1) / 2, (R1 + R2) / 2);
          return (
            <G key={i} onPress={onMonth ? () => onMonth(i + 1) : undefined}>
              <Path d={seg(a0 + 0.6, a1 - 0.6)} fill={ACCENTS[i]} />
              <SvgText x={tx} y={ty + size * 0.018} fill="#fff" fontSize={size * 0.05} fontFamily={F.displayB} textAnchor="middle">{String(i + 1).padStart(2, '0')}</SvgText>
            </G>
          );
        })}
        <Path d={seg((364 * 360) / n + 0.6, 360 - 0.6)} fill={C.goldLt} />
        <Circle cx={cx} cy={cy} r={R1 - size * 0.035} stroke={C.gold} strokeWidth={1} fill="none" />
        {Array.from({ length: 52 }, (_, k) => {
          const [a, b] = pt((k * 360) / 52, R1 - size * 0.035), [c2, d2] = pt((k * 360) / 52, R1 - size * (k % 4 === 0 ? 0.055 : 0.045));
          return <Line key={k} x1={a} y1={b} x2={c2} y2={d2} stroke={C.gold} strokeWidth={0.8} />;
        })}
        <Circle cx={cx} cy={cy} r={size * 0.17} fill={C.night2} stroke={C.gold} strokeWidth={1.4} />
        {Array.from({ length: 24 }, (_, k) => {
          const [a, b] = pt(k * 15, size * 0.185), [c2, d2] = pt(k * 15, size * 0.21);
          return <Line key={`r${k}`} x1={a} y1={b} x2={c2} y2={d2} stroke="rgba(241,213,143,0.5)" strokeWidth={0.7} />;
        })}
        {dayIndex !== undefined && (() => {
          const deg = ((dayIndex + 0.5) * 360) / n;
          const [a, b] = pt(deg, R2 + size * 0.005), [c2, d2] = pt(deg, R2 + size * 0.04);
          const [sx, sy] = pt(deg, R2 + size * 0.05);
          return <G><Line x1={a} y1={b} x2={c2} y2={d2} stroke={C.goldLt} strokeWidth={1.2} /><Circle cx={sx} cy={sy} r={size * 0.016} fill={C.goldLt} /></G>;
        })()}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        <Ankh size={ankh} color={C.gold} />
      </View>
    </View>
  );
}

export function Kicker({ children, color = C.gold, style }: { children: React.ReactNode; color?: string; style?: any }) {
  return <Text style={[{ fontFamily: F.sansB, fontSize: 10, letterSpacing: 2.4, color, textTransform: 'uppercase' }, style]}>{children}</Text>;
}

export function CountryTag({ who }: { who: string }) {
  return (
    <View style={{ backgroundColor: TAG[who], borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, marginRight: 6 }}>
      <Text style={{ color: '#fff', fontFamily: F.sansB, fontSize: 9 }}>{who.replace('IT+CM', 'IT·CM')}</Text>
    </View>
  );
}

export function Card({ children, style, dark }: { children: React.ReactNode; style?: ViewStyle; dark?: boolean }) {
  return <View style={[{ backgroundColor: dark ? C.night : C.card, borderRadius: 14, padding: 16 }, style]}>{children}</View>;
}

export function NavArrows({ label, sub, onPrev, onNext, color = C.ink, subColor = C.muted }: { label: string; sub?: string; onPrev: () => void; onNext: () => void; color?: string; subColor?: string }) {
  const btn = (t: string, f: () => void) => (
    <Pressable onPress={f} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(127,127,127,0.12)' })}>
      <Text style={{ color, fontFamily: F.sansB, fontSize: 18 }}>{t}</Text>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {btn('‹', onPrev)}
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color, fontFamily: F.displayB, fontSize: 20 }}>{label}</Text>
        {sub ? <Text style={{ color: subColor, fontFamily: F.sans, fontSize: 11, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      {btn('›', onNext)}
    </View>
  );
}

export const monthName = (m: number) => MONTHS[m - 1];
