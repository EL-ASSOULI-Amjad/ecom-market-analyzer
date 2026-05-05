// Supported markets — each entry defines display info + which scrapers are active.
// Only list scrapers that are known to work; the scraper map in scraperService will
// silently skip any unknown source so it's safe to add new ones here gradually.
// temu/alibaba: headless Chrome (puppeteer-extra-stealth) is implemented but both
// sites block from MA IPs — Temu forces login, Alibaba serves a server-side CAPTCHA.
// Would need residential US/EU proxies or a CAPTCHA-solving service to unlock.

export const COUNTRIES = {
  ma: {
    label:    'Maroc',
    flag:     '🇲🇦',
    currency: 'MAD',
    symbol:   'Dh',
    locale:   'fr-MA',
    sources:  ['jumia', 'avito'],
  },
  dz: {
    label:    'Algérie',
    flag:     '🇩🇿',
    currency: 'DZD',
    symbol:   'DA',
    locale:   'fr-DZ',
    sources:  ['jumia'],
  },
  tn: {
    label:    'Tunisie',
    flag:     '🇹🇳',
    currency: 'TND',
    symbol:   'DT',
    locale:   'fr-TN',
    sources:  ['jumia'],
  },
  fr: {
    label:    'France',
    flag:     '🇫🇷',
    currency: 'EUR',
    symbol:   '€',
    locale:   'fr-FR',
    sources:  ['amazon'],
  },
  de: {
    label:    'Allemagne',
    flag:     '🇩🇪',
    currency: 'EUR',
    symbol:   '€',
    locale:   'de-DE',
    sources:  ['amazon'],
  },
  gb: {
    label:    'Royaume-Uni',
    flag:     '🇬🇧',
    currency: 'GBP',
    symbol:   '£',
    locale:   'en-GB',
    sources:  ['amazon'],
  },
  us: {
    label:    'États-Unis',
    flag:     '🇺🇸',
    currency: 'USD',
    symbol:   '$',
    locale:   'en-US',
    sources:  ['amazon'],
  },
  sa: {
    label:    'Arabie Saoudite',
    flag:     '🇸🇦',
    currency: 'SAR',
    symbol:   'ر.س',
    locale:   'ar-SA',
    sources:  ['amazon'],
  },
  ae: {
    label:    'Émirats Arabes',
    flag:     '🇦🇪',
    currency: 'AED',
    symbol:   'د.إ',
    locale:   'ar-AE',
    sources:  ['amazon'],
  },
  eg: {
    label:    'Égypte',
    flag:     '🇪🇬',
    currency: 'EGP',
    symbol:   'E£',
    locale:   'ar-EG',
    sources:  ['jumia'],
  },
};

export const AMAZON_DOMAINS = {
  fr: 'www.amazon.fr',
  de: 'www.amazon.de',
  gb: 'www.amazon.co.uk',
  us: 'www.amazon.com',
  sa: 'www.amazon.sa',
  ae: 'www.amazon.ae',
};

export const SOURCE_LABELS = {
  jumia:      { label: 'Jumia',       flag: '🛒', currency: 'local' },
  avito:      { label: 'Avito',       flag: '📌', currency: 'local' },
  hmall:      { label: 'Hmall',       flag: '🏪', currency: 'local' },
  marjane:    { label: 'Marjane',     flag: '🏬', currency: 'local' },
  amazon:     { label: 'Amazon',      flag: '📦', currency: 'local' },
  aliexpress: { label: 'AliExpress',  flag: '🛍️', currency: 'USD'  },
  dhgate:     { label: 'DHgate',      flag: '🏭', currency: 'USD'   },
  temu:       { label: 'Temu',        flag: '🎁', currency: 'USD'   },
  alibaba:    { label: 'Alibaba',     flag: '🔶', currency: 'USD'   },
};
