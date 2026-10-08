import Phaser from 'phaser';
import { MAX_NAME, checkIn, hatch } from '../core/game';
import { askNotificationPermission } from '../native';
import { chickKey } from '../sprites/chick';
import { getGame, setGame } from '../store';
import { COLORS, FONT_TEXT, FONT_TITLE, HEIGHT, WIDTH, hex } from '../theme';
import { PixelButton } from '../ui';

const SCALE = 12;
const TAPS_TO_HATCH = 3;

/** Primera vez: Pío sale del huevo y el jugador le pone nombre. */
export class HatchScene extends Phaser.Scene {
  private taps = 0;

  constructor() {
    super('hatch');
  }

  create(): void {
    this.taps = 0;
    this.add.rectangle(0, 0, WIDTH, HEIGHT, hex(COLORS.daySky)).setOrigin(0);
    this.add.rectangle(0, 560, WIDTH, HEIGHT - 560, hex(COLORS.dayGrass)).setOrigin(0);
    this.add.rectangle(0, 560, WIDTH, 8, hex(COLORS.dayGrassTop)).setOrigin(0);

    const hint = this.add
      .text(WIDTH / 2, 150, 'Algo se mueve…\nToca el huevo', { fontFamily: FONT_TITLE, fontSize: '14px', color: COLORS.ink, align: 'center', lineSpacing: 10 })
      .setOrigin(0.5);

    const egg = this.add.image(WIDTH / 2, 500, 'egg').setScale(SCALE).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
    const wobble = this.tweens.add({ targets: egg, angle: { from: -4, to: 4 }, duration: 260, yoyo: true, repeat: -1, repeatDelay: 900 });

    egg.on('pointerdown', () => {
      this.taps++;
      this.tweens.add({ targets: egg, y: 490, duration: 80, yoyo: true });
      if (this.taps < TAPS_TO_HATCH) {
        egg.setTexture(`egg-crack-${this.taps}`);
        return;
      }
      wobble.stop();
      egg.destroy();
      hint.setText('¡Hola!\n¿Cómo me llamo?');
      const chick = this.add.image(WIDTH / 2, 500, chickKey('happy', 'none')).setScale(SCALE).setOrigin(0.5, 1);
      this.tweens.add({ targets: chick, y: 470, duration: 160, yoyo: true, repeat: 2 });
      this.showNameForm();
    });
  }

  private showNameForm(): void {
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = MAX_NAME;
    input.placeholder = 'Pío';
    input.setAttribute('aria-label', 'Nombre de tu pollito');
    input.autocomplete = 'off';
    Object.assign(input.style, {
      width: '240px',
      height: '52px',
      boxSizing: 'border-box',
      padding: '0 14px',
      border: `3px solid ${COLORS.ink}`,
      background: COLORS.cream,
      color: COLORS.ink,
      fontFamily: FONT_TEXT,
      fontSize: '30px',
      outline: 'none',
      borderRadius: '0',
    } satisfies Partial<CSSStyleDeclaration>);
    this.add.dom(WIDTH / 2, 620, input);

    const done = () => {
      const now = Date.now();
      input.blur();
      setGame(checkIn(hatch(getGame(), input.value, now), now).state);
      // Buen momento para pedir permiso de avisos: Pío acaba de nacer.
      void askNotificationPermission();
      this.scene.start('home');
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') done();
    });
    new PixelButton(this, { x: WIDTH / 2 - 90, y: 676, w: 180, h: 56, text: '¡LISTO!', fontSize: 12, onTap: done });
  }
}
