import type Phaser from 'phaser';
import { sfx } from '../audio';
import { RUNNER, type RunnerState, newRunner, stepRunner } from '../core/minigames/runner';
import { getGame } from '../store';
import { COLORS, FONT_TEXT, WIDTH, hex } from '../theme';
import { BOTTOM_TOP, FIELD_H, FIELD_TOP, MinigameScene } from './MinigameScene';

const SKY = '#ffe3a3';
const SAND = '#f2c27a';
const SAND_DARK = '#c98f4a';
const CACTUS = '#3fa34d';
const CACTUS_DARK = '#2f7a3a';

/** Pío corre (GDD 4): tocar para saltar los cactus. */
export class RunnerScene extends MinigameScene {
  protected readonly gameId = 'runner' as const;
  protected readonly title = 'Pío corre';
  protected readonly instructions = 'Toca la pantalla\npara saltar los cactus.\nMantén para saltar más alto.';

  private run: RunnerState = newRunner();
  private holding = false;
  private pressed = false;
  private gfx!: Phaser.GameObjects.Graphics;
  private pio!: Phaser.GameObjects.Image;

  constructor() {
    super('runner');
  }

  protected createField(): void {
    this.add.rectangle(0, FIELD_TOP, WIDTH, FIELD_H, hex(SKY)).setOrigin(0);
    this.add.rectangle(0, FIELD_TOP + RUNNER.groundY, WIDTH, FIELD_H - RUNNER.groundY, hex(SAND)).setOrigin(0);
    this.add.rectangle(0, FIELD_TOP + RUNNER.groundY, WIDTH, 6, hex(SAND_DARK)).setOrigin(0);
    this.add.rectangle(WIDTH - 90, FIELD_TOP + 70, 56, 56, hex('#ffd23f')).setStrokeStyle(3, hex('#e0a420'));
    this.gfx = this.add.graphics();
    this.pio = this.add.image(0, 0, 'side-a').setScale(3).setOrigin(0);

    this.add.rectangle(0, BOTTOM_TOP, WIDTH, 844 - BOTTOM_TOP, hex(COLORS.ink)).setOrigin(0);
    const best = getGame().best.runner ?? 0;
    this.add
      .text(WIDTH / 2, BOTTOM_TOP + 90, `Toca en cualquier parte para saltar\nRécord: ${best}`, {
        fontFamily: FONT_TEXT,
        fontSize: '26px',
        color: COLORS.cream,
        align: 'center',
      })
      .setOrigin(0.5);

    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length > 0) return; // tocó un botón
      this.holding = true;
      this.pressed = true;
    });
    this.input.on('pointerup', () => (this.holding = false));
  }

  protected resetRound(): void {
    this.run = newRunner();
    this.holding = false;
    this.pressed = false;
    this.draw();
  }

  protected updateRound(dt: number): void {
    const before = this.run;
    this.run = stepRunner(before, dt, { holding: this.holding, pressed: this.pressed }, Math.random);
    if (this.pressed && before.onGround && !this.run.onGround) sfx('jump');
    this.pressed = false;
    if (this.run.score > before.score) sfx('tap');
    this.draw();
    if (this.run.over) {
      sfx('hit');
      this.endRound();
    }
  }

  protected currentScore(): number {
    return this.run.score;
  }

  protected overText(score: number): string {
    return `Saltaste ${score} cactus`;
  }

  private draw(): void {
    const s = this.run;
    const g = this.gfx.clear();
    const ground = FIELD_TOP + RUNNER.groundY;

    // Nubes y piedritas que se mueven a distinta velocidad (parallax).
    g.fillStyle(0xffffff);
    for (let i = 0; i < 3; i++) {
      const x = ((i * 180 + 60 - ((s.distance * 0.15) % 520) + 1040) % 520) - 70;
      const y = FIELD_TOP + 60 + i * 52;
      g.fillRect(x + 14, y, 34, 11).fillRect(x, y + 11, 80, 11);
    }
    g.fillStyle(hex(SAND_DARK));
    for (let i = 0; i < 9; i++) {
      const x = (i * 53 + 17 - (s.distance % 390) + 780) % 390;
      g.fillRect(x, ground + 14 + (i % 3) * 18, 4 + (i % 4) * 3, 4);
    }

    for (const c of s.cacti) {
      const n = Math.round((c.w + 4) / 16);
      for (let j = 0; j < n; j++) {
        const x = c.x + j * 16;
        const h = c.h;
        g.fillStyle(hex(CACTUS_DARK)).fillRect(x - 2, ground - h - 2, 16, h + 2);
        g.fillStyle(hex(CACTUS)).fillRect(x, ground - h, 12, h);
        g.fillStyle(hex(CACTUS)).fillRect(x - 4, ground - h + 12, 4, 12).fillRect(x + 12, ground - h + 8, 4, 10);
      }
    }

    const frame = s.over ? 'side-hit' : s.onGround && Math.floor(s.time * 12) % 2 === 1 ? 'side-b' : 'side-a';
    this.pio.setTexture(frame).setPosition(RUNNER.pioX - 3, FIELD_TOP + s.y - 3);
  }
}
