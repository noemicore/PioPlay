import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { HatchScene } from './scenes/HatchScene';
import { HomeScene } from './scenes/HomeScene';
import { ProfileScene } from './scenes/ProfileScene';
import { COLORS, HEIGHT, WIDTH } from './theme';

async function start(): Promise<void> {
  // Phaser dibuja el texto en canvas: las fuentes deben estar cargadas antes.
  await Promise.all([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('16px "VT323"')]);

  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: COLORS.ink,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // Permite poner un campo de texto HTML (el nombre de Pío) sobre el juego.
    dom: { createContainer: true },
    scene: [BootScene, HatchScene, HomeScene, ProfileScene],
  });
}

void start();
