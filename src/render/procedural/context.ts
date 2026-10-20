import type { PetTraits } from '@/domain/pet';
import { FUR_COLORS, IRIS_COLORS } from '@/domain/pet';
import type { RenderOptions } from '../types';
import { outline } from '../svg';

/** Espessura do contorno: fina no cartoon, grossa para sobreviver ao downscale do pixel. */
export const STROKE = { cartoon: 4, pixel: 9 } as const;

export interface DrawContext {
  pixel: boolean;
  /** Atributos de contorno já montados (`stroke`, `stroke-width`…). */
  st: string;
  base: string;
  light: string;
  patched: boolean;
  iris: string;
  /** Some no modo pixel: brilhos, bigodes, rugas. */
  detail: (svg: string) => string;
}

export function createContext(traits: PetTraits, options: RenderOptions = {}): DrawContext {
  const pixel = options.pixel ?? false;
  const fur = FUR_COLORS[traits.fur];
  return {
    pixel,
    st: outline(pixel ? STROKE.pixel : STROKE.cartoon),
    base: fur.base,
    light: fur.light,
    patched: 'patched' in fur && fur.patched,
    iris: IRIS_COLORS[traits.eyeColor],
    detail: (svg) => (pixel ? '' : svg),
  };
}
