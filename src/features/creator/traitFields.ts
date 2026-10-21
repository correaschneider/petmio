import {
  FUR_COLORS,
  IRIS_COLORS,
  PATCH_COLORS,
  optionsFor,
  type PetTraits,
  type Species,
  type TraitKey,
} from '@/domain/pet';
import type { Messages } from '@/i18n';

/** Ordem e tipo de controle de cada traço no passo "Crea" (data-driven). */
/** `only`: o traço só existe nessa espécie (o campo some nas outras). */
export const TRAIT_FIELDS: readonly {
  key: TraitKey;
  control: 'chips' | 'swatches';
  only?: Species;
}[] = [
  { key: 'style', control: 'chips' },
  { key: 'species', control: 'chips' },
  { key: 'breed', control: 'chips' },
  { key: 'fur', control: 'swatches' },
  { key: 'body', control: 'chips' },
  { key: 'eyes', control: 'chips' },
  { key: 'eyeColor', control: 'swatches' },
  { key: 'mouth', control: 'chips' },
  { key: 'acc', control: 'chips' },
  { key: 'whiskers', control: 'chips', only: 'gatto' },
];

const TRICOLOR_SWATCH = `linear-gradient(135deg, ${FUR_COLORS.tricolore.base} 0 40%, ${PATCH_COLORS.warm} 40% 70%, ${PATCH_COLORS.dark} 70%)`;

function swatchBackground(key: TraitKey, value: string): string {
  if (key === 'fur') {
    return value === 'tricolore'
      ? TRICOLOR_SWATCH
      : FUR_COLORS[value as keyof typeof FUR_COLORS].base;
  }
  return IRIS_COLORS[value as keyof typeof IRIS_COLORS];
}

export interface FieldOption {
  value: string;
  label: string;
  background: string;
}

/** Opções de um traço já com rótulo traduzido (e cor, para swatches). */
export function fieldOptions(key: TraitKey, traits: PetTraits, t: Messages): FieldOption[] {
  const labels = t.options[key] as Record<string, string>;
  return optionsFor(key, traits).map((value) => ({
    value,
    label: labels[value] ?? value,
    background: key === 'fur' || key === 'eyeColor' ? swatchBackground(key, value) : '',
  }));
}
