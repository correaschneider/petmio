'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { PetTraits } from '@/domain/pet';
import { useMessages } from '@/i18n';
import { renderPetSvg } from '@/render';
import { renderPixelCanvas } from '@/render/raster';
import { radius } from '@/theme/tokens';

export interface PetStageProps {
  traits: PetTraits;
  /** Reserva a plaquinha (e desenha o nome, se houver). Ver `RenderOptions.nameTag`. */
  nameTag?: string;
  /** Muda a cada interação do usuário para disparar a animação "pop". */
  bumpKey?: number;
  maxWidth?: number;
}

/** Palco do avatar: SVG no cartoon, canvas no pixel art. */
export function PetStage({ traits, nameTag, bumpKey = 0, maxWidth }: PetStageProps) {
  const t = useMessages();
  const label = `${t.options.species[traits.species]} ${t.options.breed[traits.breed]}`;
  return (
    <Box
      sx={{
        bgcolor: 'soft',
        borderRadius: `${radius.lg}px`,
        aspectRatio: '1',
        width: '100%',
        maxWidth,
        mx: maxWidth ? 'auto' : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        key={bumpKey}
        className={bumpKey ? 'pet-pop' : undefined}
        // Conteúdo absoluto: o quadrado não cresce com o SVG (300×350 com plaquinha).
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {traits.style === 'pixel' ? (
          <PixelPet traits={traits} nameTag={nameTag} label={label} />
        ) : (
          <CartoonPet traits={traits} nameTag={nameTag} label={label} />
        )}
      </Box>
    </Box>
  );
}

interface PetViewProps {
  traits: PetTraits;
  nameTag?: string;
  label: string;
}

function CartoonPet({ traits, nameTag, label }: PetViewProps) {
  const svg = useMemo(
    () =>
      renderPetSvg(traits, {
        nameTag,
        label,
        fontFamily: 'var(--font-display), Fredoka, sans-serif',
      }),
    [traits, nameTag, label],
  );
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        '& svg': { width: '100%', height: '100%', display: 'block' },
      }}
      // SVG gerado pelo nosso renderer; todo texto do usuário passa por escapeXml.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function PixelPet({ traits, nameTag, label }: PetViewProps) {
  const t = useMessages();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Identidade da render pedida; o status é derivado de "qual render terminou".
  const renderKey = useMemo(
    () => JSON.stringify([traits, nameTag, label]),
    [traits, nameTag, label],
  );
  const [done, setDone] = useState<{ key: string; ok: boolean } | null>(null);
  const status = done?.key !== renderKey ? 'loading' : done.ok ? 'ready' : 'error';

  useEffect(() => {
    // Cada efeito tem seu próprio "cancelado": uma render lenta antiga nunca
    // sobrescreve a mais nova (substitui o renderSeq global do protótipo).
    let cancelled = false;
    renderPixelCanvas(traits, { nameTag, label })
      .then((sprite) => {
        const target = canvasRef.current;
        if (cancelled || !target) return;
        target.width = sprite.width;
        target.height = sprite.height;
        const ctx = target.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D indisponível');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, 0, 0);
        setDone({ key: renderKey, ok: true });
      })
      .catch(() => {
        if (!cancelled) setDone({ key: renderKey, ok: false });
      });
    return () => {
      cancelled = true;
    };
  }, [traits, nameTag, label, renderKey]);

  return (
    <>
      <Box
        component="canvas"
        ref={canvasRef}
        role="img"
        aria-label={label}
        sx={{
          display: status === 'ready' ? 'block' : 'none',
          width: '100%',
          height: '100%',
          // Escala dentro do palco quadrado sem distorcer (vale também com a plaquinha).
          objectFit: 'contain',
          imageRendering: 'pixelated',
        }}
      />
      {status !== 'ready' && (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {status === 'loading' ? t.create.pixelating : t.create.pixelError}
        </Typography>
      )}
    </>
  );
}
