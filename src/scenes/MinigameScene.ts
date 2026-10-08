import Phaser from 'phaser';
import { playMusic, sfx } from '../audio';
import { type MinigameId, type Reward, canPlay, finishMinigame } from '../core/game';
import { getGame, setGame } from '../store';
import { COLORS, FONT_TEXT, FONT_TITLE, HEIGHT, WIDTH, hex, pixelText } from '../theme';
import { PixelButton, toast } from '../ui';

export const FIELD_TOP = 112;
export const FIELD_H = 520;
export const BOTTOM_TOP = FIELD_TOP + FIELD_H;

type Status = 'ready' | 'play' | 'over';

/**
 * Lo que comparten los minijuegos: barra superior con SALIR y puntaje,
 * menú de inicio y de fin, y la recompensa al terminar (GDD, sección 4).
 */
export abstract class MinigameScene extends Phaser.Scene {
  protected status: Status = 'ready';
  protected abstract readonly gameId: MinigameId;
  protected abstract readonly title: string;
  protected abstract readonly instructions: string;

  private scoreText!: Phaser.GameObjects.Text;
  private menu!: Phaser.GameObjects.Container;
  private menuShade!: Phaser.GameObjects.Rectangle;
  private menuTitle!: Phaser.GameObjects.Text;
  private menuText!: Phaser.GameObjects.Text;
  private menuButton!: PixelButton;
  private playedRounds = 0;

  /** Dibuja el campo de juego (entre FIELD_TOP y BOTTOM_TOP). */
  protected abstract createField(): void;
  /** Reinicia el estado para una partida nueva. */
  protected abstract resetRound(): void;
  /** Avanza la partida; llamar a `endRound` cuando termine. */
  protected abstract updateRound(dt: number): void;
  protected abstract currentScore(): number;
  /** Texto del menú final, antes de la recompensa. */
  protected abstract overText(score: number): string;

  create(): void {
    this.status = 'ready';
    this.playedRounds = 0;
    this.add.rectangle(0, 0, WIDTH, HEIGHT, hex(COLORS.ink)).setOrigin(0);
    this.createField();
    this.createTopBar();
    this.createMenu();
    this.resetRound();
    this.showMenu(this.title, this.instructions, 'JUGAR');
    playMusic('game');
  }

  update(_time: number, deltaMs: number): void {
    if (this.status !== 'play') return;
    this.updateRound(Math.min(0.033, deltaMs / 1000));
    this.scoreText.setText(String(this.currentScore()));
  }

  private createTopBar(): void {
    new PixelButton(this, { x: 12, y: 54, w: 88, h: 44, text: 'SALIR', fontSize: 9, fill: COLORS.cream, onTap: () => this.back() }).setDepth(20);
    this.add.text(WIDTH / 2, 76, pixelText(this.title), { fontFamily: FONT_TITLE, fontSize: '11px', color: COLORS.yellow }).setOrigin(0.5);
    this.scoreText = this.add.text(WIDTH - 16, 76, '0', { fontFamily: FONT_TEXT, fontSize: '32px', color: COLORS.cream }).setOrigin(1, 0.5);
  }

  private createMenu(): void {
    const shade = this.add.rectangle(0, FIELD_TOP, WIDTH, FIELD_H, hex(COLORS.ink), 0.55).setOrigin(0).setInteractive();
    this.menuShade = shade;
    const panel = this.add.rectangle(WIDTH / 2, FIELD_TOP + FIELD_H / 2, 310, 290, hex(COLORS.cream)).setStrokeStyle(4, hex(COLORS.ink));
    this.menuTitle = this.add
      .text(WIDTH / 2, FIELD_TOP + 160, '', { fontFamily: FONT_TITLE, fontSize: '15px', color: COLORS.ink, align: 'center' })
      .setOrigin(0.5);
    this.menuText = this.add
      .text(WIDTH / 2, FIELD_TOP + 250, '', { fontFamily: FONT_TEXT, fontSize: '24px', color: COLORS.ink, align: 'center', lineSpacing: -2 })
      .setOrigin(0.5);
    this.menuButton = new PixelButton(this, { x: WIDTH / 2 - 100, y: FIELD_TOP + 316, w: 200, h: 54, fontSize: 12, onTap: () => this.startRound() });
    this.menu = this.add.container(0, 0, [shade, panel, this.menuTitle, this.menuText, this.menuButton]).setDepth(10);
  }

  private showMenu(title: string, text: string, button: string | null): void {
    this.menuTitle.setText(pixelText(title));
    this.menuText.setText(text);
    this.menuButton.setVisible(button !== null);
    if (button) this.menuButton.setText(button);
    this.setMenuVisible(true);
  }

  /** Oculto, el menú tampoco debe recibir toques (si no, tapa el juego). */
  private setMenuVisible(visible: boolean): void {
    this.menu.setVisible(visible);
    if (this.menuShade.input) this.menuShade.input.enabled = visible;
    if (this.menuButton.bg.input) this.menuButton.bg.input.enabled = visible && this.menuButton.visible;
  }

  private startRound(): void {
    const check = canPlay(getGame());
    if (!check.ok) {
      sfx('error');
      this.showMenu('PÍO ESTÁ CANSADO', 'Déjalo dormir un rato\ny vuelvan a jugar.', null);
      return;
    }
    sfx('tap');
    this.resetRound();
    this.setMenuVisible(false);
    this.status = 'play';
  }

  /** Termina la partida: guarda la recompensa y muestra el menú final. */
  protected endRound(): void {
    if (this.status !== 'play') return;
    this.status = 'over';
    this.playedRounds++;
    const score = this.currentScore();
    const { state, reward } = finishMinigame(getGame(), this.gameId, score);
    const badges = setGame(state);
    this.showMenu(reward.best ? '¡NUEVO RÉCORD!' : '¡FIN!', `${this.overText(score)}\n${rewardText(reward)}`, 'OTRA VEZ');
    if (reward.coins > 0) this.time.delayedCall(250, () => sfx('coin'));
    if (badges.includes('gamer')) toast(this, '¡Insignia nueva: Gamer!', 20);
  }

  /** SALIR o el botón Atrás de Android: vuelve con Pío. */
  back(): void {
    sfx('tap');
    this.scene.start('home', { played: this.playedRounds > 0 });
  }
}

function rewardText(r: Reward): string {
  return `+${r.joy} alegría · +${r.coins} ${r.coins === 1 ? 'moneda' : 'monedas'}`;
}
