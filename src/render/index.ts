import { renderVector } from './vector';
import type { PetRenderer } from './types';

export * from './types';
export { escapeXml } from './svg';

/**
 * Renderer ativo: camadas vetoriais dos guias do Recraft (`render/vector`). O procedural fica
 * só como utilitário (plaquinha do nome) e referência.
 */
export const renderPetSvg: PetRenderer = renderVector;
