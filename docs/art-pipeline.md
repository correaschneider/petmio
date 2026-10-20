# Pipeline de arte

Arte gerada com IA (Nano Banana / Gemini, conversa "Pet Mio Avatar Parts") e depois
**vetorizada**. Referência-mestre de estilo: `art/reference/reference-labrador.jpg`.

## Peças geradas (`art/raw/`)

Todas em **dourado**, JPG com fundo branco (não transparente). A cor do pelo é trocada no vetor
(recolorir o fill), não gerando uma peça por cor.

| #   | Peça                 | Cartoon                                    | Pixel                           |
| --- | -------------------- | ------------------------------------------ | ------------------------------- |
| 1   | Cabeça Labrador      | ✅ `cartoon/01-head-labrador.jpg`          | ✅ `pixel/01-head-labrador.jpg` |
| 2   | Cabeça Beagle        | ✅                                         | ✅                              |
| 3   | Cabeça Carlino (pug) | ✅                                         | ✅                              |
| 4   | Corpo atlético       | ✅                                         | ❌                              |
| 5   | Corpo robusto        | ✅                                         | ❌                              |
| 6   | Olhos rotondi        | ✅                                         | ❌                              |
| 7   | Olhos allegri        | ✅                                         | ❌                              |
| 8   | Olhos assonnati      | ✅                                         | ❌                              |
| 9   | Olhos sorpresi       | ✅                                         | ❌                              |
| 10  | Olhos dolci          | ✅                                         | ❌                              |
| 11  | Boca sorriso         | ✅                                         | ❌                              |
| 12  | Boca lingua          | ✅                                         | ❌                              |
| 13  | Boca neutro          | ❌                                         | ❌                              |
| 14  | Coleira + tag        | ✅                                         | ❌                              |
| 15  | Bandana              | ✅                                         | ❌                              |
| 16  | Óculos               | ⚠️ fotorrealista, fora do estilo — refazer | ❌                              |

**Gato:** nada gerado ainda (3 raças × mesmas camadas + rabo e bigodes).

## Prompt base

```
I am building "Pet Mio", a web app where people assemble a cartoon dog avatar from interchangeable parts and print it on mugs, notebooks and t-shirts. Each part will be vectorized and layered on top of the others, so every part must share the exact same front-view angle, scale and position as the attached reference character. Match the reference style exactly: flat vector, thick uniform dark outline, solid flat colors, no gradients, no shadows, no texture, chibi proportions.
Generate ONE image per part, square, plain pure white background, part isolated and centered, no text. Golden fur for every breed. Keep line thickness identical. Heads all the same size; eyes, mouths and accessories at the size/position they'd occupy on that head.
```

- Pedir **uma peça por mensagem** ("Image N: ONLY …").
- Pixel: acrescentar "16-bit console pixel art (SNES sprite style), visible square pixels,
  limited flat palette, 1-pixel dark outline, no anti-aliasing, minimal detail, no highlights".
- Se o Gemini travar: **Recraft** (SVG nativo + estilo customizado a partir da referência).

## Integração no app (próximo passo)

1. Recortar fundo / vetorizar (Vectorizer ou Illustrator) → SVG por peça em
   `src/render/layered/parts/` (ou `public/parts/`).
2. Alinhar as âncoras do viewBox 300×320: cabeça 150,130 · corpo 150,248 · olhos y=118 em
   x=122/178 · focinho ~150,160 · plaquinha y=306.
3. Marcar no SVG as áreas de pelo (ex.: `fill="var(--fur)"` / `data-fill="fur|fur-light"`) para
   recolorir com `FUR_COLORS`.
4. Criar `renderLayered: PetRenderer` que compõe as camadas na ordem
   orelhas → corpo → acessório de pescoço → cabeça → focinho/boca → olhos → óculos → plaquinha,
   e apontar `renderPetSvg` para ele em `src/render/index.ts` (fallback para o procedural nas
   peças que faltarem). Pixel art e PNG continuam funcionando sem mudança.
