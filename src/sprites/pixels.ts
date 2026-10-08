import type Phaser from 'phaser';

// Los sprites se dibujan como en el prototipo: filas de texto donde cada
// carácter es un píxel y la paleta dice de qué color es.

export const PALETTE: Record<string, string> = {
  X: '#5a3a12', // contorno
  Y: '#ffd23f', // plumas
  y: '#f0a500', // sombra de plumas
  O: '#ff8a1f', // pico
  o: '#d9660b', // pico (sombra)
  K: '#2b1d0e', // ojos
  L: '#ff8a1f', // patas
  P: '#ff9fb4', // mejillas
  H: '#ff4d6d', // corazón
  h: '#ffb3c1', // brillo del corazón
};

/** Agrega un contorno alrededor de todo lo que no sea transparente ni patas. */
export function outline(rows: readonly string[]): string[] {
  const grid = rows.map((r) => r.split(''));
  const filled = (r: number, c: number) => {
    const v = grid[r]?.[c];
    return v !== undefined && v !== '.' && v !== 'L';
  };
  return grid.map((row, r) =>
    row
      .map((ch, c) => (ch === '.' && (filled(r - 1, c) || filled(r + 1, c) || filled(r, c - 1) || filled(r, c + 1)) ? 'X' : ch))
      .join(''),
  );
}

/** Crea una textura de Phaser a partir de filas de píxeles. */
export function addPixelTexture(scene: Phaser.Scene, key: string, rows: readonly string[]): void {
  if (scene.textures.exists(key)) return;
  const h = rows.length;
  const w = rows[0].length;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = PALETTE[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    });
  });
  tex.refresh();
}
