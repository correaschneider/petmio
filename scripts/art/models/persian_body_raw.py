# /// script
# dependencies = ["shapely>=2", "numpy", "svgelements", "cairosvg"]
# ///
"""Corpo do persa com os paths do Recraft copiados como estão (só um clipPath tira cabeça/orelhas)."""
import re, sys
from shapely.ops import unary_union
from pathlib import Path
ROOT = str(Path(__file__).resolve().parents[3])  # raiz do repo
sys.path.insert(0, f'{ROOT}/scripts/art')
import build_layers as B

SRC = f'{ROOT}/art/recraft/gatto-persiano-guia.svg'
raw = re.findall(r'<path[^>]*>', open(SRC).read())
dd = lambda i: re.search(r' d="([^"]+)"', raw[i]).group(1)            # noqa: E731
fill = lambda i: re.search(r'fill="([^"]+)"', raw[i]).group(1)        # noqa: E731
S = {s.idx: s for s in B.read_guide(B.SRC / 'gatto-persiano-guia.svg')}
W = 18.7                                     # espessura da linha da cabeça (medida no guia)
head = B.solid(S[2].geom).buffer(W + 7)      # cabeça + o contorno dela, com folga (sem lascas da linha)
ears = unary_union([B.solid(S[i].geom).convex_hull.buffer(W * 1.6) for i in (5, 7)])
from shapely import affinity
DY = float(sys.argv[2]) if len(sys.argv) > 2 else 0   # o corpo inteiro sobe DY px (a cabeça fica)
# o recorte é feito nas coordenadas do corpo: a cabeça (parada) fica DY px mais baixa em relação a ele
# o recorte tira as DUAS: a cabeça da própria silhueta do guia (que sobe junto com o corpo) e o lugar
# da cabeça da peça (parada, DY px mais baixa nas coordenadas do corpo)
cut = unary_union([head, ears, affinity.translate(unary_union([head, ears]), 0, DY), S[9].geom])   # + branco da curva do rabo

# Prolongamento do tronco por baixo da cabeça (desenhado ATRÁS dos paths do Recraft): fecha o que a
# folga do recorte tirou na junção e o que aparece quando o corpo estica (robusto). As laterais
# continuam a curva do guia a partir de y=CUT e viram verticais aos poucos até y=TOP.
from shapely.geometry import Polygon, box
CUT, TOP, EASE = 690, 560, 60
sil = S[1].geom
dark = sil.difference(unary_union([S[i].geom for i in S if i not in (0, 1)]))
trunk = B.solid(S[3].geom)
tx0, _, tx1, _ = trunk.bounds
def edges(y):
    seg = dark.intersection(box(tx0 - 30, y, tx1 + 30, y + 1))
    return sorted((q.bounds[0], q.bounds[2]) for q in B.parts(seg))
e0, e1 = edges(CUT), edges(CUT + 40)
def side(i, j):  # (x no corte, inclinação por px)
    return (e0[i][j], (e1[i][j] - e0[i][j]) / 40)
def ease(xs, dy):
    x, k = xs; dy = min(dy, EASE)
    return x - k * dy + k * dy * dy / (2 * EASE)
def strip(a, b):
    ys = [CUT - k for k in range(0, CUT - TOP + 1, 4)]
    return Polygon([(ease(a, CUT - y), y) for y in ys] + [(ease(b, CUT - y), y) for y in reversed(ys)])
lo, li, ri, ro = side(0, 0), side(0, 1), side(-1, 0), side(-1, 1)
ext_fur = strip(lo, ro)
ext_lines = unary_union([strip(lo, li), strip(ri, ro)])

# emenda do recorte: o antialias da borda mistura silhueta escura e pelo (fio ondulado). Por cima,
# uma faixa de pelo só onde o guia tem pelo do tronco (nunca sobre linha).
seam = cut.boundary.buffer(4).intersection(S[3].geom.buffer(-2)).difference(dark.buffer(2))
# dentro da área recortada, o pelo do guia (tronco e rabo) volta — só as linhas ficam de fora; sob a
# cabeça não aparece, e onde a cabeça não cobre (vão sob o queixo, emenda do rabo) fecha
fur_back = cut.difference(S[9].geom).intersection(unary_union([S[3].geom, S[4].geom]).buffer(-1)).difference(dark.buffer(1))
seam = unary_union([seam, fur_back])

# Perto do rabo, a folga do recorte deixava um vão branco entre a cabeça e o rabo: ali os paths do
# guia voltam (pelo e linha do rabo encostam na linha da cabeça).
head_b = affinity.translate(B.solid(S[2].geom), 0, DY)
# só o rabo e a linha dele (até W do pelo do rabo) — nada da linha da cabeça do guia
tail_gap = head_b.buffer(W + 8).difference(head_b.buffer(W - 1)).intersection(B.solid(S[4].geom).buffer(W * 0.9))

def ring_d(g):
    o = []
    for p in B.parts(g.simplify(0.15)):
        for r in [p.exterior, *p.interiors]:
            o.append('M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in r.coords) + 'Z')
    return ''.join(o)
# --- uma forma só por papel (sem clipPath sobrepostos, que deixam fios de antialias nas bordas):
# linhas = silhueta do guia menos as cores (como o Recraft compõe); pelo = tronco + rabo do guia.
# Recorte único: fora da cabeça (as duas), mais a junção do rabo; o pelo também volta onde a
# cabeça não cobre (fur_back).
from shapely.geometry import box as _box
full = _box(0, -200, 1024, 1224)
keep_lines = full.difference(cut).union(tail_gap)
keep_fur = keep_lines.union(fur_back)
fur_g = unary_union([S[3].geom, S[4].geom]).difference(S[9].geom)
lines_g = dark.difference(S[9].geom).intersection(keep_lines)
lines_g = unary_union([q for q in B.parts(lines_g) if q.area > 30])
fur_g = fur_g.intersection(keep_fur)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Corpo do persa feito das formas do guia do Recraft (gatto-persiano-guia.svg), sem redesenhar:
       linhas = silhueta (path 1) menos as cores, pelo = corpo (3) + rabo (4), recortados uma vez só
       fora da cabeça (o corte fica sob ela); o branco de dentro da curva do rabo (9) fica vazado. Atrás deles, um prolongamento do tronco sob a cabeça (feito aqui,
       não é do guia) fecha a junção e o corpo esticado. O corpo inteiro sobe {DY:g} px (o rabo encaixa
       sob a cabeça). Quadro 1024 do guia. -->
  <g transform="translate(0 {-DY:g})">
  <g id="neck">
    <path data-role="fur" fill="{fill(3)}" d="{ring_d(ext_fur)}"/>
    <path data-role="outline" fill="{fill(1)}" d="{ring_d(ext_lines)}"/>
  </g>
  <g id="body">
    <path data-role="fur" fill="{fill(3)}" d="{ring_d(fur_g)}"/>
    <path data-role="outline" fill="{fill(1)}" d="{ring_d(lines_g)}"/>
  </g>
  </g>
</svg>
'''
open(f'{ROOT}/models/persiano-corpo-atletico.svg', 'w').write(svg)
import cairosvg
cairosvg.svg2png(bytestring=svg.encode(), write_to=sys.argv[1], output_width=1024, background_color='white')
