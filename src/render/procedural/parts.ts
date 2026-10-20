/**
 * Partes compartilhadas por cão e gato: olhos, óculos e plaquinha do nome.
 * Âncoras (viewBox 300×320): olhos y=118 em x=122/178; plaquinha y=306.
 */
import type { Eyes } from '@/domain/pet';
import { art } from '../palette';
import { escapeXml } from '../svg';
import type { DrawContext } from './context';

export const EYE_Y = 118;
export const EYE_XS = [122, 178] as const;

export interface EyeStyle {
  /** Cor do "branco" do olho (gato usa a própria íris). */
  sclera: string;
  /** Pupila desenhada sobre a íris (omitida no modo pixel). */
  pupil: (cx: number, cy: number, irisRadius: number) => string;
  /** Cor da pálpebra dos olhos sonolentos (segue o pelo). */
  lid: string;
}

export function drawEyes(ctx: DrawContext, eyes: Eyes, style: EyeStyle): string {
  const { st, pixel, detail } = ctx;
  const ey = EYE_Y;
  let g = '';
  for (const ex of EYE_XS) {
    if (eyes === 'allegri') {
      g += `<path d="M${ex - 12} ${ey + 3} Q${ex} ${ey - 14} ${ex + 12} ${ey + 3}" fill="none" ${st}/>`;
      continue;
    }
    const big = eyes === 'sorpresi' || eyes === 'dolci';
    const r = (big ? 14 : 11) + (pixel ? 3 : 0);
    const ir = (eyes === 'dolci' ? 10 : eyes === 'sorpresi' ? 6 : 7) + (pixel ? 2 : 0);
    g += `<circle cx="${ex}" cy="${ey}" r="${r}" fill="${style.sclera}" ${pixel ? '' : st}/>`;
    g += `<circle cx="${ex}" cy="${ey}" r="${ir}" fill="${ctx.iris}"/>`;
    if (!pixel) g += style.pupil(ex, ey, ir);
    g += detail(`<circle cx="${ex - 3}" cy="${ey - 3}" r="2.5" fill="${art.highlight}"/>`);
    if (eyes === 'dolci') {
      g += detail(`<circle cx="${ex + 4}" cy="${ey + 4}" r="1.8" fill="${art.highlight}"/>`);
    }
    if (eyes === 'assonnati') {
      g += `<path d="M${ex - r} ${ey - 2} A${r} ${r} 0 0 1 ${ex + r} ${ey - 2} L${ex + r} ${ey - 8} A${r} ${r} 0 0 0 ${ex - r} ${ey - 8} Z" fill="${style.lid}"/>`;
      g += `<path d="M${ex - r} ${ey - 3} Q${ex} ${ey + 2} ${ex + r} ${ey - 3}" fill="none" ${st}/>`;
    }
  }
  return g;
}

export interface GlassesPlacement {
  xs: readonly [number, number];
  y: number;
  r: number;
}

/** Óculos redondos; a posição padrão casa com os olhos do renderer procedural. */
export function drawGlasses(
  { xs, y, r }: GlassesPlacement = { xs: EYE_XS, y: EYE_Y, r: 19 },
): string {
  const lens = (cx: number) =>
    `<circle cx="${cx}" cy="${y}" r="${r}" fill="${art.lensTint}" stroke="${art.outline}" stroke-width="5"/>`;
  return (
    lens(xs[0]) +
    lens(xs[1]) +
    `<path d="M${xs[0] + r} ${y} L${xs[1] - r} ${y}" stroke="${art.outline}" stroke-width="5" stroke-linecap="round"/>`
  );
}

export const NAME_TAG_Y = 306;
export const DEFAULT_FONT = 'Fredoka, Nunito, sans-serif';

export function drawNameTag(ctx: DrawContext, name: string, fontFamily = DEFAULT_FONT): string {
  return (
    `<rect x="70" y="${NAME_TAG_Y}" width="160" height="34" rx="17" fill="${art.nameTag}" ${ctx.st}/>` +
    `<text x="150" y="${NAME_TAG_Y + 23}" text-anchor="middle" font-family="${escapeXml(fontFamily)}" font-weight="700" font-size="20" fill="${art.nameTagText}">${escapeXml(name)}</text>`
  );
}
