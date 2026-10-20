/**
 * Design tokens da marca Pet Mio — fonte única das cores.
 *
 * O tema MUI (`theme.ts`) é montado a partir daqui e gera as CSS vars
 * (`--mui-palette-*`) para claro/escuro. O renderer do avatar e o export PNG
 * também leem daqui (`brand`), para a arte não divergir da UI.
 */

export const brand = {
  /** Azul de ação (botões, seleção). Também é a cor da bandana. */
  blue: '#2b63d9',
  /** Amarelo "pop" (dado, plaquinha do nome, foco). */
  yellow: '#ffc53d',
  /** Texto escuro sobre o amarelo — fixo nos dois temas. */
  ink: '#1b2633',
  /** Azul bem claro (fundo do palco e do PNG). */
  sky: '#dfe8f6',
  white: '#ffffff',
} as const;

export interface SchemeTokens {
  bg: string;
  fg: string;
  muted: string;
  surface: string;
  line: string;
  accent: string;
  accentFg: string;
  pop: string;
  soft: string;
}

export const light: SchemeTokens = {
  bg: '#eef3f8',
  fg: '#1b2633',
  muted: '#5c6b7a',
  surface: '#ffffff',
  line: '#d6dee8',
  accent: brand.blue,
  accentFg: '#ffffff',
  pop: brand.yellow,
  soft: brand.sky,
};

export const dark: SchemeTokens = {
  bg: '#121821',
  fg: '#e7edf4',
  muted: '#9aa8b7',
  surface: '#1b232e',
  line: '#2d3845',
  accent: '#6b9aff',
  accentFg: '#0f1623',
  pop: '#ffd166',
  soft: '#243041',
};

export const radius = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;
