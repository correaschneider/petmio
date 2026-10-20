# Pet Mio

Crie um avatar estilizado de **cão ou gato** por camadas (raça, pelo, corpo, olhos, boca,
acessório), dê um nome e exporte em PNG 2048 px — depois, estampe em caneca, agenda e camiseta.
Mercado-alvo: **Itália** (UI em italiano). Produção futura via print-on-demand (Printful/Gelato).

> Histórico e decisões de produto: [`docs/CONTEXT.md`](docs/CONTEXT.md) (handoff do protótipo).

## Stack

Next.js 16 (App Router) · React 19 · MUI v9 (tema com CSS vars claro/escuro) · TypeScript 6 ·
Vitest + Testing Library · pnpm 11 · Node 24 · Docker.

## Rodando

Tudo via Docker (Node não precisa estar no host):

```bash
docker compose up --build        # http://localhost:3010
```

Comandos do projeto dentro do container:

```bash
docker compose run --rm web node_modules/.bin/vitest run   # testes
docker compose run --rm web node_modules/.bin/eslint .     # lint
docker compose run --rm web node_modules/.bin/tsc --noEmit # typecheck
```

Imagem de produção (Next `standalone`, usuário não-root):

```bash
docker build --target runtime -t petmio .
docker run --rm -p 3000:3000 petmio
```

Com Node 24 + pnpm 11 local: `pnpm install && pnpm dev` (scripts: `lint`, `typecheck`, `test`,
`build`, `format`).

## Estrutura

```
src/
  app/            App Router: layout (fontes, init do tema), providers, página
  domain/pet/     Catálogo de traços, regras (espécie→raça), sorteio, nome — puro, sem React
  render/         Traços → SVG (renderer procedural), pixel art (canvas), export PNG
  theme/          Tokens de marca → tema MUI (claro/escuro), fontes next/font
  i18n/           Textos em italiano, tipados contra o catálogo
  components/     UI genérica reutilizável (ChoiceChips, ColorSwatches, OptionGroup…) e do pet
  features/creator/  O fluxo Crea → Battezza (reducer + contexto + passos)
art/              Peças geradas no Nano Banana (fonte da arte real) + referência de estilo
docs/             Contexto, arquitetura, pipeline de arte, protótipo original
```

Detalhes em [`docs/architecture.md`](docs/architecture.md) e
[`docs/art-pipeline.md`](docs/art-pipeline.md).

## Estado

- ✅ Fluxo completo do protótipo: criar (com "Sorprendimi"), nomear, PNG com download real e
  cópia para a área de transferência; estilos Cartoon e Pixel art; tema claro/escuro.
- 🎨 **Arte vetorial em camadas** (guias do Recraft → `art/layers/`): labrador, beagle, carlino,
  gato europeu e siamês; 5 estilos de olho, 3 bocas, coleira/bandana/óculos trocáveis entre
  modelos, recoloração do pelo, pixel art. Persa ainda usa o modelo do europeu. Galeria em
  `/dev/galleria` (só dev).
- 🛒 Tela **Prodotti** e integração print-on-demand: fase futura.
