import Svg, { Circle, Line, Rect } from "react-native-svg";
import { useAppTheme } from "../theme/ThemeProvider";

// Port RN de apps/web/src/app/formations/_components/TrainingCoverArt.tsx —
// même algorithme déterministe (seed = id de la formation), react-native-svg
// à la place du <svg> DOM. Couvertures générées en l'absence de photo
// réelle uploadée, jamais une fausse photo prétendant représenter une
// session réelle.
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function TrainingCoverArt({ seed }: { seed: string }) {
  const { theme } = useAppTheme();
  const random = mulberry32(hashSeed(seed));
  const circles = Array.from({ length: 5 }, () => ({
    cx: random() * 100,
    cy: random() * 100,
    r: 10 + random() * 26,
    opacity: 0.08 + random() * 0.16,
  }));
  const lineY1 = 55 + random() * 25;
  const lineY2 = 45 + random() * 25;

  return (
    <Svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
      <Rect width="100" height="100" fill={theme.colors.primary} />
      {circles.map((c, i) => (
        <Circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={theme.colors.accent} opacity={c.opacity} />
      ))}
      <Line x1="0" y1={lineY1} x2="100" y2={lineY1 - 15} stroke={theme.colors.accent} strokeWidth="0.6" opacity="0.3" />
      <Line x1="0" y1={lineY2} x2="100" y2={lineY2 - 10} stroke={theme.colors.accent} strokeWidth="0.4" opacity="0.18" />
    </Svg>
  );
}
