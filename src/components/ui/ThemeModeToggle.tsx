'use client';

import IconButton from '@mui/material/IconButton';
import { useColorScheme } from '@mui/material/styles';
import { useMessages } from '@/i18n';

type Mode = 'system' | 'light' | 'dark';
const NEXT: Record<Mode, Mode> = { system: 'light', light: 'dark', dark: 'system' };
const ICON: Record<Mode, string> = { system: '◐', light: '☀', dark: '☾' };

/** Alterna sistema → claro → escuro. Persistido pelo MUI (localStorage). */
export function ThemeModeToggle() {
  const t = useMessages();
  const { mode, setMode } = useColorScheme();
  // `mode` é undefined até montar (SSR): não renderiza para evitar mismatch.
  if (!mode) return null;
  return (
    <IconButton
      onClick={() => setMode(NEXT[mode])}
      aria-label={t.theme[mode]}
      title={t.theme[mode]}
      size="small"
      sx={{ fontSize: '1.1rem', width: 36, height: 36, border: 1, borderColor: 'divider' }}
    >
      <span aria-hidden="true">{ICON[mode]}</span>
    </IconButton>
  );
}
