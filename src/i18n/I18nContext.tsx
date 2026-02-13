import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Locale, TranslationMap, I18nContextState } from '../types/i18n';


const I18N_STORAGE_KEY = 'memoryMapLanguage';
const DEFAULT_LOCALE: Locale = 'hr';

const I18nContext = createContext<I18nContextState | null>(null);

/**
 * Read saved locale from localStorage
 */
function readSavedLocale(): Locale {
  try {
    const saved = localStorage.getItem(I18N_STORAGE_KEY);
    if (saved === 'hr' || saved === 'en') {
      return saved;
    }
    // Invalid value - clear it
    if (saved !== null) {
      console.warn(`Invalid locale in storage: ${saved}, defaulting to '${DEFAULT_LOCALE}'`);
      localStorage.removeItem(I18N_STORAGE_KEY);
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_LOCALE;
}

/**
 * Save locale to localStorage
 */
function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(I18N_STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable - session-only preference
  }
}

/**
 * Get nested value from translation map using dot notation
 */
function getNestedValue(obj: TranslationMap, path: string): string | undefined {
  const keys = path.split('.');
  let current: string | TranslationMap = obj;
  
  for (const key of keys) {
    if (typeof current === 'object' && current !== null && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

/**
 * Format date according to locale conventions
 */
function formatDateForLocale(date: Date, locale: Locale): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return locale === 'hr' 
    ? `${day}.${month}.${year}`  // Croatian: DD.MM.YYYY
    : `${month}/${day}/${year}`;  // English: MM/DD/YYYY
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readSavedLocale());
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [translationCache, setTranslationCache] = useState<Map<Locale, TranslationMap>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load translations for active locale
  useEffect(() => {
    let isCancelled = false;

    async function loadTranslations() {
      // Check cache first
      const cached = translationCache.get(locale);
      if (cached) {
        setTranslations(cached);
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/locales/${locale}.json`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to load translations`);
        }
        
        const data = await response.json();
        
        // Validate JSON structure
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid translation file structure');
        }

        if (!isCancelled) {
          setTranslations(data);
          // Cache the loaded translations
          setTranslationCache(prev => new Map(prev).set(locale, data));
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load translations';
          console.error(`Failed to load translations for ${locale}:`, err);
          setError(errorMessage);
          setIsLoading(false);
          // Keep previous translations if available
        }
      }
    }

    loadTranslations();

    return () => {
      isCancelled = true;
    };
  }, [locale, translationCache]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocale(newLocale);
  }, []);

  const t = useCallback((key: string): string => {
    const value = getNestedValue(translations, key);
    if (value === undefined) {
      if (import.meta.env.DEV) {
        console.warn(`Missing translation key: ${key}`);
      }
      return key;
    }
    return value;
  }, [translations]);

  const formatDate = useCallback((date: Date): string => {
    return formatDateForLocale(date, locale);
  }, [locale]);

  return (
    <I18nContext.Provider 
      value={{ 
        locale, 
        translations, 
        isLoading, 
        error, 
        setLocale, 
        t, 
        formatDate 
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextState {
  const context = useContext(I18nContext);
  if (context === null) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
