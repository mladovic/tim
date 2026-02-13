import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthGate } from './AuthGate';
import { AuthProvider } from './AuthContext';
import { I18nProvider } from '../i18n/I18nContext';

// Mock translations
const mockTranslations = {
  hr: {
    auth: {
      title: 'The Dream Team',
      subtitle: 'feat. Marin',
      question: 'Kako se zove naš tim?',
      placeholder: 'Unesite tajnu frazu...',
      unlockButton: 'Otključaj',
      error: 'Netočna fraza. Pokušajte ponovno.'
    },
    language: {
      croatian: 'Hrvatski',
      english: 'Engleski',
      currentLanguage: 'Trenutni jezik: {language}',
      switchTo: 'Prebaci na {language}'
    }
  },
  en: {
    auth: {
      title: 'The Dream Team',
      subtitle: 'feat. Marin',
      question: 'What is the name of our team?',
      placeholder: 'Enter the secret phrase...',
      unlockButton: 'Unlock',
      error: 'Incorrect phrase. Please try again.'
    },
    language: {
      croatian: 'Croatian',
      english: 'English',
      currentLanguage: 'Current language: {language}',
      switchTo: 'Switch to {language}'
    }
  }
};

function renderWithAuth() {
  return render(
    <I18nProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </I18nProvider>
  );
}

describe('AuthGate', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock fetch for translation files
    global.fetch = vi.fn((url: string) => {
      const locale = url.includes('hr.json') ? 'hr' : 'en';
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTranslations[locale])
      } as Response);
    });
  });

  it('displays the branded heading with "Tea" highlighted in the text', async () => {
    renderWithAuth();
    const heading = await screen.findByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toBe('The Dream Team');
  });

  it('displays "feat. Marin" subtitle', async () => {
    renderWithAuth();
    expect(await screen.findByText('feat. Marin')).toBeInTheDocument();
  });

  it('displays the prompt text "What is the name of our team?"', async () => {
    renderWithAuth();
    expect(await screen.findByText('Kako se zove naš tim?')).toBeInTheDocument();
  });

  it('renders a text input field and a submit button', async () => {
    renderWithAuth();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /otključaj/i })).toBeInTheDocument();
  });

  it('calls validatePhrase on form submission via button click', async () => {
    renderWithAuth();
    const input = screen.getByRole('textbox');
    const button = await screen.findByRole('button', { name: /otključaj/i });
    await userEvent.type(input, 'wrong answer');
    await userEvent.click(button);
    expect(await screen.findByText(/netočna fraza/i)).toBeInTheDocument();
  });

  it('calls validatePhrase when Enter key is pressed in the input', async () => {
    renderWithAuth();
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'wrong answer{enter}');
    expect(await screen.findByText(/netočna fraza/i)).toBeInTheDocument();
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
