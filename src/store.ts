// La partida en curso, compartida por todas las pantallas. Cada cambio se guarda.

import { type BadgeId, type GameState, awardBadges } from './core/game';
import { advance } from './core/pet';
import { loadGame, saveGame } from './core/save';

let game: GameState | null = null;

export function getGame(): GameState {
  game ??= loadGame(localStorage, Date.now());
  return game;
}

/** Guarda el nuevo estado y devuelve las insignias que se acaban de ganar. */
export function setGame(next: GameState): BadgeId[] {
  const { state, added } = awardBadges(next);
  game = state;
  saveGame(localStorage, state);
  return added;
}

/** Aplica el tiempo que pasó. `offline` cuando la app estuvo cerrada. */
export function tickGame(offline = false): BadgeId[] {
  const current = getGame();
  return setGame({ ...current, pet: advance(current.pet, Date.now(), offline) });
}
