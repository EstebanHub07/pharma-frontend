import { describe, expect, it } from 'vitest';
import { porcentajeDe } from '../../../../core/utils/porcentaje';

describe('porcentajeDe', () => {
  it('calcula una barra proporcional y evita dividir entre cero', () => {
    expect(porcentajeDe(25, 100)).toBe(25);
    expect(porcentajeDe(25, 0)).toBe(0);
  });
});
