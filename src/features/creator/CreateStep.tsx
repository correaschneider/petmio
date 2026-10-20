'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ChoiceChips } from '@/components/ui/ChoiceChips';
import { ColorSwatches } from '@/components/ui/ColorSwatches';
import { OptionGroup } from '@/components/ui/OptionGroup';
import { PetStage } from '@/components/pet/PetStage';
import { SurpriseButton } from '@/components/pet/SurpriseButton';
import { surprise, type PetTraits } from '@/domain/pet';
import { useMessages } from '@/i18n';
import { useCreator } from './CreatorProvider';
import { TRAIT_FIELDS, fieldOptions } from './traitFields';

export function CreateStep() {
  const t = useMessages();
  const { state, dispatch } = useCreator();
  const { traits } = state;
  const shuffle = () => dispatch({ type: 'replaceTraits', traits: surprise(traits) });

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2.5,
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '380px minmax(0, 1fr)' },
        alignItems: 'start',
      }}
    >
      <Paper
        component="section"
        aria-label={t.create.preview}
        sx={{
          p: 1.75,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          position: { md: 'sticky' },
          top: { md: 16 },
        }}
      >
        <PetStage traits={traits} bumpKey={state.bump} />
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1.25 }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t.create.preview} ·{' '}
            <Typography component="strong" variant="h3" sx={{ color: 'text.primary' }}>
              {t.options.breed[traits.breed]}
            </Typography>
          </Typography>
          <Button variant="outlined" onClick={shuffle}>
            {t.create.surprise}
          </Button>
        </Stack>
      </Paper>

      <Stack sx={{ gap: 2.25, minWidth: 0 }}>
        <SurpriseButton
          title={t.create.surprise}
          subtitle={t.create.surpriseHint}
          onClick={shuffle}
        />
        {TRAIT_FIELDS.map(({ key, control }) => {
          const field = t.fields[key];
          const options = fieldOptions(key, traits, t);
          const onChange = (value: string) =>
            dispatch({ type: 'setTrait', key, value: value as PetTraits[typeof key] });
          return (
            <OptionGroup
              key={key}
              label={field.label}
              hint={'hint' in field ? field.hint : undefined}
            >
              {control === 'swatches' ? (
                <ColorSwatches options={options} value={traits[key]} onChange={onChange} />
              ) : (
                <ChoiceChips options={options} value={traits[key]} onChange={onChange} />
              )}
            </OptionGroup>
          );
        })}
        <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => dispatch({ type: 'goTo', step: 'name' })}>
            {t.create.next}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
