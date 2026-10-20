# /// script
# requires-python = ">=3.11"
# dependencies = ["svgelements>=1.9", "shapely>=2", "numpy>=2", "cairosvg>=2.7"]
# ///
"""
Monta o SVG em CAMADAS de cada modelo a partir do guia vetorial do Recraft (art/recraft/*-guia.svg).

    uv run scripts/art/build_layers.py            # todos os modelos de layer_maps.py
    uv run scripts/art/build_layers.py beagle     # só um

O SVG do Recraft é "empilhado": uma silhueta escura inteira (faz o papel de contorno) com manchas
de cor por cima. Aqui cada mancha vira uma forma independente:

  1. cada path vira polígono (shapely) e cada pedaço desconexo vira uma "peça";
  2. o mapa do modelo (layer_maps.py) diz a camada de cada peça e como completá-la
     (fechar buracos, separar cabeça/orelha por elipse, estender o corpo por baixo da cabeça...);
  3. formas de base ganham CONTORNO PRÓPRIO: traço da cor da silhueta por trás do preenchimento
     (paint-order stroke), com a espessura medida no próprio guia — some a silhueta única;
  4. o que só existia na silhueta (bigodes, armação de óculos, rugas) é recuperado como "traços":
     buracos das manchas que nenhuma outra mancha cobre + o que sobra da silhueta fora delas.

Saída: art/layers/<modelo>.svg (um <g id> por camada, na ordem de desenho) + prévias em
.preview/layers/ (figura montada e folha com cada camada sozinha).
"""
from __future__ import annotations

import math
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import cairosvg
import numpy as np
from shapely import affinity
from shapely.geometry import Polygon, box
from shapely.geometry.base import BaseGeometry
from shapely.ops import unary_union
from svgelements import Path as SvgPath

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from layer_maps import MODELS, Z_ORDER  # noqa: E402

SRC = ROOT / "art" / "recraft"
OUT = ROOT / "art" / "layers"
PREVIEW = ROOT / ".preview" / "layers"


# ---------------------------------------------------------------- leitura do guia

@dataclass
class Shape:
    idx: int
    fill: str
    geom: BaseGeometry


def path_to_geom(d: str) -> BaseGeometry:
    """Path SVG → polígono (subpaths combinados por XOR = buracos aninhados)."""
    geom: BaseGeometry = Polygon()
    for sub in SvgPath(d).as_subpaths():
        sub = SvgPath(sub)
        length = sub.length(error=1e-2) or 0
        n = max(16, int(length / 1.5))
        pts = [(p.real, p.imag) for p in (sub.point(t) for t in np.linspace(0, 1, n))]
        if len(pts) < 3:
            continue
        ring = Polygon(pts).buffer(0)
        geom = geom.symmetric_difference(ring)
    return geom.buffer(0)


def read_guide(file: Path) -> list[Shape]:
    src = file.read_text()
    shapes = []
    for i, tag in enumerate(re.findall(r"<path[^>]*?/>|<path[^>]*>.*?</path>", src, flags=re.S)):
        d = re.search(r'\sd="([^"]+)"', tag)
        fill = re.search(r'fill="([^"]+)"', tag)
        if not d:
            continue
        shapes.append(Shape(i, (fill.group(1) if fill else "#000").lower(), path_to_geom(d.group(1))))
    return shapes


def parts(geom: BaseGeometry) -> list[Polygon]:
    if isinstance(geom, Polygon):
        return [geom] if not geom.is_empty else []
    return [g for g in getattr(geom, "geoms", []) if isinstance(g, Polygon) and not g.is_empty]


def solid(geom: BaseGeometry) -> BaseGeometry:
    """Sem buracos (forma completa: o que estava por baixo de olhos/focinho vira pelo)."""
    return unary_union([Polygon(p.exterior) for p in parts(geom)])


# ---------------------------------------------------------------- operações de completar

def fit_ellipse(points: np.ndarray) -> tuple[float, float, float, float]:
    """Elipse alinhada aos eixos por mínimos quadrados: (cx, cy, rx, ry)."""
    x, y = points[:, 0], points[:, 1]
    # A x² + C y² + D x + E y = 1
    m = np.column_stack([x * x, y * y, x, y])
    sol, *_ = np.linalg.lstsq(m, np.ones_like(x), rcond=None)
    A, C, D, E = sol
    cx, cy = -D / (2 * A), -E / (2 * C)
    k = 1 + A * cx * cx + C * cy * cy
    return cx, cy, math.sqrt(k / A), math.sqrt(k / C)


def ellipse(cx: float, cy: float, rx: float, ry: float) -> Polygon:
    return Polygon([(cx + rx * math.cos(t), cy + ry * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 240)])


def split_head_ears(fur: BaseGeometry, ear_top: float) -> tuple[BaseGeometry, list[BaseGeometry]]:
    """
    Cabeça e orelhas pontudas vêm numa mancha só (gato). A cabeça é a elipse ajustada ao contorno
    ABAIXO das orelhas; o que passa da elipse são as orelhas, estendidas para dentro da cabeça
    (ficam atrás dela, então a extensão não aparece).
    """
    ring = np.array(solid(fur).exterior.coords)
    head_pts = ring[ring[:, 1] > ear_top]
    cx, cy, rx, ry = fit_ellipse(head_pts)
    ell = ellipse(cx, cy, rx * 1.01, ry * 1.01)
    head = solid(fur).intersection(ell)
    ears = []
    for p in parts(solid(fur).difference(ell).buffer(-2).buffer(2)):
        if p.area < 500:
            continue
        ears.append(unary_union([p, p.buffer(45).intersection(ell)]))
    return head, ears


def floppy_ears(fur: BaseGeometry, left_poly: list[tuple[float, float]]) -> tuple[BaseGeometry, list[BaseGeometry], BaseGeometry]:
    """
    Orelhas caídas (cão) saem da cabeça pelo polígono de corte (esquerda; a direita é espelhada).
    A cabeça é completada por baixo das orelhas com a envoltória convexa — elas ficam na frente,
    então a extensão só aparece se a orelha for trocada por outra.
    """
    left = Polygon(left_poly)
    right = Polygon([(1024 - x, y) for x, y in left_poly])
    cut = unary_union([left, right])
    fur = solid(fur)
    # A orelha avança 3 px sobre a cabeça na emenda do corte: sem isso o antialias desenha um fio
    # entre duas áreas da mesma cor.
    ears = [p.union(p.buffer(3).intersection(fur)) for p in (fur.intersection(left), fur.intersection(right)) if not p.is_empty]
    visible_head = fur.difference(cut)
    head = solid(visible_head).convex_hull
    return head, ears, visible_head


# ---------------------------------------------------------------- montagem

@dataclass
class Item:
    layer: str
    geom: BaseGeometry          # forma completa (o que fica escondido também)
    fill: str
    role: str
    outline: BaseGeometry | None = None   # contorno do guia que encosta nesta forma
    opacity: float = 1.0


@dataclass
class Model:
    name: str
    guide: str
    outline_color: str = ""
    stroke: float = 0.0
    items: list[Item] = field(default_factory=list)


def stroke_width(sil: BaseGeometry, fills: BaseGeometry) -> float:
    """Espessura média do contorno = (área da silhueta − área das manchas) / perímetro das manchas."""
    outer = solid(fills)
    return max(8.0, (solid(sil).area - outer.area) / max(outer.boundary.length, 1))


def neck_extension(g: BaseGeometry, up: float) -> BaseGeometry:
    """Pescoço por baixo da cabeça: faixa do topo do corpo, mais estreita, puxada para cima."""
    x0, y0, x1, _ = g.bounds
    top = g.intersection(box(x0, y0, x1, y0 + 40)).convex_hull
    top = affinity.scale(top, 0.72, 1.0)
    return unary_union([g, top.union(affinity.translate(top, 0, -up)).convex_hull])


def build(name: str) -> Model:
    cfg = MODELS[name]
    shapes = {s.idx: s for s in read_guide(SRC / cfg["guide"])}
    sil = cfg["silhouette"]
    drop = set(cfg.get("drop", [])) | {sil}
    fills_visible = unary_union([s.geom for i, s in shapes.items() if i not in drop])
    # O desenho das linhas do original: a parte da silhueta que fica à mostra.
    dark = shapes[sil].geom.difference(fills_visible)
    t = cfg.get("stroke") or stroke_width(shapes[sil].geom, fills_visible)
    m = Model(name, cfg["guide"], shapes[sil].fill, t)
    reach = t * 1.6

    def outline_of(visible: BaseGeometry) -> BaseGeometry:
        return dark.intersection(visible.buffer(reach))

    used = set(drop)
    for rule in cfg["layers"]:
        layer, ids = rule["layer"], rule["paths"]
        used |= set(ids)
        groups = [ids] if rule.get("merge") or rule.get("op") else [[i] for i in ids]
        for group in groups:
            visible = unary_union([shapes[i].geom for i in group])
            if rule.get("pick"):  # predicado sobre o centróide de cada peça
                visible = unary_union([p for p in parts(visible) if rule["pick"](p.centroid.x, p.centroid.y, p)])
            if visible.is_empty:
                continue
            fill = rule.get("fill") or shapes[group[0]].fill
            role = rule.get("role", "fur")
            has_outline = rule.get("outline", False)
            g = solid(visible) if rule.get("solid", has_outline) else visible

            if rule.get("op") == "head_ears":
                head, ears = split_head_ears(g, rule["ear_top"])
                ears_union = unary_union(ears)
                # A base das orelhas não tinha linha (era tudo pelo): desenha o arco da cabeça ali.
                arc = head.exterior.buffer(t / 2).intersection(ears_union.buffer(t))
                m.items.append(Item(layer, head, fill, role, unary_union([outline_of(head), arc])))
                for e in ears:
                    m.items.append(Item(rule["ears_layer"], e, fill, role, outline_of(e.difference(head))))
                continue
            if rule.get("op") == "floppy_ears":
                head, ears, visible_head = floppy_ears(g, rule["ear_poly"])
                ears_union = unary_union(ears)
                hidden_edge = head.exterior.buffer(t / 2).intersection(ears_union)
                m.items.append(Item(layer, head, fill, role, unary_union([outline_of(visible_head), hidden_edge])))
                for e in ears:
                    m.items.append(Item(rule["ears_layer"], e, fill, role, outline_of(e)))
                continue
            if rule.get("extend_up"):
                g = neck_extension(g, rule["extend_up"])
            m.items.append(Item(layer, g, fill, role, outline_of(visible) if has_outline else None,
                                rule.get("opacity", 1.0)))

    # Acessórios precisam poder SAIR sem deixar buraco: preenche por baixo com o pelo da camada
    # de baixo (corpo sob coleira/bandana, cabeça sob os óculos).
    def main_item(layer: str) -> Item | None:
        cands = [it for it in m.items if it.layer == layer and it.role not in ("line", "outline")]
        return max(cands, key=lambda it: it.geom.area, default=None)

    for acc_layer, under in (("neck-accessory", "body"), ("face-accessory", "head")):
        acc = unary_union([it.geom.union(it.outline or Polygon()) for it in m.items if it.layer == acc_layer])
        host = main_item(under)
        if acc.is_empty or host is None:
            continue
        hull = unary_union([it.geom for it in m.items if it.layer in ("body", "head", "muzzle")]).convex_hull
        filler = acc.buffer(4).intersection(hull)
        m.items.insert(m.items.index(host) + 1, Item(under, filler, host.fill, host.role))

    # Linhas que não encostam em nenhuma forma (bigodes fora da cabeça, armação longe da lente...).
    covered = unary_union([it.outline for it in m.items if it.outline is not None])
    rest = dark.difference(covered.buffer(1)).buffer(-0.8).buffer(0.8)
    for p in parts(rest):
        if p.area < cfg.get("min_line_area", 60):
            continue
        # Traço dentro de um acessório (aro da plaquinha, armação) é do acessório.
        # Idem boca/nariz/olhos: ao trocar a boca, as linhas da boca antiga têm que sair junto.
        acc_layer = next((it.layer for it in m.items if it.layer in ("neck-accessory", "face-accessory", "mouth", "nose", "eyes")
                          and it.geom.buffer(t * 2).contains(p.centroid)), None)
        layer = acc_layer or next((r["layer"] for r in cfg.get("lines", []) if r["box"].contains(p.centroid)),
                                  cfg.get("lines_default"))
        if layer:
            m.items.append(Item(layer, p, m.outline_color, "line"))

    unused = sorted(set(shapes) - used)
    if unused:
        print(f"  {name}: paths sem camada (descartados): {unused}")
    return m


# ---------------------------------------------------------------- SVG

def geom_d(g: BaseGeometry) -> str:
    out = []
    for p in parts(g.simplify(0.6)):
        for ring in [p.exterior, *p.interiors]:
            c = list(ring.coords)
            out.append("M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in c) + "Z")
    return "".join(out)


def to_svg(m: Model, only: str | None = None) -> str:
    groups = []
    order = MODELS[m.name].get("z") or Z_ORDER
    for layer in order:
        if only and layer != only:
            continue
        items = [it for it in m.items if it.layer == layer]
        if not items:
            continue
        body = []
        for it in items:
            if it.outline is not None and not it.outline.is_empty:
                body.append(f'<path data-role="outline" fill="{m.outline_color}" d="{geom_d(it.outline)}"/>')
            op = f' opacity="{it.opacity}"' if it.opacity < 1 else ""
            body.append(f'<path data-role="{it.role}" fill="{it.fill}"{op} d="{geom_d(it.geom)}"/>')
        groups.append(f'<g id="{layer}">{"".join(body)}</g>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">'
            + "".join(groups) + "</svg>")


# ---------------------------------------------------------------- export para o app

TS_OUT = ROOT / "src" / "render" / "vector" / "models.generated.ts"


def bbox(m: Model, layer: str) -> list[float] | None:
    g = unary_union([it.geom for it in m.items if it.layer == layer])
    return None if g.is_empty else [round(v, 1) for v in g.bounds]


def anchors(m: Model) -> dict:
    """Pontos de encaixe usados para trocar peças entre modelos (olhos, boca, acessórios)."""
    eyes_geom = unary_union([it.geom for it in m.items if it.layer == "eyes"])
    eyes = sorted((p for p in parts(eyes_geom.buffer(3).buffer(-3)) if p.area > 400), key=lambda p: -p.area)[:2]
    eyes = sorted(eyes, key=lambda p: p.centroid.x)
    a = {
        "eyes": [{"cx": round(p.centroid.x, 1), "cy": round(p.centroid.y, 1),
                  "r": round(math.sqrt(p.area / math.pi), 1)} for p in eyes],
        "head": bbox(m, "head"),
        "nose": bbox(m, "nose"),
        "mouth": bbox(m, "mouth"),
        "body": bbox(m, "body"),
        "neck": bbox(m, "neck-accessory"),
        "glasses": bbox(m, "face-accessory"),
        # cabeça + focinho + boca: o "rosto" inteiro (no beagle o focinho branco desce além da cabeça)
        "face": [round(v, 1) for v in unary_union(
            [it.geom for it in m.items if it.layer in ("head", "muzzle", "mouth", "head-spots")]).bounds],
    }
    return a


def export_ts(models: list[Model]) -> None:
    import json

    def entry(it: Item) -> list[dict]:
        out = []
        if it.outline is not None and not it.outline.is_empty:
            out.append({"d": geom_d(it.outline), "role": "outline"})
        e = {"d": geom_d(it.geom), "role": it.role, "fill": it.fill}
        if it.opacity < 1:
            e["opacity"] = it.opacity
        out.append(e)
        return out

    data = {}
    for m in models:
        cfg = MODELS[m.name]
        layers: dict[str, list[dict]] = {}
        for it in m.items:
            layers.setdefault(it.layer, []).extend(entry(it))
        data[cfg["breed"]] = {
            "species": cfg["species"],
            "stroke": round(m.stroke, 1),
            "outline": m.outline_color,
            "anchors": anchors(m),
            "layers": layers,
        }
    TS_OUT.parent.mkdir(parents=True, exist_ok=True)
    TS_OUT.write_text(
        "// GERADO por scripts/art/build_layers.py — não editar à mão.\n"
        "// Camadas vetoriais de cada modelo (enquadramento 1024×1024 do guia do Recraft).\n"
        "import type { VectorModel } from './types';\n\n"
        f"export const VECTOR_MODELS = {json.dumps(data, separators=(',', ':'))} as const satisfies Record<string, VectorModel>;\n"
    )
    print(f"→ {TS_OUT.relative_to(ROOT)} ({TS_OUT.stat().st_size / 1024:.0f} KB)")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    names = sys.argv[1:] or list(MODELS)
    built: list[Model] = []
    for name in names:
        m = build(name)
        svg = to_svg(m)
        (OUT / f"{name}.svg").write_text(svg)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=str(PREVIEW / f"{name}.png"), output_width=512, background_color="white")
        order = MODELS[name].get("z") or Z_ORDER
        for old in PREVIEW.glob(f"{name}--*.png"):
            if not old.stem.endswith(("--guia", "--grid")):
                old.unlink()
        for layer in order:
            if any(it.layer == layer for it in m.items):
                cairosvg.svg2png(bytestring=to_svg(m, layer).encode(), write_to=str(PREVIEW / f"{name}--{layer}.png"),
                                 output_width=220, background_color="#eef2f6")
        layers = [l for l in order if any(it.layer == l for it in m.items)]
        print(f"{name}: contorno {m.stroke:.1f}px · camadas: {', '.join(layers)} · {len(svg) / 1024:.0f} KB")
        built.append(m)
    if not sys.argv[1:]:
        export_ts(built)


if __name__ == "__main__":
    main()
