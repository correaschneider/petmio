# Pet Mio — contexto do projeto

> Handoff para continuar no Claude Code. Estado em 2026-10-20.

## 1. O que é

**Pet Mio** é um site onde a pessoa monta um avatar estilizado de cão ou gato por camadas (raça, pelo, corpo, olhos, boca, acessório), dá um nome e depois estampa em produtos (agenda, caneca, camiseta). Mercado alvo: **Itália** — toda a UI é em italiano. Produção via print-on-demand (Printful / Gelato, que imprimem dentro da UE) — ainda não integrado.

Nome: **Pet Mio** (não "Pet Me"; a transcrição de voz errou uma vez). Nome anterior "Cagnolino Mio" foi abandonado quando entrou gato.

Decisões já tomadas:
- Avatar **simples e estilizado**, não réplica fiel do pet real.
- Arte das peças gerada com **IA e depois vetorizada**, sem ilustrador.
- Validar com **3 raças de cão** (Labrador, Beagle, Carlino/Pug) e **3 de gato** (Europeo, Siamese, Persiano) antes de escalar.
- Dois estilos de arte: **Cartoon** (flat vector, contorno grosso) e **Pixel art** (sprite 16-bit). Outros estilos (aquarela etc.) ficam pra depois.
- Produtos: **fase futura**. Por enquanto o fluxo termina no nome + exportação PNG.

## 2. Protótipo atual (`cagnolino.html`)

Página HTML única, sem build, sem dependências além de Google Fonts (Fredoka + Nunito). Publicada como artefato no Claude; o arquivo é a fonte.

### Fluxo
1. **Crea** — botão "Sorprendimi" (sorteio total), depois seletores: Stile, Animale, Razza, Colore del pelo, Corpo, Occhi, Colore degli occhi, Bocca, Accessorio. Prévia ao vivo (sticky no desktop).
2. **Battezza** — input de nome (max 14), sugestões de nomes italianos, plaquinha amarela com o nome sob o pet. Após confirmar: badge "Pronto per la stampa", resumo (espécie · raça · pelo · olhos), botão **"Crea immagine PNG"**.
3. **Prodotti** — só placeholder desabilitado.

### Opções (`OPTS`)
- `style`: cartoon, pixel
- `species`: cane, gatto → `BREEDS[species]`
- `breed`: cane = labrador, beagle, pug · gatto = europeo, siamese, persiano
- `fur`: nero, bianco, caramello, cioccolato, dorato, grigio, beige, tricolore (cada um com cor base `c` e clara `lt`; tricolore adiciona manchas)
- `body`: atletico, robusto
- `eyes`: rotondi, allegri, assonnati, sorpresi, dolci
- `eyeColor`: marrone, ambra, azzurro, verde
- `mouth`: sorriso, lingua, neutro
- `acc`: nessuno, collare, bandana, occhiali

### Render
- `dogSVG(state, withTag)` e `catSVG(state, withTag)` desenham **proceduralmente** em SVG 300×320 (350 com plaquinha). São **placeholders** até entrar a arte real.
- Flags globais `SW` (stroke width) e `PIX`: no modo pixel o SVG é regerado com contorno 9px e sem detalhes finos (helper `D()` esconde brilhos, bigodes, rugas; olhos/focinho sem contorno e maiores).
- **Pixel art** = SVG → canvas 40px de largura (`PX=40`) → `posterize()` (16 níveis/canal, alpha binário) → ampliado 14× (`UP=14`) sem suavização → `<canvas class="px">`. `renderSeq` é por stage (bug corrigido: contador compartilhado cancelava a prévia).
- **Shuffle**: `pickNew(k)` nunca repete o valor atual (exceto style/species, que são cara-ou-coroa).
- **Export PNG** (`makePng`): 2048px de largura, desenha o pet (cartoon ou pixel), plaquinha com o nome em canvas (fonte Fredoka) e crédito "Creato con Pet Mio" no canto; checkbox "Con sfondo" (fundo azul claro + sombra) ou transparente. Dentro do artefato o download direto é bloqueado, então mostra a imagem pra salvar com clique direito/long-press e tem botão "Copia negli appunti" (ClipboardItem). **Em produção, trocar por `<a download>`.**

### Bugs já corrigidos (não reintroduzir)
- Atributo `stroke-width` duplicado no SVG do gato quebrava o parse → modo pixel caía silenciosamente no cartoon.
- `renderSeq` compartilhado entre stage1 e stage2.
- Botões de raça são regenerados em `render()` porque dependem da espécie.

## 3. Arte gerada (Nano Banana / Gemini)

Conversa no Gemini (perfil Google "Pessoal", correaschneider@gmail.com): **"Pet Mio Avatar Parts"**. Imagem de referência-mestre: labrador dourado sentado, coleira vermelha, estilo flat chibi (`f9925b90-image.jpg`).

Baixadas pra **Downloads do Brave (perfil Pessoal)** — 19 arquivos JPG com fundo branco (não transparente):

**Cartoon (15):**
| # | Peça |
|---|------|
| 1 | Cabeça Labrador (orelhas, focinho, nariz; sem olhos/boca) |
| 2 | Cabeça Beagle |
| 3 | Cabeça Pug |
| 4 | Corpo atlético (sentado, sem cabeça) |
| 5 | Corpo robusto |
| 6 | Olhos redondos (íris marrom) |
| 7 | Olhos felizes (arcos) |
| 8 | Olhos sonolentos |
| 9 | Olhos surpresos |
| 10 | Olhos doces (2 brilhos) |
| 11 | Sorriso simples |
| 12 | Sorriso com língua |
| 14 | Coleira vermelha com tag amarela |
| 15 | Bandana azul |
| 16 | Óculos redondos (versão refeita, só armação) |

**Pixel art (3):** cabeças Labrador, Beagle, Pug.

**Faltam** (Gemini falhou / bateu limite diário): cartoon #13 boca neutra; pixel #4–#16 (corpos, olhos, bocas, acessórios). Nenhuma peça de **gato** foi gerada ainda.

Todas as peças são **dourado**; a cor de pelo deve ser trocada no vetor (recolorir o fill), não gerada por cor.

### Prompt base usado (reaproveitar)
```
I am building "Pet Mio", a web app where people assemble a cartoon dog avatar from interchangeable parts and print it on mugs, notebooks and t-shirts. Each part will be vectorized and layered on top of the others, so every part must share the exact same front-view angle, scale and position as the attached reference character. Match the reference style exactly: flat vector, thick uniform dark outline, solid flat colors, no gradients, no shadows, no texture, chibi proportions.
Generate ONE image per part, square, plain pure white background, part isolated and centered, no text. Golden fur for every breed. Keep line thickness identical. Heads all the same size; eyes, mouths and accessories at the size/position they'd occupy on that head.
```
Pedir **uma peça por mensagem** ("Image N: ONLY …"); pedir várias de uma vez gera grade ou para no meio. Pra pixel: acrescentar "16-bit console pixel art (SNES sprite style), visible square pixels, limited flat palette, 1-pixel dark outline, no anti-aliasing, minimal detail, no highlights".

Alternativa recomendada se o Gemini continuar travando: **Recraft** (gera SVG nativo e tem estilo customizado a partir da referência).

## 4. Próximos passos

1. **Integrar arte real**: recortar fundo branco (ou vetorizar com Vectorizer/Illustrator → SVG), alinhar âncoras (cabeça 150,130; corpo 150,248; olhos y=118 em x=122/178; focinho ~150,160; plaquinha y=306), substituir `dogSVG` por composição de `<image>`/`<g>` por camada. Manter a troca de cor de pelo (recolorir fill no SVG, ou máscara/multiply sobre PNG).
2. Gerar as peças que faltam (boca neutra, pixel 4–16) e todo o **set de gato** (3 raças, mesmas camadas, + rabo e bigodes).
3. Tela **Prodotti**: mockups de caneca/agenda/camiseta com o PNG aplicado; integração print-on-demand.
4. Em produção: download real do PNG, talvez versão 1080×1080 pro Instagram com nome em cima.

## 5. Arquivos neste zip
- `cagnolino.html` — protótipo completo (fonte do artefato)
- `reference-labrador.jpg` — referência-mestre de estilo
- `sprite-sheet-v1.jpg` — primeira folha de sprites (grade) gerada pelo Gemini, útil como referência de peças
- `CONTEXT.md` — este arquivo
