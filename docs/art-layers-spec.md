# Especificação das camadas da arte (v2)

> Decidido em 20/10/2026. Substitui as peças "pré-montadas" do Nano Banana (cabeça já com focinho,
> nariz e boca), que obrigavam a remendos no build (apagar o "V", recortar boca, reconstruir
> contorno). Cada camada passa a ser desenhada **sozinha**. Primeiro teste: labrador, no Recraft.

## Ordem (de trás para frente)

| # | Camada | Variações | Observações |
|---|--------|-----------|-------------|
| 1 | Rabo | por espécie | gato sempre; cão opcional |
| 2 | Corpo | atletico, robusto | só silhueta + patas, cor única de pelo |
| 3 | Manchas do corpo | opcional | cor própria (tricolore, siamês) |
| 4 | Acessório de pescoço | coleira, bandana | **atrás da cabeça**, ver regra da coleira |
| 5 | Cabeça | por raça | só a forma base, nada dentro |
| 6 | Manchas da cabeça | opcional | cor própria |
| 7 | Focinho | por raça | a área de pelo claro do focinho |
| 8 | Nariz | por espécie | |
| 9 | Boca | neutro, sorriso, lingua | nunca embutida na cabeça/focinho |
| 10 | Olhos | rotondi, allegri, assonnati, sorpresi, dolci | íris recolorível |
| 11 | Orelhas | por raça | cão (caídas): **na frente da cabeça** (decisão do Pedro); gato (pontudas): **atrás da cabeça**, logo antes dela |
| 12 | Acessório de rosto | occhiali | por cima de tudo |

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
  caídas cortadas por polígono e cabeça completada pela envoltória convexa; corpo estendido por
  baixo da cabeça.
- Prévias em `.preview/layers/` (montado, guia e cada camada sozinha).
