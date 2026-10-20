import Box from '@mui/material/Box';

export interface Step {
  id: string;
  label: string;
}

export interface StepIndicatorProps {
  steps: readonly Step[];
  current: string;
}

/** Trilha de passos "1 · Crea  2 · Battezza  3 · Prodotti". */
export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <Box
      component="ol"
      sx={{
        display: 'flex',
        gap: 0.75,
        listStyle: 'none',
        m: 0,
        p: 0,
        fontSize: '.8rem',
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        color: 'text.secondary',
      }}
    >
      {steps.map((s, i) => {
        const active = s.id === current;
        return (
          <Box
            component="li"
            key={s.id}
            aria-current={active ? 'step' : undefined}
            sx={{
              px: 1.25,
              py: 0.5,
              borderRadius: 999,
              fontWeight: 700,
              bgcolor: active ? 'primary.main' : 'soft',
              color: active ? 'primary.contrastText' : undefined,
            }}
          >
            {i + 1} · {s.label}
          </Box>
        );
      })}
    </Box>
  );
}
