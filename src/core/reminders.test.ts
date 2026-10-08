import { describe, expect, it } from 'vitest';
import { hatch, newGame, setSetting } from './game';
import { setSleeping } from './pet';
import { planReminders } from './reminders';

const HOUR = 3_600_000;
const born = (food: number) => {
  const g = hatch(newGame(0), 'Kiwi', 0);
  return { ...g, pet: { ...g.pet, food } };
};

describe('avisos', () => {
  it('avisa cuando la comida llegue a 25 y si no vuelves en un día', () => {
    const r = planReminders(born(55), 1000);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ id: 1, at: 1000 + 5 * HOUR, title: 'Kiwi tiene hambre' });
    expect(r[1]).toMatchObject({ id: 2, at: 1000 + 24 * HOUR, title: 'Kiwi te extraña' });
  });

  it('dormido le da hambre más lento', () => {
    const g = born(55);
    const r = planReminders({ ...g, pet: setSleeping(g.pet, true) }, 0);
    expect(r[0].at).toBe(15 * HOUR);
  });

  it('si ya tiene hambre avisa en una hora', () => {
    expect(planReminders(born(10), 0)[0].at).toBe(HOUR);
  });

  it('sin avisos si están apagados o Pío no ha nacido', () => {
    expect(planReminders(setSetting(born(50), 'notifications', false), 0)).toEqual([]);
    expect(planReminders(newGame(0), 0)).toEqual([]);
  });
});
