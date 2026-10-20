import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { messages } from '@/i18n';
import { COLOR_MODE_STORAGE_KEY } from '@/theme/constants';
import { bodyFont, displayFont } from '@/theme/fonts';
import { dark, light } from '@/theme/tokens';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: messages.meta.title,
  description: messages.meta.description,
  applicationName: 'Pet Mio',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: light.bg },
    { media: '(prefers-color-scheme: dark)', color: dark.bg },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: o InitColorSchemeScript marca o <html> antes da hidratação.
    <html
      lang="it"
      className={`${displayFont.variable} ${bodyFont.variable}`}
      suppressHydrationWarning
    >
      <body>
        <InitColorSchemeScript attribute="data" modeStorageKey={COLOR_MODE_STORAGE_KEY} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
