# Pet Mio — guia para agentes

- **Produto:** avatar de cão/gato por camadas → nome → PNG (→ produtos, futuro). UI em
  **italiano**; código, comentários e docs em **português**. Nome é "Pet Mio".
- **Node/pnpm sempre via Docker** (`docker compose run --rm web …`), nunca no host.
- Antes de entregar: `vitest run`, `eslint .`, `tsc --noEmit` verdes.

## Regras

- Texto de UI só em `src/i18n/it.ts` (nada hardcoded em JSX).
- Cor só em `src/theme/tokens.ts` (UI) / `src/render/palette.ts` (arte). Componentes usam o tema.
- Traço novo = catálogo (`domain/pet/catalog.ts`) + rótulo (`i18n`) + `TRAIT_FIELDS` + renderer.
- No renderer, contorno sempre via `outline()`/`ctx.st` — nunca `stroke-width` à mão junto.
- `domain/` e `render/` sem React. Componentes genéricos em `components/ui` não conhecem o pet.
- Imports MUI por caminho (`@mui/material/Button`).

Docs: `docs/architecture.md`, `docs/art-pipeline.md`, `docs/CONTEXT.md`.
