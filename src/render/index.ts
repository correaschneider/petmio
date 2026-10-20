import { renderProcedural } from './procedural';
import type { PetRenderer } from './types';

export * from './types';
export { escapeXml } from './svg';

/** Renderer ativo. Trocar aqui quando a arte vetorizada estiver pronta. */
export const renderPetSvg: PetRenderer = renderProcedural;
