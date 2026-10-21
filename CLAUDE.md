# Pet Mio — guia para agentes

- **Produto:** avatar de cão/gato por camadas → nome → PNG (→ produtos, futuro). UI em
  **italiano**; código, comentários e docs em **português**. Nome é "Pet Mio".
- **Node/pnpm sempre via Docker** (`docker compose run --rm web …`), nunca no host.
- Antes de entregar: `vitest run`, `eslint .`, `tsc --noEmit` verdes.

## Regras

- Texto de UI só em `src/i18n/it.ts` (nada hardcoded em JSX).
- Cor só em `src/theme/tokens.ts` (UI) / `src/render/palette.ts` (arte). Componentes usam o tema.
- Traço novo = catálogo (`domain/pet/catalog.ts`) + rótulo (`i18n`) + `TRAIT_FIELDS` + renderer.
- No renderer procedural, contorno sempre via `outline()`/`ctx.st` — nunca `stroke-width` à mão junto.
- Arte = peças finais em `models/` (uma por arquivo, quadro 1024 do guia; `<raça>-<parte>[-<variação>]`
  e peças comuns `cane-*`/`gatto-*`), feitas dos guias do Recraft (`art/recraft/`) pelos scripts de
  `scripts/art/models/`. `src/render/vector/parts.generated.ts` é gerado: mudar uma peça =
  `uv run scripts/art/build_parts.py` e commitar o resultado (nunca editar à mão). Conferir a
  montagem em `models/index.html`; spec em `docs/art-layers-spec.md`.
- `domain/` e `render/` sem React. Componentes genéricos em `components/ui` não conhecem o pet.
- Imports MUI por caminho (`@mui/material/Button`).

Docs: `docs/architecture.md`, `docs/art-pipeline.md`, `docs/CONTEXT.md`.
