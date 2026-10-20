import { it, type Messages } from './it';

/**
 * Ponto único de acesso aos textos. Hoje só existe italiano; quando entrar outro
 * idioma, troca-se a implementação (ex.: next-intl) mantendo `useMessages()`.
 */
export const messages: Messages = it;

export function useMessages(): Messages {
  return messages;
}

export type { Messages };
