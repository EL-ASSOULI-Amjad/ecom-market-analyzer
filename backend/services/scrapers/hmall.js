import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const BASE = 'https://www.hmall.ma';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-MA,fr;q=0.9',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export async function scrapeHmall(query) {
  const urls = [
    `${BASE}/catalogsearch/result/?q=${encodeURIComponent(query)}`,
    `${BASE}/recherche/?requete=${encodeURIComponent(query)}`,
  ];

  for (const url of urls) {
    try {
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 20_000 });
      const $ = cheerio.load(data);
      const products = [];

      // Strategy 1: JSON-LD — now extracts aggregateRating
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json  = JSON.parse($(el).html());
          const items = json['@type'] === 'ItemList'
            ? (json.itemListElement ?? [])
            : json['@type'] === 'Product' ? [json] : [];

          for (const item of items) {
            const p         = item.item ?? item;
            const priceSpec = p.offers?.price ?? p.offers?.[0]?.price;
            const price     = priceSpec ? parsePrice(String(priceSpec)) : null;
            if (!p.name || !price) continue;

            const agg  = p.aggregateRating ?? {};
            const orig = p.offers?.priceValidUntil ? parsePrice(String(p.offers?.highPrice ?? 0)) : null;
            const discountPct = orig && orig > price ? Math.round((1 - price / orig) * 100) : 0;

            products.push({
              title:        p.name,
              price,
              originalPrice: orig ?? null,
              discountPct,
              source:       'hmall',
              url:          p.url ?? p['@id'] ?? url,
              imageUrl:     p.image?.url ?? p.image ?? null,
              category:     query,
              rating:       agg.ratingValue ? parseFloat(String(agg.ratingValue)) : null,
              reviewCount:  agg.reviewCount ? parseInt(String(agg.reviewCount), 10) : null,
            });
          }
        } catch (_) {}
      });

      if (products.length > 0) return products;

      // Strategy 2: HTML — Magento/OpenMage product grid
      const selectors = [
        {
          wrap:       '.product-item',
          title:      '.product-item-name, .product-name',
          price:      '.price',
          rating:     '.rating-result, [class*="rating"]',
          reviewCount:'.review-count, [class*="reviews"]',
        },
        {
          wrap:       '.product-card',
          title:      '.card-title, h2, h3',
          price:      '[class*="price"]',
          rating:     '[class*="stars"], [class*="rating"]',
          reviewCount:'[class*="review"]',
        },
        {
          wrap:       'li.item',
          title:      '.product-name, h2',
          price:      '.price',
          rating:     null,
          reviewCount: null,
        },
      ];

      for (const sel of selectors) {
        $(sel.wrap).each((_, el) => {
          const $el    = $(el);
          const title  = $el.find(sel.title).first().text().trim();
          const price  = parsePrice($el.find(sel.price).first().text());
          const href   = $el.find('a').first().attr('href');
          if (!title || !price) return;

          const ratingText  = sel.rating ? $el.find(sel.rating).first().attr('title') ?? $el.find(sel.rating).first().text() : '';
          const ratingMatch = ratingText.match(/(\d[.,]\d|\d\/\d)/);
          const reviewText  = sel.reviewCount ? $el.find(sel.reviewCount).first().text().replace(/\D/g, '') : '';

          products.push({
            title, price,
            source:      'hmall',
            url:         href?.startsWith('http') ? href : `${BASE}${href ?? ''}`,
            imageUrl:    $el.find('img').first().attr('src') ?? null,
            category:    query,
            discountPct: 0,
            rating:      ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.').replace('/', '.')) : null,
            reviewCount: reviewText  ? parseInt(reviewText, 10) : null,
          });
        });
        if (products.length > 0) return products;
      }

      await delay(800);
    } catch (err) {
      console.error(`[hmall] ${err.message}`);
    }
  }
  return [];
}
