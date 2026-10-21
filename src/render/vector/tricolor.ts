/**
 * Pelagem tricolor: distribui as três cores (branco, caramelo, escuro) pelas partes do pet conforme
 * o `pattern` sorteado — cada escolha do tricolor dá uma combinação.
 *
 * Partes: cabeça, orelhas (cães; nos gatos a orelha é da cabeça), corpo e pontas (máscara/orelhas
 * do carlino, pontas do siamês). Só contam as partes que a raça tem: as combinações usam as três
 * cores (ou todas as cores que cabem — europeu e persa só têm cabeça e corpo, ficam com duas), e
 * as pontas nunca têm a cor da cabeça (senão a máscara some).
 */
import type { Breed, Species } from '@/domain/pet';
import { TRICOLOR, type FurPalette } from '../palette';

type Color = keyof typeof TRICOLOR;
const COLORS = Object.keys(TRICOLOR) as Color[];

export interface Regions {
  readonly head: FurPalette;
  readonly ears: FurPalette;
  readonly body: FurPalette;
}

/** Raças com peças de ponta (máscara/orelhas do carlino, pontas do siamês). */
const HAS_POINTS: ReadonlySet<Breed> = new Set<Breed>(['pug', 'siamese']);

type Combo = [Color, Color, Color, Color];
const cache = new Map<string, Combo[]>();

function combos(species: Species, breed: Breed): Combo[] {
  const key = `${species}:${breed}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const points = HAS_POINTS.has(breed);
  const out: Combo[] = [];
  for (const head of COLORS)
    for (const ears of species === 'cane' ? COLORS : [head])
      for (const body of COLORS)
        for (const point of points ? COLORS : [body]) {
          if (points && point === head) continue;
          const visible = [head, ears, body, ...(points ? [point] : [])];
          const slots = (species === 'cane' ? 3 : 2) + (points ? 1 : 0); // partes que a raça tem
          if (new Set(visible).size < Math.min(3, slots)) continue;
          out.push([head, ears, body, point]);
        }
  cache.set(key, out);
  return out;
}

/**
 * Paleta de cada parte para o padrão dado (as pontas usam a cor sorteada para elas). Toda raça tem
 * pelo menos 6 combinações — `nextPattern` (domínio) conta com isso para nunca repetir a anterior.
 */
export function tricolorRegions(species: Species, breed: Breed, pattern: number): Regions {
  const list = combos(species, breed);
  const [head, ears, body, point] = list[((pattern % list.length) + list.length) % list.length]!;
  const withPoint = (c: Color): FurPalette => ({ ...TRICOLOR[c], point: TRICOLOR[point].fur });
  return { head: withPoint(head), ears: withPoint(ears), body: withPoint(body) };
}
