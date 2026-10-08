import Phaser from 'phaser';
import { BADGES } from '../core/game';
import { chickKey } from '../sprites/chick';
import { getGame } from '../store';
import { COLORS, FONT_TEXT, FONT_TITLE, HEIGHT, WIDTH, hex, pixelText } from '../theme';
import { PixelButton } from '../ui';

/** Perfil local: nombre, racha, monedas e insignias. Sin cuentas ni ranking (fase 2). */
export class ProfileScene extends Phaser.Scene {
  constructor() {
    super('profile');
  }

  create(): void {
    const game = getGame();
    this.add.rectangle(0, 0, WIDTH, HEIGHT, hex(COLORS.cream)).setOrigin(0);
    new PixelButton(this, { x: 16, y: 36, w: 104, h: 44, text: 'VOLVER', fontSize: 10, onTap: () => this.scene.start('home') });
    this.add.text(WIDTH - 20, 50, 'MI PERFIL', { fontFamily: FONT_TITLE, fontSize: '12px', color: COLORS.ink }).setOrigin(1, 0);

    this.add.rectangle(16, 100, WIDTH - 32, 150, hex(COLORS.yellow)).setOrigin(0).setStrokeStyle(3, hex(COLORS.ink));
    this.add.image(84, 175, chickKey('happy', game.outfit)).setScale(7);
    this.add.text(150, 120, pixelText(game.pet.name), { fontFamily: FONT_TITLE, fontSize: '14px', color: COLORS.ink });
    const days = game.streak.count;
    this.add.text(150, 150, `Racha: ${days} ${days === 1 ? 'día' : 'días'}\nMonedas: ${game.coins}\nInsignias: ${game.badges.length} de ${BADGES.length}`, {
      fontFamily: FONT_TEXT,
      fontSize: '24px',
      color: COLORS.ink,
      lineSpacing: 2,
    });

    this.add.text(16, 278, 'INSIGNIAS', { fontFamily: FONT_TITLE, fontSize: '12px', color: COLORS.ink });
    const desc = this.add
      .text(WIDTH / 2, 760, 'Toca una insignia para ver cómo se gana', {
        fontFamily: FONT_TEXT,
        fontSize: '24px',
        color: COLORS.ink,
        align: 'center',
        wordWrap: { width: WIDTH - 48 },
      })
      .setOrigin(0.5);

    BADGES.forEach((badge, i) => {
      const earned = game.badges.includes(badge.id);
      const x = 16 + (i % 3) * 122;
      const y = 310 + Math.floor(i / 3) * 190;
      const b = new PixelButton(this, {
        x,
        y,
        w: 114,
        h: 170,
        text: badge.name.replace(' ', '\n'),
        fontSize: 8,
        fill: earned ? COLORS.cream : COLORS.creamDim,
        onTap: () => desc.setText(`${badge.name}: ${earned ? '¡ganada!' : badge.desc}`),
      });
      b.label.setY(136).setLineSpacing(6);
      const icon = this.add.image(57, 64, `badge-${badge.id}`).setScale(8);
      if (!earned) icon.setTint(0xb8ad94).setAlpha(0.6);
      b.addToFace(icon);
    });
  }
}
