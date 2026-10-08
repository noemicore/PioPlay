// Bichos: 30 segundos para tocar insectos que caminan por el pasto.

export type BugType = 'lady' | 'moth' | 'fly' | 'gold';

export const BUG_TYPES: Record<BugType, { points: number; speed: number; turn: number; name: string }> = {
  lady: { points: 1, speed: 70, turn: 0.6, name: 'Mariquita' },
  moth: { points: 2, speed: 95, turn: 1.6, name: 'Mariposa' },
  fly: { points: 3, speed: 170, turn: 3, name: 'Mosca' },
  gold: { points: 5, speed: 210, turn: 2.4, name: 'Escarabajo dorado' },
};

export const BUGS = {
  width: 390,
  height: 520,
  size: 48,
  duration: 30,
  count: 5,
} as const;

export interface Bug {
  id: number;
  type: BugType;
  x: number;
  y: number;
  angle: number;
}

export interface BugsState {
  bugs: Bug[];
  time: number;
  score: number;
  caught: number;
  nextId: number;
  /** Segundos que faltan para que aparezca cada bicho nuevo. */
  respawn: number[];
  over: boolean;
}

export type Rng = () => number;

export function pickType(r: number): BugType {
  return r < 0.08 ? 'gold' : r < 0.36 ? 'fly' : r < 0.66 ? 'moth' : 'lady';
}

function newBug(id: number, rng: Rng): Bug {
  return {
    id,
    type: pickType(rng()),
    x: rng() * (BUGS.width - BUGS.size),
    y: 10 + rng() * (BUGS.height - BUGS.size - 10),
    angle: rng() * Math.PI * 2,
  };
}

export function newBugs(rng: Rng): BugsState {
  const bugs = Array.from({ length: BUGS.count }, (_, i) => newBug(i, rng));
  return { bugs, time: 0, score: 0, caught: 0, nextId: BUGS.count, respawn: [], over: false };
}

export const timeLeft = (s: BugsState): number => Math.max(0, Math.ceil(BUGS.duration - s.time));

export function stepBugs(s: BugsState, dt: number, rng: Rng): BugsState {
  if (s.over) return s;
  const time = s.time + dt;
  if (time >= BUGS.duration) return { ...s, time: BUGS.duration, over: true };
  const max = { x: BUGS.width - BUGS.size, y: BUGS.height - BUGS.size };
  // Los bichos se aceleran un poco con el tiempo.
  const hurry = 1 + time / 60;
  const bugs = s.bugs.map((b) => {
    const t = BUG_TYPES[b.type];
    let angle = b.angle + (rng() * 2 - 1) * t.turn * dt * 3;
    let x = b.x + Math.cos(angle) * t.speed * hurry * dt;
    let y = b.y + Math.sin(angle) * t.speed * hurry * dt;
    if (x < 0 || x > max.x) {
      x = Math.max(0, Math.min(max.x, x));
      angle = Math.PI - angle;
    }
    if (y < 8 || y > max.y) {
      y = Math.max(8, Math.min(max.y, y));
      angle = -angle;
    }
    return { ...b, x, y, angle };
  });
  let nextId = s.nextId;
  const respawn: number[] = [];
  for (const r of s.respawn) {
    if (r - dt <= 0) bugs.push(newBug(nextId++, rng));
    else respawn.push(r - dt);
  }
  return { ...s, bugs, time, nextId, respawn };
}

/** Atrapar un bicho: suma sus puntos y programa uno nuevo. */
export function catchBug(s: BugsState, id: number, rng: Rng): { state: BugsState; points: number; type?: BugType } {
  const bug = s.bugs.find((b) => b.id === id);
  if (!bug || s.over) return { state: s, points: 0 };
  const points = BUG_TYPES[bug.type].points;
  return {
    state: {
      ...s,
      bugs: s.bugs.filter((b) => b.id !== id),
      score: s.score + points,
      caught: s.caught + 1,
      respawn: [...s.respawn, 0.3 + rng() * 0.6],
    },
    points,
    type: bug.type,
  };
}
