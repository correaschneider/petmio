# /// script
# dependencies = ["potracer", "numpy", "pillow", "scipy"]
# ///
import sys
import numpy as np
import potrace
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert('RGBA')).astype(int)
a = im[..., 3] > 127
pal = {'outline': (84, 40, 20), 'fur': (242, 183, 79), 'fur-shade': (216, 141, 48)}
names = list(pal)
cols = np.array([pal[n] for n in names])
dist = ((im[..., None, :3] - cols[None, None]) ** 2).sum(-1)
near = dist.argmin(-1)

def trace(mask):
    bm = potrace.Bitmap(~mask)  # o potracer traça os pixels "falsos"
    out = []
    for curve in bm.trace(turdsize=8, alphamax=1.0, opticurve=True, opttolerance=0.2):
        sp = curve.start_point
        d = [f'M{sp.x:.1f} {sp.y:.1f}']
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f'L{seg.c.x:.1f} {seg.c.y:.1f} L{seg.end_point.x:.1f} {seg.end_point.y:.1f}')
            else:
                d.append(f'C{seg.c1.x:.1f} {seg.c1.y:.1f} {seg.c2.x:.1f} {seg.c2.y:.1f} {seg.end_point.x:.1f} {seg.end_point.y:.1f}')
        out.append(''.join(d) + 'Z')
    return ''.join(out)

def hexc(c): return '#%02x%02x%02x' % c
# Empilhado como os guias: silhueta inteira na cor do contorno, pelo e sombra por cima.
from scipy.ndimage import binary_dilation, binary_opening
# Linha só onde há linha (com 2 px de folga por baixo do pelo, sem fresta). Silhueta inteira escura
# deixava um fio em volta das áreas de pelo que encostam no fundo (antialias da borda).
dark = a & (near == 0)
layers = [('outline', a & binary_dilation(dark, iterations=2)), ('fur', a & (near != 0)), ('fur-shade', binary_opening(a & (near == 2), iterations=2))]  # sem fiapos de antialias
paths = '\n'.join(f'    <path data-role="{n}" fill="{hexc(pal[n])}" fill-rule="evenodd" d="{trace(m)}"/>' for n, m in layers)
open(dst, 'w').write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Orelhas do labrador v2: vetorizado de labrador-orelha-v2.png (feito à mão pelo Pedro: pelo
       vazando na raiz, cobre a linha da cabeça). Linha só onde há linha (2 px por baixo do pelo),
       pelo e sombra por cima. Quadro 1024 do guia; desenhar NA FRENTE da cabeça. -->
  <g id="ears">
{paths}
  </g>
</svg>
''')
