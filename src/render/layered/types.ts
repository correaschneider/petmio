/** Peça vetorizada gerada por `scripts/art/build_parts.py`. */
export interface PartAsset {
  /** Bbox do conteúdo no enquadramento original (x0, y0, x1, y1). */
  readonly box: readonly number[];
  /** Pontos de referência no enquadramento original (ex.: `nose` da cabeça). */
  readonly anchors: Readonly<Record<string, readonly number[]>>;
  /** `<g>` com os paths; cores recoloríveis como placeholders (`__FUR__`…). */
  readonly svg: string;
}
