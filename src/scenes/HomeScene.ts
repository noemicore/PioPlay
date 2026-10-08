import Phaser from 'phaser';
import { type ActionResult, BADGES, type BadgeId, type GameState, OUTFITS, buyOutfit, caressPet, checkIn, feedPet, wear } from '../core/game';
import { FOODS, type Food, type StatName, mood, setSleeping, speech } from '../core/pet';
import { type ChickFace, chickKey } from '../sprites/chick';
import { getGame, setGame, tickGame } from '../store';
import { COLORS, FONT_TEXT, FONT_TITLE, HEIGHT, WIDTH, hex, pixelText } from '../theme';
import { PixelButton, toast } from '../ui';

const SCALE = 12; // 16 px × 12 = 192 px en pantalla
const CHICK_Y = 520;
const GROUND_Y = 540;

const STATS: { key: StatName; label: string; color: string }[] = [
  { key: 'food', label: 'COMIDA', color: COLORS.food },
  { key: 'joy', label: 'ALEGRÍA', color: COLORS.joy },
  { key: 'energy', label: 'ENERGÍA', color: COLORS.energy },
];

type Tab = 'food' | 'dress' | 'sleep';
const TABS: { id: Tab; label: string }[] = [
  { id: 'food', label: 'COMIDA' },
  { id: 'dress', label: 'ROPA' },
  { id: 'sleep', label: 'DORMIR' },
];

const FAIL_TEXT: Record<Exclude<ActionResult, { ok: true }>['reason'], string> = {
  dormido: 'Shh… duerme',
  lleno: '¡Estoy lleno!',
  'sin-monedas': 'Faltan monedas…',
  'cansado-de-mimos': 'Ya me mimaste mucho',
  'no-la-tienes': 'Faltan monedas…',
};

export class HomeScene extends Phaser.Scene {
  private tab: Tab = 'food';
  private reaction: { face: ChickFace; text: string; until: number } | null = null;

  private sky!: Phaser.GameObjects.Rectangle;
  private grass!: Phaser.GameObjects.Rectangle;
  private grassTop!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private moodText!: Phaser.GameObjects.Text;
  private coinsText!: Phaser.GameObjects.Text;
  private segments: Record<StatName, Phaser.GameObjects.Rectangle[]> = { food: [], joy: [], energy: [] };
  private chick!: Phaser.GameObjects.Image;
  private bubble!: Phaser.GameObjects.Text;
  private tabButtons = new Map<Tab, PixelButton>();
  private panels = new Map<Tab, Phaser.GameObjects.Container>();
  private outfitButtons = new Map<string, PixelButton>();
  private sleepButton!: PixelButton;

  constructor() {
    super('home');
  }

  create(): void {
    this.segments = { food: [], joy: [], energy: [] };
    this.tabButtons.clear();
    this.panels.clear();
    this.outfitButtons.clear();
    this.reaction = null;

    this.sky = this.add.rectangle(0, 0, WIDTH, HEIGHT, hex(COLORS.daySky)).setOrigin(0);
    this.grass = this.add.rectangle(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y, hex(COLORS.dayGrass)).setOrigin(0);
    this.grassTop = this.add.rectangle(0, GROUND_Y, WIDTH, 8, hex(COLORS.dayGrassTop)).setOrigin(0);

    this.createHeader();
    this.createStats();
    this.createChick();
    this.createTabs();
    this.createFoodPanel();
    this.createDressPanel();
    this.createSleepPanel();

    this.announce(tickGame(true));
    this.dailyCheckIn();

    this.time.addEvent({ delay: 1000, loop: true, callback: () => this.tick() });
    // Al volver a la app se aplica el tiempo que estuvo cerrada.
    const onVisibility = () => {
      if (document.hidden) return;
      this.announce(tickGame(true));
      this.dailyCheckIn();
      this.render();
    };
    document.addEventListener('visibilitychange', onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.removeEventListener('visibilitychange', onVisibility));

    this.render();
  }

  // ---------- construcción ----------

  private createHeader(): void {
    this.title = this.add.text(20, 46, '', { fontFamily: FONT_TITLE, fontSize: '18px', color: COLORS.ink });
    new PixelButton(this, { x: WIDTH - 110, y: 36, w: 92, h: 44, text: 'PERFIL', fontSize: 10, fill: COLORS.cream, onTap: () => this.scene.start('profile') });
    this.moodText = this.add.text(20, 86, '', { fontFamily: FONT_TEXT, fontSize: '24px', color: COLORS.ink });
    this.add.image(WIDTH - 110, 100, 'coin').setScale(3).setOrigin(0, 0.5);
    this.coinsText = this.add.text(WIDTH - 80, 100, '', { fontFamily: FONT_TEXT, fontSize: '28px', color: COLORS.ink }).setOrigin(0, 0.5);
  }

  private createStats(): void {
    STATS.forEach((stat, i) => {
      const y = 128 + i * 40;
      this.add.rectangle(16, y, WIDTH - 32, 34, hex(COLORS.cream)).setOrigin(0).setStrokeStyle(3, hex(COLORS.ink));
      this.add.text(28, y + 11, pixelText(stat.label), { fontFamily: FONT_TITLE, fontSize: '10px', color: COLORS.ink });
      for (let s = 0; s < 10; s++) {
        this.segments[stat.key].push(this.add.rectangle(140 + s * 22, y + 8, 18, 18, hex(COLORS.creamDim)).setOrigin(0));
      }
    });
  }

  private createChick(): void {
    this.chick = this.add.image(WIDTH / 2, CHICK_Y, chickKey('idle', 'none')).setScale(SCALE).setOrigin(0.5, 1);
    this.chick.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.onCaress());
    // Respira suavemente, como en el prototipo.
    this.tweens.add({ targets: this.chick, scaleX: SCALE * 1.03, scaleY: SCALE * 0.97, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.bubble = this.add
      .text(WIDTH / 2, 290, '', { fontFamily: FONT_TEXT, fontSize: '28px', color: COLORS.ink, backgroundColor: COLORS.cream, padding: { x: 14, y: 6 } })
      .setOrigin(0.5);
  }

  private createTabs(): void {
    TABS.forEach((t, i) => {
      const button = new PixelButton(this, { x: 16 + i * 122, y: 558, w: 114, h: 44, text: t.label, fontSize: 10, onTap: () => this.selectTab(t.id) });
      this.tabButtons.set(t.id, button);
    });
  }

  private panel(tab: Tab): Phaser.GameObjects.Container {
    const c = this.add.container(0, 0);
    this.panels.set(tab, c);
    return c;
  }

  private createFoodPanel(): void {
    const panel = this.panel('food');
    FOODS.forEach((food, i) => {
      const b = new PixelButton(this, {
        x: 16 + i * 122,
        y: 626,
        w: 114,
        h: 140,
        text: `${food.name}\n\n${food.cost === 0 ? 'GRATIS' : `${food.cost}`}`,
        fontSize: 10,
        fill: COLORS.cream,
        onTap: () => this.onFeed(food),
      });
      b.label.setY(100);
      b.addToFace(this.add.image(57, 42, `food-${food.id}`).setScale(6));
      if (food.cost > 0) b.addToFace(this.add.image(57 - 22, 116, 'coin').setScale(2));
      panel.add(b);
    });
    panel.add(this.add.text(WIDTH / 2, 800, 'Toca a Pío para acariciarlo', { fontFamily: FONT_TEXT, fontSize: '22px', color: COLORS.cream }).setOrigin(0.5));
  }

  private createDressPanel(): void {
    const panel = this.panel('dress');
    OUTFITS.forEach((outfit, i) => {
      const row = i < 3 ? 0 : 1;
      const col = i < 3 ? i : i - 3;
      const b = new PixelButton(this, {
        x: 16 + col * 122,
        y: 622 + row * 98,
        w: 114,
        h: 86,
        fontSize: 9,
        onTap: () => this.onOutfit(outfit.id),
      });
      this.outfitButtons.set(outfit.id, b);
      panel.add(b);
    });
  }

  private createSleepPanel(): void {
    const panel = this.panel('sleep');
    this.sleepButton = new PixelButton(this, { x: 16, y: 640, w: WIDTH - 32, h: 96, fontSize: 14, onTap: () => this.onToggleSleep() });
    panel.add(this.sleepButton);
    panel.add(
      this.add
        .text(WIDTH / 2, 780, 'Dormido recupera energía\ny casi no le da hambre', { fontFamily: FONT_TEXT, fontSize: '22px', color: COLORS.cream, align: 'center' })
        .setOrigin(0.5),
    );
  }

  // ---------- acciones ----------

  private selectTab(tab: Tab): void {
    this.tab = tab;
    this.render();
  }

  /** Aplica una acción: si sale bien guarda y anuncia insignias; si no, Pío lo dice. */
  private apply(result: ActionResult, success?: { face: ChickFace; text: string }): boolean {
    if (!result.ok) {
      this.react('idle', FAIL_TEXT[result.reason]);
      return false;
    }
    this.announce(setGame(result.state));
    if (success) this.react(success.face, success.text);
    else this.render();
    return true;
  }

  private onFeed(food: Food): void {
    if (this.apply(feedPet(getGame(), food), { face: 'happy', text: '¡Ñam ñam!' })) this.hop();
  }

  private onCaress(): void {
    if (getGame().pet.sleeping) return;
    if (this.apply(caressPet(getGame(), Date.now()), { face: 'happy', text: '¡Te quiero!' })) {
      this.hop();
      this.floatHeart();
    }
  }

  private onOutfit(id: GameState['outfit']): void {
    const game = getGame();
    const bought = buyOutfit(game, id);
    if (!bought.ok) {
      this.apply(bought);
      return;
    }
    const isNew = !game.owned.includes(id);
    const text = id === 'none' ? '¡Así estoy bien!' : isNew ? '¡Gracias! ¿Me veo bien?' : '¿Me veo bien?';
    this.apply(wear(bought.state, id), { face: 'happy', text });
  }

  private onToggleSleep(): void {
    const game = getGame();
    this.reaction = null;
    this.apply({ ok: true, state: { ...game, pet: setSleeping(game.pet, !game.pet.sleeping) } });
  }

  private dailyCheckIn(): void {
    const { state, reward } = checkIn(getGame(), Date.now());
    if (reward === 0) return;
    this.announce(setGame(state));
    const days = state.streak.count;
    toast(this, `+${reward} monedas · racha de ${days} ${days === 1 ? 'día' : 'días'}`);
  }

  private announce(badges: BadgeId[]): void {
    badges.forEach((id, i) => {
      const badge = BADGES.find((b) => b.id === id);
      if (badge) this.time.delayedCall(i * 2900, () => toast(this, `¡Insignia nueva: ${badge.name}!`));
    });
  }

  private react(face: ChickFace, text: string): void {
    this.reaction = { face, text, until: this.time.now + 1500 };
    this.render();
  }

  private hop(): void {
    this.tweens.add({ targets: this.chick, y: CHICK_Y - 24, duration: 140, yoyo: true, ease: 'Quad.easeOut' });
  }

  private floatHeart(): void {
    const heart = this.add.image(WIDTH / 2 + 70, 360, 'heart').setScale(5);
    this.tweens.add({ targets: heart, y: 300, alpha: 0, duration: 900, onComplete: () => heart.destroy() });
  }

  private tick(): void {
    this.announce(tickGame());
    if (this.reaction && this.time.now > this.reaction.until) this.reaction = null;
    this.render();
  }

  // ---------- dibujo ----------

  private render(): void {
    const game = getGame();
    const { pet } = game;
    const night = pet.sleeping;
    this.sky.setFillStyle(hex(night ? COLORS.nightSky : COLORS.daySky));
    this.grass.setFillStyle(hex(night ? COLORS.nightGrass : COLORS.dayGrass));
    this.grassTop.setFillStyle(hex(night ? COLORS.nightGrassTop : COLORS.dayGrassTop));
    const textColor = night ? COLORS.cream : COLORS.ink;
    this.title.setColor(textColor).setText(pixelText(pet.name));
    this.moodText.setColor(textColor).setText(mood(pet));
    this.coinsText.setColor(textColor).setText(String(game.coins));

    for (const stat of STATS) {
      const lit = Math.round(pet[stat.key] / 10);
      this.segments[stat.key].forEach((seg, i) => seg.setFillStyle(hex(i < lit ? stat.color : COLORS.creamDim)));
    }

    const face: ChickFace = this.reaction?.face ?? (night ? 'sleep' : 'idle');
    this.chick.setTexture(chickKey(face, game.outfit));
    this.bubble.setText(this.reaction?.text ?? speech(pet));

    for (const [id, button] of this.tabButtons) button.setFill(id === this.tab ? COLORS.yellow : COLORS.cream);
    for (const [id, panel] of this.panels) panel.setVisible(id === this.tab);

    for (const outfit of OUTFITS) {
      const button = this.outfitButtons.get(outfit.id);
      if (!button) continue;
      const owned = game.owned.includes(outfit.id);
      const worn = game.outfit === outfit.id;
      button.setText(owned ? outfit.name : `${outfit.name}\n\n${outfit.cost} monedas`);
      button.setFill(worn ? COLORS.yellow : owned ? COLORS.cream : COLORS.creamDim);
    }
    this.sleepButton.setText(night ? 'DESPERTAR' : 'DORMIR');
  }
}
