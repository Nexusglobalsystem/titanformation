// Couverture générée par formation, en l'absence de photo réelle uploadée
// (AttachTrainingImageForm reste le chemin normal pour une vraie photo).
// Déterministe par seed (l'id de la formation) : motif abstrait aux
// couleurs de marque, jamais une fausse photo qui prétendrait représenter
// une session réelle.

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

export function TrainingCoverArt({ seed, className }: { seed: string; className?: string }) {
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
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <rect width="100" height="100" fill="var(--color-primary)" />
      {circles.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="var(--color-accent)" opacity={c.opacity} />
      ))}
      <line x1="0" y1={lineY1} x2="100" y2={lineY1 - 15} stroke="var(--color-accent)" strokeWidth="0.6" opacity="0.3" />
      <line x1="0" y1={lineY2} x2="100" y2={lineY2 - 10} stroke="var(--color-accent)" strokeWidth="0.4" opacity="0.18" />
    </svg>
  );
}
