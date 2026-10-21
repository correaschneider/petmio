# /// script
# dependencies = ["shapely>=2", "numpy", "svgelements", "cairosvg"]
# ///
"""Cabeça + orelhas do siamês do zero, direto do guia do Recraft (sem bigodes, olhos, nariz, boca)."""
import sys
from shapely.geometry import box
from shapely.ops import unary_union
from pathlib import Path
ROOT = str(Path(__file__).resolve().parents[3])  # raiz do repo
sys.path.insert(0, f'{ROOT}/scripts/art')
import build_layers as B

S = {s.idx: s for s in B.read_guide(B.SRC / 'gatto-siamese-guia.svg')}
sil = S[1].geom
OUT = S[1].fill
close = lambda g, r: g.buffer(r, join_style='round').buffer(-r, join_style='round')  # noqa: E731
# cabeça: pelo inteiro (entalhes dos bigodes e buracos de olhos/nariz/boca fechados) + máscara
fur = B.solid(close(S[2].geom, 40))  # cabeça é quase convexa: fechamento grande alisa os entalhes dos bigodes
# a cabeça é convexa: a envoltória (cantos arredondados) tira as quinas que os bigodes deixavam
hull = fur.convex_hull.buffer(-25, join_style='round').buffer(25, join_style='round')
print('envoltória × pelo: +%.2f%% de área' % (100 * (hull.area / fur.area - 1)))
fur = hull
mask = B.solid(close(S[3].geom, 10)).intersection(fur)
# espessura da linha da cabeça, medida nas laterais (longe de orelhas, bigodes e coleira)
side = box(0, 300, 1024, 440)
band_g = sil.intersection(fur.buffer(30)).difference(fur).intersection(side)
w = band_g.area / fur.exterior.intersection(side).length
head_line = fur.buffer(w, join_style='round').difference(fur)
# orelhas (atrás da cabeça): linha escura do guia em volta e por dentro + rosa + borda marrom
ears = []
for pink_i, rim_i in ((21, 23), (20, 24)):
    fills = unary_union([S[pink_i].geom, S[rim_i].geom])
    zone = B.solid(fills).convex_hull.buffer(w * 1.6)
    dark = sil.intersection(zone).difference(fur.buffer(-2))
    ears.append((dark, S[pink_i], S[rim_i]))

def d(g):
    o = []
    for p in B.parts(g.simplify(0.3)):
        for r in [p.exterior, *p.interiors]:
            o.append('M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in r.coords) + 'Z')
    return ''.join(o)
ear_svg = ''.join(
    f'    <path data-role="outline" fill="{OUT}" d="{d(dk)}"/>\n'
    f'    <path data-role="pink" fill="{pk.fill}" d="{d(pk.geom)}"/>\n'
    f'    <path data-role="spot" fill="{rm.fill}" d="{d(rm.geom)}"/>\n' for dk, pk, rm in ears)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Cabeça + orelhas do siamês numa peça só, feita do zero a partir do guia (gatto-siamese-guia.svg):
       orelhas atrás (linha do guia, rosa e borda marrom), cabeça por cima (pelo e máscara com os
       entalhes dos bigodes e os buracos de olhos/nariz/boca fechados, contorno uniforme de {w:.1f} px,
       a espessura medida no guia). Sem bigodes, olhos, nariz e boca (peças comuns). Quadro 1024 do guia. -->
  <g id="head">
{ear_svg}    <path data-role="outline" fill="{OUT}" d="{d(head_line)}"/>
    <path data-role="fur" fill="{S[2].fill}" d="{d(fur)}"/>
    <path data-role="spot" fill="{S[3].fill}" d="{d(mask)}"/>
  </g>
</svg>
'''
open(f'{ROOT}/models/siamese-cabeca.svg', 'w').write(svg)
import cairosvg
cairosvg.svg2png(bytestring=svg.encode(), write_to=sys.argv[1], output_width=1024, background_color='white')
print('espessura da linha', round(w, 1))
