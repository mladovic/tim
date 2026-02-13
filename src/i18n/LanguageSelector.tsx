import { motion } from 'framer-motion';
import { useTranslation } from './useTranslation';

export interface LanguageSelectorProps {
  className?: string;
}

/**
 * LanguageSelector component allows users to toggle between Croatian and English.
 * 
 * Features:
 * - Displays current language code ("HR" or "EN")
 * - Toggles between languages on click
 * - Fully keyboard accessible (Tab, Enter, Space)
 * - ARIA labels announce current and new language
 * - Positioned as overlay in top-right corner
 * - Semi-transparent background with Framer Motion transitions
 * 
 * @example
 * ```tsx
 * <LanguageSelector />
 * ```
 */
export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useTranslation();

  const handleToggle = () => {
    const newLocale = locale === 'hr' ? 'en' : 'hr';
    setLocale(newLocale);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Get language names for ARIA labels
  const currentLanguageName = locale === 'hr' 
    ? t('language.croatian') 
    : t('language.english');
  
  const targetLanguageName = locale === 'hr' 
    ? t('language.english') 
    : t('language.croatian');

  // Display code
  const displayCode = locale === 'hr' ? 'HR' : 'EN';

  return (
    <motion.button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        fixed top-4 right-4 z-50
        bg-white/80 backdrop-blur-sm
        text-body font-sans font-medium text-sm
        rounded-full px-4 py-2
        min-h-[44px] min-w-[44px]
        shadow-lg
        hover:bg-white/90 hover:shadow-xl
        focus:outline-none focus:ring-2 focus:ring-primary/50
        transition-all duration-200
        ${className}
      `}
      aria-label={t('language.currentLanguage').replace('{language}', currentLanguageName) + '. ' + t('language.switchTo').replace('{language}', targetLanguageName)}
      role="button"
      tabIndex={0}
    >
      {displayCode}
    </motion.button>
  );
}
