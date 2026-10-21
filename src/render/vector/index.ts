/**
 * Renderer vetorial: monta o pet com as peças finais de `models/` (geradas em
 * `parts.generated.ts` por `scripts/art/build_parts.py`), na mesma ordem e com o mesmo ajuste da
 * bancada `models/index.html`.
 *
 * - Peças da raça (`<raça>-*`): corpo, cabeça (gatos: com as orelhas) e orelhas dos cães.
 * - Peças comuns da espécie (`cane-*` / `gatto-*`): boca, nariz, bigodes, acessórios — desenhadas
 *   no rosto do modelo base (labrador / europeu) e levadas ao rosto da raça pelo `FIT`.
 * - Olhos: desenhados em código (5 estilos, íris recolorível) nas âncoras da raça.
 * - Corpo robusto: o atlético esticado na horizontal em torno do centro do corpo.
 * - Pelo: as cores marcadas {fur} {furShade} {furLight} {outline} {point} seguem a paleta do
 *   pelo escolhido (`FUR_PALETTE`, em `render/palette.ts`).
 */
import type { Accessory, Mouth, PetTraits, Species } from '@/domain/pet';
import { IRIS_COLORS } from '@/domain/pet';
import { FUR_PALETTE, type FurPalette } from '../palette';
import { createContext } from '../procedural/context';
import { drawNameTag } from '../procedural/parts';
import { svgDocument } from '../svg';
import { CANVAS, canvasHeight, type PetRenderer, type RenderOptions } from '../types';
import { drawEyes } from './eyes';
import { EYE_STYLE, EYES, FIT, PARTS, ROBUST_CX } from './parts.generated';
import { tricolorRegions, type Regions } from './tricolor';

/** Prefixo das peças comuns de cada espécie. */
const COMMON: Record<Species, string> = { cane: 'cane', gatto: 'gatto' };

const MOUTH_PART: Record<Mouth, string> = {
  sorriso: 'boca-sorriso',
  lingua: 'boca-lingua',
  neutro: 'boca-neutra',
};

const ACCESSORY_PART: Record<
  Exclude<Accessory, 'nessuno'>,
  { part: string; fit: string; front: boolean }
> = {
  collare: { part: 'acessorio-coleira', fit: 'pescoco', front: false },
  bandana: { part: 'acessorio-bandana', fit: 'pescoco', front: false },
  occhiali: { part: 'acessorio-oculos', fit: 'oculos', front: true },
};

/** Enquadramento 1024 do guia → área 300×320 do palco (com folga para a plaquinha). */
const FRAME_SCALE = 0.34;
const FRAME = `translate(${CANVAS.width / 2 - 512 * FRAME_SCALE} ${-60 * FRAME_SCALE}) scale(${FRAME_SCALE})`;

const ROBUST_WIDEN = 1.14;

/** Marcação da peça com a paleta do pelo aplicada. */
function part(name: string, p: FurPalette): string {
  const svg = PARTS[name];
  if (svg === undefined) throw new Error(`peça inexistente: ${name}`);
  return svg
    .replaceAll('{fur}', p.fur)
    .replaceAll('{furShade}', p.shade)
    .replaceAll('{furLight}', p.light)
    .replaceAll('{outline}', p.outline)
    .replaceAll('{point}', p.point);
}

/** Leva a peça comum do rosto base ao da raça (sem FIT = raça base, fica onde está). */
function fitted(breed: string, key: string, svg: string): string {
  const f = FIT[breed]?.[key];
  if (!f) return svg;
  const t = `translate(${f.to[0]} ${f.to[1]}) scale(${f.s}) translate(${-f.from[0]} ${-f.from[1]})`;
  return `<g transform="${t}">${svg}</g>`;
}

export const renderVector: PetRenderer = (traits, options: RenderOptions = {}) => {
  if (traits.fur === 'tricolore') {
    const regions = tricolorRegions(traits.species, traits.breed, traits.pattern);
    return renderWithPalette(traits, regions.body, options, regions);
  }
  return renderWithPalette(traits, FUR_PALETTE[traits.fur], options);
};

/** Monta o pet com uma paleta dada (o app usa a do pelo escolhido; o estudo de paletas compara). */
export function renderWithPalette(
  traits: PetTraits,
  p: FurPalette,
  options: RenderOptions = {},
  /** Paleta por parte (tricolor); sem ela, tudo na paleta `p`. */
  regions: Regions = { head: p, ears: p, body: p },
): string {
  const { breed, species } = traits;
  const common = COMMON[species];
  const style = { outline: p.outline, stroke: EYE_STYLE[species]!.stroke };

  const cx = ROBUST_CX[breed] ?? 512;
  let body = part(`${breed}-corpo-atletico`, regions.body);
  if (traits.body === 'robusto')
    body = `<g transform="translate(${cx} 0) scale(${ROBUST_WIDEN} 1) translate(${-cx} 0)">${body}</g>`;

  const acc = traits.acc === 'nessuno' ? null : ACCESSORY_PART[traits.acc];
  const accSvg = acc ? fitted(breed, acc.fit, part(`${common}-${acc.part}`, p)) : '';

  // ordem de desenho (de trás para frente): acessório de pescoço atrás da cabeça; orelha caída do
  // cão na frente da cabeça (a do gato já vem dentro da cabeça); óculos por cima de tudo
  const layers = [
    body,
    acc && !acc.front ? accSvg : '',
    part(`${breed}-cabeca`, regions.head),
    fitted(breed, 'boca', part(`${common}-${MOUTH_PART[traits.mouth]}`, p)),
    fitted(breed, 'nariz', part(`${common}-nariz`, p)),
    drawEyes(EYES[breed]!, traits.eyes, IRIS_COLORS[traits.eyeColor], style, regions.head.fur),
    species === 'gatto'
      ? fitted(
          breed,
          'bigodes',
          part(traits.whiskers === 'tre' ? 'gatto-bigodes-tres' : 'gatto-bigodes', p),
        )
      : '',
    species === 'cane' ? part(`${breed}-orelha`, regions.ears) : '',
    acc && acc.front ? accSvg : '',
  ];

  let doc = `<g transform="${FRAME}">${layers.join('')}</g>`;
  const withTag = options.nameTag !== undefined;
  const name = options.nameTag?.trim();
  if (name) doc += drawNameTag(createContext(traits, options), name, options.fontFamily);
  const label = options.label ?? (species === 'gatto' ? 'Gatto' : 'Cane');
  return svgDocument(doc, CANVAS.width, canvasHeight(withTag), label);
}
