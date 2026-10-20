/**
 * Olhos vetoriais desenhados no tamanho/posição dos olhos do modelo (âncora `eyes`), no traço do
 * guia. Cinco estilos do catálogo; a íris usa a cor escolhida.
 */
import type { Eyes } from '@/domain/pet';
import type { EyeAnchor, VectorModel } from './types';

const PUPIL = '#1a1414';
const WHITE = '#ffffff';

function circle(cx: number, cy: number, r: number, fill: string, extra = ''): string {
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"${extra}/>`;
}

/** Olho redondo: aro escuro, íris colorida, pupila e dois brilhos. */
function round(e: EyeAnchor, iris: string, outline: string, scale = 1, shine = 1): string {
  const r = e.r * scale;
  return (
    circle(e.cx, e.cy, r, outline) +
    circle(e.cx, e.cy, r * 0.8, iris) +
    circle(e.cx, e.cy, r * 0.46, PUPIL) +
    circle(e.cx - r * 0.32, e.cy - r * 0.32, r * 0.24 * shine, WHITE) +
    circle(e.cx + r * 0.3, e.cy + r * 0.34, r * 0.11 * shine, WHITE)
  );
}

export function drawEyes(
  eyes: readonly EyeAnchor[],
  style: Eyes,
  iris: string,
  model: VectorModel,
  fur: string,
): string {
  const o = model.outline;
  const t = model.stroke;
  return eyes
    .map((e) => {
      const r = e.r;
      switch (style) {
        case 'allegri':
          // Olho fechado sorrindo: arco para cima.
          return `<path d="M${e.cx - r * 0.85} ${e.cy + r * 0.2} Q${e.cx} ${e.cy - r * 1.05} ${e.cx + r * 0.85} ${e.cy + r * 0.2}" fill="none" stroke="${o}" stroke-width="${(t * 1.3).toFixed(1)}" stroke-linecap="round"/>`;
        case 'assonnati': {
          // Pálpebra de pelo cobrindo a metade de cima, com a linha da pálpebra.
          const y = e.cy - r * 0.05;
          return (
            round(e, iris, o) +
            `<path d="M${e.cx - r * 1.04} ${y} A${r * 1.04} ${r * 1.04} 0 0 1 ${e.cx + r * 1.04} ${y} Z" fill="${fur}"/>` +
            `<path d="M${e.cx - r} ${y} Q${e.cx} ${y + r * 0.18} ${e.cx + r} ${y}" fill="none" stroke="${o}" stroke-width="${t.toFixed(1)}" stroke-linecap="round"/>`
          );
        }
        case 'sorpresi':
          // Olho arregalado: branco grande com íris pequena.
          return (
            circle(
              e.cx,
              e.cy,
              r * 1.05,
              WHITE,
              ` stroke="${o}" stroke-width="${(t * 0.9).toFixed(1)}"`,
            ) +
            circle(e.cx, e.cy + r * 0.1, r * 0.42, iris) +
            circle(e.cx, e.cy + r * 0.1, r * 0.24, PUPIL) +
            circle(e.cx - r * 0.12, e.cy - r * 0.04, r * 0.1, WHITE)
          );
        case 'dolci':
          return round(e, iris, o, 1.12, 1.35);
        default:
          return round(e, iris, o);
      }
    })
    .join('');
}
