'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations, detectBrowserLanguage } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Initialize language immediately to avoid hydration mismatch
function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en';

  // Check localStorage first (user preference)
  const stored = localStorage.getItem('where2meet-language');
  if (stored === 'en' || stored === 'zh') {
    return stored;
  }

  // Default to English (not auto-detect)
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Save language preference to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('where2meet-language', language);
    }
  }, [language, mounted]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
