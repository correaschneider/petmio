import {
  ACCESSORIES,
  BREEDS_BY_SPECIES,
  DEFAULT_TRAITS,
  EYES,
  FUR_COLORS,
  IRIS_COLORS,
  MOUTHS,
  type PetTraits,
} from '@/domain/pet';
import { renderVector } from '.';
import { VECTOR_MODELS } from './models.generated';

const parseErrors = (svg: string) =>
  new DOMParser().parseFromString(svg, 'image/svg+xml').getElementsByTagName('parsererror').length;

function* combos(): Generator<PetTraits> {
  for (const species of ['cane', 'gatto'] as const)
    for (const breed of BREEDS_BY_SPECIES[species])
      for (const eyes of EYES)
        for (const mouth of MOUTHS)
          for (const acc of ACCESSORIES)
            for (const body of ['atletico', 'robusto'] as const)
              yield { ...DEFAULT_TRAITS, species, breed, eyes, mouth, acc, body };
}

describe('renderVector', () => {
  it('gera SVG bem formado em todas as combinações de raça, olhos, boca, acessório e corpo', () => {
    let n = 0;
    for (const t of combos()) {
      expect(parseErrors(renderVector(t, { nameTag: 'Luna' }))).toBe(0);
      n++;
    }
    expect(n).toBe(6 * 5 * 3 * 4 * 2);
  }, 60_000);

  it('recolore o pelo e a íris', () => {
    const svg = renderVector({ ...DEFAULT_TRAITS, fur: 'grigio', eyeColor: 'verde' });
    expect(svg).toContain(`fill="${FUR_COLORS.grigio.base}"`);
    expect(svg).toContain(`fill="${IRIS_COLORS.verde}"`);
  });

  it('acessórios só aparecem quando escolhidos (e o do próprio modelo sai)', () => {
    // O labrador do guia veio de coleira: sem acessório, nada do vermelho dela.
    const collarRed = VECTOR_MODELS.labrador.layers['neck-accessory'].find(
      (s) => s.role === 'collar',
    )!.fill!;
    expect(renderVector({ ...DEFAULT_TRAITS, acc: 'nessuno' })).not.toContain(collarRed);
    expect(renderVector({ ...DEFAULT_TRAITS, acc: 'collare' })).toContain(collarRed);
    // Bandana do gato transplantada no cão; óculos do beagle no gato.
    const bandana = VECTOR_MODELS.europeo.layers['neck-accessory'].find(
      (s) => s.role === 'bandana',
    )!.fill!;
    expect(renderVector({ ...DEFAULT_TRAITS, acc: 'bandana' })).toContain(bandana);
    const cat: PetTraits = {
      ...DEFAULT_TRAITS,
      species: 'gatto',
      breed: 'europeo',
      acc: 'occhiali',
    };
    expect(renderVector(cat)).toContain('opacity="0.35"');
  });

  it('boca vem do modelo que a tem (língua do beagle num labrador)', () => {
    const tongue = VECTOR_MODELS.beagle.layers.mouth.find(
      (s) => s.fill?.toLowerCase() === '#f79c6f',
    )!;
    const svg = renderVector({ ...DEFAULT_TRAITS, mouth: 'lingua' });
    expect(svg).toContain(tongue.d.slice(0, 40));
    expect(renderVector({ ...DEFAULT_TRAITS, mouth: 'sorriso' })).not.toContain(
      tongue.d.slice(0, 40),
    );
  });

  it('corpo robusto alarga só as camadas do corpo', () => {
    expect(renderVector({ ...DEFAULT_TRAITS, body: 'robusto' })).toMatch(/scale\(1\.14 1\)/);
    expect(renderVector({ ...DEFAULT_TRAITS, body: 'atletico' })).not.toMatch(/scale\(1\.14 1\)/);
  });

  it('persa usa o modelo do europeu enquanto não tem guia próprio', () => {
    const base = { ...DEFAULT_TRAITS, species: 'gatto' as const };
    expect(renderVector({ ...base, breed: 'persiano' })).toBe(
      renderVector({ ...base, breed: 'europeo' }),
    );
  });
});
