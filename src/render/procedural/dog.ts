import type { DogBreed, PetTraits } from '@/domain/pet';
import { PATCH_COLORS } from '@/domain/pet';
import { art } from '../palette';
import type { DrawContext } from './context';
import { drawEyes } from './parts';

const HEAD: Record<DogBreed, { rx: number; ry: number; cy: number }> = {
  labrador: { rx: 70, ry: 62, cy: 130 },
  beagle: { rx: 62, ry: 68, cy: 134 },
  pug: { rx: 72, ry: 70, cy: 130 },
};

const MUZZLE: Record<DogBreed, { x: number; y: number; rx: number; ry: number }> = {
  labrador: { x: 150, y: 166, rx: 36, ry: 26 },
  beagle: { x: 150, y: 170, rx: 34, ry: 32 },
  pug: { x: 150, y: 164, rx: 42, ry: 20 },
};

const NOSE: Record<DogBreed, { x: number; y: number; rx: number; ry: number }> = {
  labrador: { x: 150, y: 150, rx: 12, ry: 9 },
  beagle: { x: 150, y: 152, rx: 12, ry: 9 },
  pug: { x: 150, y: 155, rx: 11, ry: 7 },
};

/** Camadas de trás para frente: orelhas → corpo → acessório de pescoço → cabeça → rosto. */
export function drawDog(t: PetTraits, ctx: DrawContext): string {
  const { st, base, light, patched, pixel, detail } = ctx;
  const breed = t.breed as DogBreed;
  let g = '';

  // Orelhas (atrás da cabeça)
  if (breed === 'labrador') {
    g += `<ellipse cx="86" cy="132" rx="22" ry="40" transform="rotate(12 86 132)" fill="${base}" ${st}/>`;
    g += `<ellipse cx="214" cy="132" rx="22" ry="40" transform="rotate(-12 214 132)" fill="${base}" ${st}/>`;
  } else if (breed === 'beagle') {
    const ear = patched ? PATCH_COLORS.warm : base;
    g += `<ellipse cx="80" cy="150" rx="24" ry="60" transform="rotate(8 80 150)" fill="${ear}" ${st}/>`;
    g += `<ellipse cx="220" cy="150" rx="24" ry="60" transform="rotate(-8 220 150)" fill="${ear}" ${st}/>`;
  } else {
    g += `<path d="M92 92 L80 60 L128 76 Z" fill="${base}" ${st}/><path d="M208 92 L220 60 L172 76 Z" fill="${base}" ${st}/>`;
  }

  // Corpo
  const brx = t.body === 'atletico' ? 58 : 76;
  const bry = t.body === 'atletico' ? 56 : 50;
  g += `<ellipse cx="150" cy="248" rx="${brx}" ry="${bry}" fill="${base}" ${st}/>`;
  if (patched) {
    g += `<path d="M${150 - brx + 8} 238 Q150 200 ${150 + brx - 8} 238 Q150 262 ${150 - brx + 8} 238Z" fill="${PATCH_COLORS.dark}"/>`;
  }
  g += `<ellipse cx="150" cy="262" rx="${brx * 0.5}" ry="${bry * 0.55}" fill="${light}"/>`;
  g += `<ellipse cx="122" cy="296" rx="20" ry="11" fill="${base}" ${st}/><ellipse cx="178" cy="296" rx="20" ry="11" fill="${base}" ${st}/>`;

  // Acessório de pescoço (sob a cabeça)
  if (t.acc === 'collare') {
    g += `<rect x="100" y="188" width="100" height="18" rx="9" fill="${art.collar}" ${st}/><circle cx="150" cy="210" r="8" fill="${art.collarTag}" ${st}/>`;
  }
  if (t.acc === 'bandana') {
    g += `<path d="M98 190 L202 190 L150 240 Z" fill="${art.bandana}" ${st}/><rect x="96" y="184" width="108" height="12" rx="6" fill="${art.bandana}" ${st}/>`;
  }

  // Cabeça
  const hd = HEAD[breed];
  g += `<ellipse cx="150" cy="${hd.cy}" rx="${hd.rx}" ry="${hd.ry}" fill="${base}" ${st}/>`;
  if (patched) {
    g += `<ellipse cx="102" cy="112" rx="28" ry="34" fill="${PATCH_COLORS.warm}"/><ellipse cx="198" cy="112" rx="28" ry="34" fill="${PATCH_COLORS.warm}"/><ellipse cx="150" cy="80" rx="22" ry="14" fill="${PATCH_COLORS.dark}"/>`;
  }
  if (breed === 'pug') {
    g += `<path d="M118 92 Q150 78 182 92" fill="none" ${st}/>`;
    g += detail(
      `<path d="M124 104 Q150 94 176 104" fill="none" stroke="${art.outline}" stroke-width="3" stroke-linecap="round"/>`,
    );
  }

  // Focinho
  const mz = MUZZLE[breed];
  const nose = NOSE[breed];
  g += `<ellipse cx="${mz.x}" cy="${mz.y}" rx="${mz.rx}" ry="${mz.ry}" fill="${light}" ${pixel ? '' : st}/>`;

  // Boca
  const my0 = nose.y + 18;
  const smile = `<path d="M${mz.x - 16} ${my0} Q150 ${my0 + 16} ${mz.x + 16} ${my0}" fill="none" ${st}/>`;
  if (t.mouth === 'sorriso') g += smile;
  else if (t.mouth === 'lingua') {
    g += smile + `<ellipse cx="150" cy="${my0 + 16}" rx="10" ry="12" fill="${art.tongue}" ${st}/>`;
  } else g += `<path d="M${mz.x - 12} ${my0 + 4} L${mz.x + 12} ${my0 + 4}" ${st}/>`;

  // Nariz
  g += `<path d="M150 ${nose.y + 6} L150 ${my0}" ${st}/>`;
  g += `<ellipse cx="${nose.x}" cy="${nose.y}" rx="${pixel ? nose.rx + 3 : nose.rx}" ry="${pixel ? nose.ry + 2 : nose.ry}" fill="${art.outline}"/>`;
  g += detail(
    `<ellipse cx="${nose.x - 4}" cy="${nose.y - 3}" rx="3" ry="2" fill="${art.highlight}" opacity=".8"/>`,
  );

  // Olhos
  g += drawEyes(ctx, t.eyes, {
    sclera: art.sclera,
    pupil: (cx, cy, ir) => `<circle cx="${cx}" cy="${cy}" r="${ir * 0.55}" fill="${art.pupil}"/>`,
    lid: base,
  });
  return g;
}
