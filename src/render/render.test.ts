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
import { pngFileName } from './export-png';
import { posterize } from './raster';

function* allCombos(): Generator<PetTraits> {
  for (const species of SPECIES)
    for (const breed of BREEDS_BY_SPECIES[species])
      for (const fur of FURS)
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
  it.each([false, true])('gera SVG bem formado em todas as combinações (pixel=%s)', (pixel) => {
    let count = 0;
    for (const traits of allCombos()) {
      const svg = renderPetSvg(traits, { pixel, nameTag: 'Bruno' });
      const err = parseErrors(svg);
      if (err) throw new Error(`${JSON.stringify(traits)}\n${err}`);
      expect(svg).not.toMatch(/(\s[\w-]+=)"[^"]*"[^>]*\1/); // nenhum atributo repetido na mesma tag
      count++;
    }
    expect(count).toBeGreaterThan(1000);
  });

  it('escapa o nome na plaquinha', () => {
    const svg = renderPetSvg(DEFAULT_TRAITS, { nameTag: '<b>&"x' });
    expect(svg).toContain('&lt;b&gt;&amp;&quot;x');
    expect(parseErrors(svg)).toBeNull();
  });

  it('reserva a altura da plaquinha mesmo sem nome', () => {
    expect(renderPetSvg(DEFAULT_TRAITS)).toContain('viewBox="0 0 300 320"');
    expect(renderPetSvg(DEFAULT_TRAITS, { nameTag: '' })).toContain('viewBox="0 0 300 350"');
  });

  it('modo pixel remove os detalhes finos', () => {
    const cat: PetTraits = { ...DEFAULT_TRAITS, species: 'gatto', breed: 'europeo' };
    const cartoon = renderPetSvg(cat);
    const pixel = renderPetSvg(cat, { pixel: true });
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

describe('pngFileName', () => {
  it('gera slug sem acento', () => {
    expect(pngFileName('Totò Biscotto')).toBe('pet-mio-toto-biscotto.png');
    expect(pngFileName('🐶')).toBe('pet-mio.png');
  });
});
