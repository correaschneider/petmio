/**
 * Rasterização no browser: SVG → <img> → <canvas>, e o filtro de pixel art.
 * Só roda no cliente (usa Image/canvas); `posterize` é puro e testável.
 */
import type { PetTraits } from '@/domain/pet';
import { renderPetSvg } from '.';
import { CANVAS, canvasHeight, type RenderOptions } from './types';

/** Largura do sprite em "pixels de console" e fator de ampliação. */
export const PIXEL_SPRITE_WIDTH = 48;
export const PIXEL_UPSCALE = 12;
/** Supersampling: cada pixel do sprite nasce de um bloco SS×SS da render em alta. */
export const PIXEL_SUPERSAMPLE = 8;

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

const luminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Reduz `src` (w×h, RGBA) por blocos `factor`×`factor` dando prioridade ao contorno: se o
 * bloco tem traço escuro suficiente, o pixel vira contorno; senão, a média das cores claras.
 * O downscale do browser faz média de tudo e o contorno fino da arte some no sprite.
 */
export function downsampleSprite(
  src: Uint8ClampedArray,
  w: number,
  h: number,
  factor: number,
): { data: Uint8ClampedArray<ArrayBuffer>; width: number; height: number } {
  const width = Math.floor(w / factor);
  const height = Math.floor(h / factor);
  const data = new Uint8ClampedArray(width * height * 4);
  const area = factor * factor;
  for (let by = 0; by < height; by++) {
    for (let bx = 0; bx < width; bx++) {
      // 1ª passada: luminância máxima do bloco (escuridão é RELATIVA — pelo preto não é contorno).
      let maxLum = 0;
      for (let y = 0; y < factor; y++) {
        for (let x = 0; x < factor; x++) {
          const i = ((by * factor + y) * w + bx * factor + x) * 4;
          if ((src[i + 3] ?? 0) >= 128) {
            maxLum = Math.max(maxLum, luminance(src[i] ?? 0, src[i + 1] ?? 0, src[i + 2] ?? 0));
          }
        }
      }
      const darkBelow = Math.min(90, maxLum * 0.55);
      let opaque = 0;
      const dark = [0, 0, 0, 0];
      const lite = [0, 0, 0, 0];
      for (let y = 0; y < factor; y++) {
        for (let x = 0; x < factor; x++) {
          const i = ((by * factor + y) * w + bx * factor + x) * 4;
          if ((src[i + 3] ?? 0) < 128) continue;
          opaque++;
          const r = src[i] ?? 0;
          const g = src[i + 1] ?? 0;
          const b = src[i + 2] ?? 0;
          const acc = luminance(r, g, b) < darkBelow ? dark : lite;
          acc[0]! += r;
          acc[1]! += g;
          acc[2]! += b;
          acc[3]! += 1;
        }
      }
      const o = (by * width + bx) * 4;
      if (opaque < area * 0.4) continue; // transparente
      const pick = dark[3]! >= area * 0.18 || lite[3] === 0 ? dark : lite;
      data[o] = pick[0]! / pick[3]!;
      data[o + 1] = pick[1]! / pick[3]!;
      data[o + 2] = pick[2]! / pick[3]!;
      data[o + 3] = 255;
    }
  }
  return { data, width, height };
}

/** Pixel art = SVG simplificado rasterizado minúsculo e ampliado sem suavização. */
export async function renderPixelCanvas(
  traits: PetTraits,
  options: Omit<RenderOptions, 'pixel'> = {},
): Promise<HTMLCanvasElement> {
  const svg = renderPetSvg(traits, { ...options, pixel: true });
  const img = await svgToImage(svg);
  const height = canvasHeight(options.nameTag !== undefined);

  const ss = PIXEL_SUPERSAMPLE;
  const hi = document.createElement('canvas');
  hi.width = PIXEL_SPRITE_WIDTH * ss;
  hi.height = Math.round((PIXEL_SPRITE_WIDTH * height) / CANVAS.width) * ss;
  const hx = hi.getContext('2d', { willReadFrequently: true });
  if (!hx) throw new Error('Canvas 2D indisponível');
  hx.drawImage(img, 0, 0, hi.width, hi.height);
  const sprite = downsampleSprite(
    hx.getImageData(0, 0, hi.width, hi.height).data,
    hi.width,
    hi.height,
    ss,
  );
  // Passo 16: com 32 os escuros desviavam de matiz (#2f2f33 virava azul-marinho).
  posterize(sprite.data, 16);

  const small = document.createElement('canvas');
  small.width = sprite.width;
  small.height = sprite.height;
  const sx = small.getContext('2d');
  if (!sx) throw new Error('Canvas 2D indisponível');
  sx.putImageData(new ImageData(sprite.data, sprite.width, sprite.height), 0, 0);

  const big = document.createElement('canvas');
  big.width = small.width * PIXEL_UPSCALE;
  big.height = small.height * PIXEL_UPSCALE;
  const bx = big.getContext('2d');
  if (!bx) throw new Error('Canvas 2D indisponível');
  bx.imageSmoothingEnabled = false;
  bx.drawImage(small, 0, 0, big.width, big.height);
  return big;
}
