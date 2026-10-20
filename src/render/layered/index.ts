/**
 * Renderer por camadas: compõe as peças vetorizadas do Nano Banana (`parts.generated.ts`).
 *
 * Cobertura atual: cão cartoon (3 cabeças, 2 corpos, 5 olhos, 2 bocas, coleira, bandana).
 * O que ainda não tem arte cai no procedural: gato inteiro e óculos (a peça gerada saiu
 * fotorrealista). As bocas saem da boca fechada original da cabeça, separada no build. Pixel art = estas camadas pelo pixelador.
 */
import type { DogBreed, PetTraits } from '@/domain/pet';
import { FUR_COLORS, IRIS_COLORS } from '@/domain/pet';
import { renderProcedural } from '../procedural';
import { createContext } from '../procedural/context';
import { drawGlasses, drawNameTag } from '../procedural/parts';
import { svgDocument } from '../svg';
import { CANVAS, canvasHeight, type PetRenderer, type RenderOptions } from '../types';
import { mix } from './colors';
import { EYES, LAYOUT, eyePlacement, placementTransform, type Placement } from './layout';
import { PARTS, type PartId } from './parts.generated';

/** Contorno marrom da arte gerada (as peças já vêm com ele). */
export const LAYERED_OUTLINE = '#3d1f0c';

interface Palette {
  fur: string;
  furShade: string;
  iris: string;
}

function paint(svg: string, p: Palette): string {
  return svg
    .replaceAll('__OUTLINE__', LAYERED_OUTLINE)
    .replaceAll('__FUR_SHADE__', p.furShade)
    .replaceAll('__FUR__', p.fur)
    .replaceAll('__IRIS__', p.iris);
}

function layer(
  id: PartId,
  placement: Placement,
  palette: Palette,
  svg: string = PARTS[id].svg,
): string {
  return `<g transform="${placementTransform(placement)}">${paint(svg, palette)}</g>`;
}

/**
 * Boca. A cabeça vem sem a boca embutida (o "V" que dividia as bochechas — o build separa):
 * "neutro" = essa boca original de volta; "sorriso"/"lingua" = peças de boca da arte.
 */
function mouth(traits: PetTraits, breed: DogBreed, palette: Palette): string {
  if (traits.mouth === 'neutro') return layer(`mouth.closed.${breed}`, LAYOUT.head, palette);
  return layer(`mouth.${traits.mouth}`, LAYOUT.mouth, palette);
}

/** Peças disponíveis para os traços (sem fallback). */
export function hasLayeredArt(traits: PetTraits): boolean {
  return traits.species === 'cane';
}

/** Óculos centrados nos olhos da arte. */
function glasses(): string {
  return drawGlasses({ xs: [EYES.left.x, EYES.right.x], y: EYES.y, r: 26 });
}

export const renderLayered: PetRenderer = (traits, options: RenderOptions = {}) => {
  if (!hasLayeredArt(traits)) return renderProcedural(traits, options);

  const base = FUR_COLORS[traits.fur].base;
  const palette: Palette = {
    fur: base,
    furShade: mix(base, LAYERED_OUTLINE, 0.35),
    iris: IRIS_COLORS[traits.eyeColor],
  };
  const breed = traits.breed as DogBreed;

  let body = layer(`body.${traits.body}`, LAYOUT.body, palette);
  if (traits.acc === 'collare') body += layer('acc.collare', LAYOUT.neck, palette);
  if (traits.acc === 'bandana') body += layer('acc.bandana', LAYOUT.neck, palette);
  body += layer(`head.${breed}`, LAYOUT.head, palette);
  body += layer(`eyes.${traits.eyes}.left`, eyePlacement('left'), palette);
  body += layer(`eyes.${traits.eyes}.right`, eyePlacement('right'), palette);
  body += mouth(traits, breed, palette);
  if (traits.acc === 'occhiali') body += glasses();

  const withTag = options.nameTag !== undefined;
  const name = options.nameTag?.trim();
  if (name) body += drawNameTag(createContext(traits, options), name, options.fontFamily);

  return svgDocument(body, CANVAS.width, canvasHeight(withTag), options.label ?? 'Cane');
};
