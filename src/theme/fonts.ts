import { Fredoka, Nunito } from 'next/font/google';

/** Fontes self-hosted pelo next/font (sem request ao Google em runtime). */
export const displayFont = Fredoka({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const bodyFont = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
