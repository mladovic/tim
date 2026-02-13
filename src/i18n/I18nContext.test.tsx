import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { I18nProvider, useI18n } from './I18nContext';
import type { ReactNode } from 'react';

// Mock fetch for translation files
const mockTranslations = {
  hr: {
    auth: {
      title: 'The Dream Team',
      error: 'Netočna fraza. Pokušajte ponovno.'
    },
    common: {
      loading: 'Učitavanje...'
    }
  },
  en: {
    auth: {
      title: 'The Dream Team',
      error: 'Incorrect phrase. Please try again.'
    },
    common: {
      loading: 'Loading...'
    }
  }
};

function wrapper({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

describe('I18nContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Mock fetch
    globalThis.fetch = vi.fn((url: string | URL | Request) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      const locale = urlString.includes('hr.json') ? 'hr' : 'en';
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTranslations[locale])
      } as Response);
    });
  });

  it('initializes with Croatian as default language', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    expect(result.current.locale).toBe('hr');
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('loads Croatian translations on mount', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.t('auth.title')).toBe('The Dream Team');
    expect(result.current.t('auth.error')).toBe('Netočna fraza. Pokušajte ponovno.');
  });

  it('switches to English and loads English translations', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Switch to English
    result.current.setLocale('en');
    
    await waitFor(() => expect(result.current.locale).toBe('en'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.t('auth.error')).toBe('Incorrect phrase. Please try again.');
  });

  it('saves locale preference to localStorage', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    result.current.setLocale('en');
    
    await waitFor(() => {
      expect(localStorage.getItem('memoryMapLanguage')).toBe('en');
    });
  });

  it('restores locale preference from localStorage', async () => {
    localStorage.setItem('memoryMapLanguage', 'en');
    
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    expect(result.current.locale).toBe('en');
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('handles invalid localStorage value gracefully', async () => {
    localStorage.setItem('memoryMapLanguage', 'invalid');
    
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    expect(result.current.locale).toBe('hr');
    expect(localStorage.getItem('memoryMapLanguage')).toBeNull();
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('returns key as fallback for missing translation', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('formats dates according to Croatian locale (DD.MM.YYYY)', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    const date = new Date(2023, 11, 25); // December 25, 2023
    expect(result.current.formatDate(date)).toBe('25.12.2023');
  });

  it('formats dates according to English locale (MM/DD/YYYY)', async () => {
    localStorage.setItem('memoryMapLanguage', 'en');
    
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    const date = new Date(2023, 11, 25); // December 25, 2023
    expect(result.current.formatDate(date)).toBe('12/25/2023');
  });

  it('handles translation loading errors gracefully', async () => {
    globalThis.fetch = vi.fn(() => 
      Promise.resolve({
        ok: false,
        status: 404
      } as Response)
    );
    
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    expect(result.current.error).toBeTruthy();
    expect(result.current.error).toContain('HTTP 404');
  });

  it('caches translations to avoid redundant fetches', async () => {
    const { result } = renderHook(() => useI18n(), { wrapper });
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    const fetchCallCount = (globalThis.fetch as any).mock.calls.length;
    
    // Switch to English
    result.current.setLocale('en');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Switch back to Croatian
    result.current.setLocale('hr');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    
    // Should have only 2 fetch calls (hr and en), not 3
    expect((globalThis.fetch as any).mock.calls.length).toBe(fetchCallCount + 1);
  });

  it('throws error when useI18n is used outside provider', () => {
    expect(() => {
      renderHook(() => useI18n());
    }).toThrow('useI18n must be used within an I18nProvider');
  });
});
