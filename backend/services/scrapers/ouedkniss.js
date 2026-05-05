import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const BASE = 'https://www.ouedkniss.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-DZ,fr;q=0.9,ar;q=0.8',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
};

export async function scrapeOuedkniss(query) {
  const results = [];
  try {
    const url = `${BASE}/search?q=${encodeURIComponent(query)}&hasPictures=false`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20_000 });
    const $ = cheerio.load(data);

    // Strategy 1: Nuxt/Vue __NUXT__ or JSON data
    const scriptContent = $('script:not([src])').toArray()
      .map(el => $(el).html() ?? '')
      .find(s => s.includes('"announcements"') || s.includes('"data"'));

    if (scriptContent) {
      try {
        const match = scriptContent.match(/"announcements"\s*:\s*(\[[\s\S]*?\])/);
        if (match) {
          const items = JSON.parse(match[1]);
          for (const item of items.slice(0, 30)) {
            const price = parsePrice(String(item.price ?? item.priceMain ?? ''));
            if (item.title && price) {
              results.push({
                title: item.title,
                price,
                source: 'ouedkniss',
                url: item.url?.startsWith('http') ? item.url : `${BASE}${item.url ?? ''}`,
                imageUrl: item.defaultMedia?.mediaUrl ?? null,
                category: query,
                discountPct: 0,
              });
            }
          }
          if (results.length > 0) return results;
        }
      } catch (_) {}
    }

    // Strategy 2: HTML selectors
    const selectors = [
      { wrap: '.o-announcement-card', title: '.o-announcement-title', price: '.o-announcement-price' },
      { wrap: '[class*="ann-card"]',   title: 'h2, h3',                price: '[class*="price"]' },
    ];

    for (const sel of selectors) {
      $(sel.wrap).each((_, el) => {
        const $el = $(el);
        const title = $el.find(sel.title).first().text().trim();
        const price = parsePrice($el.find(sel.price).first().text());
        const href  = $el.find('a').first().attr('href');
        if (title && price) {
          results.push({
            title, price,
            source: 'ouedkniss',
            url: href?.startsWith('http') ? href : `${BASE}${href ?? ''}`,
            imageUrl: $el.find('img').first().attr('src') ?? null,
            category: query,
            discountPct: 0,
          });
        }
      });
      if (results.length > 0) return results;
    }
  } catch (err) {
    console.error(`[ouedkniss] ${err.message}`);
  }
  return results;
}
