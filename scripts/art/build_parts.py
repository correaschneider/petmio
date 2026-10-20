# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow>=11", "numpy>=2", "scipy>=1.14", "vtracer>=0.6"]
# ///
"""
Converte as peças do Nano Banana (art/raw/cartoon/*.jpg) em SVG por camada, recolorível.

    uv run scripts/art/build_parts.py            # gera src/render/layered/parts.generated.ts
    uv run scripts/art/build_parts.py --preview DIR   # + PNG de conferência de cada peça

Pipeline por peça:
  1. fundo: flood-fill do branco a partir das bordas (o branco dos olhos não encosta na borda)
     + "buracos" brancos grandes (miolo da coleira, vão entre as patas) também viram transparente;
  2. classes: cada pixel vira contorno / pelo / pelo claro / sombra / íris / preto / branco
     (peças "plain" — boca, acessórios — mantêm as cores originais);
  3. vetorização com vtracer (cores chapadas → paths);
  4. cores de pelo/íris viram placeholders (__FUR__…) trocados em runtime pela cor escolhida.

As coordenadas de saída ficam no enquadramento ORIGINAL (1024×1024) da peça, para o renderer
posicionar cada categoria com uma única transformação.
"""
from __future__ import annotations

import argparse
import io
import json
import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import vtracer
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "art" / "raw" / "cartoon"
OUT = ROOT / "src" / "render" / "layered" / "parts.generated.ts"

# Peças usadas (id → arquivo, tipo). Óculos (16) ficam de fora: saiu fotorrealista.
PARTS: dict[str, tuple[str, str]] = {
    "head.labrador": ("01-head-labrador.jpg", "fur"),
    "head.beagle": ("02-head-beagle.jpg", "fur"),
    "head.pug": ("03-head-pug.jpg", "fur"),
    "body.atletico": ("04-body-atletico.jpg", "fur"),
    "body.robusto": ("05-body-robusto.jpg", "fur"),
    "eyes.rotondi": ("06-eyes-rotondi.jpg", "eyes"),
    "eyes.allegri": ("07-eyes-allegri.jpg", "eyes"),
    "eyes.assonnati": ("08-eyes-assonnati.jpg", "eyes"),
    "eyes.sorpresi": ("09-eyes-sorpresi.jpg", "eyes"),
    "eyes.dolci": ("10-eyes-dolci.jpg", "eyes"),
    "mouth.sorriso": ("11-mouth-sorriso.jpg", "plain"),
    "mouth.lingua": ("12-mouth-lingua.jpg", "plain"),
    "acc.collare": ("14-acc-collare.jpg", "plain"),
    "acc.bandana": ("15-acc-bandana.jpg", "plain"),
}

# Cor "de trabalho" de cada classe (RGB únicos) → valor emitido no SVG.
CLASSES: dict[str, tuple[tuple[int, int, int], str]] = {
    "outline": ((61, 31, 12), "__OUTLINE__"),
    "fur": ((216, 168, 72), "__FUR__"),
    "furShade": ((168, 120, 48), "__FUR_SHADE__"),
    "iris": ((120, 72, 30), "__IRIS__"),
    "black": ((17, 17, 17), "#111111"),
    "white": ((255, 255, 255), "#ffffff"),
}

TRACE_MAX = 640  # lado máximo da imagem vetorizada (controla o tamanho dos paths)


@dataclass
class Part:
    id: str
    kind: str
    box: tuple[int, int, int, int]  # x0, y0, x1, y1 no enquadramento original
    svg: str
    anchors: dict[str, list[float]]


def background_mask(rgb: np.ndarray, kind: str) -> np.ndarray:
    white = (rgb.min(axis=2) > 222) & (np.ptp(rgb, axis=2) < 28)
    lab, _ = ndimage.label(white)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    if kind != "eyes":
        # Brancos internos grandes (miolo da coleira, vão entre as patas) também são fundo.
        sizes = ndimage.sum(np.ones_like(lab), lab, index=np.arange(lab.max() + 1))
        bg |= np.isin(lab, np.where(sizes > 1500)[0][1:])
    # Engorda 1 px para comer o halo claro do JPEG em volta do contorno.
    return ndimage.binary_dilation(bg, iterations=1) & white | bg


def classify(rgb: np.ndarray, kind: str) -> np.ndarray:
    """Devolve imagem RGB com cada pixel trocado pela cor de trabalho da sua classe."""
    f = rgb.reshape(-1, 3) / 255.0
    hsv = _hsv(f)
    h, s, v = hsv[:, 0] * 360, hsv[:, 1], hsv[:, 2]
    cls = np.full(f.shape[0], "outline", dtype=object)
    golden = (h >= 22) & (h <= 58) & (s > 0.33) & (v >= 0.55)
    cls[golden] = "fur"
    # Sem classe "pelo claro": a textura sutil do JPEG virava manchas. Sombra só nos traços.
    cls[golden & (v < 0.72)] = "furShade"
    mid = (~golden) & (v >= 0.36) & (v < 0.62) & (s > 0.3)
    cls[mid] = "iris" if kind == "eyes" else "furShade"
    cls[v < 0.16] = "black"
    cls[(s < 0.15) & (v > 0.8)] = "white"
    out = np.zeros_like(f)
    for name, (color, _) in CLASSES.items():
        out[cls == name] = np.array(color) / 255.0
    return (out.reshape(rgb.shape) * 255).astype(np.uint8)


def quantize(rgb: np.ndarray, bg: np.ndarray, colors: int = 6) -> np.ndarray:
    """Peças com cores próprias (boca, acessórios): paleta curta, ignorando o fundo."""
    fg = rgb[~bg].reshape(-1, 1, 3)
    pal = Image.fromarray(fg.astype(np.uint8), "RGB").quantize(colors, method=Image.Quantize.MAXCOVERAGE)
    lut = np.array(pal.getpalette()[: colors * 3]).reshape(-1, 3)
    out = rgb.copy()
    out[~bg] = lut[np.asarray(pal).reshape(-1)]
    return out.astype(np.uint8)


def _hsv(f: np.ndarray) -> np.ndarray:
    mx, mn = f.max(axis=1), f.min(axis=1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-9), 0)
    r, g, b = f.T
    h = np.zeros_like(mx)
    m = d > 0
    rc = np.where(m, (mx - r) / np.maximum(d, 1e-9), 0)
    gc = np.where(m, (mx - g) / np.maximum(d, 1e-9), 0)
    bc = np.where(m, (mx - b) / np.maximum(d, 1e-9), 0)
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2.0 + rc - bc, 4.0 + gc - rc))
    h = np.where(m, (h / 6.0) % 1.0, 0)
    return np.stack([h, s, mx], axis=1)


def nearest_token(hex_color: str, kind: str) -> str:
    if kind == "plain":
        return hex_color
    c = np.array([int(hex_color[i : i + 2], 16) for i in (1, 3, 5)])
    name = min(CLASSES, key=lambda k: np.sum((np.array(CLASSES[k][0]) - c) ** 2))
    return CLASSES[name][1]


PATH_RE = re.compile(r'<path d="([^"]+)" fill="(#[0-9a-fA-F]{6})" transform="translate\(([-\d.]+),([-\d.]+)\)"\s*/>')


def trace(rgba: Image.Image, kind: str, offset: tuple[int, int], scale: float) -> str:
    buf = io.BytesIO()
    rgba.save(buf, format="PNG")
    svg = vtracer.convert_raw_image_to_svg(
        buf.getvalue(),
        img_format="png",
        colormode="color",
        hierarchical="stacked",
        mode="spline",
        filter_speckle=10,
        color_precision=8,
        layer_difference=8,
        corner_threshold=60,
        length_threshold=4.0,
        splice_threshold=45,
        path_precision=1,
    )
    paths = []
    for d, fill, tx, ty in PATH_RE.findall(svg):
        paths.append(f'<path d="{d}" transform="translate({tx} {ty})" fill="{nearest_token(fill.lower(), kind)}"/>')
    if not paths:
        raise RuntimeError("vtracer não devolveu paths")
    ox, oy = offset
    return f'<g transform="translate({ox} {oy}) scale({1 / scale:.5f})">{"".join(paths)}</g>'


def anchors_for(pid: str, rgb: np.ndarray, bg: np.ndarray) -> dict[str, list[float]]:
    """Pontos de referência no enquadramento original (ex.: centro do nariz da cabeça)."""
    if not pid.startswith("head."):
        return {}
    black = (rgb.max(axis=2) < 60) & ~bg
    lab, n = ndimage.label(black)
    sizes = ndimage.sum(black, lab, index=range(1, n + 1))
    nose = int(np.argmax(sizes)) + 1
    ys, xs = np.where(lab == nose)
    return {"nose": [round(float(xs.mean()), 1), round(float(ys.mean()), 1)], "noseBottom": [round(float(xs.mean()), 1), float(ys.max())]}


# Olhos: o par gerado vem quase encostado; cada lado vira uma peça para o renderer controlar o
# espaçamento. Corte vertical no meio do enquadramento (centros dos olhos em x≈281 e x≈739).
EYE_SPLIT_X = 511


def build_all(pid: str, file: str, kind: str, preview: Path | None) -> list[Part]:
    if kind != "eyes":
        return [build(pid, file, kind, preview)]
    return [
        build(f"{pid}.left", file, kind, preview, keep=lambda x: x < EYE_SPLIT_X),
        build(f"{pid}.right", file, kind, preview, keep=lambda x: x >= EYE_SPLIT_X),
    ]


def build(pid: str, file: str, kind: str, preview: Path | None, keep=None) -> Part:
    src = Image.open(RAW / file).convert("RGB")
    rgb = np.asarray(src).astype(np.int16)
    bg = background_mask(rgb, kind)
    # Mediana tira o ruído de compressão sem arredondar o contorno.
    smooth = np.asarray(src.filter(ImageFilter.MedianFilter(5)))
    if keep is not None:
        bg = bg | ~keep(np.arange(bg.shape[1]))[None, :]
    ys, xs = np.where(~bg)
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    color = quantize(smooth, bg) if kind == "plain" else classify(smooth, kind)
    rgba = np.dstack([color, np.where(bg, 0, 255).astype(np.uint8)])[y0:y1, x0:x1]
    img = Image.fromarray(rgba, "RGBA")
    scale = min(1.0, TRACE_MAX / max(img.size))
    if scale < 1:
        # NEAREST preserva as cores de classe (sem misturas na borda).
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.NEAREST)
    if preview:
        img.save(preview / f"{pid}.png")
    return Part(pid, kind, (x0, y0, x1, y1), trace(img, kind, (x0, y0), scale), anchors_for(pid, rgb, bg))


def emit(parts: list[Part]) -> str:
    body = ",\n".join(
        f"  {json.dumps(p.id)}: {{ box: {list(p.box)}, anchors: {json.dumps(p.anchors)}, svg: {json.dumps(p.svg)} }}"
        for p in parts
    )
    return (
        "// GERADO por scripts/art/build_parts.py — não editar à mão.\n"
        "// Coordenadas no enquadramento original 1024×1024 de cada peça.\n"
        "import type { PartAsset } from './types';\n\n"
        f"export const PARTS = {{\n{body},\n}} as const satisfies Record<string, PartAsset>;\n\n"
        "export type PartId = keyof typeof PARTS;\n"
    )


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", type=Path)
    args = ap.parse_args()
    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
    parts = [part for pid, (f, k) in PARTS.items() for part in build_all(pid, f, k, args.preview)]
    OUT.write_text(emit(parts))
    for p in parts:
        print(f"{p.id:16} box={p.box} paths={p.svg.count('<path')} {len(p.svg) / 1024:.0f} KB {p.anchors or ''}")
    print(f"→ {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
