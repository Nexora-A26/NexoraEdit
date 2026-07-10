import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations } from './translations.js';

const LanguageContext = createContext();

const STORAGE_KEY = 'nexoraedit_language';

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'ar';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.body.style.fontFamily = language === 'ar'
      ? "'Tajawal', 'Noto Sans Arabic', sans-serif"
      : "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
  }, [language]);

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] ?? translations['ar']?.[key] ?? key;
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
