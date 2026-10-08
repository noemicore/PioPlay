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

function edit(changes: [row: number, col: number, ch: string][]): string[] {
  const grid = BASE.map((r) => r.split(''));
  for (const [r, c, ch] of changes) grid[r][c] = ch;
  return grid.map((r) => r.join(''));
}

/** Ojos cerrados, como dormido. */
const SLEEP = edit([[5, 6, 'Y'], [5, 9, 'Y'], [5, 5, 'K'], [5, 6, 'K'], [5, 9, 'K'], [5, 10, 'K']]);

/** Ojos felices (^ ^). */
const HAPPY = edit([[5, 6, 'Y'], [5, 9, 'Y'], [5, 5, 'K'], [4, 6, 'K'], [5, 7, 'K'], [5, 8, 'K'], [4, 9, 'K'], [5, 10, 'K']]);

export const CHICK_FRAMES = {
  'chick-idle': outline(BASE),
  'chick-sleep': outline(SLEEP),
  'chick-happy': outline(HAPPY),
} as const;

export type ChickFrame = keyof typeof CHICK_FRAMES;

export const HEART = ['.HH.HH.', 'HhHHHHH', 'HHHHHHH', '.HHHHH.', '..HHH..', '...H...'];
