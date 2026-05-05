import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const BASE = 'https://www.marjane.ma';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-MA,fr;q=0.9',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
};

const parseMAD = parsePrice;

export async function scrapeMarjane(query) {
  const urls = [
    `${BASE}/recherche?q=${encodeURIComponent(query)}`,
    `${BASE}/catalogsearch/result/?q=${encodeURIComponent(query)}`,
  ];

  for (const url of urls) {
    try {
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 20_000 });
      const $ = cheerio.load(data);
      const products = [];

      // Strategy 1: JSON-LD
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).html());
          const items = json['@type'] === 'ItemList' ? (json.itemListElement ?? [])
                      : json['@type'] === 'Product' ? [json] : [];
          for (const item of items) {
            const p = item.item ?? item;
            const rawPrice = p.offers?.price ?? p.offers?.[0]?.price;
            const price = rawPrice ? parseMAD(String(rawPrice)) : null;
            if (p.name && price) {
              products.push({
                title: p.name,
                price,
                source: 'marjane',
                url: p.url ?? url,
                imageUrl: p.image?.url ?? p.image ?? null,
                category: query,
                discountPct: 0,
                rating: p.aggregateRating?.ratingValue ?? null,
                reviewCount: p.aggregateRating?.reviewCount ?? null,
              });
            }
          }
        } catch (_) {}
      });

      if (products.length > 0) return products;

      // Strategy 2: HTML selectors (Magento / custom Marjane)
      const selectors = [
        { wrap: '.product-item-info', title: '.product-item-name a, .product-name', price: '.price', oldPrice: '.old-price .price' },
        { wrap: '.product-card',       title: 'h3, h2, .name',                       price: '[class*="price"], .prc' },
        { wrap: '[class*="product"]',  title: 'h3, h2',                               price: '[class*="price"]' },
      ];

      for (const sel of selectors) {
        $(sel.wrap).each((_, el) => {
          const $el = $(el);
          const title    = $el.find(sel.title).first().text().trim();
          const price    = parseMAD($el.find(sel.price).first().text());
          const oldPrice = sel.oldPrice ? parseMAD($el.find(sel.oldPrice).first().text()) : null;
          const href     = $el.find('a').first().attr('href');
          if (title && price) {
            const discountPct = oldPrice && oldPrice > price
              ? Math.round((1 - price / oldPrice) * 100) : 0;
            products.push({
              title, price, originalPrice: oldPrice ?? null, discountPct,
              source: 'marjane',
              url: href?.startsWith('http') ? href : `${BASE}${href ?? ''}`,
              imageUrl: $el.find('img').first().attr('src') ?? null,
              category: query,
            });
          }
        });
        if (products.length > 0) return products;
      }
    } catch (err) {
      console.error(`[marjane] url ${url}: ${err.message}`);
    }
  }
  return [];
}
