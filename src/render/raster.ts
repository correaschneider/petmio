/**
 * Rasterização no browser: SVG → <img> → <canvas>, e o filtro de pixel art.
 * Só roda no cliente (usa Image/canvas); `posterize` é puro e testável.
 */
import type { PetTraits } from '@/domain/pet';
import { renderPetSvg } from '.';
import { CANVAS, canvasHeight, type RenderOptions } from './types';

/** Largura do sprite em "pixels de console" e fator de ampliação. */
export const PIXEL_SPRITE_WIDTH = 40;
export const PIXEL_UPSCALE = 14;

export function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Falha ao carregar o SVG como imagem'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/**
 * Reduz cada canal a passos de 32 (paleta curta) e torna o alpha binário, para
 * as áreas chapadas continuarem chapadas como num sprite de console.
 */
export function posterize(pixels: Uint8ClampedArray, step = 32): void {
  for (let i = 0; i < pixels.length; i += 4) {
    if ((pixels[i + 3] ?? 0) < 128) {
      pixels[i + 3] = 0;
      continue;
    }
    pixels[i + 3] = 255;
    for (let c = 0; c < 3; c++) pixels[i + c] = Math.round((pixels[i + c] ?? 0) / step) * step;
  }
}

/** Pixel art = SVG simplificado rasterizado minúsculo e ampliado sem suavização. */
export async function renderPixelCanvas(
  traits: PetTraits,
  options: Omit<RenderOptions, 'pixel'> = {},
): Promise<HTMLCanvasElement> {
  const svg = renderPetSvg(traits, { ...options, pixel: true });
  const img = await svgToImage(svg);
  const height = canvasHeight(options.nameTag !== undefined);

  const small = document.createElement('canvas');
  small.width = PIXEL_SPRITE_WIDTH;
  small.height = Math.round((PIXEL_SPRITE_WIDTH * height) / CANVAS.width);
  const sx = small.getContext('2d', { willReadFrequently: true });
  if (!sx) throw new Error('Canvas 2D indisponível');
  sx.imageSmoothingEnabled = false;
  sx.drawImage(img, 0, 0, small.width, small.height);
  const data = sx.getImageData(0, 0, small.width, small.height);
  posterize(data.data);
  sx.putImageData(data, 0, 0);

  const big = document.createElement('canvas');
  big.width = small.width * PIXEL_UPSCALE;
  big.height = small.height * PIXEL_UPSCALE;
  const bx = big.getContext('2d');
  if (!bx) throw new Error('Canvas 2D indisponível');
  bx.imageSmoothingEnabled = false;
  bx.drawImage(small, 0, 0, big.width, big.height);
  return big;
}
