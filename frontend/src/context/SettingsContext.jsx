import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

const THEMES = {
  dark:  { label: 'Sombre',  bg: '#0A0E1A', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.87)', textMuted: 'rgba(255,255,255,0.4)', cardBg: 'rgba(255,255,255,0.03)' },
  light: { label: 'Clair',   bg: '#F0F2F8', surface: 'rgba(0,0,0,0.03)',        border: 'rgba(0,0,0,0.08)',       text: 'rgba(0,0,0,0.87)',         textMuted: 'rgba(0,0,0,0.45)',    cardBg: '#ffffff' },
};

const LANGUAGES = {
  fr: { label: 'Français', dir: 'ltr' },
  en: { label: 'English',  dir: 'ltr' },
  ar: { label: 'العربية',  dir: 'rtl' },
};

export const T = {
  fr: {
    suggestions: 'Suggestions',
    dashboard:   'Dashboard',
    analysis:    'Analyse Produit',
    stores:      'Multi-Sources',
    stock:       'Stock IA',
    reports:     'Rapports',
    settings:    'Paramètres',
    reduce:      'Réduire',
    theme:       'Thème',
    language:    'Langue',
    country:     'Pays cible',
    save:        'Enregistrer',
    personalization: 'Personnalisation',
    appearance:  'Apparence',
    search:      'Rechercher…',
  },
  en: {
    suggestions: 'Suggestions',
    dashboard:   'Dashboard',
    analysis:    'Product Analysis',
    stores:      'Multi-Sources',
    stock:       'AI Stock',
    reports:     'Reports',
    settings:    'Settings',
    reduce:      'Collapse',
    theme:       'Theme',
    language:    'Language',
    country:     'Target country',
    save:        'Save',
    personalization: 'Personalization',
    appearance:  'Appearance',
    search:      'Search…',
  },
  ar: {
    suggestions: 'اقتراحات',
    dashboard:   'لوحة القيادة',
    analysis:    'تحليل المنتج',
    stores:      'مصادر متعددة',
    stock:       'مخزون AI',
    reports:     'التقارير',
    settings:    'الإعدادات',
    reduce:      'طي',
    theme:       'المظهر',
    language:    'اللغة',
    country:     'البلد المستهدف',
    save:        'حفظ',
    personalization: 'التخصيص',
    appearance:  'المظهر',
    search:      'بحث…',
  },
};

export function SettingsProvider({ children }) {
  const [theme,    setTheme]    = useState(() => localStorage.getItem('theme')    ?? 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') ?? 'fr');
  const [country,  setCountry]  = useState(() => localStorage.getItem('country')  ?? 'ma');

  useEffect(() => { localStorage.setItem('theme',    theme);    applyTheme(theme);    }, [theme]);
  useEffect(() => { localStorage.setItem('language', language); applyLanguage(language); }, [language]);
  useEffect(() => { localStorage.setItem('country',  country);  }, [country]);

  const t = T[language] ?? T.fr;

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, country, setCountry, t, THEMES, LANGUAGES }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

function applyTheme(theme) {
  const vars = THEMES[theme] ?? THEMES.dark;
  const root = document.documentElement;
  root.style.setProperty('--bg',         vars.bg);
  root.style.setProperty('--surface',    vars.surface);
  root.style.setProperty('--border',     vars.border);
  root.style.setProperty('--text',       vars.text);
  root.style.setProperty('--text-muted', vars.textMuted);
  root.style.setProperty('--card-bg',    vars.cardBg);
  root.setAttribute('data-theme', theme);
}

function applyLanguage(lang) {
  const cfg = LANGUAGES[lang] ?? LANGUAGES.fr;
  document.documentElement.setAttribute('dir', cfg.dir);
  document.documentElement.setAttribute('lang', lang);
}
