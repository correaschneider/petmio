import { BREEDS_BY_SPECIES, DEFAULT_TRAITS, optionsFor, withTrait } from '.';

describe('withTrait', () => {
  it('trocar a espécie leva a raça para a primeira da nova espécie', () => {
    const cat = withTrait(DEFAULT_TRAITS, 'species', 'gatto');
    expect(cat.species).toBe('gatto');
    expect(cat.breed).toBe(BREEDS_BY_SPECIES.gatto[0]);
  });

  it('reescolher a mesma espécie não reseta a raça', () => {
    const beagle = withTrait(DEFAULT_TRAITS, 'breed', 'beagle');
    expect(withTrait(beagle, 'species', 'cane')).toBe(beagle);
  });

  it('ignora raça de outra espécie', () => {
    expect(withTrait(DEFAULT_TRAITS, 'breed', 'siamese')).toBe(DEFAULT_TRAITS);
  });

  it('não muta o objeto original', () => {
    const next = withTrait(DEFAULT_TRAITS, 'fur', 'nero');
    expect(next.fur).toBe('nero');
    expect(DEFAULT_TRAITS.fur).toBe('dorato');
  });
});

describe('optionsFor', () => {
  it('raças dependem da espécie', () => {
    expect(optionsFor('breed', { species: 'cane' })).toEqual(['labrador', 'beagle', 'pug']);
    expect(optionsFor('breed', { species: 'gatto' })).toEqual(['europeo', 'siamese', 'persiano']);
  });
});
