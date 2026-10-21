import {
  ACCESSORIES,
  BODIES,
  BREEDS_BY_SPECIES,
  EYES,
  FURS,
  MOUTHS,
  SPECIES,
  DEFAULT_TRAITS,
  type PetTraits,
} from '@/domain/pet';
import { renderPetSvg } from '.';
import { renderProcedural } from './procedural';
import { pngFileName } from './export-png';
import { downsampleSprite, posterize } from './raster';

function* allCombos(furs: readonly PetTraits['fur'][] = FURS): Generator<PetTraits> {
  for (const species of SPECIES)
    for (const breed of BREEDS_BY_SPECIES[species])
      for (const fur of furs)
        for (const body of BODIES)
          for (const eyes of EYES)
            for (const mouth of MOUTHS)
              for (const acc of ACCESSORIES)
                yield { ...DEFAULT_TRAITS, species, breed, fur, body, eyes, mouth, acc };
}

function parseErrors(svg: string): string | null {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  return doc.getElementsByTagName('parsererror')[0]?.textContent ?? null;
}

describe('renderPetSvg', () => {
  // Regressão: `stroke-width` duplicado no gato quebrava o parse e o pixel art
  // caía no cartoon sem erro visível.
  it.each([false, true])(
    'procedural gera SVG bem formado em todas as combinações (pixel=%s)',
    (pixel) => {
      let count = 0;
      for (const traits of allCombos()) {
        const svg = renderProcedural(traits, { pixel, nameTag: 'Bruno' });
        const err = parseErrors(svg);
        if (err) throw new Error(`${JSON.stringify(traits)}\n${err}`);
        expect(svg).not.toMatch(/(\s[\w-]+=)"[^"]*"[^>]*\1/); // nenhum atributo repetido na mesma tag
        count++;
      }
      expect(count).toBeGreaterThan(1000);
    },
    // varre milhares de combinações (dobraram com o bigode): o runner do CI passa de 5 s
    60_000,
  );

  // No renderer ativo o pelo só troca cor; varre todas as combinações de estrutura.
  it('renderer ativo gera SVG bem formado em todas as combinações de estrutura', () => {
    for (const traits of allCombos(['tricolore'])) {
      const err = parseErrors(renderPetSvg(traits, { nameTag: 'Bruno' }));
      if (err) throw new Error(`${JSON.stringify(traits)}\n${err}`);
    }
  }, 30_000);

  it('escapa o nome na plaquinha', () => {
    const svg = renderPetSvg(DEFAULT_TRAITS, { nameTag: '<b>&"x' });
    expect(svg).toContain('&lt;b&gt;&amp;&quot;x');
    expect(parseErrors(svg)).toBeNull();
  });

  it('reserva a altura da plaquinha mesmo sem nome', () => {
    expect(renderPetSvg(DEFAULT_TRAITS)).toContain('viewBox="0 0 300 320"');
    expect(renderPetSvg(DEFAULT_TRAITS, { nameTag: '' })).toContain('viewBox="0 0 300 350"');
  });

  it('procedural: modo pixel remove os detalhes finos', () => {
    const cat: PetTraits = { ...DEFAULT_TRAITS, species: 'gatto', breed: 'europeo' };
    const cartoon = renderProcedural(cat);
    const pixel = renderProcedural(cat, { pixel: true });
    expect(cartoon).toContain('stroke-width="4"');
    expect(pixel).toContain('stroke-width="9"');
    expect(pixel.length).toBeLessThan(cartoon.length); // sem bigodes/brilhos
  });
});

describe('posterize', () => {
  it('quantiza cor e binariza alpha', () => {
    const px = new Uint8ClampedArray([17, 100, 250, 200, 1, 2, 3, 50]);
    posterize(px);
    expect([...px]).toEqual([32, 96, 255, 255, 1, 2, 3, 0]);
  });
});

describe('downsampleSprite', () => {
  /** Bloco 4×4 com `dark` pixels escuros (#3d1f0c) e o resto da cor `fill`. */
  function block(dark: number, fill: [number, number, number]) {
    const px = new Uint8ClampedArray(16 * 4);
    for (let i = 0; i < 16; i++) px.set(i < dark ? [61, 31, 12, 255] : [...fill, 255], i * 4);
    return px;
  }

  it('contorno fino vence a média (vira pixel de contorno)', () => {
    const { data } = downsampleSprite(block(4, [216, 168, 72]), 4, 4, 4);
    expect([...data]).toEqual([61, 31, 12, 255]);
  });

  it('bloco só de pelo vira a cor do pelo', () => {
    const { data } = downsampleSprite(block(1, [216, 168, 72]), 4, 4, 4);
    expect([...data]).toEqual([216, 168, 72, 255]);
  });

  it('pelo preto não é confundido com contorno (escuridão relativa)', () => {
    const { data } = downsampleSprite(block(0, [47, 47, 51]), 4, 4, 4);
    expect([...data]).toEqual([47, 47, 51, 255]);
  });

  it('bloco quase vazio fica transparente', () => {
    const px = new Uint8ClampedArray(16 * 4);
    px.set([216, 168, 72, 255], 0);
    expect(downsampleSprite(px, 4, 4, 4).data[3]).toBe(0);
  });
});

describe('pngFileName', () => {
  it('gera slug sem acento', () => {
    expect(pngFileName('Totò Biscotto')).toBe('pet-mio-toto-biscotto.png');
    expect(pngFileName('🐶')).toBe('pet-mio.png');
  });
});
