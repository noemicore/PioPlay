import type { OutfitId } from '../core/game';
import { outline } from './pixels';

// Pío de frente, 16×16, igual que en el prototipo de diseño.
const BASE = [
  '................',
  '........y.......',
  '......YYYY......',
  '.....YYYYYY.....',
  '....YYYYYYYY....',
  '....YYKYYKYY....',
  '....YPYOOYPY....',
  '....YYYooYYY....',
  '...YYYYYYYYYY...',
  '..yYYYYYYYYYYy..',
  '..yyYYYYYYYYyy..',
  '...yYYYYYYYYy...',
  '....YYYYYYYY....',
  '.....yyyyyy.....',
  '......L..L......',
  '.....LL..LL.....',
];

type Edit = [row: number, col: number, ch: string];

function apply(rows: readonly string[], edits: Edit[]): string[] {
  const grid = rows.map((r) => r.split(''));
  for (const [r, c, ch] of edits) if (grid[r]?.[c] !== undefined) grid[r][c] = ch;
  return grid.map((r) => r.join(''));
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export type ChickFace = 'idle' | 'happy' | 'sleep';

const FACES: Record<ChickFace, Edit[]> = {
  idle: [],
  // Ojos cerrados.
  sleep: [[5, 6, 'Y'], [5, 9, 'Y'], [5, 5, 'K'], [5, 6, 'K'], [5, 9, 'K'], [5, 10, 'K']],
  // Ojos felices (^ ^).
  happy: [[5, 6, 'Y'], [5, 9, 'Y'], [5, 5, 'K'], [4, 6, 'K'], [5, 7, 'K'], [5, 8, 'K'], [4, 9, 'K'], [5, 10, 'K']],
};

// Prendas, copiadas del prototipo.
const OUTFIT_EDITS: Record<OutfitId, Edit[]> = {
  none: [],
  hat: [...range(5, 10).flatMap((c): Edit[] => [[0, c, 'R'], [1, c, 'r']]), ...range(3, 12).map((c): Edit => [2, c, 'R'])],
  bow: [[1, 10, 'B'], [2, 10, 'B'], [3, 10, 'B'], [2, 11, 'b'], [1, 12, 'B'], [2, 12, 'B'], [3, 12, 'B']],
  scarf: [
    ...range(3, 12).map((c): Edit => [8, c, c % 2 ? 'S' : 's']),
    [9, 10, 'S'], [10, 10, 's'], [11, 10, 'S'], [9, 11, 'S'], [10, 11, 's'], [11, 11, 'S'],
  ],
  glasses: [[5, 5, 'g'], [5, 6, 'G'], [6, 5, 'G'], [6, 6, 'G'], [5, 7, 'G'], [5, 8, 'G'], [5, 9, 'g'], [5, 10, 'G'], [6, 9, 'G'], [6, 10, 'G']],
};

export const OUTFIT_IDS = Object.keys(OUTFIT_EDITS) as OutfitId[];
export const FACE_IDS = Object.keys(FACES) as ChickFace[];

export const chickKey = (face: ChickFace, outfit: OutfitId) => `chick-${face}-${outfit}`;

export function chickRows(face: ChickFace, outfit: OutfitId): string[] {
  // Con los ojos cerrados las gafas taparían la cara: no se dibujan.
  const wearGlasses = outfit === 'glasses' && face === 'sleep' ? 'none' : outfit;
  return outline(apply(apply(BASE, FACES[face]), OUTFIT_EDITS[wearGlasses]));
}

export const HEART = ['.HH.HH.', 'HhHHHHH', 'HHHHHHH', '.HHHHH.', '..HHH..', '...H...'];

export const EGG = outline([
  '................',
  '................',
  '......wwww......',
  '.....wwwwww.....',
  '....wwwwwwww....',
  '....wwwwwwww....',
  '...wwwwwwwwww...',
  '...wwYwwwwYww...',
  '...wYYYwwYYYw...',
  '...wwYwwwwYww...',
  '...wwwwwwwwww...',
  '...wwwwwwwwww...',
  '....wwwwwwww....',
  '....cwwwwwwc....',
  '.....cccccc.....',
  '................',
]);

/** Grietas que aparecen en el huevo al tocarlo. */
export const EGG_CRACKS: string[][] = [
  apply(EGG, [[4, 7, 'K'], [5, 8, 'K'], [5, 6, 'K']]),
  apply(EGG, [[4, 7, 'K'], [5, 8, 'K'], [5, 6, 'K'], [6, 9, 'K'], [6, 5, 'K'], [7, 4, 'K'], [7, 10, 'K']]),
];

export const COIN = ['..nnnn..', '.nnmmnn.', 'nnmnnmnn', 'nnmnnmnn', 'nnmnnmnn', 'nnmnnmnn', '.nnmmnn.', '..nnnn..'];

export const FOOD_ICONS: Record<'corn' | 'worm' | 'berry', string[]> = {
  corn: ['...vv...', '..vnnv..', '..nmnn..', '.vnnmnv.', '.vnmnnv.', '..nnmn..', '..vnnv..', '...vv...'],
  worm: ['........', '........', '..pp....', '.pKpp...', '.pppppp.', '....ppp.', '........', '........'],
  berry: ['...vv...', '..vvvv..', '.eeeeee.', '.eweewe.', '.eeeeee.', '..ewee..', '..eeee..', '...ee...'],
};

export const BADGE_ICONS: Record<string, string[]> = {
  fed: FOOD_ICONS.corn,
  happy: ['........', '.HH.HH..', 'HHHHHHH.', 'HHHHHHH.', '.HHHHH..', '..HHH...', '...H....', '........'],
  rested: ['...uuu..', '..uu....', '.uu.....', '.uu..n..', '.uu.....', '.uu.....', '..uu....', '...uuu..'],
  streak7: ['...O....', '..OO....', '..OOO...', '.OOeOO..', '.OennO..', '.OenneO.', '.OOnnOO.', '..OOOO..'],
  fashion: ['..RRRR..', '..RRRR..', '..RRRR..', '..rrrr..', 'RRRRRRRR', '........', '........', '........'],
  gamer: ['...KK...', '...KK...', '....K...', '....K...', '.KKKKKK.', 'KKeKKuKK', 'KKKKKKKK', '.KKKKKK.'],
};

// Pío de lado para Pío corre (14×14), del prototipo.
const SIDE = [
  '..............', '.....YYYY.....', '....YYYYYY....', '....YYYYKYY...', '....YYYYYYOO..', '....YYYYYYO...',
  '..YYYYYYYYY...', '.YYyyYYYYYY...', '.YyyyYYYYYY...', '..YyYYYYYYY...', '...YYYYYYYY...',
  '.....L..L.....', '....LL.LL.....', '..............',
];
export const SIDE_FRAMES = {
  'side-a': outline(SIDE),
  'side-b': outline([...SIDE.slice(0, 11), '......L.L.....', '.....LL.LL....', '..............']),
  // Ojo en X al chocar.
  'side-hit': outline([...SIDE.slice(0, 3), '....YYYYKYK...', ...SIDE.slice(4)]),
};

const LADY = ['..K..K..', '...KK...', '.eeKKee.', 'eKeKKeKe', 'eeeKKeee', 'eKeKKeKe', '.eeKKee.', '..K..K..'];
export const BUG_SPRITES = {
  'bug-lady': LADY,
  'bug-moth': ['uu....uu', 'uuu..uuu', 'uuuKKuuu', '.uuKKuu.', '.ssKKss.', 'sssKKsss', 'ss.KK.ss', '........'],
  'bug-fly': ['........', '.gg..gg.', 'gggKKggg', '.gKKKKg.', '..KRRK..', '..KKKK..', '...KK...', '........'],
  'bug-gold': LADY.map((r) => r.replace(/e/g, 'n').replace(/K/g, 'm')),
};

