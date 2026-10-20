/**
 * Onde cada categoria de peça cai no viewBox 300×320 (proporção chibi da referência-mestre:
 * cabeça ≈ 55% da altura e bem mais larga que o corpo).
 *
 * As peças de uma mesma categoria vêm no MESMO enquadramento 1024×1024 (as 3 cabeças, os 2
 * corpos, os 5 olhos), então uma transformação por categoria basta e mantém a proporção entre
 * raças. Cada entrada leva um ponto da fonte (`src`) a um ponto do viewBox (`at`) com escala `k`.
 */
export interface Placement {
  src: readonly [number, number];
  at: readonly [number, number];
  k: number;
}

export const LAYOUT = {
  /** Base do corpo (patas) no chão do palco. */
  body: { src: [513, 893], at: [150, 316], k: 0.235 },
  /** Topo da cabeça; o queixo sobrepõe o pescoço do corpo. Nariz cai em y≈129. */
  head: { src: [512, 157], at: [150, 12], k: 0.26 },
  /** Topo do sorriso, logo abaixo do nariz. */
  mouth: { src: [512, 423], at: [150, 143], k: 0.13 },
  /** Topo do anel (fica atrás da cabeça); a frente aparece sob o queixo. */
  neck: { src: [512, 248], at: [150, 161], k: 0.14 },
} as const satisfies Record<string, Placement>;

/**
 * Olhos: cada lado é uma peça própria (o par gerado vem quase encostado). Centro de cada olho
 * no enquadramento da fonte → posição na cara.
 */
export const EYES = {
  k: 0.12,
  y: 92,
  left: { src: [281, 503], x: 107 },
  right: { src: [740, 503], x: 193 },
} as const;

export function eyePlacement(side: 'left' | 'right'): Placement {
  const e = EYES[side];
  return { src: e.src, at: [e.x, EYES.y], k: EYES.k };
}

/** Converte um ponto da fonte para o viewBox. */
export function project(p: Placement, x: number, y: number): [number, number] {
  return [p.at[0] + (x - p.src[0]) * p.k, p.at[1] + (y - p.src[1]) * p.k];
}

export function placementTransform(p: Placement): string {
  return `translate(${p.at[0]} ${p.at[1]}) scale(${p.k}) translate(${-p.src[0]} ${-p.src[1]})`;
}
