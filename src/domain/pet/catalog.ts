/**
 * Catálogo de traços do avatar — fonte única dos IDs válidos e dos dados visuais
 * (cores). Rótulos NÃO moram aqui: ficam em `src/i18n` para a UI poder ser
 * traduzida sem tocar no domínio.
 */

export const STYLES = ['cartoon', 'pixel'] as const;
export const SPECIES = ['cane', 'gatto'] as const;
export const DOG_BREEDS = ['labrador', 'beagle', 'pug'] as const;
export const CAT_BREEDS = ['europeo', 'siamese', 'persiano'] as const;
export const FURS = [
  'nero',
  'bianco',
  'caramello',
  'cioccolato',
  'dorato',
  'grigio',
  'beige',
  'tricolore',
] as const;
export const BODIES = ['atletico', 'robusto'] as const;
export const EYES = ['rotondi', 'allegri', 'assonnati', 'sorpresi', 'dolci'] as const;
export const EYE_COLORS = ['marrone', 'ambra', 'azzurro', 'verde'] as const;
export const MOUTHS = ['sorriso', 'lingua', 'neutro'] as const;
export const ACCESSORIES = ['nessuno', 'collare', 'bandana', 'occhiali'] as const;
/** Fios do bigode de cada lado (só gatos). */
export const WHISKERS = ['due', 'tre'] as const;

export type Style = (typeof STYLES)[number];
export type Species = (typeof SPECIES)[number];
export type DogBreed = (typeof DOG_BREEDS)[number];
export type CatBreed = (typeof CAT_BREEDS)[number];
export type Breed = DogBreed | CatBreed;
export type Fur = (typeof FURS)[number];
export type Body = (typeof BODIES)[number];
export type Eyes = (typeof EYES)[number];
export type EyeColor = (typeof EYE_COLORS)[number];
export type Mouth = (typeof MOUTHS)[number];
export type Accessory = (typeof ACCESSORIES)[number];
export type Whiskers = (typeof WHISKERS)[number];

export const BREEDS_BY_SPECIES = {
  cane: DOG_BREEDS,
  gatto: CAT_BREEDS,
} as const satisfies Record<Species, readonly Breed[]>;

export interface FurColor {
  /** Cor base do pelo. */
  base: string;
  /** Tom claro (focinho, barriga). */
  light: string;
  /** Pelagem com manchas (desenha patches extras). */
  patched?: boolean;
}

export const FUR_COLORS = {
  nero: { base: '#2f2f33', light: '#55555c' },
  bianco: { base: '#f3efe6', light: '#fbf9f4' },
  caramello: { base: '#c9803a', light: '#e7b074' },
  cioccolato: { base: '#5a3a26', light: '#8a5f45' },
  dorato: { base: '#d9a95a', light: '#f0d19b' },
  grigio: { base: '#8f9196', light: '#bfc1c6' },
  beige: { base: '#e3cfae', light: '#f4e8d2' },
  tricolore: { base: '#f3efe6', light: '#fbf9f4', patched: true },
} as const satisfies Record<Fur, FurColor>;

/** Cores das manchas da pelagem tricolore. */
export const PATCH_COLORS = { warm: '#c9803a', dark: '#2f2f33' } as const;

export const IRIS_COLORS = {
  marrone: '#4a2e1a',
  ambra: '#b8732c',
  azzurro: '#4d8fcf',
  verde: '#4f8a4b',
} as const satisfies Record<EyeColor, string>;
