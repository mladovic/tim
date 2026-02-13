import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSelector } from './LanguageSelector';
import { I18nProvider } from './I18nContext';

describe('LanguageSelector', () => {
  it('renders with current language code', async () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    // Wait for translations to load
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('HR');
    });
  });

  it('has appropriate ARIA label', async () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button.getAttribute('aria-label')).toContain('Hrvatski');
    });
  });

  it('is keyboard accessible with Tab', async () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  it('toggles language on click', async () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('HR');
    });

    const button = screen.getByRole('button');
    
    // Click to toggle
    fireEvent.click(button);

    // Wait for language to change
    await waitFor(() => {
      expect(button.textContent).toBe('EN');
    });
  });

  it('toggles language on Enter key', async () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('HR');
    });

    const button = screen.getByRole('button');

    // Press Enter
    fireEvent.keyDown(button, { key: 'Enter' });

    // Wait for language to change
    await waitFor(() => {
      expect(button.textContent).toBe('EN');
    });
  });

  it('toggles language on Space key', async () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('HR');
    });

    const button = screen.getByRole('button');

    // Press Space
    fireEvent.keyDown(button, { key: ' ' });

    // Wait for language to change
    await waitFor(() => {
      expect(button.textContent).toBe('EN');
    });
  });

  it('updates ARIA label when language changes', async () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      const initialLabel = button.getAttribute('aria-label');
      expect(initialLabel).toContain('Hrvatski');
    });

    const button = screen.getByRole('button');
    const initialLabel = button.getAttribute('aria-label');

    // Toggle language
    fireEvent.click(button);

    // Wait for ARIA label to update
    await waitFor(() => {
      const newLabel = button.getAttribute('aria-label');
      expect(newLabel).toContain('English');
      expect(newLabel).not.toBe(initialLabel);
    });
  });

  it('accepts custom className prop', async () => {
    render(
      <I18nProvider>
        <LanguageSelector className="custom-class" />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  it('has proper tabIndex for keyboard navigation', async () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });
  });
});
