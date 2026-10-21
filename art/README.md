# art/

Fonte da arte (não servida pelo app).

- `recraft/` — guias vetoriais do Recraft (um personagem completo por raça). Fonte de tudo.
- `layers/` — camadas intermediárias tiradas dos guias por `scripts/art/build_layers.py`; os
  scripts de `scripts/art/models/` partem delas para montar as peças.

As **peças finais** que o app usa ficam em [`../models/`](../models/) (uma peça por arquivo, no
quadro 1024 do guia) e viram `src/render/vector/parts.generated.ts` com
`uv run scripts/art/build_parts.py`. Spec em [`../docs/art-layers-spec.md`](../docs/art-layers-spec.md).
