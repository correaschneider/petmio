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
import { FUR_PALETTE } from '../palette';
import { PARTS } from './parts.generated';

/** Trecho do desenho de uma peça (o 1º `d`), para achá-la no SVG final (as cores mudam, o desenho não). */
const piece = (name: string) => PARTS[name]!.match(/ d="([^"]{60})/)![1]!;

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

  it('acessórios só aparecem quando escolhidos', () => {
    expect(renderVector({ ...DEFAULT_TRAITS, acc: 'nessuno' })).not.toContain(
      piece('cane-acessorio-coleira'),
    );
    expect(renderVector({ ...DEFAULT_TRAITS, acc: 'collare' })).toContain(
      piece('cane-acessorio-coleira'),
    );
    expect(renderVector({ ...DEFAULT_TRAITS, acc: 'bandana' })).toContain(
      piece('cane-acessorio-bandana'),
    );
    const cat: PetTraits = {
      ...DEFAULT_TRAITS,
      species: 'gatto',
      breed: 'europeo',
      acc: 'occhiali',
    };
    expect(renderVector(cat)).toContain('opacity="0.35"');
    expect(renderVector({ ...cat, acc: 'nessuno' })).not.toContain('opacity="0.35"');
  });

  it('cada boca usa a sua peça', () => {
    expect(renderVector({ ...DEFAULT_TRAITS, mouth: 'lingua' })).toContain(
      piece('cane-boca-lingua'),
    );
    expect(renderVector({ ...DEFAULT_TRAITS, mouth: 'sorriso' })).not.toContain(
      piece('cane-boca-lingua'),
    );
    expect(renderVector({ ...DEFAULT_TRAITS, mouth: 'sorriso' })).toContain(
      piece('cane-boca-sorriso'),
    );
  });

  it('tricolor: as três cores pelas partes, conforme o padrão sorteado', () => {
    const tri = (pattern: number) => renderVector({ ...DEFAULT_TRAITS, fur: 'tricolore', pattern });
    expect(tri(0)).toBe(tri(0)); // mesmo padrão → mesmo desenho
    const looks = new Set(Array.from({ length: 12 }, (_, i) => tri(i)));
    expect(looks.size).toBe(6); // labrador: as 6 formas de pôr as 3 cores em cabeça, orelhas e corpo
    // passos de 1 a 5 (nextPattern) nunca repetem a combinação anterior, em nenhuma raça
    for (const [species, breed] of [
      ['cane', 'labrador'],
      ['cane', 'beagle'],
      ['cane', 'pug'],
      ['gatto', 'europeo'],
      ['gatto', 'siamese'],
      ['gatto', 'persiano'],
    ] as const)
      for (let step = 1; step <= 5; step++) {
        const t = { ...DEFAULT_TRAITS, species, breed, fur: 'tricolore' as const };
        expect(renderVector({ ...t, pattern: 7 + step })).not.toBe(
          renderVector({ ...t, pattern: 7 }),
        );
      }
    const colors = [FUR_PALETTE.bianco.fur, FUR_PALETTE.caramello.fur, FUR_PALETTE.nero.fur];
    const used = (svg: string) => colors.filter((c) => svg.includes(`fill="${c}"`)).length;
    for (let i = 0; i < 12; i++) {
      expect(used(tri(i))).toBe(3); // labrador: cabeça, orelhas e corpo → as três cores
      const cat = {
        ...DEFAULT_TRAITS,
        species: 'gatto' as const,
        fur: 'tricolore' as const,
        pattern: i,
      };
      expect(used(renderVector({ ...cat, breed: 'siamese' }))).toBe(3); // com as pontas
      expect(used(renderVector({ ...cat, breed: 'europeo' }))).toBe(2); // só cabeça e corpo
    }
  });

  it('corpo robusto estica só o corpo', () => {
    expect(renderVector({ ...DEFAULT_TRAITS, body: 'robusto' })).toMatch(/scale\(1\.14 1\)/);
    expect(renderVector({ ...DEFAULT_TRAITS, body: 'atletico' })).not.toMatch(/scale\(1\.14 1\)/);
  });

  it('peças comuns vão ao rosto da raça (FIT) e a raça base fica no lugar', () => {
    const base = { ...DEFAULT_TRAITS, species: 'gatto' as const };
    expect(renderVector({ ...base, breed: 'europeo' })).not.toContain('translate(465.2 520.4)');
    expect(renderVector({ ...base, breed: 'persiano' })).toContain('translate(465.2 520.4)');
    expect(renderVector({ ...base, breed: 'persiano' })).not.toBe(
      renderVector({ ...base, breed: 'europeo' }),
    );
  });

  it('bigode de 2 ou 3 fios (só gato)', () => {
    const cat = { ...DEFAULT_TRAITS, species: 'gatto' as const, breed: 'europeo' as const };
    expect(renderVector({ ...cat, whiskers: 'due' })).toContain(piece('gatto-bigodes'));
    expect(renderVector({ ...cat, whiskers: 'tre' })).toContain(
      PARTS['gatto-bigodes-tres']!.match(/ d="([^"]{40})/)![1]!,
    );
    expect(renderVector({ ...cat, whiskers: 'tre' })).not.toContain(piece('gatto-bigodes'));
    expect(renderVector({ ...DEFAULT_TRAITS, whiskers: 'tre' })).toBe(renderVector(DEFAULT_TRAITS));
  });

  it('gato tem bigodes e orelha na cabeça; cão tem orelha própria e sem bigodes', () => {
    const cat = renderVector({ ...DEFAULT_TRAITS, species: 'gatto', breed: 'siamese' });
    expect(cat).toContain(piece('gatto-bigodes'));
    expect(renderVector(DEFAULT_TRAITS)).toContain(piece('labrador-orelha'));
    expect(renderVector(DEFAULT_TRAITS)).not.toContain(piece('gatto-bigodes'));
  });
});
