import Phaser from 'phaser';
import { sfx } from '../audio';
import { BUGS, BUG_TYPES, type BugType, type BugsState, catchBug, newBugs, stepBugs, timeLeft } from '../core/minigames/bugs';
import { chickKey } from '../sprites/chick';
import { getGame } from '../store';
import { COLORS, FONT_TEXT, FONT_TITLE, WIDTH, hex } from '../theme';
import { BOTTOM_TOP, FIELD_H, FIELD_TOP, MinigameScene } from './MinigameScene';

const GRASS = '#9fdc6f';
const FLOWERS: [number, number][] = [[30, 60], [300, 40], [180, 140], [70, 260], [320, 230], [210, 330], [40, 430], [280, 450], [150, 470]];
const TUFTS: [number, number][] = [[110, 40], [250, 110], [20, 170], [140, 230], [350, 330], [90, 360], [230, 410], [340, 480]];

const CHEERS: Record<BugType, string> = {
  lady: '¡Bien!',
  moth: '¡Muy bien!',
  fly: '¡Qué rápido!',
  gold: '¡Uno dorado!',
};

/** Bichos (GDD 4): 30 segundos para tocar insectos. Pío anima desde abajo. */
export class BugsScene extends MinigameScene {
  protected readonly gameId = 'bugs' as const;
  protected readonly title = 'Bichos';
  protected readonly instructions = 'Toca los bichos para\natraparlos antes de que\nse acabe el tiempo.';

  private bugs!: BugsState;
  private sprites = new Map<number, Phaser.GameObjects.Image>();
  private timeBar!: Phaser.GameObjects.Rectangle;
  private timeText!: Phaser.GameObjects.Text;
  private cheer!: Phaser.GameObjects.Text;
  private chick!: Phaser.GameObjects.Image;
  private happyUntil = 0;

  constructor() {
    super('bugs');
  }

  protected createField(): void {
    this.sprites = new Map();
    this.add.rectangle(0, FIELD_TOP, WIDTH, FIELD_H, hex(GRASS)).setOrigin(0);
    const colors = ['f', 'g', 'O'];
    FLOWERS.forEach(([x, y], i) => {
      const c = hex(colors[i % 3] === 'f' ? '#ff5fa2' : colors[i % 3] === 'g' ? '#ffffff' : '#ff8a1f');
      this.add.rectangle(x + 6, FIELD_TOP + y, 6, 18, c).setOrigin(0);
      this.add.rectangle(x, FIELD_TOP + y + 6, 18, 6, c).setOrigin(0);
      this.add.rectangle(x + 6, FIELD_TOP + y + 6, 6, 6, hex(COLORS.yellow)).setOrigin(0);
    });
    for (const [x, y] of TUFTS) {
      for (const [dx, dy] of [[0, 0], [6, 4], [-6, 4]]) this.add.rectangle(x + dx, FIELD_TOP + y + dy, 4, 10, hex('#5aa83a')).setOrigin(0);
    }
    this.timeBar = this.add.rectangle(0, FIELD_TOP, WIDTH, 6, hex(COLORS.yellow)).setOrigin(0).setDepth(5);
    this.timeText = this.add.text(WIDTH - 16, FIELD_TOP + 14, '', { fontFamily: FONT_TEXT, fontSize: '24px', color: COLORS.ink }).setOrigin(1, 0).setDepth(5);

    // Abajo: Pío anima y la tabla de puntos.
    this.add.rectangle(0, BOTTOM_TOP, WIDTH, 844 - BOTTOM_TOP, hex(COLORS.dayGrass)).setOrigin(0);
    this.add.rectangle(0, BOTTOM_TOP, WIDTH, 6, hex(COLORS.dayGrassTop)).setOrigin(0);
    this.chick = this.add.image(70, BOTTOM_TOP + 104, chickKey('idle', getGame().outfit)).setScale(6);
    this.cheer = this.add
      .text(140, BOTTOM_TOP + 50, '', { fontFamily: FONT_TEXT, fontSize: '26px', color: COLORS.ink, backgroundColor: COLORS.cream, padding: { x: 10, y: 4 } })
      .setOrigin(0, 0.5);
    const legend = (Object.keys(BUG_TYPES) as BugType[]).map((t) => `${BUG_TYPES[t].name.split(' ')[0]} +${BUG_TYPES[t].points}`);
    legend.forEach((txt, i) => {
      const x = 140 + (i % 2) * 120;
      const y = BOTTOM_TOP + 100 + Math.floor(i / 2) * 40;
      this.add.image(x, y, `bug-${(Object.keys(BUG_TYPES) as BugType[])[i]}`).setScale(3).setOrigin(0, 0.5);
      this.add.text(x + 30, y, txt, { fontFamily: FONT_TITLE, fontSize: '7px', color: COLORS.ink }).setOrigin(0, 0.5);
    });
  }

  protected resetRound(): void {
    for (const img of this.sprites.values()) img.destroy();
    this.sprites.clear();
    this.bugs = newBugs(Math.random);
    this.happyUntil = 0;
    this.draw();
  }

  protected updateRound(dt: number): void {
    this.bugs = stepBugs(this.bugs, dt, Math.random);
    this.draw();
    if (this.bugs.over) this.endRound();
  }

  protected currentScore(): number {
    return this.bugs.score;
  }

  protected overText(score: number): string {
    const n = this.bugs.caught;
    return `Atrapaste ${n} ${n === 1 ? 'bicho' : 'bichos'} · ${score} puntos`;
  }

  private onCatch(id: number): void {
    if (this.status !== 'play') return;
    const bug = this.bugs.bugs.find((b) => b.id === id);
    const r = catchBug(this.bugs, id, Math.random);
    if (!bug || r.points === 0 || !r.type) return;
    this.bugs = r.state;
    sfx('catch');
    this.happyUntil = this.time.now + 600;
    this.cheer.setText(CHEERS[r.type]);
    const pop = this.add
      .text(bug.x + 10, FIELD_TOP + bug.y + 8, `+${r.points}`, { fontFamily: FONT_TITLE, fontSize: '14px', color: COLORS.ink })
      .setDepth(6);
    this.tweens.add({ targets: pop, y: pop.y - 30, alpha: 0, duration: 700, onComplete: () => pop.destroy() });
    this.tweens.add({ targets: this.chick, y: BOTTOM_TOP + 90, duration: 120, yoyo: true });
    this.draw();
  }

  private draw(): void {
    const alive = new Set<number>();
    for (const b of this.bugs.bugs) {
      alive.add(b.id);
      let img = this.sprites.get(b.id);
      if (!img) {
        img = this.add.image(0, 0, `bug-${b.type}`).setScale(6).setInteractive({ useHandCursor: true });
        // El área de toque es un poco más grande que el bicho, para dedos.
        img.input?.hitArea.setTo(-2, -2, 12, 12);
        const id = b.id;
        img.on('pointerdown', () => this.onCatch(id));
        this.sprites.set(b.id, img);
      }
      const facingLeft = Math.cos(b.angle) < 0;
      img.setPosition(b.x + BUGS.size / 2, FIELD_TOP + b.y + BUGS.size / 2).setFlipX(facingLeft).setAngle(Math.sin(b.angle) * 20);
    }
    for (const [id, img] of this.sprites) {
      if (!alive.has(id)) {
        img.destroy();
        this.sprites.delete(id);
      }
    }
    const left = timeLeft(this.bugs);
    this.timeBar.width = WIDTH * (1 - Math.min(1, this.bugs.time / BUGS.duration));
    this.timeText.setText(`${left} s`);
    const happy = this.time.now < this.happyUntil || this.status === 'over';
    this.chick.setTexture(chickKey(happy ? 'happy' : 'idle', getGame().outfit));
    if (!happy) this.cheer.setText(this.status === 'play' && left <= 5 ? '¡Rápido, rápido!' : '¡Atrápalos!');
  }
}
