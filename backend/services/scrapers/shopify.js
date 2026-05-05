/**
 * Shopify scraper — hits /products.json on a curated list of Moroccan stores.
 * All public Shopify stores expose this endpoint; no auth needed.
 */
import axios from 'axios';
import { parsePrice } from '../../utils/parsePrice.js';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-MA,fr;q=0.9',
  Accept: 'application/json',
};

// Curated list of verified Moroccan Shopify / Shopify-compatible stores
const MOROCCAN_STORES = [
  'https://www.hmizate.ma',
  'https://www.jevelo.ma',
  'https://www.marocbeauty.ma',
  'https://www.sportsandco.ma',
  'https://www.midoula.ma',
  'https://www.naturel.ma',
  'https://www.boutique-bio.ma',
  'https://moodmaroc.myshopify.com',
  'https://moroccancraft.myshopify.com',
];

async function fetchStore(baseUrl, query) {
  try {
    const url = `${baseUrl}/products.json?limit=20&q=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 10_000 });
    if (!Array.isArray(data?.products) || data.products.length === 0) return [];

    return data.products
      .filter(p => p.title && p.variants?.[0]?.price)
      .map(p => {
        const variant     = p.variants[0];
        const price       = parsePrice(String(variant.price));
        const compareAt   = parsePrice(String(variant.compare_at_price ?? ''));
        const discountPct = compareAt && compareAt > price
          ? Math.round((1 - price / compareAt) * 100) : 0;
        const domain = baseUrl.replace(/^https?:\/\//, '');
        return {
          title:         p.title,
          price,
          originalPrice: compareAt ?? null,
          discountPct,
          source:        'shopify',
          shopifyStore:  domain,
          url:           `${baseUrl}/products/${p.handle}`,
          imageUrl:      p.images?.[0]?.src ?? null,
          category:      p.product_type || query,
          rating:        null,
          reviewCount:   null,
        };
      })
      .filter(p => p.price);
  } catch (_) {
    return [];
  }
}

export async function scrapeShopify(query) {
  const results = [];
  // Try all stores concurrently — fast, and failures are silent
  const batches = await Promise.allSettled(
    MOROCCAN_STORES.map(store => fetchStore(store, query))
  );
  for (const b of batches) {
    if (b.status === 'fulfilled') results.push(...b.value);
  }
  return results;
}
