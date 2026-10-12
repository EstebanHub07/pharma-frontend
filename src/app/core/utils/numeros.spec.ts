import { describe, expect, it } from 'vitest';
import { redondear } from './numeros';

describe('redondear', () => {
  it('conserva dos decimales para importes de venta', () => {
    expect(redondear(12.345)).toBe(12.35);
  });
});
