import type {
  Accessory,
  Body,
  Breed,
  EyeColor,
  Eyes,
  Fur,
  Mouth,
  Species,
  Style,
} from '@/domain/pet';

/**
 * Textos da UI em italiano. Os rótulos das opções são `Record<Id, string>`:
 * esquecer um rótulo ao adicionar uma opção no catálogo vira erro de compilação.
 */
export const it = {
  meta: {
    title: 'Pet Mio — crea l’avatar del tuo cane o gatto',
    description:
      'Componi un avatar illustrato del tuo cane o gatto, dagli un nome e scaricalo in alta qualità.',
  },
  brand: { first: 'Pet', second: 'Mio' },
  steps: { create: 'Crea', name: 'Battezza', products: 'Prodotti' },
  theme: { light: 'Tema chiaro', dark: 'Tema scuro', system: 'Tema di sistema' },
  create: {
    preview: 'Anteprima',
    surprise: 'Sorprendimi',
    surpriseHint: 'Cane o gatto a caso, con stile, pelo e accessori',
    next: 'Avanti: dagli un nome →',
    pixelating: 'Pixelando…',
    pixelError: 'Il browser non riesce a pixelare questa immagine.',
  },
  fields: {
    style: { label: 'Stile', hint: 'come viene disegnato' },
    species: { label: 'Animale' },
    breed: { label: 'Razza', hint: 'definisce testa, orecchie e muso' },
    fur: { label: 'Colore del pelo' },
    body: { label: 'Corpo' },
    eyes: { label: 'Occhi', hint: 'stile' },
    eyeColor: { label: 'Colore degli occhi' },
    mouth: { label: 'Bocca' },
    acc: { label: 'Accessorio' },
  },
  options: {
    style: { cartoon: 'Cartoon', pixel: 'Pixel art' } satisfies Record<Style, string>,
    species: { cane: 'Cane', gatto: 'Gatto' } satisfies Record<Species, string>,
    breed: {
      labrador: 'Labrador',
      beagle: 'Beagle',
      pug: 'Carlino',
      europeo: 'Europeo',
      siamese: 'Siamese',
      persiano: 'Persiano',
    } satisfies Record<Breed, string>,
    fur: {
      nero: 'Nero',
      bianco: 'Bianco',
      caramello: 'Caramello',
      cioccolato: 'Cioccolato',
      dorato: 'Dorato',
      grigio: 'Grigio',
      beige: 'Beige',
      tricolore: 'Tricolore',
    } satisfies Record<Fur, string>,
    body: { atletico: 'Atletico', robusto: 'Robusto' } satisfies Record<Body, string>,
    eyes: {
      rotondi: 'Rotondi',
      allegri: 'Allegri',
      assonnati: 'Assonnati',
      sorpresi: 'Sorpresi',
      dolci: 'Dolci',
    } satisfies Record<Eyes, string>,
    eyeColor: {
      marrone: 'Marrone',
      ambra: 'Ambra',
      azzurro: 'Azzurro',
      verde: 'Verde',
    } satisfies Record<EyeColor, string>,
    mouth: { sorriso: 'Sorriso', lingua: 'Lingua fuori', neutro: 'Neutro' } satisfies Record<
      Mouth,
      string
    >,
    acc: {
      nessuno: 'Nessuno',
      collare: 'Collare',
      bandana: 'Bandana',
      occhiali: 'Occhiali',
    } satisfies Record<Accessory, string>,
  },
  name: {
    title: 'Come si chiama?',
    lead: 'Il nome finirà sulla targhetta, e poi su tazze, agende e magliette.',
    label: 'Nome',
    placeholder: 'es. Bruno',
    suggestions: 'Suggerimenti',
    back: '← Modifica',
    confirm: 'Conferma il nome',
    ready: 'Pronto per la stampa',
    rename: 'Cambia nome',
    products: 'Scegli i prodotti (presto)',
    productsHint: 'Prossimo passo',
    summary: (p: { species: string; breed: string; fur: string; eyeColor: string }) =>
      `${p.species} ${p.breed} · pelo ${p.fur.toLowerCase()} · occhi ${p.eyeColor.toLowerCase()}`,
  },
  export: {
    create: 'Crea immagine PNG',
    creating: 'Creo l’immagine…',
    withBackground: 'Con sfondo',
    download: 'Scarica PNG',
    copy: 'Copia negli appunti',
    copied: 'Copiata!',
    copyUnsupported: 'Il browser non permette la copia: usa “Scarica PNG”.',
    error: 'Non sono riuscito a creare il PNG.',
    alt: 'Il tuo animale in PNG',
    hint: '2048 px, pronta per social e stampa.',
    credit: 'Creato con Pet Mio',
  },
} as const;

export type Messages = typeof it;
