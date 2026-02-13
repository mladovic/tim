import { useI18n } from './I18nContext';


/**
 * Convenience hook for accessing translation functionality in components.
 * 
 * This hook wraps useI18n from I18nContext and provides a cleaner API
 * for components to access translation functionality.
 * 
 * @throws {Error} If used outside of I18nProvider
 * 
 * @returns Translation utilities including:
 *   - t: Translation function that accepts a translation key
 *   - locale: Current active language ('hr' | 'en')
 *   - setLocale: Function to change the active language
 *   - formatDate: Function to format dates according to locale conventions
 *   - isLoading: Boolean indicating if translations are being loaded
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { t, locale, setLocale } = useTranslation();
 *   
 *   return (
 *     <div>
 *       <h1>{t('auth.title')}</h1>
 *       <button onClick={() => setLocale(locale === 'hr' ? 'en' : 'hr')}>
 *         {t('common.switchLanguage')}
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTranslation() {
  const { t, locale, setLocale, formatDate, isLoading } = useI18n();
  
  return {
    t,
    locale,
    setLocale,
    formatDate,
    isLoading,
  };
}
