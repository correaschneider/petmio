import Typography from '@mui/material/Typography';
import { useMessages } from '@/i18n';

export function Logo() {
  const t = useMessages();
  return (
    <Typography
      component="span"
      sx={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '1.6rem',
        letterSpacing: '-.01em',
      }}
    >
      {t.brand.first}{' '}
      <Typography component="span" sx={{ font: 'inherit', color: 'primary.main' }}>
        {t.brand.second}
      </Typography>
    </Typography>
  );
}
