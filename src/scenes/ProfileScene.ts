import Phaser from 'phaser';
import { setSoundEnabled, sfx } from '../audio';
import { BADGES, MAX_NAME, rename, setSetting } from '../core/game';
import { askNotificationPermission } from '../native';
import { chickKey } from '../sprites/chick';
import { getGame, setGame } from '../store';
import { COLORS, FONT_TEXT, FONT_TITLE, HEIGHT, WIDTH, hex, pixelText } from '../theme';
import { PixelButton } from '../ui';

/** Perfil local: nombre, racha, monedas, insignias y ajustes. Sin cuentas ni ranking (fase 2). */
export class ProfileScene extends Phaser.Scene {
  private nameText!: Phaser.GameObjects.Text;
  private soundButton!: PixelButton;
  private notifButton!: PixelButton;
  private nameForm: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('profile');
  }

  create(): void {
    this.nameForm = null;
    const game = getGame();
    this.add.rectangle(0, 0, WIDTH, HEIGHT, hex(COLORS.cream)).setOrigin(0);
    new PixelButton(this, { x: 16, y: 36, w: 104, h: 44, text: 'VOLVER', fontSize: 10, onTap: () => this.back() });
    this.add.text(WIDTH - 20, 50, 'MI PERFIL', { fontFamily: FONT_TITLE, fontSize: '12px', color: COLORS.ink }).setOrigin(1, 0);

    this.add.rectangle(16, 100, WIDTH - 32, 150, hex(COLORS.yellow)).setOrigin(0).setStrokeStyle(3, hex(COLORS.ink));
    this.add.image(84, 175, chickKey('happy', game.outfit)).setScale(7);
    this.nameText = this.add.text(150, 120, pixelText(game.pet.name), { fontFamily: FONT_TITLE, fontSize: '14px', color: COLORS.ink });
    const days = game.streak.count;
    this.add.text(150, 150, `Racha: ${days} ${days === 1 ? 'día' : 'días'}\nMonedas: ${game.coins}\nInsignias: ${game.badges.length} de ${BADGES.length}`, {
      fontFamily: FONT_TEXT,
      fontSize: '24px',
      color: COLORS.ink,
      lineSpacing: 2,
    });

    this.add.text(16, 270, 'INSIGNIAS', { fontFamily: FONT_TITLE, fontSize: '12px', color: COLORS.ink });
    const desc = this.add
      .text(WIDTH / 2, 600, 'Toca una insignia para ver cómo se gana', {
        fontFamily: FONT_TEXT,
        fontSize: '22px',
        color: COLORS.ink,
        align: 'center',
        wordWrap: { width: WIDTH - 40 },
      })
      .setOrigin(0.5);

    BADGES.forEach((badge, i) => {
      const earned = game.badges.includes(badge.id);
      const b = new PixelButton(this, {
        x: 16 + (i % 3) * 122,
        y: 298 + Math.floor(i / 3) * 136,
        w: 114,
        h: 124,
        text: badge.name.replace(' ', '\n'),
        fontSize: 8,
        fill: earned ? COLORS.cream : COLORS.creamDim,
        onTap: () => {
          sfx('tap');
          desc.setText(`${badge.name}: ${earned ? '¡ganada!' : badge.desc}`);
        },
      });
      b.label.setY(98).setLineSpacing(6);
      const icon = this.add.image(57, 46, `badge-${badge.id}`).setScale(6);
      if (!earned) icon.setTint(0xb8ad94).setAlpha(0.6);
      b.addToFace(icon);
    });

    this.add.text(16, 650, 'AJUSTES', { fontFamily: FONT_TITLE, fontSize: '12px', color: COLORS.ink });
    this.soundButton = new PixelButton(this, { x: 16, y: 680, w: 114, h: 64, fontSize: 9, onTap: () => this.toggle('sound') });
    this.notifButton = new PixelButton(this, { x: 138, y: 680, w: 114, h: 64, fontSize: 9, onTap: () => this.toggle('notifications') });
    new PixelButton(this, { x: 260, y: 680, w: 114, h: 64, text: 'CAMBIAR\nNOMBRE', fontSize: 9, fill: COLORS.cream, onTap: () => this.openNameForm() }).label.setLineSpacing(6);
    this.add
      .text(WIDTH / 2, 800, 'Ranking y amigos llegarán más adelante', { fontFamily: FONT_TEXT, fontSize: '20px', color: '#8a7b5c' })
      .setOrigin(0.5);
    this.renderSettings();
  }

  /** Para el botón Atrás de Android: cierra el formulario o vuelve a Pío. */
  back(): void {
    if (this.nameForm) {
      this.closeNameForm();
      return;
    }
    sfx('tap');
    this.scene.start('home');
  }

  private toggle(key: 'sound' | 'notifications'): void {
    const game = getGame();
    const on = !game.settings[key];
    setGame(setSetting(game, key, on));
    if (key === 'sound') setSoundEnabled(on);
    if (key === 'notifications' && on) void askNotificationPermission();
    sfx('tap');
    this.renderSettings();
  }

  private renderSettings(): void {
    const { settings } = getGame();
    this.soundButton.setText(`SONIDO\n\n${settings.sound ? 'SÍ' : 'NO'}`).setFill(settings.sound ? COLORS.yellow : COLORS.creamDim);
    this.notifButton.setText(`AVISOS\n\n${settings.notifications ? 'SÍ' : 'NO'}`).setFill(settings.notifications ? COLORS.yellow : COLORS.creamDim);
  }

  private openNameForm(): void {
    if (this.nameForm) return;
    sfx('tap');
    const shade = this.add.rectangle(0, 0, WIDTH, HEIGHT, hex(COLORS.ink), 0.6).setOrigin(0).setInteractive();
    const panel = this.add.rectangle(WIDTH / 2, 420, 330, 250, hex(COLORS.cream)).setStrokeStyle(4, hex(COLORS.ink));
    const title = this.add.text(WIDTH / 2, 330, 'NUEVO NOMBRE', { fontFamily: FONT_TITLE, fontSize: '12px', color: COLORS.ink }).setOrigin(0.5);

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = MAX_NAME;
    input.value = getGame().pet.name;
    input.setAttribute('aria-label', 'Nuevo nombre');
    input.autocomplete = 'off';
    Object.assign(input.style, {
      width: '240px',
      height: '52px',
      boxSizing: 'border-box',
      padding: '0 14px',
      border: `3px solid ${COLORS.ink}`,
      background: '#ffffff',
      color: COLORS.ink,
      fontFamily: FONT_TEXT,
      fontSize: '30px',
      outline: 'none',
      borderRadius: '0',
    } satisfies Partial<CSSStyleDeclaration>);
    const dom = this.add.dom(WIDTH / 2, 395, input);

    const save = () => {
      setGame(rename(getGame(), input.value));
      this.nameText.setText(pixelText(getGame().pet.name));
      sfx('pio');
      this.closeNameForm();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') save();
    });
    const cancel = new PixelButton(this, { x: WIDTH / 2 - 150, y: 456, w: 140, h: 52, text: 'CANCELAR', fontSize: 9, fill: COLORS.cream, onTap: () => this.closeNameForm() });
    const ok = new PixelButton(this, { x: WIDTH / 2 + 10, y: 456, w: 140, h: 52, text: 'GUARDAR', fontSize: 9, onTap: save });
    this.nameForm = this.add.container(0, 0, [shade, panel, title, dom, cancel, ok]).setDepth(50);
    input.focus();
  }

  private closeNameForm(): void {
    this.nameForm?.destroy();
    this.nameForm = null;
  }
}
