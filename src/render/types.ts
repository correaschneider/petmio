import type { PetTraits } from '@/domain/pet';

/** Área de desenho do avatar (unidades do viewBox SVG). */
export const CANVAS = { width: 300, height: 320, nameTagHeight: 30 } as const;

export interface RenderOptions {
  /**
   * Geometria simplificada para o rasterizador de pixel art: contorno grosso,
   * sem detalhes finos (brilhos, bigodes, rugas), olhos/focinho maiores.
   */
  pixel?: boolean;
  /**
   * Se presente, reserva a área da plaquinha sob o pet e, se não vazio, desenha
   * o nome nela.
   */
  nameTag?: string;
  /** Família tipográfica da plaquinha (no browser, a do next/font). */
  fontFamily?: string;
  /** Rótulo acessível do <svg>. */
  label?: string;
}

/**
 * Contrato do renderer: traços → SVG (string). Hoje é procedural (placeholder);
 * quando entrar a arte vetorizada, outro renderer com o MESMO contrato compõe as
 * camadas (`<g>`/`<image>`) e nada acima desta camada muda.
 */
export type PetRenderer = (traits: PetTraits, options?: RenderOptions) => string;

export function canvasHeight(withNameTag: boolean): number {
  return CANVAS.height + (withNameTag ? CANVAS.nameTagHeight : 0);
}
