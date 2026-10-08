// Todo lo que Pío guarda además de sus barras: monedas, ropa, racha e
// insignias (ver GDD, secciones 3 y 5). Igual que pet.ts, funciones puras.

import { type Food, type PetState, caress, feed, newPet } from './pet';

export type OutfitId = 'none' | 'hat' | 'bow' | 'scarf' | 'glasses';
export type BadgeId = 'fed' | 'happy' | 'rested' | 'streak7' | 'fashion' | 'gamer';

export interface Outfit {
  id: OutfitId;
  name: string;
  cost: number;
}

/** El sombrero es gratis; las demás prendas se compran con monedas. */
export const OUTFITS: readonly Outfit[] = [
  { id: 'none', name: 'NADA', cost: 0 },
  { id: 'hat', name: 'SOMBRERO', cost: 0 },
  { id: 'bow', name: 'MOÑO', cost: 50 },
  { id: 'scarf', name: 'BUFANDA', cost: 100 },
  { id: 'glasses', name: 'GAFAS', cost: 150 },
];

export interface Badge {
  id: BadgeId;
  name: string;
  desc: string;
}

export const BADGES: readonly Badge[] = [
  { id: 'fed', name: 'Panza llena', desc: 'Llena la comida de Pío hasta 80.' },
  { id: 'happy', name: 'Pío feliz', desc: 'Sube la alegría de Pío hasta 80.' },
  { id: 'rested', name: 'Dulces sueños', desc: 'Deja que Pío duerma hasta tener 80 de energía.' },
  { id: 'streak7', name: 'Racha 7 días', desc: 'Cuida a Pío 7 días seguidos.' },
  { id: 'fashion', name: 'Fashion', desc: 'Viste a Pío con alguna prenda.' },
  { id: 'gamer', name: 'Gamer', desc: 'Juega los minijuegos con Pío.' },
];

export const DAILY_COINS = 10;
export const START_COINS = 20;
export const CARESSES_PER_HOUR = 5;
const HOUR = 60 * 60 * 1000;

export interface GameState {
  hatched: boolean;
  pet: PetState;
  coins: number;
  outfit: OutfitId;
  owned: OutfitId[];
  streak: { count: number; lastDay: string | null };
  badges: BadgeId[];
  /** Momentos de las caricias de la última hora (para el límite). */
  caresses: number[];
}

export function newGame(now: number): GameState {
  return {
    hatched: false,
    pet: newPet(now),
    coins: START_COINS,
    outfit: 'none',
    owned: ['none', 'hat'],
    streak: { count: 0, lastDay: null },
    badges: [],
    caresses: [],
  };
}

export const MAX_NAME = 10;

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
}

/** Pío sale del huevo con el nombre que eligió el jugador. */
export function hatch(state: GameState, rawName: string, now: number): GameState {
  const name = cleanName(rawName) || 'Pío';
  return { ...state, hatched: true, pet: newPet(now, name) };
}

/** Fecha local como 'AAAA-MM-DD'. */
export function dayKey(time: number): string {
  const d = new Date(time);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function previousDayKey(time: number): string {
  const d = new Date(time);
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime());
}

/**
 * Se llama al abrir la app. La primera visita de cada día da monedas y
 * suma a la racha si la visita anterior fue ayer.
 */
export function checkIn(state: GameState, now: number): { state: GameState; reward: number } {
  const today = dayKey(now);
  if (state.streak.lastDay === today) return { state, reward: 0 };
  const count = state.streak.lastDay === previousDayKey(now) ? state.streak.count + 1 : 1;
  return {
    state: { ...state, coins: state.coins + DAILY_COINS, streak: { count, lastDay: today } },
    reward: DAILY_COINS,
  };
}

export type ActionResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: 'dormido' | 'lleno' | 'sin-monedas' | 'cansado-de-mimos' | 'no-la-tienes' };

export function feedPet(state: GameState, food: Food): ActionResult {
  if (state.coins < food.cost) return { ok: false, reason: 'sin-monedas' };
  const r = feed(state.pet, food);
  if (!r.ok) return r;
  return { ok: true, state: { ...state, pet: r.pet, coins: state.coins - food.cost } };
}

/** Acariciar siempre se agradece, pero solo 5 caricias por hora suben la alegría. */
export function caressPet(state: GameState, now: number): ActionResult {
  if (state.pet.sleeping) return { ok: false, reason: 'dormido' };
  const recent = state.caresses.filter((t) => now - t < HOUR);
  if (recent.length >= CARESSES_PER_HOUR) return { ok: false, reason: 'cansado-de-mimos' };
  return { ok: true, state: { ...state, pet: caress(state.pet), caresses: [...recent, now] } };
}

export function buyOutfit(state: GameState, id: OutfitId): ActionResult {
  const outfit = OUTFITS.find((o) => o.id === id);
  if (!outfit) return { ok: false, reason: 'no-la-tienes' };
  if (state.owned.includes(id)) return { ok: true, state };
  if (state.coins < outfit.cost) return { ok: false, reason: 'sin-monedas' };
  return { ok: true, state: { ...state, coins: state.coins - outfit.cost, owned: [...state.owned, id] } };
}

export function wear(state: GameState, id: OutfitId): ActionResult {
  if (!state.owned.includes(id)) return { ok: false, reason: 'no-la-tienes' };
  return { ok: true, state: { ...state, outfit: id } };
}

/** Insignias que el estado actual merece (las ya ganadas no se pierden). */
export function earnedBadges(state: GameState): BadgeId[] {
  const { pet } = state;
  const checks: Record<Exclude<BadgeId, 'gamer'>, boolean> = {
    fed: pet.food >= 80,
    happy: pet.joy >= 80,
    rested: pet.energy >= 80 && pet.sleeping,
    streak7: state.streak.count >= 7,
    fashion: state.outfit !== 'none',
  };
  const earned = (Object.keys(checks) as (keyof typeof checks)[]).filter((id) => checks[id]);
  return earned.filter((id) => !state.badges.includes(id));
}

/** Agrega las insignias nuevas y dice cuáles fueron. */
export function awardBadges(state: GameState): { state: GameState; added: BadgeId[] } {
  const added = earnedBadges(state);
  if (added.length === 0) return { state, added };
  return { state: { ...state, badges: [...state.badges, ...added] }, added };
}
