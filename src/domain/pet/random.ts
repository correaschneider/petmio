import { nextPattern, optionsFor, type PetTraits, type TraitKey } from './traits';

/** Fonte de aleatoriedade injetável (testes passam uma determinística). */
export type Rng = () => number;

export function pick<T>(items: readonly T[], rng: Rng): T {
  const item = items[Math.floor(rng() * items.length)];
  if (item === undefined) throw new Error('pick() em lista vazia');
  return item;
}

/** Sorteia um valor diferente do atual — com 2–3 opções, sorteio puro repete demais. */
export function pickDifferent<T>(items: readonly T[], current: T, rng: Rng): T {
  const others = items.filter((item) => item !== current);
  return others.length ? pick(others, rng) : current;
}

/** Traços sempre trocados no "Sorprendimi" (estilo e espécie são cara-ou-coroa). */
const ALWAYS_CHANGE: readonly TraitKey[] = [
  'breed',
  'fur',
  'body',
  'eyes',
  'eyeColor',
  'mouth',
  'acc',
  'whiskers',
];

export function surprise(current: PetTraits, rng: Rng = Math.random): PetTraits {
  const style = pick(optionsFor('style', current), rng);
  const species = pick(optionsFor('species', current), rng);
  // Com a espécie nova, a raça atual pode não existir — `pickDifferent` cai para uma válida.
  const next: PetTraits = { ...current, style, species };
  for (const key of ALWAYS_CHANGE) {
    (next as unknown as Record<TraitKey, unknown>)[key] = pickDifferent(
      optionsFor(key, next) as readonly unknown[],
      current[key],
      rng,
    );
  }
  if (next.fur === 'tricolore') next.pattern = nextPattern(current.pattern, rng);
  return next;
}
