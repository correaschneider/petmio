import { art } from './palette';

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => XML_ESCAPES[c] ?? c);
}

/**
 * Atributos de contorno padrão. Use SEMPRE este helper em vez de escrever
 * `stroke-width` à mão: atributo duplicado quebra o parse do SVG e o modo pixel
 * caía silenciosamente no cartoon (bug do protótipo).
 */
export function outline(width: number): string {
  return `stroke="${art.outline}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
}

export function svgDocument(body: string, width: number, height: number, label: string): string {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(label)}">${body}</svg>`;
}
