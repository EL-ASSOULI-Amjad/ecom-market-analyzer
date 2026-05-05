import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const BASE = 'https://www.trendyol.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
};

export async function scrapeTrendyol(query) {
  const results = [];
  try {
    const url = `${BASE}/sr?q=${encodeURIComponent(query)}&qt=${encodeURIComponent(query)}&st=${encodeURIComponent(query)}&os=1`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20_000 });
    const $ = cheerio.load(data);

    // Strategy 1: window.__PRODUCT_LIST_APP__ or similar embedded JSON
    const scriptContent = $('script:not([src])').toArray()
      .map(el => $(el).html() ?? '')
      .find(s => s.includes('"products"') || s.includes('"productList"'));

    if (scriptContent) {
      try {
        const match = scriptContent.match(/"products"\s*:\s*(\[[\s\S]*?\])/);
        if (match) {
          const items = JSON.parse(match[1]);
          for (const item of items.slice(0, 30)) {
            const price = parsePrice(String(item.price?.sellingPrice ?? item.price ?? ''));
            if (!item.name || !price) continue;

            // Trendyol embeds rich rating data in the JSON
            const ratingScore = item.ratingScore ?? item.ratings ?? {};
            const rating      = ratingScore.averageRating ?? item.averageRating ?? null;
            const reviewCount = ratingScore.totalCount     ?? item.reviewCount   ?? null;
            const soldCount   = item.soldQuantity ?? item.salesCount ?? item.orderCount ?? null;

            results.push({
              title:         item.name,
              price,
              originalPrice: parsePrice(String(item.price?.originalPrice ?? '')),
              discountPct:   item.price?.discountedRate ?? 0,
              source:        'trendyol',
              url:           `${BASE}${item.url ?? ''}`,
              imageUrl:      item.images?.[0] ?? null,
              category:      query,
              rating:        rating   ? parseFloat(String(rating).replace(',', '.')) : null,
              reviewCount:   reviewCount ? parseInt(String(reviewCount).replace(/\D/g, ''), 10) : null,
              soldCount:     soldCount   ? parseInt(String(soldCount).replace(/\D/g, ''), 10)   : null,
            });
          }
          if (results.length > 0) return results;
        }
      } catch (_) {}
    }

    // Strategy 2: HTML fallback
    $('.p-card-wrppr').each((_, el) => {
      const $el = $(el);
      const title     = $el.find('.prdct-desc .name').first().text().trim()
                     || $el.find('h3, h2').first().text().trim();
      const priceText = $el.find('.prc-box-sllng, .prc-box-dscntd').first().text();
      const price     = parsePrice(priceText);
      const href      = $el.find('a').first().attr('href');
      if (!title || !price) return;

      // HTML rating selectors
      const ratingText  = $el.find('.rating-score, [class*="rating"]').first().text().trim();
      const ratingMatch = ratingText.match(/(\d[.,]\d)/);
      const reviewText  = $el.find('.ratingCount, [class*="review-count"]').first().text().replace(/\D/g, '');

      results.push({
        title, price,
        source:   'trendyol',
        url:      href?.startsWith('http') ? href : `${BASE}${href ?? ''}`,
        imageUrl: $el.find('img').first().attr('src') ?? null,
        category: query,
        discountPct: 0,
        rating:      ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null,
        reviewCount: reviewText  ? parseInt(reviewText, 10) : null,
        soldCount:   null,
      });
    });
  } catch (err) {
    console.error(`[trendyol] ${err.message}`);
  }
  return results;
}
