import { MAX_NAME_LENGTH, normalizeName } from '.';

describe('normalizeName', () => {
  it('apara espaços e corta no limite', () => {
    expect(normalizeName('  Bruno  ')).toBe('Bruno');
    expect(normalizeName('x'.repeat(30))).toHaveLength(MAX_NAME_LENGTH);
  });

  it('não parte emoji/acentos no meio', () => {
    expect(normalizeName('Totò🐶')).toBe('Totò🐶');
  });
});
