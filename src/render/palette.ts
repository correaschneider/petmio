import { brand } from '@/theme/tokens';
import type { Fur } from '@/domain/pet';

/** Cores fixas da arte (independem do tema claro/escuro e do pelo escolhido). */
export const art = {
  outline: '#262a30',
  pupil: '#1a1a1a',
  sclera: '#ffffff',
  highlight: '#ffffff',
  tongue: '#f0708a',
  catNose: '#e8808f',
  catInnerEar: '#f0a3b0',
  collar: '#d8402f',
  collarTag: brand.yellow,
  bandana: brand.blue,
  lensTint: 'rgba(80,130,220,.18)',
  nameTag: brand.yellow,
  nameTagText: brand.ink,
  /** Ponta escura do siamês (orelhas, máscara, patas, rabo). */
  siamesePointDark: '#1c1816',
  siamesePointWarm: '#4a3326',
} as const;

/**
 * Paleta da pelagem: os tons da arte vetorial que seguem a cor escolhida (marcadores das peças em
 * `render/vector/parts.generated.ts`). `fur` = cor do pelo (a mesma do botão, `FUR_COLORS.base`);
 * `shade` = sombra (coxas, orelha por dentro, sombra da coleira); `light` = focinho/barriga;
 * `outline` = contorno e traços (escuro da mesma família, não marrom fixo); `point` = pontas da
 * pelagem (máscara/orelhas/patas/rabo do siamês, máscara/orelhas do carlino).
 *
 * Escolhidos à mão para cada pelagem (estudo de 20/10/2026), em vez de mistura automática: a
 * mistura com branco deixava o claro de pelagens escuras cinza-claro, e o contorno marrom sumia
 * no preto e brigava com o cinza.
 */
export interface FurPalette {
  readonly fur: string;
  readonly shade: string;
  readonly light: string;
  readonly outline: string;
  readonly point: string;
}

export const FUR_PALETTE: Record<Fur, FurPalette> = {
  // dourado: o tom dos guias
  dorato: {
    fur: '#d9a95a',
    shade: '#bd8740',
    light: '#f2d6a0',
    outline: '#542814',
    point: '#7a4a1f',
  },
  caramello: {
    fur: '#c9803a',
    shade: '#a8652a',
    light: '#ebc597',
    outline: '#4a2610',
    point: '#6e3a16',
  },
  cioccolato: {
    fur: '#5a3a26',
    shade: '#472c1b',
    light: '#8c6448',
    outline: '#24140b',
    point: '#2f1b10',
  },
  // preto: claro só um pouco acima do pelo (sem focinho cinza), contorno quase preto
  nero: {
    fur: '#2f2f33',
    shade: '#232327',
    light: '#46454d',
    outline: '#111114',
    point: '#19191c',
  },
  grigio: {
    fur: '#8f9196',
    shade: '#76787e',
    light: '#c3c5c9',
    outline: '#2f3136',
    point: '#4c4e54',
  },
  // claros: contorno marrom-acinzentado (o marrom forte ficava pesado), pontas creme/canela
  bianco: {
    fur: '#f3efe6',
    shade: '#dcd3c3',
    light: '#ffffff',
    outline: '#5a4636',
    point: '#c4ad8e',
  },
  beige: {
    fur: '#e3cfae',
    shade: '#c9b089',
    light: '#f5ead6',
    outline: '#5c4029',
    point: '#9b7350',
  },
  // tricolore: só a base — o renderer distribui branco/caramelo/escuro pelas partes (TRICOLOR)
  tricolore: {
    fur: '#f3efe6',
    shade: '#dcd3c3',
    light: '#ffffff',
    outline: '#4a2610',
    point: '#2f2f33',
  },
};

/**
 * Tricolor: as três cores da pelagem (as mesmas do botão). O `pattern` do pet sorteia qual vai em
 * cada parte (ver `render/vector/tricolor.ts`); contorno marrom único para as três combinarem.
 */
const TRI_OUTLINE = '#4a2610';
export const TRICOLOR = {
  branco: { ...FUR_PALETTE.bianco, outline: TRI_OUTLINE },
  caramelo: { ...FUR_PALETTE.caramello, outline: TRI_OUTLINE },
  escuro: { ...FUR_PALETTE.nero, light: '#55545c', outline: TRI_OUTLINE },
} as const satisfies Record<string, FurPalette>;
