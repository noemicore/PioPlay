// Avisos del teléfono (GDD, sección 7): se calculan al cerrar la app.

import type { GameState } from './game';
import { RATES } from './pet';

export interface Reminder {
  id: number;
  at: number;
  title: string;
  body: string;
}

export const HUNGRY_AT = 25;
const HOUR = 60 * 60 * 1000;

/** Hasta 2 avisos: cuando le dé hambre y si no vuelves en 24 horas. */
export function planReminders(game: GameState, now: number): Reminder[] {
  if (!game.hatched || !game.settings.notifications) return [];
  const { pet } = game;
  const reminders: Reminder[] = [];
  const foodPerHour = -(pet.sleeping ? RATES.asleep.food : RATES.awake.food);
  // Si ya tiene hambre, se avisa en una hora para no insistir al instante.
  const hoursToHungry = pet.food <= HUNGRY_AT ? 1 : (pet.food - HUNGRY_AT) / foodPerHour;
  if (hoursToHungry < 24) {
    reminders.push({ id: 1, at: now + hoursToHungry * HOUR, title: `${pet.name} tiene hambre`, body: '¿Le das algo de comer?' });
  }
  reminders.push({ id: 2, at: now + 24 * HOUR, title: `${pet.name} te extraña`, body: 'Hace un día que no lo visitas.' });
  return reminders;
}
