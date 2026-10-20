import { renderLayered } from './layered';
import type { PetRenderer } from './types';

export * from './types';
export { escapeXml } from './svg';

/**
 * Renderer ativo: arte vetorizada por camadas, com fallback procedural no que ainda não tem
 * peça (ver `layered/index.ts`).
 */
export const renderPetSvg: PetRenderer = renderLayered;
