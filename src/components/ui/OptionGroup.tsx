import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

export interface OptionGroupProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

/** `<fieldset>` + `<legend>` acessível para um grupo de escolhas. */
export function OptionGroup({ label, hint, children }: OptionGroupProps) {
  return (
    <Box component="fieldset" sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}>
      <Typography component="legend" variant="subtitle1" sx={{ mb: 1, p: 0 }}>
        {label}
        {hint && (
          <Typography
            component="small"
            variant="body2"
            sx={{ ml: 0.75, color: 'text.secondary', fontSize: '.8rem' }}
          >
            {hint}
          </Typography>
        )}
      </Typography>
      {children}
    </Box>
  );
}
