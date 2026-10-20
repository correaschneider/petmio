import {
  ACCESSORIES,
  BODIES,
  BREEDS_BY_SPECIES,
  EYE_COLORS,
  EYES,
  FURS,
  MOUTHS,
  SPECIES,
  STYLES,
  type Accessory,
  type Body,
  type Breed,
  type EyeColor,
  type Eyes,
  type Fur,
  type Mouth,
  type Species,
  type Style,
} from './catalog';

/** Tudo o que define a aparência do avatar (sem o nome). */
export interface PetTraits {
  style: Style;
  species: Species;
  breed: Breed;
  fur: Fur;
  body: Body;
  eyes: Eyes;
  eyeColor: EyeColor;
  mouth: Mouth;
  acc: Accessory;
}

export type TraitKey = keyof PetTraits;

export const DEFAULT_TRAITS: PetTraits = {
  style: 'cartoon',
  species: 'cane',
  breed: 'labrador',
  fur: 'dorato',
  body: 'atletico',
  eyes: 'rotondi',
  eyeColor: 'marrone',
  mouth: 'sorriso',
  acc: 'nessuno',
};

/** Valores possíveis de cada traço. `breed` depende da espécie atual. */
export function optionsFor<K extends TraitKey>(
  key: K,
  traits: Pick<PetTraits, 'species'>,
): readonly PetTraits[K][] {
  const table: { [P in TraitKey]: readonly PetTraits[P][] } = {
    style: STYLES,
    species: SPECIES,
    breed: BREEDS_BY_SPECIES[traits.species],
    fur: FURS,
    body: BODIES,
    eyes: EYES,
    eyeColor: EYE_COLORS,
    mouth: MOUTHS,
    acc: ACCESSORIES,
  };
  return table[key];
}

export function isValidBreed(species: Species, breed: Breed): boolean {
  return (BREEDS_BY_SPECIES[species] as readonly Breed[]).includes(breed);
}

/**
 * Aplica um traço mantendo a combinação válida: trocar a espécie leva a raça
 * para a primeira da nova espécie; raça de outra espécie é ignorada.
 */
export function withTrait<K extends TraitKey>(
  traits: PetTraits,
  key: K,
  value: PetTraits[K],
): PetTraits {
  if (key === 'species') {
    const species = value as Species;
    if (species === traits.species) return traits;
    return { ...traits, species, breed: BREEDS_BY_SPECIES[species][0] };
  }
  if (key === 'breed' && !isValidBreed(traits.species, value as Breed)) return traits;
  return { ...traits, [key]: value };
}
