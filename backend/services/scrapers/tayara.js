import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const BASE = 'https://www.tayara.tn';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-TN,fr;q=0.9,ar;q=0.8',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
};

export async function scrapeTayara(query) {
  const results = [];
  try {
    const url = `${BASE}/ads/k/${encodeURIComponent(query)}`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20_000 });
    const $ = cheerio.load(data);

    // Strategy 1: Next.js __NEXT_DATA__
    const nextRaw = $('#__NEXT_DATA__').html();
    if (nextRaw) {
      try {
        const nextData = JSON.parse(nextRaw);
        const items = nextData?.props?.pageProps?.searchResult?.data
                   ?? nextData?.props?.pageProps?.data?.list ?? [];
        for (const item of items) {
          const price = parsePrice(String(item.price ?? ''));
          const title = item.title ?? item.subject;
          if (title && price) {
            results.push({
              title,
              price,
              source: 'tayara',
              url: item.adPath ? `${BASE}${item.adPath}` : BASE,
              imageUrl: item.images?.[0] ?? null,
              category: query,
              discountPct: 0,
            });
          }
        }
        if (results.length > 0) return results;
      } catch (_) {}
    }

    // Strategy 2: HTML
    const selectors = [
      { wrap: '[class*="AdCard"], [class*="adCard"]', title: 'h2, h3, [class*="title"]', price: '[class*="price"]' },
      { wrap: 'article',                               title: 'h2, h3',                   price: '[class*="price"], [class*="prix"]' },
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
            source: 'tayara',
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
    console.error(`[tayara] ${err.message}`);
  }
  return results;
}
