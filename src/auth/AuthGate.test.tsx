import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthGate } from './AuthGate';
import { AuthProvider } from './AuthContext';

function renderWithAuth() {
  return render(
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

describe('AuthGate', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('displays the branded heading with "Tea" highlighted in the text', () => {
    renderWithAuth();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain('The Dream');
    expect(heading.textContent).toContain('Tea');
    expect(heading.textContent).toContain('m');
  });

  it('displays "feat. Marin" subtitle', () => {
    renderWithAuth();
    expect(screen.getByText('feat. Marin')).toBeInTheDocument();
  });

  it('displays the prompt text "What is the name of our team?"', () => {
    renderWithAuth();
    expect(screen.getByText('What is the name of our team?')).toBeInTheDocument();
  });

  it('renders a text input field and a submit button', () => {
    renderWithAuth();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit|enter|unlock/i })).toBeInTheDocument();
  });

  it('calls validatePhrase on form submission via button click', async () => {
    renderWithAuth();
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button', { name: /submit|enter|unlock/i });
    await userEvent.type(input, 'wrong answer');
    await userEvent.click(button);
    expect(screen.getByText(/not quite right/i)).toBeInTheDocument();
  });

  it('calls validatePhrase when Enter key is pressed in the input', async () => {
    renderWithAuth();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'wrong answer{enter}');
    expect(screen.getByText(/not quite right/i)).toBeInTheDocument();
  });

  it('displays error message inline when error state is non-null', async () => {
    renderWithAuth();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'wrong{enter}');
    const errorMsg = screen.getByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg.textContent).toBeTruthy();
  });

  it('does not display error message initially', () => {
    renderWithAuth();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
