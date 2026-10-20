/**
 * Export PNG em alta (2048 px de largura): pet + plaquinha com o nome + crédito.
 * A plaquinha é desenhada no canvas (não no SVG) para usar as web fonts.
 */
import type { PetTraits } from '@/domain/pet';
import { brand, light } from '@/theme/tokens';
import { art } from './palette';
import { renderPetSvg } from '.';
import { renderPixelCanvas, svgToImage } from './raster';
import { CANVAS } from './types';

export const PNG_WIDTH = 2048;

export interface PngOptions {
  name: string;
  withBackground: boolean;
  credit: string;
  /** `font-family` resolvida das fontes do next/font (display e corpo). */
  fonts: { display: string; body: string };
}

function roundRect(
  x: CanvasRenderingContext2D,
  X: number,
  Y: number,
  w: number,
  h: number,
  r: number,
) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + w, Y, X + w, Y + h, r);
  x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r);
  x.arcTo(X, Y, X + w, Y, r);
  x.closePath();
}

export async function createPetPng(traits: PetTraits, opts: PngOptions): Promise<Blob> {
  const W = PNG_WIDTH;
  const petH = Math.round(CANVAS.height * (W / CANVAS.width));
  const H = petH + 260;
  const displayFont = `700 110px ${opts.fonts.display}`;
  const bodyFont = `600 40px ${opts.fonts.body}`;
  try {
    await Promise.all([document.fonts.load(displayFont), document.fonts.load(bodyFont)]);
  } catch {
    // Sem a web font o canvas cai no fallback — aceitável.
  }

  const pixel = traits.style === 'pixel';
  const source = pixel ? await renderPixelCanvas(traits) : await svgToImage(renderPetSvg(traits));

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  if (!x) throw new Error('Canvas 2D indisponível');

  if (opts.withBackground) {
    x.fillStyle = brand.sky;
    x.fillRect(0, 0, W, H);
    x.fillStyle = brand.white;
    x.beginPath();
    x.ellipse(W / 2, H * 0.86, W * 0.42, H * 0.07, 0, 0, Math.PI * 2);
    x.fill();
  }
  x.imageSmoothingEnabled = !pixel;
  x.drawImage(source, 0, 0, W, petH);
  x.imageSmoothingEnabled = true;

  // Plaquinha
  const th = 180;
  const ty = petH + 10;
  const tw = Math.min(W * 0.7, Math.max(560, opts.name.length * 110 + 200));
  x.fillStyle = art.outline;
  roundRect(x, (W - tw) / 2 - 8, ty - 8, tw + 16, th + 16, th / 2 + 8);
  x.fill();
  x.fillStyle = art.nameTag;
  roundRect(x, (W - tw) / 2, ty, tw, th, th / 2);
  x.fill();
  x.fillStyle = art.nameTagText;
  x.font = displayFont;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(opts.name, W / 2, ty + th / 2 + 6);

  // Crédito
  x.font = bodyFont;
  x.textAlign = 'right';
  x.textBaseline = 'alphabetic';
  x.fillStyle = opts.withBackground ? light.muted : '#8f9196';
  x.fillText(opts.credit, W - 60, H - 50);

  return new Promise((resolve, reject) =>
    c.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob falhou'))), 'image/png'),
  );
}

/** Nome de arquivo seguro: "pet-mio-bruno.png". */
export function pngFileName(name: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `pet-mio${slug ? `-${slug}` : ''}.png`;
}
