import { describe, expect, it } from 'vitest';
import { RUNNER, newRunner, stepRunner } from './runner';

const idle = { holding: false, pressed: false };
const tap = { holding: true, pressed: true };
const hold = { holding: true, pressed: false };
const fixed = (v: number) => () => v;

function run(steps: number, input = idle, s = newRunner(), rng = fixed(0)) {
  for (let i = 0; i < steps; i++) s = stepRunner(s, 1 / 60, input, rng);
  return s;
}

describe('Pío corre', () => {
  it('al tocar salta y vuelve al suelo', () => {
    let s = stepRunner(newRunner(), 1 / 60, tap, fixed(0));
    expect(s.onGround).toBe(false);
    s = run(30, hold, s);
    expect(s.y).toBeLessThan(RUNNER.groundY - RUNNER.pioH - 50);
    s = run(120, idle, s);
    expect(s.onGround).toBe(true);
  });

  it('soltar el dedo hace el salto más bajo', () => {
    const high = (input: typeof idle) => {
      let s = stepRunner(newRunner(), 1 / 60, tap, fixed(0));
      let top = s.y;
      for (let i = 0; i < 60; i++) {
        s = stepRunner(s, 1 / 60, input, fixed(0));
        top = Math.min(top, s.y);
      }
      return top;
    };
    expect(high(hold)).toBeLessThan(high(idle));
  });

  it('si no salta, choca con el primer cactus', () => {
    const s = run(600);
    expect(s.over).toBe(true);
    expect(s.score).toBe(0);
  });

  it('saltando a tiempo suma un punto por cactus', () => {
    let s = newRunner();
    for (let i = 0; i < 60 * 20 && !s.over; i++) {
      // Salta cuando el cactus más cercano está a punto de llegar.
      const near = s.cacti.find((c) => !c.passed && c.x - (RUNNER.pioX + RUNNER.pioW) < s.speed * 0.18 && c.x > RUNNER.pioX);
      s = stepRunner(s, 1 / 60, near ? tap : hold, fixed(0.5));
    }
    expect(s.score).toBeGreaterThan(3);
  });

  it('la velocidad sube pero tiene tope', () => {
    expect(run(60).speed).toBeGreaterThan(RUNNER.startSpeed);
    const late = stepRunner({ ...newRunner(), time: 10_000 }, 1 / 60, idle, fixed(0));
    expect(late.speed).toBe(RUNNER.maxSpeed);
  });
});
