import type { PetRenderer } from '../types';
import { CANVAS, canvasHeight } from '../types';
import { svgDocument } from '../svg';
import { createContext } from './context';
import { drawCat } from './cat';
import { drawDog } from './dog';
import { drawGlasses, drawNameTag } from './parts';

/**
 * Renderer procedural (placeholder até a arte vetorizada entrar).
 * Ver `docs/art-pipeline.md` para o plano de troca.
 */
export const renderProcedural: PetRenderer = (traits, options = {}) => {
  const ctx = createContext(traits, options);
  let body = traits.species === 'gatto' ? drawCat(traits, ctx) : drawDog(traits, ctx);
  if (traits.acc === 'occhiali') body += drawGlasses();
  // `nameTag: ''` reserva o espaço da plaquinha sem desenhá-la (a prévia não "pula").
  const withTag = options.nameTag !== undefined;
  const name = options.nameTag?.trim();
  if (name) body += drawNameTag(ctx, name, options.fontFamily);
  const label = options.label ?? (traits.species === 'gatto' ? 'Gatto' : 'Cane');
  return svgDocument(body, CANVAS.width, canvasHeight(withTag), label);
};
