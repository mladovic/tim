import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock the translation files
beforeEach(() => {
  globalThis.fetch = vi.fn((url: string | URL | Request) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    if (urlString.includes('/locales/hr.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          auth: {
            title: 'Dobrodošli',
            passphraseLabel: 'Unesite lozinku',
          },
        }),
      } as Response);
    }
    return Promise.reject(new Error('Not found'));
  });
});

describe('App with I18nProvider', () => {
  it('renders without crashing with I18nProvider wrapper', async () => {
    render(<App />);
    
    // Wait for translations to load
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/locales/hr.json');
    });
  });

  it('wraps AuthGate with I18nProvider context', async () => {
    render(<App />);
    
    // Wait for translations to load and auth gate to render
    await waitFor(() => {
      // The component should render without throwing context errors
      // Check for the auth form which is part of AuthGate
      expect(screen.getByRole('button', { name: /unlock/i })).toBeInTheDocument();
    });
  });
});
