import { describe, expect, it } from 'vitest';
import { coincide } from './texto';

describe('coincide', () => {
  it('busca sin importar mayúsculas ni tildes', () => {
    expect(coincide('cuidado personal', 'Cuidado Pérsonal')).toBe(true);
  });
});
