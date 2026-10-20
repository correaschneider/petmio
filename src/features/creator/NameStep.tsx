'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import { useId, useRef } from 'react';
import { PetStage } from '@/components/pet/PetStage';
import { MAX_NAME_LENGTH, NAME_SUGGESTIONS, normalizeName } from '@/domain/pet';
import { useMessages } from '@/i18n';
import { brand } from '@/theme/tokens';
import { useCreator } from './CreatorProvider';
import { ExportPanel } from './ExportPanel';

export function NameStep() {
  const t = useMessages();
  const { state, dispatch } = useCreator();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const name = normalizeName(state.name);
  const { traits } = state;

  return (
    <Paper
      component="section"
      sx={{ p: 2.75, display: 'grid', gap: 2.25, maxWidth: 560, mx: 'auto' }}
    >
      <PetStage traits={traits} nameTag={name} maxWidth={300} />

      {!state.confirmed ? (
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            dispatch({ type: 'confirmName' });
          }}
        >
          <Typography variant="h2">{t.name.title}</Typography>
          <Typography sx={{ color: 'text.secondary' }}>{t.name.lead}</Typography>
          <InputLabel
            htmlFor={inputId}
            sx={{ mt: 2, mb: 0.75, fontWeight: 700, fontSize: '.9rem', color: 'text.primary' }}
          >
            {t.name.label}
          </InputLabel>
          <OutlinedInput
            id={inputId}
            inputRef={inputRef}
            placeholder={t.name.placeholder}
            value={state.name}
            onChange={(e) => dispatch({ type: 'setName', name: e.target.value })}
            autoComplete="off"
            fullWidth
            slotProps={{ input: { maxLength: MAX_NAME_LENGTH } }}
          />
          <Stack
            direction="row"
            useFlexGap
            role="group"
            aria-label={t.name.suggestions}
            sx={{ flexWrap: 'wrap', gap: 0.75, mt: 1.25 }}
          >
            {NAME_SUGGESTIONS.map((n) => (
              <Chip
                key={n}
                label={n}
                variant="outlined"
                clickable
                onClick={() => dispatch({ type: 'setName', name: n })}
              />
            ))}
          </Stack>
          <Stack
            direction="row"
            useFlexGap
            sx={{ justifyContent: 'flex-end', gap: 1.25, mt: 2, flexWrap: 'wrap' }}
          >
            <Button variant="outlined" onClick={() => dispatch({ type: 'goTo', step: 'create' })}>
              {t.name.back}
            </Button>
            <Button type="submit" variant="contained" disabled={!name}>
              {t.name.confirm}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Stack sx={{ gap: 1, textAlign: 'center' }}>
          <Box>
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                bgcolor: 'pop.main',
                color: brand.ink,
                borderRadius: 999,
                px: 1.5,
                py: 0.5,
                fontWeight: 700,
                fontSize: '.8rem',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              {t.name.ready}
            </Box>
          </Box>
          <Typography variant="h1" component="p" sx={{ fontSize: '2rem', color: 'primary.main' }}>
            {name}
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            {t.name.summary({
              species: t.options.species[traits.species],
              breed: t.options.breed[traits.breed],
              fur: t.options.fur[traits.fur],
              eyeColor: t.options.eyeColor[traits.eyeColor],
            })}
          </Typography>
          <Stack
            direction="row"
            useFlexGap
            sx={{ justifyContent: 'center', gap: 1.25, flexWrap: 'wrap', mt: 0.75 }}
          >
            <Button
              variant="outlined"
              onClick={() => {
                dispatch({ type: 'editName' });
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
            >
              {t.name.rename}
            </Button>
            <Button variant="contained" disabled title={t.name.productsHint}>
              {t.name.products}
            </Button>
          </Stack>
          <ExportPanel traits={traits} name={name} />
        </Stack>
      )}
    </Paper>
  );
}
