/** Caixa (x0, y0, x1, y1) no enquadramento 1024×1024 do guia. */
export type Box = readonly number[];

/** Forma de uma camada. `role` diz como recolorir (fur, fur-shade, fur-light, outline, ...). */
export interface VectorShape {
  readonly d: string;
  readonly role: string;
  readonly fill?: string;
  readonly opacity?: number;
}

export interface EyeAnchor {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

/** Modelo gerado por `scripts/art/build_layers.py` a partir de um guia do Recraft. */
export interface VectorModel {
  readonly species: string;
  /** Espessura média do contorno do guia (px no enquadramento 1024). */
  readonly stroke: number;
  readonly outline: string;
  readonly anchors: {
    readonly eyes: readonly EyeAnchor[];
    readonly head: Box | null;
    readonly nose: Box | null;
    readonly mouth: Box | null;
    readonly body: Box | null;
    readonly neck: Box | null;
    readonly glasses: Box | null;
    /** Cabeça + focinho + boca (o queixo de verdade). */
    readonly face: Box;
  };
  readonly layers: Readonly<Record<string, readonly VectorShape[]>>;
}
