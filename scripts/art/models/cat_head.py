# /// script
# dependencies = ["shapely>=2", "numpy", "svgelements", "cairosvg"]
# ///
"""Cabeça + orelhas do gato do zero, direto do guia do Recraft (uma peça só)."""
import sys
from shapely.ops import unary_union
from pathlib import Path
ROOT = str(Path(__file__).resolve().parents[3])  # raiz do repo
sys.path.insert(0, f'{ROOT}/scripts/art')
import build_layers as B

guide, out_name, ids = sys.argv[1], sys.argv[2], sys.argv[3]   # ids: "head,muzzle,ear1,ear2,sil"
head_i, muzzle_i, e1, e2, sil_i = [int(x) for x in ids.split(',')]
S = {s.idx: s for s in B.read_guide(B.SRC / guide)}
sil = S[sil_i].geom
# pelo de cabeça+orelhas: forma inteira, com os buracos de olhos/nariz/boca/bigodes fechados
fur = B.solid(S[head_i].geom)
# focinho é uma cúpula: a envoltória convexa tira os entalhes dos bigodes da borda (o queixo recorta)
hull = S[muzzle_i].geom.convex_hull
# arredonda os cantos de cima da envoltória; embaixo ela segue até o queixo
from shapely.geometry import box as _box
_y1 = hull.bounds[3]
muzzle = unary_union([hull.buffer(-20, join_style='round').buffer(20, join_style='round'),
                      hull.intersection(_box(0, _y1 - 60, 1024, 1024))]).intersection(fur)
pinks = unary_union([S[e1].geom, S[e2].geom])
# contorno: a linha real do guia em volta da forma (silhueta escura colada no pelo)
# linha inteira do guia em volta (até 30 px, a silhueta limita); onde ela emenda com outra forma
# (queixo × bandana/corpo) fica só a metade do lado da cabeça
others = unary_union([sh.geom for i, sh in S.items() if i not in (0, sil_i, head_i, muzzle_i, e1, e2)
                      and not sh.geom.intersects(fur.buffer(-2))])
gap = sil.intersection(fur.buffer(40)).difference(fur).intersection(others.buffer(40))
# espessura da linha no resto da cabeça (fora das emendas); no queixo usa a mesma
full = sil.intersection(fur.buffer(30)).difference(fur)
free = full.difference(gap.buffer(2))
w = free.area / max(fur.exterior.difference(gap.buffer(25)).length, 1)
# espessura uniforme na volta toda (sem degrau onde a linha emendava com a bandana)
band = fur.buffer(w, join_style='round').difference(fur)
print('espessura da linha', round(w, 1))
band = unary_union([q for q in B.parts(band) if q.area > 50])

def d(g):
    o = []
    for p in B.parts(g.simplify(0.3)):
        for r in [p.exterior, *p.interiors]:
            o.append('M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in r.coords) + 'Z')
    return ''.join(o)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Cabeça + orelhas do gato numa peça só (as orelhas não variam), feita do zero a partir do guia
       ({guide}): pelo da cabeça+orelhas (buracos de olhos/nariz/boca/bigodes fechados), focinho,
       rosa das orelhas e a linha real do guia em volta. Sem olhos, nariz, boca e bigodes (peças comuns).
       Quadro 1024 do guia. -->
  <g id="head">
    <path data-role="outline" fill="{S[sil_i].fill}" d="{d(band)}"/>
    <path data-role="fur" fill="{S[head_i].fill}" d="{d(fur)}"/>
    <path data-role="fur-light" fill="{S[muzzle_i].fill}" d="{d(muzzle)}"/>
    <path data-role="pink" fill="{S[e1].fill}" d="{d(pinks)}"/>
  </g>
</svg>
'''
open(f'{ROOT}/models/{out_name}.svg', 'w').write(svg)
import cairosvg
cairosvg.svg2png(bytestring=svg.encode(), write_to=sys.argv[4], output_width=500, background_color='white')
