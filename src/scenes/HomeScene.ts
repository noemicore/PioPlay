import Phaser from 'phaser';
import { FOODS, type PetState, type StatName, advance, caress, feed, mood, setSleeping, speech } from '../core/pet';
import { loadPet, savePet } from '../core/save';
import { CHICK_FRAMES, type ChickFrame, HEART } from '../sprites/chick';
import { addPixelTexture } from '../sprites/pixels';
import { COLORS, FONT_TEXT, FONT_TITLE, HEIGHT, WIDTH, hex } from '../theme';

const SCALE = 12; // 16 px × 12 = 192 px en pantalla
const SAVE_EVERY_MS = 5000;

const STATS: { key: StatName; label: string; color: string }[] = [
  { key: 'food', label: 'COMIDA', color: COLORS.food },
  { key: 'joy', label: 'ALEGRÍA', color: COLORS.joy },
  { key: 'energy', label: 'ENERGÍA', color: COLORS.energy },
];

interface Button {
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

export class HomeScene extends Phaser.Scene {
  private pet!: PetState;
  private reaction: { frame: ChickFrame; text: string; until: number } | null = null;
  private lastSave = 0;

  private sky!: Phaser.GameObjects.Rectangle;
  private grass!: Phaser.GameObjects.Rectangle;
  private grassTop!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private moodText!: Phaser.GameObjects.Text;
  private segments: Record<StatName, Phaser.GameObjects.Rectangle[]> = { food: [], joy: [], energy: [] };
  private chick!: Phaser.GameObjects.Image;
  private bubble!: Phaser.GameObjects.Text;
  private sleepButton!: Button;

  constructor() {
    super('home');
  }

  create(): void {
    for (const [key, rows] of Object.entries(CHICK_FRAMES)) addPixelTexture(this, key, rows);
    addPixelTexture(this, 'heart', HEART);

    this.pet = advance(loadPet(localStorage, Date.now()), Date.now(), true);

    this.sky = this.add.rectangle(0, 0, WIDTH, HEIGHT, hex(COLORS.daySky)).setOrigin(0);
    this.grass = this.add.rectangle(0, 560, WIDTH, HEIGHT - 560, hex(COLORS.dayGrass)).setOrigin(0);
    this.grassTop = this.add.rectangle(0, 560, WIDTH, 8, hex(COLORS.dayGrassTop)).setOrigin(0);

    this.title = this.add.text(24, 56, this.pet.name.toUpperCase(), { fontFamily: FONT_TITLE, fontSize: '22px', color: COLORS.ink });
    this.moodText = this.add.text(WIDTH - 24, 60, '', { fontFamily: FONT_TEXT, fontSize: '24px', color: COLORS.ink }).setOrigin(1, 0);

    this.createStats();
    this.createChick();
    this.createButtons();

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() });
    // Al volver a la app, aplicar el tiempo que estuvo cerrada; al salir, guardar.
    const onVisibility = () => {
      if (document.hidden) this.save();
      else this.setPet(advance(this.pet, Date.now(), true));
    };
    document.addEventListener('visibilitychange', onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.removeEventListener('visibilitychange', onVisibility));

    this.render();
  }

  private createStats(): void {
    STATS.forEach((stat, i) => {
      const y = 110 + i * 40;
      this.add.rectangle(16, y - 6, WIDTH - 32, 34, hex(COLORS.cream)).setOrigin(0).setStrokeStyle(3, hex(COLORS.ink));
      const label = this.add.text(28, y, stat.label, { fontFamily: FONT_TITLE, fontSize: '10px', color: COLORS.ink });
      label.setY(y + 4);
      for (let s = 0; s < 10; s++) {
        const seg = this.add.rectangle(140 + s * 22, y + 2, 18, 18, hex(COLORS.creamDim)).setOrigin(0);
        this.segments[stat.key].push(seg);
      }
    });
  }

  private createChick(): void {
    this.chick = this.add.image(WIDTH / 2, 470, 'chick-idle').setScale(SCALE).setOrigin(0.5, 1);
    this.chick.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onCaress());
    // Respira suavemente, como en el prototipo.
    this.tweens.add({ targets: this.chick, scaleX: SCALE * 1.03, scaleY: SCALE * 0.97, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.bubble = this.add
      .text(WIDTH / 2, 248, '', {
        fontFamily: FONT_TEXT,
        fontSize: '28px',
        color: COLORS.ink,
        backgroundColor: COLORS.cream,
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5);
  }

  private createButtons(): void {
    const corn = FOODS[0];
    this.makeButton(24, 620, 160, 'DAR MAÍZ', () => this.onFeed(corn));
    this.sleepButton = this.makeButton(WIDTH - 24 - 160, 620, 160, 'DORMIR', () => this.onToggleSleep());
    this.add
      .text(WIDTH / 2, 720, 'Toca a Pío para acariciarlo', { fontFamily: FONT_TEXT, fontSize: '22px', color: COLORS.cream })
      .setOrigin(0.5);
  }

  private makeButton(x: number, y: number, w: number, text: string, onTap: () => void): Button {
    this.add.rectangle(x, y + 5, w, 60, hex(COLORS.ink)).setOrigin(0);
    const bg = this.add.rectangle(x, y, w, 60, hex(COLORS.yellow)).setOrigin(0).setStrokeStyle(3, hex(COLORS.ink));
    const label = this.add.text(x + w / 2, y + 30, text, { fontFamily: FONT_TITLE, fontSize: '11px', color: COLORS.ink }).setOrigin(0.5);
    const press = (down: boolean) => {
      bg.setY(down ? y + 3 : y);
      label.setY(down ? y + 33 : y + 30);
    };
    bg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => press(true))
      .on('pointerout', () => press(false))
      .on('pointerup', () => {
        press(false);
        onTap();
      });
    return { bg, label };
  }

  private onFeed(food: (typeof FOODS)[number]): void {
    const result = feed(this.pet, food);
    if (!result.ok) {
      this.react('chick-idle', result.reason === 'lleno' ? '¡Estoy lleno!' : 'Shh… duerme');
      return;
    }
    this.setPet(result.pet);
    this.react('chick-happy', '¡Ñam ñam!');
    this.hop();
  }

  private onCaress(): void {
    if (this.pet.sleeping) return;
    this.setPet(caress(this.pet));
    this.react('chick-happy', '¡Te quiero!');
    this.hop();
    this.floatHeart();
  }

  private onToggleSleep(): void {
    this.reaction = null;
    this.setPet(setSleeping(this.pet, !this.pet.sleeping));
  }

  private react(frame: ChickFrame, text: string): void {
    this.reaction = { frame, text, until: this.time.now + 1300 };
    this.render();
  }

  private hop(): void {
    this.tweens.add({ targets: this.chick, y: 446, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
  }

  private floatHeart(): void {
    const heart = this.add.image(WIDTH / 2 + 70, 300, 'heart').setScale(5);
    this.tweens.add({ targets: heart, y: 240, alpha: 0, duration: 900, onComplete: () => heart.destroy() });
  }

  private setPet(pet: PetState): void {
    this.pet = pet;
    this.save();
    this.render();
  }

  private tick(): void {
    this.pet = advance(this.pet, Date.now());
    if (this.reaction && this.time.now > this.reaction.until) this.reaction = null;
    if (Date.now() - this.lastSave > SAVE_EVERY_MS) this.save();
    this.render();
  }

  private save(): void {
    savePet(localStorage, this.pet);
    this.lastSave = Date.now();
  }

  private render(): void {
    const night = this.pet.sleeping;
    this.sky.setFillStyle(hex(night ? COLORS.nightSky : COLORS.daySky));
    this.grass.setFillStyle(hex(night ? COLORS.nightGrass : COLORS.dayGrass));
    this.grassTop.setFillStyle(hex(night ? COLORS.nightGrassTop : COLORS.dayGrassTop));
    const textColor = night ? COLORS.cream : COLORS.ink;
    this.title.setColor(textColor);
    this.moodText.setColor(textColor).setText(mood(this.pet));

    for (const stat of STATS) {
      const lit = Math.round(this.pet[stat.key] / 10);
      this.segments[stat.key].forEach((seg, i) => seg.setFillStyle(hex(i < lit ? stat.color : COLORS.creamDim)));
    }

    const frame: ChickFrame = this.reaction?.frame ?? (night ? 'chick-sleep' : 'chick-idle');
    this.chick.setTexture(frame);
    this.bubble.setText(this.reaction?.text ?? speech(this.pet));
    this.sleepButton.label.setText(night ? 'DESPERTAR' : 'DORMIR');
  }
}
