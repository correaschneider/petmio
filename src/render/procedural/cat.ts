import type { CatBreed, PetTraits } from '@/domain/pet';
import { PATCH_COLORS } from '@/domain/pet';
import { art } from '../palette';
import { STROKE, type DrawContext } from './context';
import { drawEyes } from './parts';

const HEAD: Record<CatBreed, { rx: number; ry: number; cy: number }> = {
  europeo: { rx: 66, ry: 58, cy: 130 },
  siamese: { rx: 60, ry: 56, cy: 132 },
  persiano: { rx: 74, ry: 66, cy: 130 },
};

/** Camadas de trás para frente: rabo → orelhas → corpo → acessório → cabeça → rosto. */
export function drawCat(t: PetTraits, ctx: DrawContext): string {
  const { st, base, light, patched, pixel, detail } = ctx;
  const breed = t.breed as CatBreed;
  const siamese = breed === 'siamese';
  // Siamês: pontas escuras (orelhas, máscara, patas, rabo)
  const point =
    t.fur === 'nero' || t.fur === 'cioccolato' ? art.siamesePointDark : art.siamesePointWarm;
  const pointed = siamese ? point : base;
  const strokeWidth = pixel ? STROKE.pixel : STROKE.cartoon;
  let g = '';

  // Rabo (atrás do corpo): traço grosso escuro + traço da cor por cima = contorno
  const tail = 'M205 268 Q262 262 246 206';
  g += `<path d="${tail}" fill="none" stroke="${art.outline}" stroke-width="${16 + strokeWidth * 2}" stroke-linecap="round"/>`;
  g += `<path d="${tail}" fill="none" stroke="${pointed}" stroke-width="16" stroke-linecap="round"/>`;

  // Orelhas
  if (breed === 'persiano') {
    g += `<path d="M104 84 Q92 44 124 66 Z" fill="${pointed}" ${st}/><path d="M196 84 Q208 44 176 66 Z" fill="${pointed}" ${st}/>`;
  } else {
    const w = siamese ? 80 : 88;
    const h = siamese ? 30 : 40;
    g += `<path d="M102 92 L${w} ${h} L140 70 Z" fill="${pointed}" ${st}/><path d="M198 92 L${300 - w} ${h} L160 70 Z" fill="${pointed}" ${st}/>`;
    g += `<path d="M106 86 L${w + 8} ${h + 14} L132 74 Z" fill="${art.catInnerEar}"/><path d="M194 86 L${292 - w} ${h + 14} L168 74 Z" fill="${art.catInnerEar}"/>`;
  }

  // Corpo
  const brx = t.body === 'atletico' ? 52 : 70;
  const bry = t.body === 'atletico' ? 56 : 50;
  g += `<ellipse cx="150" cy="248" rx="${brx}" ry="${bry}" fill="${base}" ${st}/>`;
  if (patched) {
    g += `<path d="M${150 - brx + 6} 236 Q150 196 ${150 + brx - 6} 236 Q150 262 ${150 - brx + 6} 236Z" fill="${PATCH_COLORS.warm}"/>`;
  }
  g += `<ellipse cx="150" cy="262" rx="${brx * 0.5}" ry="${bry * 0.55}" fill="${light}"/>`;
  g += `<ellipse cx="124" cy="296" rx="18" ry="10" fill="${pointed}" ${st}/><ellipse cx="176" cy="296" rx="18" ry="10" fill="${pointed}" ${st}/>`;

  // Acessório de pescoço
  if (t.acc === 'collare') {
    g += `<rect x="104" y="190" width="92" height="16" rx="8" fill="${art.collar}" ${st}/><circle cx="150" cy="210" r="7" fill="${art.collarTag}" ${st}/>`;
  }
  if (t.acc === 'bandana') {
    g += `<path d="M102 192 L198 192 L150 236 Z" fill="${art.bandana}" ${st}/><rect x="100" y="186" width="100" height="12" rx="6" fill="${art.bandana}" ${st}/>`;
  }

  // Cabeça (persa tem bochechas fofas)
  const hd = HEAD[breed];
  if (breed === 'persiano') {
    g += `<ellipse cx="92" cy="150" rx="22" ry="28" fill="${base}" ${st}/><ellipse cx="208" cy="150" rx="22" ry="28" fill="${base}" ${st}/>`;
  }
  g += `<ellipse cx="150" cy="${hd.cy}" rx="${hd.rx}" ry="${hd.ry}" fill="${base}" ${st}/>`;
  if (patched) {
    g += `<ellipse cx="106" cy="110" rx="26" ry="32" fill="${PATCH_COLORS.warm}"/><ellipse cx="196" cy="108" rx="26" ry="30" fill="${PATCH_COLORS.dark}"/>`;
  }
  if (siamese) g += `<ellipse cx="150" cy="156" rx="48" ry="30" fill="${point}"/>`;

  // Focinho + bigodes
  const my = breed === 'persiano' ? 150 : 158;
  const ny = my - 8;
  g += `<ellipse cx="150" cy="${my}" rx="${pixel ? 30 : 26}" ry="${pixel ? 19 : 16}" fill="${light}" ${pixel ? '' : st}/>`;
  g += detail(
    `<path d="M118 ${my - 4} L78 ${my - 10} M118 ${my + 2} L80 ${my + 10} M182 ${my - 4} L222 ${my - 10} M182 ${my + 2} L220 ${my + 10}" fill="none" stroke="${art.outline}" stroke-width="3" stroke-linecap="round"/>`,
  );

  // Boca ("w" de gato)
  const m0 = ny + 8;
  const w = `<path d="M136 ${m0} Q143 ${m0 + 10} 150 ${m0} Q157 ${m0 + 10} 164 ${m0}" fill="none" ${st}/>`;
  if (t.mouth === 'sorriso') g += w;
  else if (t.mouth === 'lingua') {
    g += w + `<ellipse cx="150" cy="${m0 + 12}" rx="7" ry="9" fill="${art.tongue}" ${st}/>`;
  } else g += `<path d="M142 ${m0 + 3} L158 ${m0 + 3}" ${st}/>`;

  // Nariz triangular
  g += `<path d="M150 ${ny + 3} L150 ${m0}" ${st}/>`;
  g += `<path d="M150 ${ny + 5} L142 ${ny - 4} L158 ${ny - 4} Z" fill="${art.catNose}" stroke="${art.outline}" stroke-width="3" stroke-linejoin="round"/>`;

  // Olhos (pupila vertical; redonda quando surpreso)
  g += drawEyes(ctx, t.eyes, {
    sclera: ctx.iris,
    pupil: (cx, cy, ir) =>
      t.eyes === 'sorpresi'
        ? `<circle cx="${cx}" cy="${cy}" r="${ir * 0.6}" fill="${art.pupil}"/>`
        : `<ellipse cx="${cx}" cy="${cy}" rx="${ir * 0.32}" ry="${ir * 0.85}" fill="${art.pupil}"/>`,
    lid: pointed,
  });
  return g;
}
