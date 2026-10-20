'use client';

import ButtonBase from '@mui/material/ButtonBase';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import { radius } from '@/theme/tokens';

export interface Choice<T extends string> {
  value: T;
  label: string;
}

export interface ChoiceChipsProps<T extends string> {
  options: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
}

const Chip = styled(ButtonBase)(({ theme }) => ({
  minHeight: 40,
  padding: '8px 12px',
  borderRadius: radius.sm,
  border: `2px solid ${theme.vars?.palette.divider}`,
  background: theme.vars?.palette.background.paper,
  color: theme.vars?.palette.text.primary,
  font: `600 .9rem ${theme.typography.fontFamily}`,
  transition: theme.transitions.create(['border-color', 'background-color']),
  '&:hover': { borderColor: theme.vars?.palette.primary.main },
  '&[aria-pressed="true"]': {
    borderColor: theme.vars?.palette.primary.main,
    background: theme.vars?.palette.primary.main,
    color: theme.vars?.palette.primary.contrastText,
  },
}));

/** Escolha única entre rótulos curtos (botões `aria-pressed` numa linha que quebra). */
export function ChoiceChips<T extends string>({ options, value, onChange }: ChoiceChipsProps<T>) {
  return (
    <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', gap: 1 }}>
      {options.map((o) => (
        <Chip
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          focusRipple
        >
          {o.label}
        </Chip>
      ))}
    </Stack>
  );
}
