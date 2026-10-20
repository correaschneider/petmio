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

## Integração no app

Peças → `scripts/art/build_parts.py` → `src/render/layered/parts.generated.ts` → `renderLayered`.

```bash
uv run scripts/art/build_parts.py                 # regenera o módulo (commitar o resultado)
uv run scripts/art/build_parts.py --preview DIR   # + PNG por peça para conferir a classificação
```

O script, por peça:

1. **Fundo:** flood-fill do branco a partir das bordas (o branco dos olhos não encosta na borda,
   então sobrevive); brancos internos grandes (miolo da coleira, vão entre as patas) também
   viram transparente.
2. **Classes de cor** (cabeça, corpo, olhos): cada pixel vira contorno / pelo / sombra / íris /
   preto / branco, depois de um filtro de mediana que tira o ruído do JPEG. Boca e acessórios
   ("plain") só têm a paleta quantizada em 6 cores.
3. **Vetorização** com vtracer.
4. **Placeholders:** pelo e íris saem como `__FUR__`, `__FUR_SHADE__`, `__IRIS__`, `__OUTLINE__`,
   trocados em runtime pelas cores do catálogo, sem uma peça por cor.
5. **Olhos** viram duas peças (`.left`/`.right`): o par gerado vem quase encostado, e o
   espaçamento é decidido no layout.

As coordenadas ficam no enquadramento original 1024×1024. Peças da mesma categoria compartilham
esse enquadramento, então `src/render/layered/layout.ts` tem **uma transformação por
categoria** (ponto da fonte → ponto do viewBox 300×320 + escala). A calibração atual segue a
proporção chibi da referência (cabeça ≈ 55% da altura).

Ordem das camadas: corpo → coleira/bandana → cabeça → olhos → boca → óculos → plaquinha.

**Fallbacks** (sem peça): gato inteiro → procedural; boca neutra → traço simples; óculos →
desenhados (a peça gerada saiu fotorrealista); tricolore → só a cor base, sem manchas.

**Pixel art** passa estas mesmas camadas pelo pixelador (`render/raster.ts`): render em 8× e
downsample por bloco com prioridade para o contorno (escuridão relativa ao bloco, para pelo
preto não virar contorno).

**Conferência visual:** `http://localhost:3010/dev/galleria` (só em dev) mostra uma linha por
variação de traço.

### Adicionar uma peça nova

1. Salvar o JPG em `art/raw/cartoon/` no mesmo enquadramento das irmãs da categoria.
2. Registrar em `PARTS` do script (id `categoria.valor`, tipo `fur` | `eyes` | `plain`) e rodar.
3. Se for categoria nova, adicionar o `Placement` em `layout.ts` e a camada em
   `layered/index.ts`; o TypeScript acusa id de peça inexistente (`PartId`).
4. Conferir na galeria e rodar os testes.
