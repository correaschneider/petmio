import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Imagem de produção enxuta (ver Dockerfile, estágio runtime).
  output: 'standalone',
  poweredByHeader: false,
};

export default nextConfig;
