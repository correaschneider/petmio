'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import type { PetTraits } from '@/domain/pet';
import { useMessages } from '@/i18n';
import { createPetPng, pngFileName } from '@/render/export-png';
import { bodyFont, displayFont } from '@/theme/fonts';
import { radius } from '@/theme/tokens';

type Status = 'idle' | 'working' | 'ready' | 'error';

export interface ExportPanelProps {
  traits: PetTraits;
  name: string;
}

export function ExportPanel({ traits, name }: ExportPanelProps) {
  const t = useMessages();
  const [withBackground, setWithBackground] = useState(true);
  const [status, setStatus] = useState<Status>('idle');
  const [png, setPng] = useState<{ blob: Blob; url: string } | null>(null);
  const [message, setMessage] = useState('');

  // Libera o object URL anterior ao trocar de imagem / desmontar.
  useEffect(
    () => () => {
      if (png) URL.revokeObjectURL(png.url);
    },
    [png],
  );

  async function generate() {
    setStatus('working');
    setMessage('');
    try {
      const blob = await createPetPng(traits, {
        name,
        withBackground,
        credit: t.export.credit,
        fonts: { display: displayFont.style.fontFamily, body: bodyFont.style.fontFamily },
      });
      setPng({ blob, url: URL.createObjectURL(blob) });
      setStatus('ready');
    } catch {
      setStatus('error');
      setMessage(t.export.error);
    }
  }

  async function copy() {
    if (!png) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png.blob })]);
      setMessage(t.export.copied);
    } catch {
      setMessage(t.export.copyUnsupported);
    }
  }

  return (
    <Stack sx={{ borderTop: 1, borderColor: 'divider', pt: 2, gap: 1.5, textAlign: 'left' }}>
      <Stack direction="row" useFlexGap sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="contained" onClick={generate} loading={status === 'working'}>
          {status === 'working' ? t.export.creating : t.export.create}
        </Button>
        <FormControlLabel
          control={
            <Checkbox
              checked={withBackground}
              onChange={(e) => setWithBackground(e.target.checked)}
            />
          }
          label={t.export.withBackground}
        />
      </Stack>

      {png && status === 'ready' && (
        <>
          <Box
            component="img"
            src={png.url}
            alt={t.export.alt}
            sx={(th) => ({
              width: '100%',
              display: 'block',
              borderRadius: `${radius.md}px`,
              border: 1,
              borderColor: 'divider',
              // Xadrez para evidenciar a transparência.
              background: `repeating-conic-gradient(${th.vars?.palette.soft} 0 25%, ${th.vars?.palette.background.paper} 0 50%) 0 0/20px 20px`,
            })}
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t.export.hint}
          </Typography>
          <Stack direction="row" useFlexGap sx={{ gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="contained" href={png.url} download={pngFileName(name)}>
              {t.export.download}
            </Button>
            <Button variant="outlined" onClick={copy}>
              {t.export.copy}
            </Button>
          </Stack>
        </>
      )}
      <Typography
        variant="body2"
        role="status"
        sx={{ color: 'text.secondary', minHeight: '1.5em' }}
      >
        {message}
      </Typography>
    </Stack>
  );
}
