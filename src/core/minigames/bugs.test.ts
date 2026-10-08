import { describe, expect, it } from 'vitest';
import { BUGS, catchBug, newBugs, pickType, stepBugs, timeLeft } from './bugs';

const seq = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

describe('Bichos', () => {
  it('empieza con 5 bichos y 30 segundos', () => {
    const s = newBugs(Math.random);
    expect(s.bugs).toHaveLength(BUGS.count);
    expect(timeLeft(s)).toBe(30);
  });

  it('los tipos salen según su rareza', () => {
    expect(pickType(0.05)).toBe('gold');
    expect(pickType(0.2)).toBe('fly');
    expect(pickType(0.5)).toBe('moth');
    expect(pickType(0.9)).toBe('lady');
  });

  it('atrapar un bicho suma sus puntos y aparece otro después', () => {
    const rng = seq([0.9, 0.5, 0.5, 0.5]);
    let s = newBugs(rng);
    const r = catchBug(s, s.bugs[0].id, rng);
    expect(r.points).toBe(1);
    expect(r.state.score).toBe(1);
    expect(r.state.bugs).toHaveLength(BUGS.count - 1);
    s = r.state;
    for (let i = 0; i < 60; i++) s = stepBugs(s, 1 / 60, rng);
    expect(s.bugs).toHaveLength(BUGS.count);
  });

  it('los bichos no salen del pasto', () => {
    let s = newBugs(Math.random);
    for (let i = 0; i < 60 * 25; i++) s = stepBugs(s, 1 / 60, Math.random);
    for (const b of s.bugs) {
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x).toBeLessThanOrEqual(BUGS.width - BUGS.size);
      expect(b.y).toBeLessThanOrEqual(BUGS.height - BUGS.size);
    }
  });

  it('se acaba a los 30 segundos y ya no se puede atrapar', () => {
    let s = newBugs(Math.random);
    for (let i = 0; i < 31; i++) s = stepBugs(s, 1, Math.random);
    expect(s.over).toBe(true);
    expect(timeLeft(s)).toBe(0);
    expect(catchBug(s, s.bugs[0].id, Math.random).points).toBe(0);
  });
});
