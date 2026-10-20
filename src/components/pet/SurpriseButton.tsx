'use client';

import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { brand, radius } from '@/theme/tokens';

export interface SurpriseButtonProps {
  title: string;
  subtitle: string;
  onClick: () => void;
}

/** Botão grande do dado: sorteia o avatar inteiro. */
export function SurpriseButton({ title, subtitle, onClick }: SurpriseButtonProps) {
  return (
    <ButtonBase
      type="button"
      onClick={onClick}
      focusRipple
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.75,
        width: '100%',
        textAlign: 'left',
        bgcolor: 'pop.main',
        color: brand.ink,
        borderRadius: `${radius.lg}px`,
        px: 2,
        py: 1.5,
        '&:hover': { filter: 'brightness(1.05)' },
        '&.Mui-focusVisible': {
          outline: '3px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      <span aria-hidden="true" style={{ fontSize: '1.8rem', lineHeight: 1 }}>
        🎲
      </span>
      <span>
        <Typography component="b" variant="h3" sx={{ display: 'block', fontSize: '1.1rem' }}>
          {title}
        </Typography>
        <Typography component="small" variant="body2" sx={{ display: 'block', opacity: 0.8 }}>
          {subtitle}
        </Typography>
      </span>
    </ButtonBase>
  );
}
