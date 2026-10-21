import type { NextConfig } from 'next';

/**
 * Dois alvos:
 * - padrão: imagem Docker enxuta (ver Dockerfile, estágio runtime);
 * - `PAGES=1`: site estático para o GitHub Pages (`out/`), servido em `/<repo>` (`PAGES_BASE_PATH`,
 *   padrão `/petmio`). O app é todo do lado do cliente, então exporta sem perder nada.
 */
const pages = process.env.PAGES === '1';
const basePath = pages ? (process.env.PAGES_BASE_PATH ?? '/petmio') : undefined;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  ...(pages
    ? {
        output: 'export',
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
        // build e site exportado em `out/` (no Next 16 o export sai no distDir): não disputa o
        // `.next` com o `next dev` rodando
        distDir: 'out',
      }
    : { output: 'standalone' }),
};

export default nextConfig;
