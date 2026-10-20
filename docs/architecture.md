# Arquitetura

## Camadas

```
domain/pet  ──►  render  ──►  components/pet  ──►  features/creator  ──►  app
   (puro)       (puro + canvas)   (React)            (estado do fluxo)
theme/tokens ──► theme (MUI), render/palette, export PNG
i18n ──► todos os componentes (nenhum texto hardcoded em JSX)
```

- **`domain/pet`** — IDs válidos (`as const`), cores do pelo/íris, regras (`withTrait`: trocar
  espécie reseta a raça), sorteio com RNG injetável (`surprise` nunca repete o valor atual),
  normalização do nome. Sem React, sem DOM: 100% testável.
- **`render`** — contrato `PetRenderer = (traits, options) => string (SVG)`. O renderer ativo é
  escolhido em `render/index.ts`. Hoje é o procedural (`render/procedural/`), com as partes
  comuns (olhos, óculos, plaquinha) em `parts.ts`. Pixel art e PNG ficam em `raster.ts` e
  `export-png.ts` e só dependem do contrato — trocar o renderer não mexe neles.
- **`theme`** — `tokens.ts` é a fonte única de cor. `theme.ts` monta o tema MUI com
  `cssVariables` + `colorSchemes` (claro/escuro); o `InitColorSchemeScript` do layout aplica o
  esquema antes do primeiro paint. Componentes usam `sx`/`theme.vars`, nunca cor solta. Paleta
  estendida com `pop` (amarelo) e `soft` (fundo do palco) via module augmentation.
- **`i18n`** — `it.ts` tipado: os rótulos das opções são `Record<Id, string>`, então adicionar
  uma opção no catálogo sem rótulo quebra a compilação. `useMessages()` é o ponto de troca para
  next-intl quando houver outro idioma.
- **`components/ui`** — genéricos e sem conhecer o pet: `ChoiceChips<T>`, `ColorSwatches<T>`,
  `OptionGroup` (fieldset/legend), `StepIndicator`, `ThemeModeToggle`.
- **`features/creator`** — `creatorReducer` (puro) + `CreatorProvider`. O passo "Crea" é
  **data-driven**: `TRAIT_FIELDS` define ordem e controle de cada traço; um traço novo é uma
  linha ali + catálogo + i18n.

## Decisões

- **SVG como string** no renderer: é o formato que o pixel art (SVG → `<img>` → canvas) e o
  PNG precisam. Na UI é injetado com `dangerouslySetInnerHTML`; todo texto do usuário passa por
  `escapeXml`.
- **`outline()`** monta os atributos de contorno — não escrever `stroke-width` à mão
  (atributo duplicado quebrava o parse e o pixel caía no cartoon sem erro). O teste
  `render.test.ts` faz o parse de **todas** as ~1.400 combinações nos dois estilos.
- **Render de pixel cancelável por efeito** (`PixelPet`): cada efeito tem seu `cancelled`,
  substituindo o `renderSeq` global do protótipo; o status é derivado da última render concluída.
- **Download real** (`<a download>`) + cópia via `ClipboardItem`.

## Bugs do protótipo que não podem voltar

1. `stroke-width` duplicado no SVG do gato → coberto por `render.test.ts`.
2. `renderSeq` compartilhado entre os palcos → cada `PixelPet` cancela só a própria render.
3. Raças dependem da espécie → `optionsFor('breed', traits)` + teste de UI.
