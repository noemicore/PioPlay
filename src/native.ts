// Lo que solo existe en el teléfono: avisos y botón Atrás de Android.
// En el navegador estas funciones no hacen nada.

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { GameState } from './core/game';
import { planReminders } from './core/reminders';

const native = Capacitor.isNativePlatform();
const IDS = [{ id: 1 }, { id: 2 }];

export async function askNotificationPermission(): Promise<boolean> {
  if (!native) return false;
  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') return true;
    return (await LocalNotifications.requestPermissions()).display === 'granted';
  } catch {
    return false;
  }
}

/** Al cerrar la app: reprograma los avisos según cómo quedó Pío. */
export async function scheduleReminders(game: GameState): Promise<void> {
  if (!native) return;
  try {
    await LocalNotifications.cancel({ notifications: IDS });
    const reminders = planReminders(game, Date.now());
    if (reminders.length === 0) return;
    await LocalNotifications.schedule({
      notifications: reminders.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        schedule: { at: new Date(r.at), allowWhileIdle: true },
        smallIcon: 'ic_stat_pio',
      })),
    });
  } catch {
    // Sin permiso o sin soporte: el juego sigue sin avisos.
  }
}

/** Al volver a la app no hace falta avisar. */
export async function cancelReminders(): Promise<void> {
  if (!native) return;
  try {
    await LocalNotifications.cancel({ notifications: IDS });
  } catch {
    // ignorar
  }
}

/** Botón Atrás de Android: `onBack` devuelve false si hay que salir de la app. */
export function onBackButton(onBack: () => boolean): void {
  if (!native) return;
  void App.addListener('backButton', () => {
    if (!onBack()) void App.exitApp();
  });
}
