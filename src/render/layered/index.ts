/**
 * Renderer por camadas: compõe as peças vetorizadas do Nano Banana (`parts.generated.ts`).
 *
 * Cobertura atual: cão cartoon (3 cabeças, 2 corpos, 5 olhos, 2 bocas, coleira, bandana).
 * O que ainda não tem arte cai no procedural: gato inteiro e óculos (a peça gerada saiu
 * fotorrealista). A boca "neutro" é a boca fechada original da cabeça, separada no build. Pixel art = estas camadas pelo pixelador.
 */
import type { DogBreed, PetTraits } from '@/domain/pet';
import { FUR_COLORS, IRIS_COLORS } from '@/domain/pet';
import { renderProcedural } from '../procedural';
import { createContext } from '../procedural/context';
import { drawGlasses, drawNameTag } from '../procedural/parts';
import { svgDocument } from '../svg';
import { CANVAS, canvasHeight, type PetRenderer, type RenderOptions } from '../types';
import { mix } from './colors';
import {
  EYES,
  LAYOUT,
  MOUTH_EXTRA_STROKE,
  eyePlacement,
  mouthPlacement,
  placementTransform,
  type Placement,
} from './layout';
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

/** Boca escolhida: traço engrossado com um `stroke` da mesma cor por cima do preenchimento. */
function mouthLayer(
  id: 'mouth.sorriso' | 'mouth.lingua',
  breed: DogBreed,
  palette: Palette,
): string {
  const placement = mouthPlacement(breed);
  // stroke-width vive no espaço da peça: converte as unidades do viewBox pela escala.
  const width = Math.round(MOUTH_EXTRA_STROKE / placement.k);
  const thick = PARTS[id].svg.replaceAll(
    'fill="__OUTLINE__"',
    `fill="__OUTLINE__" stroke="__OUTLINE__" stroke-width="${width}" stroke-linejoin="round"`,
  );
  return layer(id, placement, palette, thick);
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
  // "neutro" = a boca fechada que veio desenhada na cabeça (o build separa em peça própria).
  body +=
    traits.mouth === 'neutro'
      ? layer(`mouth.closed.${breed}`, LAYOUT.head, palette)
      : mouthLayer(`mouth.${traits.mouth}`, breed, palette);
  if (traits.acc === 'occhiali') body += glasses();

  const withTag = options.nameTag !== undefined;
  const name = options.nameTag?.trim();
  if (name) body += drawNameTag(createContext(traits, options), name, options.fontFamily);

  return svgDocument(body, CANVAS.width, canvasHeight(withTag), options.label ?? 'Cane');
};
