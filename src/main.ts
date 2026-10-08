import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import Phaser from 'phaser';
import { initAudio, setSoundEnabled } from './audio';
import { cancelReminders, onBackButton, scheduleReminders } from './native';
import { BootScene } from './scenes/BootScene';
import { BugsScene } from './scenes/BugsScene';
import { HatchScene } from './scenes/HatchScene';
import { HomeScene } from './scenes/HomeScene';
import { MinigameScene } from './scenes/MinigameScene';
import { ProfileScene } from './scenes/ProfileScene';
import { RunnerScene } from './scenes/RunnerScene';
import { getGame } from './store';
import { COLORS, HEIGHT, WIDTH } from './theme';

async function start(): Promise<void> {
  // Phaser dibuja el texto en canvas: las fuentes deben estar cargadas antes.
  await Promise.all([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('16px "VT323"')]);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: COLORS.ink,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // Permite poner un campo de texto HTML (el nombre de Pío) sobre el juego.
    dom: { createContainer: true },
    scene: [BootScene, HatchScene, HomeScene, ProfileScene, RunnerScene, BugsScene],
  });

  initAudio();
  setSoundEnabled(getGame().settings.sound);

  // Avisos: se programan al salir de la app y se cancelan al volver.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void scheduleReminders(getGame());
    else void cancelReminders();
  });
  void cancelReminders();

  onBackButton(() => {
    const scene = game.scene.getScenes(true)[0];
    if (scene instanceof ProfileScene || scene instanceof MinigameScene) {
      scene.back();
      return true;
    }
    return false; // en la pantalla principal o el huevo, Atrás cierra la app
  });
}

void start();
