# /// script
# dependencies = ["shapely>=2", "numpy", "scipy", "svgelements", "cairosvg"]
# ///
import re, sys, math
import numpy as np
from scipy.interpolate import splprep, splev
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union
from pathlib import Path
ROOT = str(Path(__file__).resolve().parents[3])  # raiz do repo
sys.path.insert(0, f'{ROOT}/scripts/art')
import build_layers as B

s = open(f'{ROOT}/art/layers/cane-labrador.svg').read()
g = re.search(r'<g id="head">(.*?)</g>', s, flags=re.S).group(1)
paths = re.findall(r'<path data-role="(\w+)" fill="([^"]+)" d="([^"]+)"', g)
geo = {r: (f, B.path_to_geom(d)) for r, f, d in paths}
fur_fill, fur = geo['fur']; line_fill, line = geo['outline']
t = 11.2 * 1.25  # espessura da linha do guia no contorno da cabeça (medida ~14 px)

# pontos da borda da cabeça que estão colados na linha REAL do guia (topo e queixo)
ext = B.solid(fur).exterior
pts = [ext.interpolate(d) for d in np.arange(0, ext.length, 4)]
ge = re.search(r'<g id="ears">(.*?)</g>', s, flags=re.S).group(1)
ears = unary_union([B.path_to_geom(dd) for r, f, dd in re.findall(r'<path data-role="(\w+)" fill="([^"]+)" d="([^"]+)"', ge) if r != 'outline'])
keep = [p for p in pts if line.distance(p) < 2.0 and ears.distance(p) > t * 1.5]
c = B.solid(fur).centroid
keep.sort(key=lambda p: math.atan2(p.y - c.y, p.x - c.x))
xy = np.array([(p.x, p.y) for p in keep])
# simetriza (cabeça frontal): espelha e junta, depois reordena
mir = np.column_stack([2 * c.x - xy[:, 0], xy[:, 1]])
allp = np.vstack([xy, mir])
ang = np.arctan2(allp[:, 1] - c.y, allp[:, 0] - c.x)
allp = allp[np.argsort(ang)]
tck, _ = splprep([allp[:, 0], allp[:, 1]], s=len(allp) * 6.0, per=True)
u = np.linspace(0, 1, 500)
x, y = splev(u, tck)
head = Polygon(zip(x, y)).buffer(0)
band = head.buffer(t, join_style='round').difference(head)

def d(geom):
    out = []
    for p in getattr(geom, 'geoms', [geom]):
        for ring in [p.exterior, *p.interiors]:
            out.append('M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in ring.coords) + 'Z')
    return ''.join(out)

x0, y0, x1, y1 = head.buffer(t + 8).bounds
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Cabeça do labrador como peça independente: só a forma base, sem orelhas, focinho, boca,
       nariz nem olhos. Curva suave pelo contorno real do guia (topo e queixo de
       art/recraft/cane-labrador-guia.svg), simétrica, fechada por baixo das orelhas, com contorno
       contínuo de espessura uniforme. Coordenadas no enquadramento 1024 do guia. -->
  <g id="head">
    <path data-role="outline" fill="{line_fill}" d="{d(band)}"/>
    <path data-role="fur" fill="{fur_fill}" d="{d(head)}"/>
  </g>
</svg>
'''
open(f'{ROOT}/models/labrador-cabeca.svg', 'w').write(svg)
import cairosvg
cairosvg.svg2png(bytestring=svg.encode(), write_to=sys.argv[1], output_width=500)
print(len(keep), 'pontos reais')
