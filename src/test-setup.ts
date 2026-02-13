import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock translation data for all tests
const mockTranslations = {
  hr: {
    auth: {
      title: 'The Dream Team',
      subtitle: 'feat. Marin',
      question: 'Kako se zove naš tim?',
      placeholder: 'Unesite tajnu frazu...',
      unlockButton: 'Otključaj',
      error: 'Netočna fraza. Pokušajte ponovno.',
    },
    map: {
      zoomIn: 'Uvećaj',
      zoomOut: 'Umanji',
      resetView: 'Resetiraj pogled',
    },
    memory: {
      closeButton: 'Zatvori',
      videoLoadError: 'Nije moguće učitati video. Video datoteka možda nije dostupna ili je u nepodržanom formatu.',
      videoNotSupported: 'Vaš preglednik ne podržava reprodukciju videa.',
      loading: 'Učitavanje...',
    },
    story: {
      playButton: 'Pokreni našu priču',
      stopButton: 'Zaustavi način priče',
      progressLabel: 'Uspomena {current} od {total}',
      memoryOf: 'Uspomena {current} od {total}',
    },
    common: {
      loading: 'Učitavanje...',
      error: 'Greška',
      close: 'Zatvori',
      switchLanguage: 'Promijeni jezik',
    },
    language: {
      croatian: 'Hrvatski',
      english: 'Engleski',
      currentLanguage: 'Trenutni jezik: {language}',
      switchTo: 'Prebaci na {language}',
    },
  },
  en: {
    auth: {
      title: 'The Dream Team',
      subtitle: 'feat. Marin',
      question: 'What is the name of our team?',
      placeholder: 'Enter the secret phrase...',
      unlockButton: 'Unlock',
      error: 'Incorrect phrase. Please try again.',
    },
    map: {
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      resetView: 'Reset View',
    },
    memory: {
      closeButton: 'Close',
      videoLoadError: 'Unable to load video. The video file may be unavailable or in an unsupported format.',
      videoNotSupported: 'Your browser does not support video playback.',
      loading: 'Loading...',
    },
    story: {
      playButton: 'Play Our Story',
      stopButton: 'Stop Story Mode',
      progressLabel: 'Memory {current} of {total}',
      memoryOf: 'Memory {current} of {total}',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      close: 'Close',
      switchLanguage: 'Switch Language',
    },
    language: {
      croatian: 'Croatian',
      english: 'English',
      currentLanguage: 'Current language: {language}',
      switchTo: 'Switch to {language}',
    },
  },
};

// Setup fetch mock for translation files before each test
beforeEach(() => {
  // Clear localStorage before each test to ensure clean state
  localStorage.clear();
  
  globalThis.fetch = vi.fn((url: string | URL | Request) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    if (urlString.includes('/locales/hr.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTranslations.hr),
      } as Response);
    }
    
    if (urlString.includes('/locales/en.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTranslations.en),
      } as Response);
    }
    
    // For other URLs, return a rejected promise
    return Promise.reject(new Error(`Unexpected fetch: ${urlString}`));
  });
});

afterEach(() => {
  // Clean up localStorage after each test
  localStorage.clear();
});
