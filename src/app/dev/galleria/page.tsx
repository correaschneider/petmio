import { notFound } from 'next/navigation';
import {
  ACCESSORIES,
  BODIES,
  BREEDS_BY_SPECIES,
  DEFAULT_TRAITS,
  EYES,
  FURS,
  MOUTHS,
  type PetTraits,
} from '@/domain/pet';
import { renderPetSvg } from '@/render';

/**
 * Galeria de desenvolvimento: uma linha por variação de traço, para conferir encaixe e
 * recoloração das peças. Não existe em produção.
 */
export default function GalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const rows: { title: string; items: PetTraits[] }[] = [
    {
      title: 'Razze cane',
      items: BREEDS_BY_SPECIES.cane.map((breed) => ({ ...DEFAULT_TRAITS, breed })),
    },
    {
      title: 'Corpo',
      items: BODIES.flatMap((body) =>
        BREEDS_BY_SPECIES.cane.map((breed) => ({ ...DEFAULT_TRAITS, body, breed })),
      ),
    },
    { title: 'Occhi', items: EYES.map((eyes) => ({ ...DEFAULT_TRAITS, eyes })) },
    { title: 'Bocca', items: MOUTHS.map((mouth) => ({ ...DEFAULT_TRAITS, mouth })) },
    { title: 'Accessori', items: ACCESSORIES.map((acc) => ({ ...DEFAULT_TRAITS, acc })) },
    {
      title: 'Pelo',
      items: FURS.map((fur) => ({ ...DEFAULT_TRAITS, fur, eyeColor: 'azzurro' as const })),
    },
    {
      title: 'Gatti (procedurale)',
      items: BREEDS_BY_SPECIES.gatto.map((breed) => ({
        ...DEFAULT_TRAITS,
        species: 'gatto' as const,
        breed,
      })),
    },
  ];

  return (
    <main style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <style>{'.cell svg { width: 100%; height: auto; display: block; }'}</style>
      {rows.map((row) => (
        <section key={row.title}>
          <h2 style={{ fontSize: 16 }}>{row.title}</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {row.items.map((t, i) => (
              <div
                key={i}
                className="cell"
                title={JSON.stringify(t)}
                style={{ width: 160, background: '#dfe8f6', borderRadius: 12 }}
                dangerouslySetInnerHTML={{
                  __html: renderPetSvg(t, { nameTag: i === 0 ? 'Bruno' : undefined }),
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
