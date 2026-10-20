import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function NotFound() {
  return (
    <Stack
      sx={{ minHeight: '100dvh', alignItems: 'center', justifyContent: 'center', gap: 2, p: 2 }}
    >
      <Typography variant="h2" component="h1">
        Pagina non trovata
      </Typography>
      <Button variant="contained" href="/">
        Torna a Pet Mio
      </Button>
    </Stack>
  );
}
