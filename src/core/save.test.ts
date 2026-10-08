import { describe, expect, it } from 'vitest';
import { newGame } from './game';
import { newPet } from './pet';
import { type KeyValueStore, loadGame, saveGame } from './save';

function memoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data = { ...initial };
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => { data[k] = v; } };
}

describe('guardado', () => {
  it('guarda y recupera la partida', () => {
    const store = memoryStore();
    const game = { ...newGame(123), hatched: true, coins: 77, outfit: 'hat' as const };
    saveGame(store, game);
    expect(loadGame(store, 999)).toEqual(game);
  });

  it('sin partida guardada empieza una nueva', () => {
    expect(loadGame(memoryStore(), 5)).toEqual(newGame(5));
  });

  it('si el guardado está roto empieza de nuevo en vez de fallar', () => {
    expect(loadGame(memoryStore({ 'pio.save': '{no es json' }), 5)).toEqual(newGame(5));
    expect(loadGame(memoryStore({ 'pio.save': '{"v":99}' }), 5)).toEqual(newGame(5));
  });

  it('convierte las partidas de la primera versión sin perder a Pío', () => {
    const pet = { ...newPet(100), food: 33 };
    const game = loadGame(memoryStore({ 'pio.save': JSON.stringify({ v: 1, pet }) }), 5);
    expect(game.hatched).toBe(true);
    expect(game.pet).toEqual(pet);
    expect(game.coins).toBe(newGame(5).coins);
  });
});
