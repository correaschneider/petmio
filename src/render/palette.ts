import { brand } from '@/theme/tokens';

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
