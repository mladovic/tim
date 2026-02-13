import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import { LanguageSelector } from '../i18n/LanguageSelector';

export function AuthGate() {
  const { validatePhrase, error } = useAuth();
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validatePhrase(input);
  };

  return (
    <div className="auth-gate-bg min-h-dvh flex items-center justify-center p-6">
      <LanguageSelector />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6 text-center max-w-sm w-full"
      >
        <h1 className="font-display text-4xl sm:text-5xl leading-tight">
          {t('auth.title')}
        </h1>
        <p className="font-script text-xl text-body/70">{t('auth.subtitle')}</p>

        <p className="text-body/80 text-lg">{t('auth.question')}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-primary/30 bg-white/80 backdrop-blur-sm text-body text-center font-sans text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-body/40"
            placeholder={t('auth.placeholder')}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-white rounded-xl font-sans font-medium text-lg hover:bg-primary/90 transition-colors"
          >
            {t('auth.unlockButton')}
          </button>
        </form>

        {error && (
          <p role="alert" className="text-primary font-medium text-sm">
            {t('auth.error')}
          </p>
        )}
      </motion.div>
    </div>
  );
}
