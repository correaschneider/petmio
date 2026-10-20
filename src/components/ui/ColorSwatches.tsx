'use client';

import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

export interface Swatch<T extends string> {
  value: T;
  label: string;
  /** Qualquer `background` CSS (cor sólida ou gradiente). */
  background: string;
}

export interface ColorSwatchesProps<T extends string> {
  options: readonly Swatch<T>[];
  value: T;
  onChange: (value: T) => void;
}

const Dot = styled(ButtonBase)(({ theme }) => ({
  width: 34,
  height: 34,
  borderRadius: '50%',
  border: `2px solid ${theme.vars?.palette.divider}`,
  '&[aria-pressed="true"]': {
    borderColor: theme.vars?.palette.text.primary,
    boxShadow: `0 0 0 3px ${theme.vars?.palette.background.paper}, 0 0 0 5px ${theme.vars?.palette.primary.main}`,
  },
}));

/** Escolha única por cor. O nome da cor vai no `aria-label` e no tooltip nativo. */
export function ColorSwatches<T extends string>({
  options,
  value,
  onChange,
}: ColorSwatchesProps<T>) {
  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
      {options.map((o) => (
        <Dot
          key={o.value}
          type="button"
          title={o.label}
          aria-label={o.label}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          sx={{ background: o.background }}
        />
      ))}
    </Stack>
  );
}
