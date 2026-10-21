# Especificação das camadas da arte (v2)

> Decidido em 20/10/2026. Substitui as peças "pré-montadas" do Nano Banana (cabeça já com focinho,
> nariz e boca), que obrigavam a remendos no build (apagar o "V", recortar boca, reconstruir
> contorno). Cada camada passa a ser desenhada **sozinha**. Primeiro teste: labrador, no Recraft.

## Ordem (de trás para frente)

| #   | Camada               | Variações                                    | Observações                                                                                                     |
| --- | -------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Rabo                 | por espécie                                  | gato sempre; cão opcional                                                                                       |
| 2   | Corpo                | atletico, robusto                            | só silhueta + patas, cor única de pelo                                                                          |
| 3   | Manchas do corpo     | opcional                                     | cor própria (tricolore, siamês)                                                                                 |
| 4   | Acessório de pescoço | coleira, bandana                             | **atrás da cabeça**, ver regra da coleira                                                                       |
| 5   | Cabeça               | por raça                                     | só a forma base, nada dentro                                                                                    |
| 6   | Manchas da cabeça    | opcional                                     | cor própria                                                                                                     |
| 7   | Focinho              | por raça                                     | a área de pelo claro do focinho                                                                                 |
| 8   | Nariz                | por espécie                                  |                                                                                                                 |
| 9   | Boca                 | neutro, sorriso, lingua                      | nunca embutida na cabeça/focinho                                                                                |
| 10  | Olhos                | rotondi, allegri, assonnati, sorpresi, dolci | íris recolorível                                                                                                |
| 11  | Orelhas              | por raça                                     | cão (caídas): **na frente da cabeça** (decisão do Pedro); gato (pontudas): **atrás da cabeça**, logo antes dela |
| 12  | Acessório de rosto   | occhiali                                     | por cima de tudo                                                                                                |

## Regras de todas as camadas

- **Mesmo enquadramento e escala**: uma imagem-guia (personagem completo) fixa as âncoras; cada
  camada é pedida como "só X, na mesma posição da guia".
- **Uma camada não desenha o que é de outra** (cabeça sem focinho, focinho sem boca, corpo sem
  coleira...).
- **Cores por papel** (viram placeholders no build): contorno, pelo base, pelo claro (focinho,
  barriga), mancha, íris, rosa (nariz/língua). Arte sempre em dourado; a cor do pelo é trocada no
  vetor.
- Estilo: flat vector, contorno marrom-escuro grosso e uniforme (mesma espessura em todas as
  camadas), cores chapadas, sem gradiente/sombra/textura, chibi, vista frontal.
- Uma camada por pedido. Download dos arquivos (nunca pela área de transferência).

## Regra da coleira (e de acessórios de pescoço)

- Desenhar **só a faixa da frente** — sem a metade de trás do anel aparecendo acima.
- **Justa** no pescoço e **alta**, logo sob o queixo; a cabeça cobre a borda de cima.
- Plaquinha pendurada no meio da faixa.

## Pipeline atual (guias do Recraft → camadas)

- Guias vetoriais em `art/recraft/*-guia.svg` (estilo "Pet Mio chibi flat", V4.1 Vector): labrador,
  beagle, carlino, gato europeu, siamês. O persa falhou na geração.
- `uv run scripts/art/build_layers.py [modelo]` → `art/layers/<modelo>.svg`, um `<g id>` por camada.
  Mapa de cada guia em `scripts/art/layer_maps.py`.
- **Contorno**: vem do próprio guia — a silhueta escura menos todas as manchas é o desenho das
  linhas; cada camada leva a parte dele que encosta nela (espessuras idênticas ao original).
- **Formas completas**: buracos fechados; cabeça de gato separada das orelhas por elipse; orelhas
  caídas cortadas por polígono cuja borda interna segue a linha real do guia (`ear_line`, pontos
  medidos; trecho escondido sob os óculos é interpolado), desenhada com espessura constante, e
  cabeça completada pela envoltória convexa; corpo estendido por
  baixo da cabeça.
- Prévias em `.preview/layers/` (montado, guia e cada camada sozinha).

## Peças finais (`models/`) — o que o app usa

> Decidido em 20/10/2026, depois de montar peça a peça com o Pedro.

- **Uma peça por arquivo**, todas no quadro 1024×1024 do guia, cada uma no seu lugar (empilhar os
  arquivos monta o pet). Nome: `<raça>-<parte>[-<variação>]` (`labrador-corpo-atletico`,
  `persiano-cabeca`) e **peças comuns da espécie** `cane-*` / `gatto-*` (bocas, nariz, bigodes,
  acessórios, olhos), desenhadas no rosto do modelo base (labrador / europeu).
- **Bigode** (gatos): 2 ou 3 fios por lado (`gatto-bigodes` / `gatto-bigodes-tres`), traço `whiskers`.
- **Tricolor:** branco, caramelo e escuro distribuídos por cabeça/orelhas/corpo/pontas conforme o
  `pattern` do pet, sorteado a cada clique no tricolor (`render/vector/tricolor.ts`).
- **Peças por raça:** corpo atlético; cabeça (com focinho e manchas; nos gatos, com as orelhas);
  orelhas dos cães (na frente da cabeça). O **robusto** não é arquivo: é o atlético esticado 1,14×
  em torno do centro do corpo.
- **FIT:** para cada raça, como levar cada peça comum do rosto base ao da raça (ponto de → para +
  escala; olhos um de cada vez). Fonte única em `models/fit.json` (com os olhos base e os centros
  do robusto); `build_parts.py` gera dele o app e o `models/fit.js` que a bancada carrega.
- **Olhos no app:** desenhados em código (5 estilos, íris recolorível) nas âncoras da raça; os SVGs
  `*-olhos-*` são só para a bancada.
- **Gerar:** `uv run scripts/art/build_parts.py` → `src/render/vector/parts.generated.ts`. As cores
  com papel `fur`/`fur-shade`/`fur-light` viram marcadores e seguem o pelo escolhido.
- **Scripts das peças** (`scripts/art/models/`): `make_parts.py` (peças a partir das camadas:
  corpos, cabeças de cão, orelhas; ombros que sobem por baixo da cabeça), `labrador_head.py`,
  `cat_head.py`/`siamese_head.py`/`persian_head.py` (cabeça+orelhas do gato direto do guia),
  `persian_body_raw.py` (corpo do persa com as formas do guia), `png2svg.py` (peça desenhada à mão
  em PNG → SVG, como a orelha do labrador).
