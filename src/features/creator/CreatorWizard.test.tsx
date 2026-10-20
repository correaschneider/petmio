import { ThemeProvider } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { theme } from '@/theme/theme';
import { CreatorWizard } from './CreatorWizard';

vi.mock('@/theme/fonts', () => ({
  displayFont: { style: { fontFamily: 'Fredoka' }, variable: '' },
  bodyFont: { style: { fontFamily: 'Nunito' }, variable: '' },
}));

function setup() {
  window.scrollTo = vi.fn();
  return render(
    <ThemeProvider theme={theme}>
      <CreatorWizard />
    </ThemeProvider>,
  );
}

describe('<CreatorWizard>', () => {
  it('trocar para gatto atualiza as raças disponíveis', async () => {
    const user = userEvent.setup();
    setup();
    const razza = screen.getByRole('group', { name: /Razza/ });
    expect(within(razza).getByRole('button', { name: 'Labrador' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Gatto' }));
    expect(within(razza).getByRole('button', { name: 'Europeo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(razza).queryByRole('button', { name: 'Labrador' })).not.toBeInTheDocument();
  });

  it('fluxo de nome: sugestão habilita confirmar e mostra o resultado', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /Avanti/ }));

    const confirm = screen.getByRole('button', { name: 'Conferma il nome' });
    expect(confirm).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Luna' }));
    expect(screen.getByLabelText('Nome')).toHaveValue('Luna');
    await user.click(confirm);

    expect(screen.getByText('Pronto per la stampa')).toBeInTheDocument();
    expect(screen.getByText('Cane Labrador · pelo dorato · occhi marrone')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crea immagine PNG' })).toBeEnabled();
  });
});
