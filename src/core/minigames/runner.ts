// Pío corre: corredor infinito. Pío corre solo y salta los cactus al tocar
// la pantalla. Un punto por cada cactus superado. Termina al chocar.

export const RUNNER = {
  width: 390,
  groundY: 400,
  pioX: 60,
  pioW: 36,
  pioH: 36,
  gravity: 2400,
  jumpSpeed: 780,
  /** Si se suelta el dedo antes, el salto se corta: saltos cortos o largos. */
  shortJumpSpeed: 340,
  startSpeed: 260,
  maxSpeed: 600,
  /** Cuánto sube la velocidad por segundo. */
  speedUp: 8,
} as const;

export interface Cactus {
  x: number;
  w: number;
  h: number;
  passed: boolean;
}

export interface RunnerState {
  y: number;
  vy: number;
  onGround: boolean;
  speed: number;
  time: number;
  distance: number;
  nextCactus: number;
  cacti: Cactus[];
  score: number;
  over: boolean;
}

export interface RunnerInput {
  /** El dedo está tocando la pantalla. */
  holding: boolean;
  /** Se acaba de tocar la pantalla en este cuadro. */
  pressed: boolean;
}

/** Números aleatorios entre 0 y 1; se inyecta para poder probar. */
export type Rng = () => number;

export function newRunner(): RunnerState {
  return {
    y: RUNNER.groundY - RUNNER.pioH,
    vy: 0,
    onGround: true,
    speed: RUNNER.startSpeed,
    time: 0,
    distance: 0,
    nextCactus: 420,
    cacti: [],
    score: 0,
    over: false,
  };
}

function spawnCactus(rng: Rng): Cactus {
  const n = rng() < 0.6 ? 1 : rng() < 0.75 ? 2 : 3;
  return { x: RUNNER.width + 20, w: n * 16 - 4, h: Math.round(34 + rng() * 22), passed: false };
}

export function stepRunner(s: RunnerState, dt: number, input: RunnerInput, rng: Rng): RunnerState {
  if (s.over) return s;
  const time = s.time + dt;
  const speed = Math.min(RUNNER.maxSpeed, RUNNER.startSpeed + time * RUNNER.speedUp);
  const dx = speed * dt;

  let { y, vy, onGround } = s;
  if (input.pressed && onGround) {
    vy = -RUNNER.jumpSpeed;
    onGround = false;
  }
  if (!input.holding && vy < -RUNNER.shortJumpSpeed) vy = -RUNNER.shortJumpSpeed;
  vy += RUNNER.gravity * dt;
  y += vy * dt;
  if (y >= RUNNER.groundY - RUNNER.pioH) {
    y = RUNNER.groundY - RUNNER.pioH;
    vy = 0;
    onGround = true;
  }

  let nextCactus = s.nextCactus - dx;
  const cacti = s.cacti.map((c) => ({ ...c, x: c.x - dx })).filter((c) => c.x + c.w > -20);
  if (nextCactus <= 0) {
    cacti.push(spawnCactus(rng));
    // A más velocidad, más espacio entre cactus para que siempre se pueda saltar.
    nextCactus = 240 + rng() * 220 + speed * 0.45;
  }

  let score = s.score;
  let over = false;
  const left = RUNNER.pioX + 6;
  const right = RUNNER.pioX + RUNNER.pioW - 6;
  for (const c of cacti) {
    const top = RUNNER.groundY - c.h;
    if (right > c.x + 3 && left < c.x + c.w - 3 && y + RUNNER.pioH - 4 > top + 3) over = true;
    if (!c.passed && c.x + c.w < left) {
      c.passed = true;
      score++;
    }
  }

  return { y, vy, onGround, speed, time, distance: s.distance + dx, nextCactus, cacti, score, over };
}
