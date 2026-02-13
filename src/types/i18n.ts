/**
 * Core i18n type definitions
 */

/**
 * Supported locales
 */
export type Locale = 'hr' | 'en';

/**
 * Translation map structure - supports nested objects
 */
export interface TranslationMap {
  [key: string]: string | TranslationMap;
}

/**
 * I18n context state interface
 */
export interface I18nContextState {
  /** Current active language */
  locale: Locale;
  
  /** Loaded translations for active locale */
  translations: TranslationMap;
  
  /** Translation loading state */
  isLoading: boolean;
  
  /** Error message if loading fails */
  error: string | null;
  
  /** Function to change language */
  setLocale: (locale: Locale) => void;
  
  /** Translation function - returns translated text or key as fallback */
  t: (key: string) => string;
  
  /** Locale-aware date formatter */
  formatDate: (date: Date) => string;
}
