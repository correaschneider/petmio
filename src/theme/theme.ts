'use client';

import { alpha, createTheme, type PaletteColorOptions } from '@mui/material/styles';
import { dark, light, radius, type SchemeTokens } from './tokens';

declare module '@mui/material/styles' {
  interface Palette {
    /** Amarelo de destaque (dado, plaquinha, foco). */
    pop: Palette['primary'];
    /** Fundo suave (palco do avatar, chips inativos). */
    soft: string;
  }
  interface PaletteOptions {
    pop?: PaletteColorOptions;
    soft?: string;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    pop: true;
  }
}

const FONT_DISPLAY = 'var(--font-display), "Fredoka", "Nunito", system-ui, sans-serif';
const FONT_BODY = 'var(--font-body), "Nunito", system-ui, sans-serif';

function paletteFrom(t: SchemeTokens, mode: 'light' | 'dark') {
  return {
    mode,
    primary: { main: t.accent, contrastText: t.accentFg },
    pop: { main: t.pop, contrastText: '#1b2633' },
    soft: t.soft,
    background: { default: t.bg, paper: t.surface },
    text: { primary: t.fg, secondary: t.muted },
    divider: t.line,
  };
}

/**
 * Tema único da aplicação. As cores vêm de `tokens.ts`; o MUI gera as CSS vars
 * (`--mui-palette-*`) para os dois esquemas e o `InitColorSchemeScript` do
 * layout aplica o esquema antes do primeiro paint (sem flash).
 * Componentes consomem SEMPRE `theme.vars.*` / `sx` — nada de cor hardcoded.
 */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'data' },
  colorSchemes: {
    light: { palette: paletteFrom(light, 'light') },
    dark: { palette: paletteFrom(dark, 'dark') },
  },
  shape: { borderRadius: radius.sm },
  typography: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    h1: { fontFamily: FONT_DISPLAY, fontWeight: 700 },
    h2: { fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: '1.5rem', textWrap: 'balance' },
    h3: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '1.15rem' },
    subtitle1: { fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: '1rem' },
    button: { fontFamily: FONT_DISPLAY, fontWeight: 700, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (t) => ({
        body: { lineHeight: 1.5 },
        ':focus-visible': {
          outline: `3px solid ${t.vars?.palette.pop.main ?? light.pop}`,
          outlineOffset: 2,
        },
        '@media (prefers-reduced-motion: no-preference)': {
          '.pet-pop': { animation: 'pet-pop .4s' },
        },
        '@keyframes pet-pop': {
          '0%': { transform: 'scale(.92)' },
          '60%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
      }),
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: radius.md, padding: '10px 20px', fontSize: '1rem' },
        outlined: ({ theme: t }) => ({
          borderRadius: radius.pill,
          fontFamily: FONT_BODY,
          fontWeight: 600,
          fontSize: '.85rem',
          padding: '6px 12px',
          color: t.vars?.palette.text.primary,
          borderColor: t.vars?.palette.divider,
          '&:hover': { borderColor: t.vars?.palette.primary.main, background: 'transparent' },
        }),
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0, variant: 'outlined' },
      styleOverrides: { rounded: { borderRadius: radius.xl } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          borderRadius: radius.md,
          background: t.vars?.palette.background.default,
          fontFamily: FONT_DISPLAY,
          fontWeight: 600,
          fontSize: '1.2rem',
          '& fieldset': { borderWidth: 2, borderColor: t.vars?.palette.divider },
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        outlined: ({ theme: t }) => ({
          borderStyle: 'dashed',
          '&:hover': {
            borderColor: t.vars?.palette.primary.main,
            color: t.vars?.palette.primary.main,
            background: alpha(light.accent, 0.04),
          },
        }),
      },
    },
  },
});
