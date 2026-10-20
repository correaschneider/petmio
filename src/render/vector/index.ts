/**
 * Renderer vetorial por camadas: monta o pet a partir das camadas dos guias do Recraft
 * (`models.generated.ts`, gerado por `scripts/art/build_layers.py`).
 *
 * A raça escolhe o modelo base (cabeça, orelhas, focinho, nariz, corpo, manchas, rabo). Os traços
 * trocáveis entram pelas âncoras do modelo:
 *  - olhos: desenhados aqui no tamanho/posição dos olhos do modelo (5 estilos, íris recolorível);
 *  - boca: transplantada do modelo que tem aquela boca, presa à base do nariz;
 *  - coleira/bandana: do próprio modelo ou transplantada pela âncora do pescoço;
 *  - óculos: do beagle, presos ao meio dos olhos;
 *  - corpo robusto: corpo alargado; pelo: recolorido por papel da cor.
 */
import type { Accessory, Mouth, PetTraits, Species } from '@/domain/pet';
import { FUR_COLORS, IRIS_COLORS } from '@/domain/pet';
import { mix } from '../colors';
import { createContext } from '../procedural/context';
import { drawNameTag } from '../procedural/parts';
import { svgDocument } from '../svg';
import { CANVAS, canvasHeight, type PetRenderer, type RenderOptions } from '../types';
import { drawEyes } from './eyes';
import { VECTOR_MODELS } from './models.generated';
import type { Box, VectorModel, VectorShape } from './types';

type ModelId = keyof typeof VECTOR_MODELS;

/** Raça → modelo. O persa ainda não tem guia próprio: usa o europeu. */
const MODEL_OF: Record<PetTraits['breed'], ModelId> = {
  labrador: 'labrador',
  beagle: 'beagle',
  pug: 'pug',
  europeo: 'europeo',
  siamese: 'siamese',
  persiano: 'europeo',
};

/** De qual modelo vem cada boca (por espécie). `null` = desenhada aqui. */
const MOUTH_FROM: Record<Species, Record<Mouth, ModelId | null>> = {
  cane: { sorriso: 'labrador', lingua: 'beagle', neutro: 'pug' },
  gatto: { sorriso: 'europeo', lingua: 'siamese', neutro: null },
};

/** Modelo que doa cada acessório quando o modelo base não tem o seu. */
const ACCESSORY_FROM: Record<Exclude<Accessory, 'nessuno'>, Record<Species, ModelId>> = {
  collare: { cane: 'labrador', gatto: 'siamese' },
  bandana: { cane: 'europeo', gatto: 'europeo' },
  occhiali: { cane: 'beagle', gatto: 'beagle' },
};

/** Ordem de desenho: orelha caída do cão na frente da cabeça; pontuda do gato atrás. */
const Z: Record<Species, readonly string[]> = {
  cane: [
    'tail',
    'body',
    'body-spots',
    'belly',
    'neck-accessory',
    'head',
    'head-spots',
    'muzzle',
    'mouth',
    'nose',
    'eyes',
    'whiskers',
    'ears',
    'face-accessory',
  ],
  gatto: [
    'tail',
    'body',
    'body-spots',
    'belly',
    'neck-accessory',
    'ears',
    'head',
    'head-spots',
    'muzzle',
    'mouth',
    'nose',
    'eyes',
    'whiskers',
    'face-accessory',
  ],
};

/** Enquadramento 1024 do guia → área 300×320 do palco (com folga para a plaquinha). */
const FRAME_SCALE = 0.34;
const FRAME = `translate(${CANVAS.width / 2 - 512 * FRAME_SCALE} ${-60 * FRAME_SCALE}) scale(${FRAME_SCALE})`;

const ROBUST_WIDEN = 1.14;

interface Palette {
  fur: string;
  furShade: string;
  furLight: string;
  outline: string;
}

function colorOf(shape: VectorShape, p: Palette): string {
  switch (shape.role) {
    case 'outline':
      return p.outline;
    case 'fur':
      return p.fur;
    case 'fur-shade':
      return p.furShade;
    case 'fur-light':
      return p.furLight;
    default:
      return shape.fill ?? p.outline;
  }
}

function paintShapes(shapes: readonly VectorShape[] | undefined, p: Palette): string {
  return (shapes ?? [])
    .map((s) => {
      const op = s.opacity !== undefined ? ` opacity="${s.opacity}"` : '';
      return `<path fill="${colorOf(s, p)}"${op} d="${s.d}"/>`;
    })
    .join('');
}

const center = (b: Box) => ((b[0] ?? 0) + (b[2] ?? 0)) / 2;
const width = (b: Box) => (b[2] ?? 0) - (b[0] ?? 0);

/** Leva o ponto (sx, sy) do modelo-fonte ao ponto (dx, dy) do alvo, com escala k. */
function moveTo(sx: number, sy: number, dx: number, dy: number, k: number): string {
  return `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) scale(${k.toFixed(4)}) translate(${(-sx).toFixed(1)} ${(-sy).toFixed(1)})`;
}

function neckKind(m: VectorModel): 'collare' | 'bandana' | null {
  const roles = (m.layers['neck-accessory'] ?? []).map((s) => s.role);
  if (roles.includes('collar')) return 'collare';
  if (roles.includes('bandana')) return 'bandana';
  return null;
}

/** Topo-centro e largura do pescoço: a coleira do modelo, ou estimado sob o queixo. */
function neckAnchor(m: VectorModel): { cx: number; y: number; w: number } {
  const n = m.anchors.neck;
  if (n) return { cx: center(n), y: n[1] ?? 0, w: width(n) };
  const f = m.anchors.face;
  return {
    cx: center(f),
    y: (f[3] ?? 0) - 0.04 * ((f[3] ?? 0) - (f[1] ?? 0)),
    w: 0.42 * width(m.anchors.head ?? f),
  };
}

function mouthLayer(traits: PetTraits, base: VectorModel, p: Palette): string {
  const from = MOUTH_FROM[base.species as Species][traits.mouth];
  const nose = base.anchors.nose ?? base.anchors.face;
  const nx = center(nose);
  const ny = nose[3] ?? 0;
  if (!from) {
    // Boca fechada de gato: traço curto do nariz e um "w" achatado.
    const w = width(base.anchors.head ?? base.anchors.face) * 0.07;
    return `<path d="M${nx} ${ny} v${w * 0.35} M${nx - w} ${ny + w * 0.3} Q${nx - w / 2} ${ny + w * 0.65} ${nx} ${ny + w * 0.35} Q${nx + w / 2} ${ny + w * 0.65} ${nx + w} ${ny + w * 0.3}" fill="none" stroke="${p.outline}" stroke-width="${base.stroke}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const src = VECTOR_MODELS[from] as VectorModel;
  const snose = src.anchors.nose ?? src.anchors.face;
  const k =
    width(base.anchors.head ?? base.anchors.face) / width(src.anchors.head ?? src.anchors.face);
  const t = moveTo(center(snose), snose[3] ?? 0, nx, ny, k);
  return `<g transform="${t}">${paintShapes(src.layers.mouth, { ...p, outline: src.outline })}</g>`;
}

function neckLayer(traits: PetTraits, base: VectorModel, p: Palette): string {
  if (traits.acc !== 'collare' && traits.acc !== 'bandana') return '';
  if (neckKind(base) === traits.acc) return paintShapes(base.layers['neck-accessory'], p);
  const src = VECTOR_MODELS[ACCESSORY_FROM[traits.acc][base.species as Species]] as VectorModel;
  const s = neckAnchor(src);
  const d = neckAnchor(base);
  return `<g transform="${moveTo(s.cx, s.y, d.cx, d.y, d.w / s.w)}">${paintShapes(src.layers['neck-accessory'], p)}</g>`;
}

function glassesLayer(base: VectorModel, p: Palette): string {
  const src = VECTOR_MODELS.beagle as VectorModel;
  const [se1, se2] = src.anchors.eyes;
  const [de1, de2] = base.anchors.eyes;
  if (!se1 || !se2 || !de1 || !de2) return '';
  const k = (de2.cx - de1.cx) / (se2.cx - se1.cx);
  const t = moveTo(
    (se1.cx + se2.cx) / 2,
    (se1.cy + se2.cy) / 2,
    (de1.cx + de2.cx) / 2,
    (de1.cy + de2.cy) / 2,
    k,
  );
  return `<g transform="${t}">${paintShapes(src.layers['face-accessory'], { ...p, outline: src.outline })}</g>`;
}

export const renderVector: PetRenderer = (traits, options: RenderOptions = {}) => {
  const base = VECTOR_MODELS[MODEL_OF[traits.breed]] as VectorModel;
  const fur = FUR_COLORS[traits.fur].base;
  const p: Palette = {
    fur,
    furShade: mix(fur, base.outline, 0.3),
    furLight: mix(fur, '#ffffff', 0.55),
    outline: base.outline,
  };
  const body = base.anchors.body;
  const widen =
    traits.body === 'robusto' && body
      ? `translate(${center(body)} 0) scale(${ROBUST_WIDEN} 1) translate(${-center(body)} 0)`
      : '';

  const layers: string[] = [];
  for (const layer of Z[base.species as Species]) {
    let svg: string;
    if (layer === 'eyes')
      svg = drawEyes(base.anchors.eyes, traits.eyes, IRIS_COLORS[traits.eyeColor], base, p.fur);
    else if (layer === 'mouth') svg = mouthLayer(traits, base, p);
    else if (layer === 'neck-accessory') svg = neckLayer(traits, base, p);
    else if (layer === 'face-accessory')
      svg = traits.acc === 'occhiali' ? glassesLayer(base, p) : '';
    else svg = paintShapes(base.layers[layer], p);
    if (!svg) continue;
    const bodyish =
      layer === 'tail' || layer === 'body' || layer === 'body-spots' || layer === 'belly';
    layers.push(bodyish && widen ? `<g transform="${widen}">${svg}</g>` : svg);
  }

  let doc = `<g transform="${FRAME}">${layers.join('')}</g>`;
  const withTag = options.nameTag !== undefined;
  const name = options.nameTag?.trim();
  if (name) doc += drawNameTag(createContext(traits, options), name, options.fontFamily);
  const label = options.label ?? (traits.species === 'gatto' ? 'Gatto' : 'Cane');
  return svgDocument(doc, CANVAS.width, canvasHeight(withTag), label);
};
