'use client';

import Box from '@mui/material/Box';
import { useEffect, useRef } from 'react';
import { Logo } from '@/components/brand/Logo';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { ThemeModeToggle } from '@/components/ui/ThemeModeToggle';
import { useMessages } from '@/i18n';
import { CreateStep } from './CreateStep';
import { CreatorProvider, useCreator } from './CreatorProvider';
import { NameStep } from './NameStep';

export function CreatorWizard() {
  return (
    <CreatorProvider>
      <WizardLayout />
    </CreatorProvider>
  );
}

function WizardLayout() {
  const t = useMessages();
  const { state } = useCreator();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
  }, [state.step]);

  const steps = [
    { id: 'create', label: t.steps.create },
    { id: 'name', label: t.steps.name },
    { id: 'products', label: t.steps.products },
  ] as const;

  return (
    <Box
      sx={{
        maxWidth: 1040,
        mx: 'auto',
        pt: 2.5,
        pb: 6,
        pl: 'max(16px, env(safe-area-inset-left, 0px))',
        pr: 'max(16px, env(safe-area-inset-right, 0px))',
      }}
    >
      <Box
        component="header"
        sx={{
          display: 'grid',
          alignItems: 'center',
          gap: 1.5,
          mb: 2.25,
          gridTemplateColumns: { xs: '1fr auto', sm: 'auto 1fr auto' },
          gridTemplateAreas: { xs: '"logo mode" "steps steps"', sm: '"logo steps mode"' },
        }}
      >
        <Box sx={{ gridArea: 'logo' }}>
          <Logo />
        </Box>
        <Box sx={{ gridArea: 'steps', justifySelf: { sm: 'end' } }}>
          <StepIndicator steps={steps} current={state.step} />
        </Box>
        <Box sx={{ gridArea: 'mode' }}>
          <ThemeModeToggle />
        </Box>
      </Box>
      <main>{state.step === 'create' ? <CreateStep /> : <NameStep />}</main>
    </Box>
  );
}
