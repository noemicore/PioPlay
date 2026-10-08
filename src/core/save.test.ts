import { describe, expect, it } from 'vitest';
import { newPet } from './pet';
import { type KeyValueStore, loadPet, savePet } from './save';

function memoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

describe('guardado', () => {
  it('guarda y recupera a Pío', () => {
    const store = memoryStore();
    const pet = { ...newPet(123), food: 42 };
    savePet(store, pet);
    expect(loadPet(store, 999)).toEqual(pet);
  });

  it('sin partida guardada crea un Pío nuevo', () => {
    expect(loadPet(memoryStore(), 5)).toEqual(newPet(5));
  });

  it('si el guardado está roto empieza de nuevo en vez de fallar', () => {
    expect(loadPet(memoryStore({ 'pio.save': '{no es json' }), 5)).toEqual(newPet(5));
    expect(loadPet(memoryStore({ 'pio.save': '{"v":99}' }), 5)).toEqual(newPet(5));
  });
});
