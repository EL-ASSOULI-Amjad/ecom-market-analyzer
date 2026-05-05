/**
 * Query expansion — enriches a raw user query before handing it to scrapers.
 *
 * Goals:
 *   1. Translate common French/Arabic terms to English so AliExpress/Temu find them
 *   2. Add category-specific modifiers that improve result relevance
 *   3. Return a ranked list: [primary, ...alternatives] (deduplicated, max 4)
 */

// French → English translations for the most common e-commerce queries in Morocco/France
const FR_EN = {
  'téléphone':         'smartphone',
  'telephone':         'smartphone',
  'portable':          'laptop',
  'ordinateur portable':'laptop',
  'ordinateur':        'computer',
  'télévision':        'television',
  'télé':              'tv',
  'vêtement':          'clothing',
  'vetement':          'clothing',
  'chaussure':         'shoes',
  'montre':            'watch',
  'sac':               'bag',
  'écouteur':          'earphone',
  'casque':            'headphone',
  'enceinte':          'bluetooth speaker',
  'aspirateur':        'vacuum cleaner',
  'réfrigérateur':     'refrigerator',
  'frigo':             'refrigerator',
  'climatiseur':       'air conditioner',
  'clim':              'air conditioner',
  'machine à laver':   'washing machine',
  'four':              'oven',
  'micro-onde':        'microwave',
  'manette':           'game controller',
  'caméra':            'camera',
  'appareil photo':    'camera',
  'imprimante':        'printer',
  'tablette':          'tablet',
  'carte graphique':   'graphics card',
  'processeur':        'processor',
  'disque dur':        'hard drive',
  'clé usb':           'usb flash drive',
  'prise':             'power adapter',
  'câble':             'cable',
  'chargeur':          'charger',
  'coque':             'phone case',
  'protection':        'protective case',
  'verre trempé':      'tempered glass screen protector',
  'powerbank':         'power bank',
  'batterie externe':  'power bank',
  'lampe':             'lamp',
  'luminaire':         'light fixture',
  'coussin':           'cushion',
  'housse':            'cover',
  'tapis':             'rug',
  'rideau':            'curtain',
  'miroir':            'mirror',
  'jouet':             'toy',
  'vélo':              'bicycle',
  'trottinette':       'electric scooter',
  'drone':             'drone',
  'montre connectée':  'smartwatch',
  'bracelet connecté': 'fitness tracker',
};

// Arabic → English (transliteration-style common search terms)
const AR_EN = {
  'هاتف':              'smartphone',
  'لابتوب':            'laptop',
  'تلفاز':             'television',
  'مكيف':              'air conditioner',
  'ثلاجة':             'refrigerator',
  'غسالة':             'washing machine',
  'سماعة':             'headphone',
  'ساعة':              'watch',
  'كاميرا':            'camera',
  'شاحن':              'charger',
  'كفر':               'phone case',
  'حذاء':              'shoes',
  'حقيبة':             'bag',
};

// Category-specific keyword modifiers that improve search quality
const CATEGORY_BOOST = {
  smartphone:   ['best seller', '4G 5G'],
  laptop:       ['gaming', 'ultrabook'],
  headphone:    ['wireless bluetooth'],
  earphone:     ['TWS wireless'],
  watch:        ['smart digital'],
  shoes:        ['fashion sneakers'],
  bag:          ['fashion handbag'],
  camera:       ['digital 4K'],
  printer:      ['laser inkjet'],
  tablet:       ['android 10 inch'],
  clothing:     ['fashion unisex'],
};

function normalize(q) { return q.toLowerCase().trim(); }

/**
 * Returns an array of search queries.
 * First element = best query for wholesale sources (AliExpress, Temu, Alibaba).
 * Remaining = alternatives for diversity.
 */
export function expandQuery(rawQuery, { forWholesale = false } = {}) {
  const q = normalize(rawQuery);
  const queries = [rawQuery]; // original always first

  // Step 1 — translate FR/AR to EN for wholesale (AliExpress/Temu work best in English)
  if (forWholesale) {
    for (const [fr, en] of Object.entries(FR_EN)) {
      if (q.includes(fr)) {
        const translated = q.replace(fr, en);
        if (!queries.includes(translated)) queries.push(translated);
      }
    }
    for (const [ar, en] of Object.entries(AR_EN)) {
      if (q.includes(ar)) {
        if (!queries.includes(en)) queries.push(en);
      }
    }
  }

  // Step 2 — add a boosted variant (primary query + most relevant modifier)
  const primaryEn = queries[queries.length > 1 ? 1 : 0];
  for (const [cat, mods] of Object.entries(CATEGORY_BOOST)) {
    if (primaryEn.toLowerCase().includes(cat)) {
      const boosted = `${primaryEn} ${mods[0]}`.trim();
      if (!queries.includes(boosted)) queries.push(boosted);
      break;
    }
  }

  // Cap at 3 to avoid hammering scrapers
  return [...new Set(queries)].slice(0, 3);
}

/**
 * Given a raw query, return the single best query string to use on a given source.
 * - 'aliexpress' / 'temu' / 'alibaba' → English preferred
 * - 'jumia' / 'avito' / others        → original (local language)
 */
export function bestQueryFor(rawQuery, source) {
  const wholesale = ['aliexpress', 'temu', 'alibaba', 'dhgate'];
  if (wholesale.includes(source)) {
    return expandQuery(rawQuery, { forWholesale: true })[0] ?? rawQuery;
  }
  return rawQuery;
}
