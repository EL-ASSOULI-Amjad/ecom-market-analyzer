import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const BASE = 'https://www.avito.ma';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-MA,fr;q=0.9,en;q=0.7',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
};

const CATEGORY_MAP = {
  telephone: 'telephones_et_tablettes', smartphone: 'telephones_et_tablettes',
  iphone: 'telephones_et_tablettes', samsung: 'telephones_et_tablettes',
  laptop: 'informatique', ordinateur: 'informatique', pc: 'informatique',
  television: 'electronique', tv: 'electronique', ecouteur: 'electronique',
  casque: 'electronique', enceinte: 'electronique',
  vetement: 'mode_et_beaute', vêtement: 'mode_et_beaute',
  chaussure: 'mode_et_beaute', sac: 'mode_et_beaute',
  sport: 'sport_et_loisirs', velo: 'sport_et_loisirs',
  meuble: 'maison_et_jardin', electromenager: 'electromenager',
};

function guessCategory(query) {
  const q = query.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_MAP)) if (q.includes(k)) return v;
  return 'maroc';
}

function pickListings(nextData) {
  // Avito has changed their Next.js data structure several times — try all known paths
  const pp = nextData?.props?.pageProps ?? {};
  return (
    // Current structure (2024-2025): componentProps.ads.ads
    pp.componentProps?.ads?.ads ??
    // Legacy paths kept as fallback
    pp.searchResult?.ads ??
    pp.searchResult?.results ??
    pp.initialState?.search?.ads ??
    pp.initialReduxState?.search?.ads ??
    pp.initialReduxState?.search?.data?.ads ??
    pp.ads ??
    pp.listings?.data ??
    pp.data?.ads ??
    pp.results ??
    []
  );
}

function mapListing(item) {
  // Avito changed price from a plain number to {value, currency}
  let priceRaw;
  if (item.price !== null && typeof item.price === 'object') {
    priceRaw = item.price.value ?? item.price.amount ?? item.price.price;
  } else {
    priceRaw = item.price ?? item.priceLabel ?? item.formattedPrice;
  }
  const price = priceRaw != null ? parsePrice(String(priceRaw)) : null;
  const href = item.href ?? item.url ?? item.path ?? item.link ?? '';
  const rawImg = item.defaultImage ?? item.images?.[0];
  const imageUrl = typeof rawImg === 'string' ? rawImg : (rawImg?.url ?? item.thumbnail ?? item.image ?? item.imageUrl ?? null);
  return {
    title:       item.subject ?? item.title ?? item.name ?? null,
    price,
    source:      'avito',
    url:         href.startsWith('http') ? href : `${BASE}${href}`,
    imageUrl,
    category:    item.category?.name ?? null,
    discountPct: 0,
  };
}

export async function scrapeAvito(query) {
  const category = guessCategory(query);
  // Try the category-scoped URL first, then the global search
  const urls = [
    `${BASE}/fr/${category}?query=${encodeURIComponent(query)}`,
    `${BASE}/fr/maroc?query=${encodeURIComponent(query)}`,
    `${BASE}/fr/maroc/${category}?query=${encodeURIComponent(query)}`,
  ];

  for (const url of urls) {
    let html;
    try {
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 22_000 });
      html = data;
    } catch (err) {
      console.warn(`[avito] fetch failed (${url}): ${err.message}`);
      continue;
    }

    const $ = cheerio.load(html);

    // ── Strategy 1: __NEXT_DATA__ (most reliable when Avito serves SSR) ────────
    const nextRaw = $('#__NEXT_DATA__').html();
    if (nextRaw) {
      try {
        const nextData = JSON.parse(nextRaw);
        const listings = pickListings(nextData);
        if (listings.length > 0) {
          const products = listings.map(mapListing).filter(p => p.title && p.price);
          if (products.length > 0) {
            console.log(`[avito] __NEXT_DATA__ → ${products.length} results`);
            return products;
          }
        }
      } catch { /* fall through */ }
    }

    // ── Strategy 2: window.__STORE__ or window.__INITIAL_STATE__ ────────────────
    for (const varName of ['window.__STORE__', 'window.__INITIAL_STATE__', 'window.__data__']) {
      const scriptTags = $('script').filter((_, el) => $(el).html()?.includes(varName.split('.')[1]));
      for (let i = 0; i < scriptTags.length; i++) {
        const src = $(scriptTags[i]).html() ?? '';
        const match = src.match(/"ads"\s*:\s*(\[[\s\S]*?\])\s*,\s*"(?:page|total|meta)"/);
        if (match) {
          try {
            const ads = JSON.parse(match[1]);
            if (ads.length > 0) {
              const products = ads.map(mapListing).filter(p => p.title && p.price);
              if (products.length > 0) {
                console.log(`[avito] ${varName} → ${products.length} results`);
                return products;
              }
            }
          } catch { /* continue */ }
        }
      }
    }

    // ── Strategy 3: HTML parsing ─────────────────────────────────────────────────
    const results = [];
    const selectors = [
      { wrap: '[class*="listing-"]', title: '[class*="title"], h3', price: '[class*="price"]' },
      { wrap: 'li[id^="ad-"]',       title: 'h3, [class*="title"]', price: '[class*="price"]' },
      { wrap: '[data-testid*="ad"]', title: 'h3, [class*="title"]', price: '[class*="price"]' },
      { wrap: '.mc-adcard-body',     title: '.mc-adcard-title',      price: '.mc-adcard-price' },
    ];

    for (const sel of selectors) {
      $(sel.wrap).each((_, el) => {
        const $el  = $(el);
        const title = $el.find(sel.title).first().text().trim();
        const price = parsePrice($el.find(sel.price).first().text());
        const href  = $el.find('a').first().attr('href') ?? '';
        if (!title || !price) return;
        results.push({
          title, price,
          source:      'avito',
          url:         href.startsWith('http') ? href : `${BASE}${href}`,
          imageUrl:    $el.find('img').first().attr('src') ?? null,
          discountPct: 0,
        });
      });
      if (results.length > 0) {
        console.log(`[avito] HTML (${sel.wrap}) → ${results.length} results`);
        return results;
      }
    }
  }

  console.warn(`[avito] all strategies failed for "${query}"`);
  return [];
}
