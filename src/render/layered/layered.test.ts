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

  it('boca neutra usa a boca original da raça; óculos ainda desenhados', () => {
    const svg = renderLayered({
      ...DEFAULT_TRAITS,
      breed: 'beagle',
      mouth: 'neutro',
      acc: 'occhiali',
    });
    const closed = PARTS['mouth.closed.beagle'].svg;
    expect(svg).toContain(closed.slice(closed.indexOf('<path'), closed.indexOf('<path') + 60));
    expect(svg).toMatch(/<circle [^>]*r="26"/);
  });

  it('cabeças não trazem mais a boca embutida (vira peça própria)', () => {
    for (const breed of DOG_BREEDS) {
      const closed = PARTS[`mouth.closed.${breed}`];
      // A boca apagada (com o fim do filtro) fica dentro da zona da boca, abaixo do nariz.
      expect(closed.box[1]).toBeGreaterThanOrEqual(690);
      expect(closed.box[0]).toBeGreaterThanOrEqual(400);
      expect(closed.box[2]).toBeLessThanOrEqual(625);
    }
  });

  it('sorriso e língua usam as peças de boca da arte (cabeça já sem o "V")', () => {
    const snippet = (id: keyof typeof PARTS) => {
      const svg = PARTS[id].svg;
      return svg.slice(svg.indexOf('<path'), svg.indexOf('<path') + 60);
    };
    for (const breed of DOG_BREEDS) {
      const smile = renderLayered({ ...DEFAULT_TRAITS, breed, mouth: 'sorriso' });
      expect(smile).toContain(snippet('mouth.sorriso'));
      expect(smile).not.toContain(snippet(`mouth.closed.${breed}`));
      const tongue = renderLayered({ ...DEFAULT_TRAITS, breed, mouth: 'lingua' });
      expect(tongue).toContain(snippet('mouth.lingua'));
      expect(tongue).not.toContain(snippet('mouth.sorriso'));
    }
  });

  it('traço da boca usa a mesma cor de contorno da cabeça; a língua mantém a cor própria', () => {
    expect(PARTS['mouth.sorriso'].svg).toContain('fill="__OUTLINE__"');
    expect(PARTS['mouth.lingua'].svg).toMatch(/fill="#(?!111111)[0-9a-f]{6}"/);
  });
});

describe('mix', () => {
  it('interpola canal a canal', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#d9a95a', '#d9a95a', 0.3)).toBe('#d9a95a');
  });
});
