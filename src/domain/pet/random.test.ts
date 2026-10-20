import { DEFAULT_TRAITS, isValidBreed, pickDifferent, surprise, type PetTraits } from '.';

/** RNG determinístico (LCG) para os testes. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

describe('pickDifferent', () => {
  it('nunca devolve o valor atual quando há alternativa', () => {
    const rng = seeded(1);
    for (let i = 0; i < 200; i++) expect(pickDifferent(['a', 'b'], 'a', rng)).toBe('b');
  });

  it('devolve o atual se for a única opção', () => {
    expect(pickDifferent(['a'], 'a', Math.random)).toBe('a');
  });
});

describe('surprise', () => {
  it('troca todos os traços "sempre trocados" e mantém a raça válida', () => {
    const rng = seeded(42);
    let current: PetTraits = DEFAULT_TRAITS;
    for (let i = 0; i < 300; i++) {
      const next = surprise(current, rng);
      expect(isValidBreed(next.species, next.breed)).toBe(true);
      for (const k of ['fur', 'body', 'eyes', 'eyeColor', 'mouth', 'acc'] as const) {
        expect(next[k]).not.toBe(current[k]);
      }
      current = next;
    }
  });
});
