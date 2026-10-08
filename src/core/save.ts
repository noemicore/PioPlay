import { type GameState, newGame } from './game';
import type { PetState } from './pet';

const KEY = 'pio.save';
const VERSION = 2;

/** Lo mínimo que necesitamos de localStorage, para poder probarlo sin navegador. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface SaveV1 {
  v: 1;
  pet: PetState;
}

interface SaveV2 {
  v: 2;
  game: GameState;
}

export function loadGame(store: KeyValueStore, now: number): GameState {
  try {
    const raw = store.getItem(KEY);
    if (!raw) return newGame(now);
    const data = JSON.parse(raw) as SaveV1 | SaveV2;
    if (data.v === 2 && typeof data.game?.pet?.updatedAt === 'number') {
      // Campos nuevos que una versión vieja del juego no guardaba toman su valor inicial.
      return { ...newGame(now), ...data.game };
    }
    if (data.v === 1 && typeof data.pet?.updatedAt === 'number') {
      // Partidas de la primera versión: Pío ya había nacido.
      return { ...newGame(now), hatched: true, pet: data.pet };
    }
    return newGame(now);
  } catch {
    return newGame(now);
  }
}

export function saveGame(store: KeyValueStore, game: GameState): void {
  const data: SaveV2 = { v: VERSION, game };
  store.setItem(KEY, JSON.stringify(data));
}
