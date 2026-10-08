// Estado de Pío y reglas de sus estadísticas (ver GDD, sección 3).
// Todo es puro: recibe un estado y devuelve uno nuevo, para poder probarlo.

export type StatName = 'food' | 'joy' | 'energy';

export interface PetState {
  name: string;
  food: number;
  joy: number;
  energy: number;
  sleeping: boolean;
  /** Última vez que se aplicó el paso del tiempo (ms desde epoch). */
  updatedAt: number;
}

export type Mood = 'feliz' | 'tranquilo' | 'triste' | 'durmiendo';

const HOUR = 60 * 60 * 1000;

/** Cambio por hora de cada estadística. */
export const RATES = {
  awake: { food: -6, joy: -4, energy: -5 },
  asleep: { food: -2, joy: 0, energy: 20 },
} as const;

/** Mientras la app está cerrada ninguna barra baja de este valor. */
export const OFFLINE_FLOOR = 10;

export const clamp = (v: number): number => Math.max(0, Math.min(100, v));

export function newPet(now: number, name = 'Pío'): PetState {
  return { name, food: 70, joy: 70, energy: 80, sleeping: false, updatedAt: now };
}

/**
 * Aplica el tiempo que pasó desde `updatedAt` hasta `now`.
 * Con `offline` (al reabrir la app) las barras no bajan de OFFLINE_FLOOR,
 * aunque si ya estaban por debajo se quedan donde estaban.
 */
export function advance(pet: PetState, now: number, offline = false): PetState {
  const hours = Math.max(0, now - pet.updatedAt) / HOUR;
  if (hours === 0) return pet;
  const rate = pet.sleeping ? RATES.asleep : RATES.awake;
  const next = { ...pet, updatedAt: now };
  for (const stat of ['food', 'joy', 'energy'] as const) {
    let value = clamp(pet[stat] + rate[stat] * hours);
    if (offline && value < pet[stat]) value = Math.max(value, Math.min(pet[stat], OFFLINE_FLOOR));
    next[stat] = value;
  }
  return next;
}

export interface Food {
  id: 'corn' | 'worm' | 'berry';
  name: string;
  food: number;
  joy: number;
  cost: number;
}

export const FOODS: readonly Food[] = [
  { id: 'corn', name: 'MAÍZ', food: 15, joy: 2, cost: 0 },
  { id: 'worm', name: 'GUSANO', food: 25, joy: 6, cost: 5 },
  { id: 'berry', name: 'FRESA', food: 10, joy: 12, cost: 8 },
];

export type FeedResult = { ok: true; pet: PetState } | { ok: false; reason: 'dormido' | 'lleno' };

export function feed(pet: PetState, food: Food): FeedResult {
  if (pet.sleeping) return { ok: false, reason: 'dormido' };
  if (pet.food >= 100) return { ok: false, reason: 'lleno' };
  return { ok: true, pet: { ...pet, food: clamp(pet.food + food.food), joy: clamp(pet.joy + food.joy) } };
}

export function caress(pet: PetState): PetState {
  if (pet.sleeping) return pet;
  return { ...pet, joy: clamp(pet.joy + 8) };
}

export function setSleeping(pet: PetState, sleeping: boolean): PetState {
  return { ...pet, sleeping };
}

export function mood(pet: PetState): Mood {
  if (pet.sleeping) return 'durmiendo';
  const avg = (pet.food + pet.joy + pet.energy) / 3;
  return avg > 70 ? 'feliz' : avg >= 40 ? 'tranquilo' : 'triste';
}

/** Lo que Pío dice en su globo de texto, por orden de prioridad. */
export function speech(pet: PetState): string {
  if (pet.sleeping) return 'Zzz… zzz…';
  if (pet.food < 30) return 'Tengo hambre…';
  if (pet.energy < 30) return 'Tengo sueño…';
  if (pet.joy < 30) return '¿Jugamos?';
  return '¡Pío pío!';
}
