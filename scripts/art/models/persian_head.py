# /// script
# dependencies = ["shapely>=2", "numpy", "svgelements", "cairosvg"]
# ///
"""Cabeça + orelhas do persa, direto do guia do Recraft (o guia já vem sem olhos/nariz/boca/bigodes)."""
import sys
from shapely.geometry import box
from shapely.ops import unary_union
from pathlib import Path
ROOT = str(Path(__file__).resolve().parents[3])  # raiz do repo
sys.path.insert(0, f'{ROOT}/scripts/art')
import build_layers as B

S = {s.idx: s for s in B.read_guide(B.SRC / 'gatto-persiano-guia.svg')}
sil, OUT = S[1].geom, S[1].fill
fur = B.solid(S[2].geom)            # cabeça fofa: borda ondulada do guia, como está
# espessura da linha da cabeça, medida nas laterais (longe de orelhas e do corpo)
side = box(0, 330, 1024, 560)
w = sil.intersection(fur.buffer(30)).difference(fur).intersection(side).area / fur.exterior.intersection(side).length
head_line = fur.buffer(w, join_style='round').difference(fur)
ears = []
for fur_i, pink_i in ((5, 6), (7, 8)):
    zone = B.solid(S[fur_i].geom).convex_hull.buffer(w * 1.6)
    ears.append((sil.intersection(zone).difference(fur.buffer(-2)), S[fur_i], S[pink_i]))

def d(g):
    o = []
    for p in B.parts(g.simplify(0.3)):
        for r in [p.exterior, *p.interiors]:
            o.append('M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in r.coords) + 'Z')
    return ''.join(o)
ear_svg = ''.join(f'    <path data-role="outline" fill="{OUT}" d="{d(dk)}"/>\n'
                  f'    <path data-role="fur" fill="{fu.fill}" d="{d(fu.geom)}"/>\n'
                  f'    <path data-role="pink" fill="{pk.fill}" d="{d(pk.geom)}"/>\n' for dk, fu, pk in ears)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Cabeça + orelhas do persa numa peça só, feita do guia (gatto-persiano-guia.svg, gerado já sem
       olhos, nariz, boca, bigodes e acessórios): orelhas atrás (linha do guia, pelo e rosa), cabeça
       fofa por cima (borda ondulada do guia, contorno uniforme de {w:.1f} px, a espessura medida no guia).
       Quadro 1024 do guia. -->
  <g id="head">
{ear_svg}    <path data-role="outline" fill="{OUT}" d="{d(head_line)}"/>
    <path data-role="fur" fill="{S[2].fill}" d="{d(fur)}"/>
  </g>
</svg>
'''
open(f'{ROOT}/models/persiano-cabeca.svg', 'w').write(svg)
import cairosvg
cairosvg.svg2png(bytestring=svg.encode(), write_to=sys.argv[1], output_width=1024, background_color='white')
cairosvg.svg2png(url=f'{ROOT}/art/recraft/gatto-persiano-guia.svg', write_to=sys.argv[2], output_width=1024, background_color='white')
print('espessura da linha', round(w, 1))
