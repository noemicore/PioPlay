import { describe, expect, it } from 'vitest';
import { FOODS, OFFLINE_FLOOR, advance, caress, feed, mood, newPet, setSleeping, speech } from './pet';

const HOUR = 3_600_000;
const corn = FOODS[0];

describe('advance', () => {
  it('baja las barras por hora mientras Pío está despierto', () => {
    const pet = advance(newPet(0), 2 * HOUR);
    expect(pet.food).toBe(70 - 12);
    expect(pet.joy).toBe(70 - 8);
    expect(pet.energy).toBe(80 - 10);
    expect(pet.updatedAt).toBe(2 * HOUR);
  });

  it('dormido recupera energía y no pierde alegría', () => {
    const pet = advance(setSleeping({ ...newPet(0), energy: 20 }, true), 3 * HOUR);
    expect(pet.energy).toBe(80);
    expect(pet.joy).toBe(70);
    expect(pet.food).toBe(64);
  });

  it('nunca pasa de 0 a 100', () => {
    const pet = advance(newPet(0), 100 * HOUR);
    expect(pet.food).toBe(0);
    const rested = advance(setSleeping(newPet(0), true), 100 * HOUR);
    expect(rested.energy).toBe(100);
  });

  it('con la app cerrada las barras no bajan del mínimo', () => {
    const pet = advance(newPet(0), 72 * HOUR, true);
    expect(pet.food).toBe(OFFLINE_FLOOR);
    expect(pet.joy).toBe(OFFLINE_FLOOR);
    expect(pet.energy).toBe(OFFLINE_FLOOR);
  });

  it('con la app cerrada no sube una barra que ya estaba por debajo del mínimo', () => {
    const pet = advance({ ...newPet(0), food: 4 }, 10 * HOUR, true);
    expect(pet.food).toBe(4);
  });

  it('si el reloj va hacia atrás no cambia nada', () => {
    const start = newPet(10 * HOUR);
    expect(advance(start, 5 * HOUR)).toBe(start);
  });
});

describe('acciones', () => {
  it('dar maíz sube comida y alegría', () => {
    const r = feed({ ...newPet(0), food: 50 }, corn);
    expect(r.ok && r.pet.food).toBe(65);
    expect(r.ok && r.pet.joy).toBe(72);
  });

  it('no come si está lleno o dormido', () => {
    expect(feed({ ...newPet(0), food: 100 }, corn)).toEqual({ ok: false, reason: 'lleno' });
    expect(feed(setSleeping(newPet(0), true), corn)).toEqual({ ok: false, reason: 'dormido' });
  });

  it('acariciar sube alegría solo si está despierto', () => {
    expect(caress(newPet(0)).joy).toBe(78);
    const asleep = setSleeping(newPet(0), true);
    expect(caress(asleep)).toBe(asleep);
  });
});

describe('ánimo y globo de texto', () => {
  it('calcula el ánimo con el promedio', () => {
    expect(mood({ ...newPet(0), food: 90, joy: 90, energy: 90 })).toBe('feliz');
    expect(mood({ ...newPet(0), food: 50, joy: 50, energy: 50 })).toBe('tranquilo');
    expect(mood({ ...newPet(0), food: 10, joy: 10, energy: 10 })).toBe('triste');
    expect(mood(setSleeping(newPet(0), true))).toBe('durmiendo');
  });

  it('el hambre tiene prioridad en lo que dice', () => {
    expect(speech({ ...newPet(0), food: 20, energy: 20 })).toBe('Tengo hambre…');
    expect(speech(newPet(0))).toBe('¡Pío pío!');
  });
});
