'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always start with 'en' to match server-side render
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Load saved language preference after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('where2meet-language');
    if (stored === 'en' || stored === 'zh') {
      setLanguage(stored);
    }
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
