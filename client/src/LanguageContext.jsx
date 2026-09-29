import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './locales/en.json';
import svTranslations from './locales/sv.json';

const LanguageContext = createContext();

const BUILT_IN_LANGUAGES = {
  en: { name: 'English (Default)', translations: enTranslations },
  sv: { name: 'Svenska (Swedish)', translations: svTranslations }
};

export function LanguageProvider({ children }) {
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem('apex_lang') || 'en';
  });

  const [customLanguages, setCustomLanguages] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_custom_langs');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Store active language
  useEffect(() => {
    localStorage.setItem('apex_lang', currentLang);
  }, [currentLang]);

  // Store custom uploaded languages
  useEffect(() => {
    localStorage.setItem('apex_custom_langs', JSON.stringify(customLanguages));
  }, [customLanguages]);

  // Upload custom language JSON file
  const uploadCustomLanguage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          // Determine language code from filename (e.g., de.json -> de, swedish.json -> swedish)
          const baseName = file.name.replace(/\.json$/i, '').toLowerCase();
          const langCode = baseName || 'custom_' + Date.now();
          const displayName = (content._name || baseName.charAt(0).toUpperCase() + baseName.slice(1)) + ' (Custom)';

          setCustomLanguages(prev => ({
            ...prev,
            [langCode]: {
              name: displayName,
              translations: content
            }
          }));

          setCurrentLang(langCode);
          resolve({ code: langCode, name: displayName });
        } catch (err) {
          reject(new Error('Invalid JSON language file format: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  // Get current active translation bundle
  const activeBundle = customLanguages[currentLang]?.translations 
    || BUILT_IN_LANGUAGES[currentLang]?.translations 
    || enTranslations;

  // t('section.key', params)
  const t = (path, params = {}) => {
    const keys = path.split('.');
    let val = activeBundle;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        // Fallback to English base
        let fallback = enTranslations;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            fallback = null;
            break;
          }
        }
        val = fallback || path;
        break;
      }
    }

    if (typeof val === 'string') {
      let str = val;
      for (const [pKey, pVal] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), pVal);
      }
      return str;
    }

    return typeof val === 'string' ? val : path;
  };

  const availableLanguages = [
    ...Object.entries(BUILT_IN_LANGUAGES).map(([code, l]) => ({ code, name: l.name })),
    ...Object.entries(customLanguages).map(([code, l]) => ({ code, name: l.name }))
  ];

  return (
    <LanguageContext.Provider value={{
      currentLang,
      setCurrentLang,
      availableLanguages,
      uploadCustomLanguage,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
