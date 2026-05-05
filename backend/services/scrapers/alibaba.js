import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';
import { fetchWithBrowser } from './headless.js';

const delay = ms => new Promise(r => setTimeout(r, ms));

function parsePriceRange(text) {
  if (!text) return null;
  const nums = (text.match(/[\d.]+/g) ?? []).map(Number).filter(n => n > 0);
  return nums.length ? nums[0] : null;
}

function parseCount(text) {
  if (!text) return null;
  const m = text.replace(/,/g, '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function extractFromHtml(html, query) {
  const $ = cheerio.load(html);

  // Strategy A: embedded __INIT_DATA__ or __DELIVERY_DATA__
  const scriptContent = $('script').map((_, s) => $(s).html() ?? '').get().join('\n');
  for (const rx of [
    /window\.__INIT_DATA__\s*=\s*(\{[\s\S]*?\});\s*(?:window|<\/script>)/,
    /window\.__DELIVERY_DATA__\s*=\s*(\{[\s\S]*?\});\s*(?:window|<\/script>)/,
    /__INIT_DATA__["']?\s*:\s*(\{[\s\S]*?\})\s*[,}]/,
  ]) {
    const m = scriptContent.match(rx);
    if (m) {
      try {
        const pd = JSON.parse(m[1]);
        const items = pd?.data?.offerList ?? pd?.offerList ?? pd?.data?.resultList ?? [];
        const products = items.map(item => {
          const offer    = item.offer ?? item;
          const price    = parsePriceRange(offer.priceText ?? offer.tradePrice ?? offer.price ?? '');
          const imgUrl   = offer.imgUrl ?? '';
          return {
            title:       offer.subject ?? offer.title ?? null,
            price,
            currency:    'USD',
            source:      'alibaba',
            url:         offer.detailUrl?.startsWith('http') ? offer.detailUrl : offer.detailUrl ? `https:${offer.detailUrl}` : null,
            imageUrl:    imgUrl.startsWith('//') ? `https:${imgUrl}` : imgUrl || null,
            soldCount:   parseCount(offer.ordersText ?? offer.reviewCount),
            discountPct: 0,
          };
        }).filter(p => p.title && p.price && p.url);
        if (products.length > 0) return products;
      } catch { /* fall through */ }
    }
  }

  // Strategy B: DOM scraping
  const results = [];
  $('[class*="J-offer-wrapper"], .offer-wrapper, [class*="organic-offer"], [class*="offer-item"]').each((_, el) => {
    const $el = $(el);
    const title = $el.find('[class*="subject-line"], h2, h3, [class*="title"]').first().text().trim();
    if (!title) return;
    const priceText = $el.find('[class*="price"], [class*="Price"]').first().text().trim();
    const price = parsePriceRange(priceText);
    if (!price) return;
    const href   = $el.find('a').first().attr('href') ?? '';
    const imgSrc = $el.find('img').first().attr('src') ?? $el.find('img').first().attr('data-src');
    results.push({
      title, price, currency: 'USD', source: 'alibaba',
      url:      href.startsWith('http') ? href : href.startsWith('//') ? `https:${href}` : `https://www.alibaba.com${href}`,
      imageUrl: imgSrc ?? null,
      soldCount: parseCount($el.find('[class*="order"]').first().text()),
      discountPct: 0,
    });
  });
  return results;
}

export async function scrapeAlibaba(query, pages = 1) {
  const results = [];

  for (let page = 1; page <= pages; page++) {
    const url = `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}&fsb=y&IndexArea=product_en&CatId=&tab=all&page=${page}`;
    let items = [];

    try {
      const html = await fetchWithBrowser(url, { waitFor: '[class*="J-offer-wrapper"], [class*="offer-item"], [class*="organic-offer"]', timeout: 35_000, extraWait: 2000 });
      items = extractFromHtml(html, query);
      if (items.length > 0) console.log(`[alibaba] headless page ${page} → ${items.length} results`);
    } catch (e) {
      console.warn(`[alibaba] headless page ${page} failed: ${e.message?.slice(0, 100)}`);
    }

    if (items.length === 0) console.warn(`[alibaba] 0 results for "${query}" page ${page}`);
    results.push(...items);
    if (page < pages) await delay(2500 + Math.random() * 1500);
  }

  const seen = new Set();
  return results.filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true; });
}
