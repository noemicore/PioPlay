import Phaser from 'phaser';
import { BADGE_ICONS, BUG_SPRITES, COIN, EGG, EGG_CRACKS, FACE_IDS, FOOD_ICONS, HEART, OUTFIT_IDS, SIDE_FRAMES, chickKey, chickRows } from '../sprites/chick';
import { addPixelTextures } from '../sprites/pixels';
import { getGame } from '../store';

/** Crea todas las texturas y decide si Pío ya nació. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  create(): void {
    const sprites: Record<string, readonly string[]> = {
      heart: HEART,
      coin: COIN,
      egg: EGG,
      'egg-crack-1': EGG_CRACKS[0],
      'egg-crack-2': EGG_CRACKS[1],
      ...SIDE_FRAMES,
      ...BUG_SPRITES,
    };
    for (const face of FACE_IDS) for (const outfit of OUTFIT_IDS) sprites[chickKey(face, outfit)] = chickRows(face, outfit);
    for (const [id, rows] of Object.entries(FOOD_ICONS)) sprites[`food-${id}`] = rows;
    for (const [id, rows] of Object.entries(BADGE_ICONS)) sprites[`badge-${id}`] = rows;
    addPixelTextures(this, sprites);

    this.scene.start(getGame().hatched ? 'home' : 'hatch');
  }
}
