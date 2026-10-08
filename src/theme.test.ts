import { describe, expect, it } from 'vitest';
import { pixelText } from './theme';

describe('pixelText', () => {
  it('quita las tildes que la fuente pixel dibuja mal pero conserva la Ñ', () => {
    expect(pixelText('Alegría')).toBe('ALEGRIA');
    expect(pixelText('Moño')).toBe('MOÑO');
    expect(pixelText('Súper Pío')).toBe('SUPER PIO');
  });
});
