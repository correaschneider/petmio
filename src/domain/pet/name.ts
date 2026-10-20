export const MAX_NAME_LENGTH = 14;

export const NAME_SUGGESTIONS = [
  'Bruno',
  'Luna',
  'Pepe',
  'Nina',
  'Oreo',
  'Gigi',
  'Birba',
  'Nuvola',
  'Totò',
  'Mia',
  'Micio',
  'Biscotto',
] as const;

/** Normaliza o nome digitado: sem espaços nas pontas, no máximo 14 caracteres. */
export function normalizeName(raw: string): string {
  return [...raw.trim()].slice(0, MAX_NAME_LENGTH).join('');
}
