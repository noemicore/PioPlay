import Phaser from 'phaser';
import { COLORS, FONT_TITLE, hex, pixelText } from './theme';

export interface ButtonOptions {
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fontSize?: number;
  fill?: string;
  onTap: () => void;
}

/** Botón pixel con sombra que se hunde al tocarlo, como en el prototipo. */
export class PixelButton extends Phaser.GameObjects.Container {
  readonly bg: Phaser.GameObjects.Rectangle;
  readonly label: Phaser.GameObjects.Text;
  private readonly face: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, opts: ButtonOptions) {
    super(scene, opts.x, opts.y);
    const shadow = scene.add.rectangle(0, 5, opts.w, opts.h, hex(COLORS.ink)).setOrigin(0);
    this.bg = scene.add.rectangle(0, 0, opts.w, opts.h, hex(opts.fill ?? COLORS.yellow)).setOrigin(0).setStrokeStyle(3, hex(COLORS.ink));
    this.label = scene.add
      .text(opts.w / 2, opts.h / 2, pixelText(opts.text ?? ''), { fontFamily: FONT_TITLE, fontSize: `${opts.fontSize ?? 11}px`, color: COLORS.ink, align: 'center' })
      .setOrigin(0.5);
    this.face = scene.add.container(0, 0, [this.bg, this.label]);
    this.add([shadow, this.face]);
    this.setSize(opts.w, opts.h);

    const press = (down: boolean) => this.face.setY(down ? 3 : 0);
    this.bg
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => press(true))
      .on('pointerout', () => press(false))
      .on('pointerup', () => {
        press(false);
        opts.onTap();
      });
    scene.add.existing(this);
  }

  /** Agrega algo (un ícono) que se hunde junto con el botón. */
  addToFace(obj: Phaser.GameObjects.GameObject): this {
    this.face.add(obj);
    return this;
  }

  setText(text: string): this {
    this.label.setText(pixelText(text));
    return this;
  }

  setFill(color: string): this {
    this.bg.setFillStyle(hex(color));
    return this;
  }
}

const currentToast = new WeakMap<Phaser.Scene, Phaser.GameObjects.Text>();

/** Mensaje que aparece unos segundos (monedas, insignias). Uno nuevo reemplaza al anterior. */
export function toast(scene: Phaser.Scene, text: string, y = 318): void {
  currentToast.get(scene)?.destroy();
  const t = scene.add
    .text(scene.scale.width / 2, y, text, {
      fontFamily: '"VT323", monospace',
      fontSize: '24px',
      color: COLORS.ink,
      backgroundColor: COLORS.yellow,
      padding: { x: 12, y: 4 },
    })
    .setOrigin(0.5, 0)
    .setDepth(100)
    .setAlpha(0);
  currentToast.set(scene, t);
  scene.tweens.chain({
    targets: t,
    tweens: [
      { alpha: 1, duration: 200 },
      { alpha: 1, duration: 2200 },
      { alpha: 0, duration: 400, onComplete: () => t.destroy() },
    ],
  });
}
