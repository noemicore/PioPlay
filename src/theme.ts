// Colores y fuentes del prototipo de diseño.
export const COLORS = {
  ink: '#2b1d0e',
  cream: '#fff4d6',
  creamDim: '#e7d9b5',
  yellow: '#ffd23f',
  daySky: '#9ee0ff',
  nightSky: '#22285a',
  dayGrass: '#6cc24a',
  dayGrassTop: '#3f8f2f',
  nightGrass: '#2d5a3a',
  nightGrassTop: '#1d3d27',
  food: '#ff8a1f',
  joy: '#ff5fa2',
  energy: '#3b82f6',
} as const;

export const FONT_TITLE = '"Press Start 2P", monospace';
export const FONT_TEXT = '"VT323", monospace';

/** Convierte '#rrggbb' al número que usa Phaser. */
export const hex = (c: string): number => parseInt(c.slice(1), 16);

/** Tamaño lógico de la pantalla (teléfono vertical). */
export const WIDTH = 390;
export const HEIGHT = 844;
