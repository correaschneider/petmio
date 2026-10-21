# /// script
# requires-python = ">=3.11"
# ///
"""
Gera `src/render/vector/parts.generated.ts` a partir das peças finais em `models/*.svg`.

    uv run scripts/art/build_parts.py

As peças (`models/`) são a fonte da arte do app: cada uma no quadro 1024×1024 do guia, na posição
da sua raça (peças `<raça>-*`) ou do modelo base da espécie (peças comuns `cane-*` / `gatto-*`, no
rosto do labrador / do europeu). `models/index.html` é a bancada para conferir a montagem.

Saída:
  PARTS     marcação SVG de cada peça (sem comentários nem ids), com as cores trocáveis viradas
            marcadores: {fur} {furShade} {furLight} {outline} {point} (o renderer troca pela paleta
            do pelo escolhido — render/palette.ts);
  FIT       por raça, como levar cada peça comum do rosto base ao rosto da raça (de → para, escala);
  EYES      âncoras dos olhos de cada raça (para os 5 estilos desenhados em código);
  ROBUST_CX centro x do corpo de cada raça (o robusto é o atlético esticado em torno dele).

O encaixe (FIT, olhos base, centros do robusto) vem de `models/fit.json` — fonte única, usada aqui
e pela bancada (que carrega o `models/fit.js` gerado junto).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / "models"
OUT = ROOT / "src" / "render" / "vector" / "parts.generated.ts"

# papel da cor → marcador (cores que seguem o pelo escolhido); o resto fica com a cor do guia
RECOLOR = {"fur": "{fur}", "fur-shade": "{furShade}", "fur-light": "{furLight}"}
# contorno/traço: a cor escura de cada guia vira {outline} (acompanha o pelo — preto num gato preto)
OUTLINES = {"#542814", "#4a2411", "#462412", "#4a2310", "#482211", "#492513"}
# pontas da pelagem (máscara/orelhas/patas/rabo do siamês, máscara/orelhas do carlino) → {point}
POINT_PARTS = ("siamese-", "pug-")

# Encaixe das peças (FIT por raça, olhos base, centros do robusto): fonte única em models/fit.json.
CFG = json.loads((MODELS / "fit.json").read_text())
SPECIES: dict[str, str] = CFG["species"]
FIT: dict = CFG["fit"]

# Peças que o app usa (as variações de olhos em SVG ficam só na bancada: o app os desenha em código).
USED = [p.stem for p in sorted(MODELS.glob("*.svg")) if not re.match(r"(cane|gatto)-olhos", p.stem)]


def markup(path: Path) -> str:
    point = path.stem.startswith(POINT_PARTS)
    s = path.read_text()
    s = s[s.index(">", s.index("<svg")) + 1: s.rindex("</svg>")]
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r'\sid="[^"]*"', "", s)  # ids repetiriam entre peças no mesmo SVG

    def recolor(m: re.Match) -> str:
        role, fill = m.group(1), m.group(2)
        if role in RECOLOR:
            return f'fill="{RECOLOR[role]}"'
        if role == "spot" and point:
            return 'fill="{point}"'
        return f'fill="{"{outline}" if fill.lower() in OUTLINES else fill}"'
    s = re.sub(r'data-role="([\w-]+)" fill="([^"]+)"', recolor, s)
    s = re.sub(r'stroke="(#[0-9a-fA-F]{6})"', lambda m: 'stroke="{outline}"' if m.group(1).lower() in OUTLINES else m.group(0), s)
    s = re.sub(r'\sdata-role="[^"]*"', "", s)
    return re.sub(r">\s+<", "><", s).strip()


def eyes(breed: str) -> list[dict]:
    """Olhos da raça: os do modelo base levados pelo FIT (raça base fica com os dela)."""
    out = []
    for e, key in zip(CFG["baseEyes"][SPECIES[breed]], ("olho-esq", "olho-dir")):
        f = FIT.get(breed, {}).get(key)
        cx, cy, r = (f["to"][0], f["to"][1], e["r"] * f["s"]) if f else (e["cx"], e["cy"], e["r"])
        out.append({"cx": round(cx, 1), "cy": round(cy, 1), "r": round(r, 1)})
    return out


def main() -> None:
    parts = {name: markup(MODELS / f"{name}.svg") for name in USED}
    body = [
        "// GERADO por scripts/art/build_parts.py a partir de models/*.svg — não editar à mão.",
        "// Peças no quadro 1024×1024 do guia; {fur} {furShade} {furLight} {outline} {point} = paleta do pelo.",
        "",
        f"export const PARTS: Record<string, string> = {json.dumps(parts, ensure_ascii=False)};",
        "",
        "export interface Fit { from: [number, number]; to: [number, number]; s: number }",
        f"export const FIT: Record<string, Record<string, Fit>> = {json.dumps(FIT)};",
        "",
        "export interface EyeAnchor { cx: number; cy: number; r: number }",
        f"export const EYES: Record<string, EyeAnchor[]> = {json.dumps({b: eyes(b) for b in SPECIES})};",
        "",
        f"export const EYE_STYLE: Record<string, {{ outline: string; stroke: number }}> = {json.dumps(CFG['eyeStyle'])};",
        "",
        f"export const ROBUST_CX: Record<string, number> = {json.dumps(CFG['robustCx'])};",
        "",
    ]
    OUT.write_text("\n".join(body))
    # a bancada (models/index.html, aberta direto do disco) não pode dar fetch no JSON: vira script
    (MODELS / "fit.js").write_text(
        "// GERADO por scripts/art/build_parts.py a partir de models/fit.json — não editar à mão.\n"
        f"window.PETMIO_FIT = {json.dumps({k: v for k, v in CFG.items() if not k.startswith('_')})};\n")
    print(f"→ {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB, {len(parts)} peças)")


if __name__ == "__main__":
    main()
