# /// script
# dependencies = ["shapely>=2", "numpy", "scipy", "svgelements", "cairosvg"]
# ///
"""Peças soltas de uma raça (models/<raça>-*.svg) a partir de art/layers e do guia."""
import math, re, sys
import numpy as np
from scipy.interpolate import splprep, splev
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from pathlib import Path
ROOT = str(Path(__file__).resolve().parents[3])  # raiz do repo
P = ROOT
sys.path.insert(0, f'{P}/scripts/art')
import build_layers as B
from layer_maps import MODELS

model, breed = sys.argv[1], sys.argv[2]          # ex.: cane-beagle beagle
cfg = MODELS[model]
L = open(f'{P}/art/layers/{model}.svg').read()
groups = dict(re.findall(r'<g id="([^"]+)">(.*?)</g>', L, flags=re.S))
def paths(layer):
    return [(r, f, B.path_to_geom(d)) for r, f, d in re.findall(r'<path data-role="([\w-]+)" fill="([^"]+)" d="([^"]+)"', groups.get(layer, ''))]
shapes = {s.idx: s for s in B.read_guide(B.SRC / cfg['guide'])}
sil = cfg['silhouette']; drop = set(cfg.get('drop', [])) | {sil}
dark = shapes[sil].geom.difference(unary_union([s.geom for i, s in shapes.items() if i not in drop]))
outline_color = shapes[sil].fill
fur_color = next(f for r, f, _ in paths('head') if r == 'fur')
gen = open(f'{P}/src/render/vector/models.generated.ts').read()
t = float(re.search(rf'"{breed}":\{{"species":"\w+","stroke":([\d.]+)', gen).group(1)) * 1.25
body_box = [float(v) for v in re.search(rf'"{breed}":.*?"body":\[([^\]]+)\]', gen).group(1).split(',')]

def d(g, tol=0.4):
    out = []
    for p in B.parts(g.simplify(tol)):
        for ring in [p.exterior, *p.interiors]:
            out.append('M' + ' L'.join(f'{a:.1f} {b:.1f}' for a, b in ring.coords) + 'Z')
    return ''.join(out)
ONLY = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None   # ex.: corpo-atletico
def svg(name, comment, body):
    if ONLY and name not in ONLY:
        return
    open(f'{P}/models/{breed}-{name}.svg', 'w').write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">\n'
        f'  <!-- {comment}\n       Quadro 1024 do guia ({cfg["guide"]}). -->\n{body}</svg>\n')

species = cfg['species']
# ---- cabeça: forma inteira (capa + focinho + manchas), curva suave pelo contorno real.
# Gato: a cabeça do app já é completa (arco entre as orelhas) e o contorno tem detalhe (tufos,
# bochechas) que a curva suave apagaria — fica como está.
keep = []
fills = [g for r, f, g in paths('head') if r != 'outline'] + [g for _, _, g in paths('muzzle')] + [g for _, _, g in paths('head-spots')]
full = B.solid(unary_union(fills)).buffer(2).buffer(-2)
full = max(B.parts(full), key=lambda p: p.area)
ears = unary_union([g for r, f, g in paths('ears') if r != 'outline'])
if species == 'gatto':
    head = B.solid(unary_union([g for r, f, g in paths('head') if r != 'outline']))
ext = full.exterior
pts = [ext.interpolate(x) for x in np.arange(0, ext.length, 4)]
mouthish = unary_union([g for layer in ('mouth', 'nose') for _, _, g in paths(layer)])  # traços da boca/língua não são contorno
keep = [] if species == 'gatto' else [p for p in pts if dark.distance(p) < 2.0 and ears.distance(p) > t * 1.5 and mouthish.distance(p) > t * 2]
if species != 'gatto':
    c = full.centroid
    xy = np.array([(p.x, p.y) for p in keep])
    allp = np.vstack([xy, np.column_stack([2 * c.x - xy[:, 0], xy[:, 1]])])
    allp = allp[np.argsort(np.arctan2(allp[:, 1] - c.y, allp[:, 0] - c.x))]
    tck, _ = splprep([allp[:, 0], allp[:, 1]], s=len(allp) * 6.0, per=True)
    x, y = splev(np.linspace(0, 1, 500), tck)
    head = Polygon(zip(x, y)).buffer(0)
    band = head.buffer(t, join_style='round').difference(head)
# focinho e manchas da cabeça fazem parte da cabeça (decisão do Pedro): forma sólida (fecha os
# entalhes onde ficavam os traços da boca original) recortada dentro da cabeça.
extra = ''
for layer in ('muzzle', 'head-spots'):
    for r, f, g in paths(layer):
        if r not in ('line', 'outline'):  # traços (rugas do carlino) ficam como estão
            g = B.solid(g.buffer(10).buffer(-10))
        if layer == 'muzzle' and breed == 'beagle':
            # (só beagle: o branco chega à borda no guia) desce até o queixo seguindo a própria forma (cópias deslocadas para baixo), sem pontinhas
            # de pelo entre ele e o contorno e sem virar um bloco reto embaixo
            from shapely import affinity
            g = unary_union([affinity.translate(g, 0, dy) for dy in range(0, 41, 4)]).intersection(head)
        if layer == 'muzzle' and f.lower() == outline_color.lower():  # mesma cor do contorno (carlino): emenda sem fio claro
            extra += f'    <path data-role="{r}" fill="{f}" d="{d(g.buffer(3).intersection(head.buffer(t * 0.5)))}"/>\n'
            continue
        extra += f'    <path data-role="{r}" fill="{f}" d="{d(g.intersection(head))}"/>\n'
def drop_bits(g, min_area=400):
    return unary_union([q for q in B.parts(g) if q.area >= min_area])
if species == 'gatto':
    # O arco que o pipeline desenha na base das orelhas (para separar cabeça e orelha) não existe no
    # guia: lá a orelha se funde com a cabeça. O contorno da cabeça fica só onde o guia tem linha.
    ears_fill = unary_union([g for r, f, g in paths('ears') if r != 'outline'])
    ear_lines = unary_union([g for r, f, g in paths('ears') if r == 'outline'])
    def head_outline(g):
        g = drop_bits(g.intersection(dark.buffer(1.5)))
        # o contorno da cabeça termina cortado reto onde encontra o da orelha (degrau): fecha a
        # emenda das duas linhas (fechamento morfológico) e o remendo fica na cabeça, por cima
        u = unary_union([g, ear_lines])
        joint = u.buffer(6, join_style='round').buffer(-6, join_style='round').difference(u)
        joint = joint.intersection(ear_lines.buffer(t)).intersection(g.buffer(t))
        return unary_union([g, joint])
    head_out = unary_union([head_outline(g) for r, f, g in paths('head') if r == 'outline'])
    head_fur = unary_union([g for r, f, g in paths('head') if r != 'outline'])
    # pontas do contorno da orelha que entram na cabeça (dentinho entre o contorno e o pelo): o pelo
    # da cabeça cobre — sem tocar nas linhas da cabeça
    teeth = ear_lines.intersection(head_fur.buffer(t * 0.6)).difference(head_out.buffer(1))
    teeth = unary_union([q for q in B.parts(teeth) if q.area < 1500])
    head_inner = ''.join(
        f'<path data-role="{r}" fill="{f}" d="{d((head_out if r == "outline" else g.union(teeth) if r == "fur" else g), 0.3)}"/>'
        for r, f, g in paths('head'))
    svg('cabeca', f'Cabeça do {breed}: camada "head" de art/layers/{model}.svg como está (já completa, com o arco entre\n'
        '       as orelhas e os detalhes do contorno) + focinho/máscara recortados dentro dela (sem orelhas, boca,\n'
        '       nariz, olhos nem bigodes).',
        f'  <g id="head">{head_inner}\n{extra}  </g>\n')
else:
    svg('cabeca', f'Cabeça do {breed} como peça independente: forma base + focinho + manchas da cabeça (sem orelhas,\n'
        '       boca, nariz nem olhos). Curva suave pelo contorno real do guia, simétrica, contorno contínuo.',
        f'  <g id="head">\n    <path data-role="outline" fill="{outline_color}" d="{d(band)}"/>\n'
        f'    <path data-role="fur" fill="{fur_color}" d="{d(head)}"/>\n{extra}  </g>\n')

# ---- orelhas: a camada do app como está
svg('orelha', f'Orelhas do {breed}: camada "ears" de art/layers/{model}.svg como está no app. Desenhar '
    + ('ATRÁS da cabeça (orelha pontuda).' if species == 'gatto' else 'NA FRENTE da cabeça.'),
    '  <g id="ears">' + groups['ears'] + '</g>\n')

# ---- corpo atlético (corpo + manchas do corpo) com silhueta de fundo que fecha as frestas.
# Furos pequenos nos preenchimentos (sombra do queixo que o guia tinha no pescoço) são fechados e o
# contorno de dentro deles sai — senão sobra uma linha solta no pescoço.
from shapely.geometry import Polygon as _P
def small_holes(g, limit=3000):
    return unary_union([_P(h) for q in B.parts(g) for h in q.interiors if _P(h).area < limit])
BODY_LAYERS = ('tail', 'body', 'body-spots', 'belly')  # rabo junto: no app ele estica com o corpo robusto
body_paths = [(L, r, f, g) for L in BODY_LAYERS for r, f, g in paths(L)]
holes = unary_union([small_holes(g) for _, r, f, g in body_paths if r not in ('outline', 'line')])
# Ombros: no carlino as pontas de cima do corpo saem dos lados do queixo (e abrem com o corpo
# esticado). Acima de y_cut as laterais sobem retas até o topo do corpo, escondidas sob a cabeça.
SHOULDER_CUT = {'pug': 640, 'europeo': 620, 'siamese': 652, 'labrador': 615}
# raças com linha no meio do peito (o W do labrador): o ajuste mexe só nas laterais, o miolo fica
SHOULDER_SIDES_ONLY = {'labrador': 30}
_trunk = max((g for L, r, f, g in body_paths if L == 'body' and r not in ('outline', 'line')), key=lambda g: g.area)
_tx0, _, _tx1, _ = _trunk.bounds
SHOULDER_EASE = 60  # px acima do corte em que a lateral termina de virar vertical
def _edges(g, y):
    seg = g.intersection(box(_tx0 - 30, y, _tx1 + 30, y + 1))
    return sorted((q.bounds[0], q.bounds[2]) for q in B.parts(seg)) if not seg.is_empty else []
def _ease_x(x_c, slope, dy):
    """dy = quanto acima do corte (>=0). Começa com a inclinação da lateral e fica vertical em L."""
    L = SHOULDER_EASE
    dy = min(dy, L)
    return x_c - slope * dy + slope * dy * dy / (2 * L)
_side_cache = {}
def _sides():
    """Bordas (externa e interna) de cada lateral no corte + inclinação medida 40 px abaixo."""
    if 'v' in _side_cache:
        return _side_cache['v']
    yc = SHOULDER_CUT[breed]
    raw = unary_union([g for L, r, f, g in body_paths if L == 'body' and r in ('outline', 'line')])
    e0, e1 = _edges(raw, yc), _edges(raw, yc + 40)
    sides = []
    for pick in (0, -1):                 # lateral esquerda (1ª peça) e direita (última)
        (a0, b0), (a1, b1) = e0[pick], e1[pick]
        sides.append(((a0, (a1 - a0) / 40), (b0, (b1 - b0) / 40)))
    _side_cache['v'] = sides
    return sides
def _poly(xl, xr, yc, top):
    """Polígono entre duas bordas suavizadas (cada uma = (x no corte, inclinação)), do corte ao topo."""
    ys = [yc - k for k in range(0, int(yc - top) + 1, 4)]
    left = [(_ease_x(xl[0], xl[1], yc - y), y) for y in ys]
    right = [(_ease_x(xr[0], xr[1], yc - y), y) for y in reversed(ys)]
    return Polygon(left + right)
def straight_up(g, kind='fill'):
    """Ombros: acima de y_cut o tronco sobe até o topo do corpo (sob a cabeça) continuando a curva
    da lateral, que vira vertical aos poucos (sem quina no corte). Rabo e patas ficam como estão."""
    yc = SHOULDER_CUT.get(breed)
    if yc is None or g.is_empty:
        return g
    top = body_box[1] - 5
    (lo, li), (ri, ro) = _sides()
    zone = box(_tx0 - 30, 0, _tx1 + 30, yc)
    m = SHOULDER_SIDES_ONLY.get(breed)
    if m is not None:  # miolo intacto: só as faixas das laterais são refeitas
        zone = zone.difference(box(li[0] + m, 0, ri[0] - m, yc))
    keep = g.difference(zone)
    if g.intersection(box(_tx0, yc, _tx1, yc + 2)).area < 50:
        return g                           # forma que não chega ao corte (barriga, manchas): intacta          # esquerda: externa, interna; direita: interna, externa
    if kind == 'line':
        cols = unary_union([_poly(lo, li, yc + 1, top), _poly(ri, ro, yc + 1, top)])
    else:  # pelo de lateral a lateral, sem cobrir as faixas das linhas (nos cães o pelo vem depois da linha)
        cols = _poly(lo, ro, yc + 1, top).difference(unary_union([_poly(lo, li, yc + 1, top), _poly(ri, ro, yc + 1, top)]))
    return unary_union([keep, cols.intersection(box(0, top, 1024, yc + 1))])
def fixed(r, g):
    g = g.union(holes.intersection(B.solid(g))) if r not in ('outline', 'line') else g.difference(holes.buffer(1))
    return straight_up(g, 'line' if r in ('outline', 'line') else 'fill')
allb = unary_union([g for *_, g in body_paths])
under = straight_up(B.solid(allb.buffer(3, join_style='round').buffer(-3, join_style='round')))
# A silhueta escura só fica perto das linhas: onde o preenchimento encosta direto no fundo (topo do
# pescoço, que vai por baixo da cabeça) ela recua 1,5 px, senão o antialias desenha um fio na borda.
lines_b = unary_union([fixed(r, g) for _, r, f, g in body_paths if r in ('outline', 'line')])
fills_b = unary_union([fixed(r, g) for _, r, f, g in body_paths if r not in ('outline', 'line')])
under = under.intersection(unary_union([lines_b.buffer(3), fills_b.buffer(-1.5)]))
# Linhas do acessório de pescoço que ficaram no corpo (borda da bandana em "V", da coleira):
# aparecem no peito sem acessório. Sai do corpo toda linha sob o acessório que não seja borda da
# silhueta do corpo, e o pelo cobre o lugar.
neck_acc = unary_union([g for r, f, g in paths('neck-accessory')])
body_sil = B.solid(unary_union([g for *_, g in body_paths]))
acc_lines = (neck_acc.buffer(t * 1.6).intersection(body_sil.buffer(-t * 1.2))
             if species == 'gatto' and not neck_acc.is_empty else Polygon())
body_fur_color = next((f for L, r, f, g in body_paths if L == 'body' and r == 'fur'), fur_color)
belly_g = unary_union([g for r, f, g in paths('belly')])
# a remoção acima não pode comer o topo das linhas internas das pernas (logo abaixo da ponta do V):
# protege os pedaços escuros do guia que descem pela perna
if not belly_g.is_empty:
    _bx0, _by0, _bx1, _ = belly_g.bounds
    leg_tops = unary_union([q for q in B.parts(dark.intersection(box(_bx0 - 2 * t, _by0 - 3 * t, _bx1 + 2 * t, _by0 + 3 * t)))
                            if q.bounds[3] > _by0 + 20])
    acc_lines = acc_lines.difference(leg_tops.buffer(1))
lines_b = lines_b.difference(acc_lines)
belly_line = (dark.intersection(belly_g.buffer(t * 1.2)).difference(belly_g)
              if species == 'gatto' and not belly_g.is_empty else Polygon()).difference(neck_acc.buffer(t * 1.6))
if not belly_g.is_empty:  # só a linha de baixo da barriga (em cima ela pegava borrões nas pontas das pernas)
    belly_line = belly_line.intersection(box(0, belly_g.bounds[3] - t * 1.5, 1024, 1024))
if not belly_line.is_empty:
    u = unary_union([lines_b, belly_line])
    seam = u.buffer(5, join_style='round').buffer(-5, join_style='round').difference(u)
    belly_line = unary_union([belly_line, seam.intersection(belly_line.buffer(t))])
lines_b = unary_union([lines_b, belly_line])
LINES_OVER = species == 'gatto'  # (cães já aprovados sem isso)
def clean(r, g):
    g = fixed(r, g)
    if r == 'fur' and not belly_g.is_empty:  # o pelo do guia tem um furo sob a barriga: fecha (sem fresta na borda dela)
        g = unary_union([g, B.solid(g).intersection(belly_g.buffer(6))])
    if r in ('outline', 'line'):
        g = g.difference(acc_lines)
    if LINES_OVER and r not in ('outline', 'line'):
        g = g.difference(lines_b)  # o preenchimento não cobre linha do corpo (barriga, pescoço)
    return g
def group(L):
    out = ''.join(f'<path data-role="{r}" fill="{f}" d="{d(clean(r, g), 0.3)}"/>' for LL, r, f, g in body_paths if LL == L)
    if L == 'belly' and not belly_line.is_empty:  # linha do guia em volta da barriga
        out += f'<path data-role="line" fill="{outline_color}" d="{d(belly_line, 0.3)}"/>'
    return out
under = under.difference(acc_lines)
acc_patch = acc_lines.intersection(body_sil.buffer(-1)).difference(belly_g)
inner = f'<path data-role="outline" fill="{outline_color}" d="{d(under, 0.3)}"/>' + (
    f'<path data-role="fur" fill="{body_fur_color}" d="{d(acc_patch, 0.3)}"/>' if not acc_patch.is_empty else '') + '\n  '.join(
    f'<g id="{L}">' + group(L) + '</g>' for L in BODY_LAYERS if L in groups)
svg('corpo-atletico', f'Corpo atlético do {breed}: camadas {", ".join(L for L in BODY_LAYERS if L in groups)} de art/layers/{model}.svg, com silhueta\n'
    '       na cor do contorno por trás (fecha as frestas de menos de 1 px, que apareciam como linhas claras).',
    f'  {inner}\n')
# corpo robusto: não vira arquivo — o HTML estica o atlético (1,14× em volta do centro do corpo)
print('ok', breed, 't=', t, 'pontos reais', len(keep))
