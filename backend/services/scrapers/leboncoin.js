import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const BASE = 'https://www.leboncoin.fr';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
};

export async function scrapeLeboncoin(query) {
  const results = [];
  try {
    const url = `${BASE}/recherche?text=${encodeURIComponent(query)}&price=1-max`;
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20_000 });
    const $ = cheerio.load(data);

    // Strategy 1: __NEXT_DATA__ JSON
    const nextRaw = $('#__NEXT_DATA__').html();
    if (nextRaw) {
      try {
        const nextData = JSON.parse(nextRaw);
        const listings = nextData?.props?.pageProps?.searchData?.ads ?? [];
        for (const item of listings) {
          const price = parsePrice(String(item.price?.[0] ?? ''));
          if (item.subject && price) {
            results.push({
              title: item.subject,
              price,
              source: 'leboncoin',
              url: item.url?.startsWith('http') ? item.url : `${BASE}${item.url ?? ''}`,
              imageUrl: item.images?.urls_large?.[0] ?? item.images?.thumb_url ?? null,
              category: query,
              discountPct: 0,
              rating: null,
              reviewCount: null,
            });
          }
        }
        if (results.length > 0) return results;
      } catch (_) {}
    }

    // Strategy 2: HTML parsing
    $('[data-qa-id="aditem_container"], article').each((_, el) => {
      const $el = $(el);
      const title = $el.find('[data-qa-id="aditem_title"], h2, h3').first().text().trim();
      const priceText = $el.find('[data-qa-id="aditem_price"], [class*="price"]').first().text();
      const price = parsePrice(priceText);
      const href = $el.find('a').first().attr('href');
      if (title && price) {
        results.push({
          title, price,
          source: 'leboncoin',
          url: href?.startsWith('http') ? href : `${BASE}${href ?? ''}`,
          imageUrl: $el.find('img').first().attr('src') ?? null,
          category: query,
          discountPct: 0,
        });
      }
    });
  } catch (err) {
    console.error(`[leboncoin] ${err.message}`);
  }
  return results;
}
