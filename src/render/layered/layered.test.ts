import {
  ACCESSORIES,
  BODIES,
  DEFAULT_TRAITS,
  DOG_BREEDS,
  EYES,
  FUR_COLORS,
  IRIS_COLORS,
  MOUTHS,
  type PetTraits,
} from '@/domain/pet';
import { renderProcedural } from '../procedural';
import { renderLayered } from '.';
import { mix } from './colors';
import { PARTS } from './parts.generated';

describe('renderLayered', () => {
  it('não deixa placeholder de cor sem trocar em nenhuma combinação de cão', () => {
    for (const breed of DOG_BREEDS)
      for (const body of BODIES)
        for (const eyes of EYES)
          for (const mouth of MOUTHS)
            for (const acc of ACCESSORIES) {
              const svg = renderLayered({ ...DEFAULT_TRAITS, breed, body, eyes, mouth, acc });
              expect(svg).not.toMatch(/__[A-Z_]+__/);
            }
  });

  it('recolore pelo e íris com a escolha do usuário', () => {
    const traits: PetTraits = { ...DEFAULT_TRAITS, fur: 'grigio', eyeColor: 'verde' };
    const svg = renderLayered(traits);
    expect(svg).toContain(`fill="${FUR_COLORS.grigio.base}"`);
    expect(svg).toContain(`fill="${IRIS_COLORS.verde}"`);
    expect(svg).not.toContain(`fill="${FUR_COLORS.dorato.base}"`);
  });

  it('compõe cabeça da raça, corpo e os dois olhos', () => {
    const svg = renderLayered({ ...DEFAULT_TRAITS, breed: 'pug', body: 'robusto' });
    const pug = PARTS['head.pug'].svg.slice(0, 80);
    expect(svg).toContain(pug.slice(pug.indexOf('<path')));
    expect(svg.match(/<g transform="translate\(/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it('gato ainda sem arte cai no procedural', () => {
    const cat: PetTraits = { ...DEFAULT_TRAITS, species: 'gatto', breed: 'siamese' };
    expect(renderLayered(cat)).toBe(renderProcedural(cat));
  });

  it('boca neutra e óculos (sem peça) usam fallback desenhado', () => {
    const svg = renderLayered({ ...DEFAULT_TRAITS, mouth: 'neutro', acc: 'occhiali' });
    expect(svg).toMatch(/<circle [^>]*r="26"/);
  });
});

describe('mix', () => {
  it('interpola canal a canal', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#d9a95a', '#d9a95a', 0.3)).toBe('#d9a95a');
  });
});
