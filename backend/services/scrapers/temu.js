import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';
import { fetchWithBrowser } from './headless.js';

const delay = ms => new Promise(r => setTimeout(r, ms));

const TEMU_DOMAINS = {
  us: 'www.temu.com', fr: 'www.temu.com',
  de: 'www.temu.com', gb: 'www.temu.com',
};

function parsePriceCents(val) {
  if (!val) return null;
  if (typeof val === 'number') return val > 100 ? val / 100 : val;
  return parsePrice(String(val));
}

function extractFromHtml(html, domain, query) {
  const $ = cheerio.load(html);

  // Strategy A: __NEXT_DATA__ JSON
  const nextRaw = $('#__NEXT_DATA__').html();
  if (nextRaw) {
    try {
      const nd = JSON.parse(nextRaw);
      const sd = nd?.props?.pageProps?.searchResult ?? nd?.props?.pageProps?.data ?? nd?.props?.pageProps ?? {};
      const list = sd?.productList ?? sd?.goods ?? sd?.result?.goods ?? sd?.items ?? [];
      const products = list.map(p => ({
        title:       p.goodsName ?? p.name ?? p.title ?? null,
        price:       parsePriceCents(p.finalPrice ?? p.salePrice ?? p.price ?? p.displayPrice),
        currency:    'USD',
        source:      'temu',
        url:         p.goodsUrl ? `https://${domain}${p.goodsUrl}` : `https://${domain}/search_result.html?search_key=${encodeURIComponent(query)}`,
        imageUrl:    p.thumbUrl ?? p.goodsThumbUrl ?? p.imgUrl ?? null,
        rating:      parseFloat(p.goodsRating ?? p.rating ?? 0) || null,
        reviewCount: parseInt(p.reviewNum ?? p.reviewCount ?? 0, 10) || null,
        soldCount:   parseInt(p.soldNum ?? p.soldCount ?? 0, 10) || null,
        discountPct: p.discountRate ? Math.round(p.discountRate) : 0,
      })).filter(p => p.title && p.price);
      if (products.length > 0) return products;
    } catch { /* fall through */ }
  }

  // Strategy B: Inline JS data blob
  const scriptData = $('script').map((_, s) => $(s).html() ?? '').get().join('\n');
  const m = scriptData.match(/"goods"\s*:\s*(\[[\s\S]{20,}\])\s*[,}]/);
  if (m) {
    try {
      const goods = JSON.parse(m[1]);
      const products = goods.map(p => ({
        title:       p.goodsName ?? p.name ?? null,
        price:       parsePriceCents(p.finalPrice ?? p.salePrice ?? p.price),
        currency:    'USD',
        source:      'temu',
        url:         p.goodsUrl ? `https://${domain}${p.goodsUrl}` : `https://${domain}/search_result.html?search_key=${encodeURIComponent(query)}`,
        imageUrl:    p.thumbUrl ?? null,
        discountPct: p.discountRate ? Math.round(p.discountRate) : 0,
      })).filter(p => p.title && p.price);
      if (products.length > 0) return products;
    } catch { /* fall through */ }
  }

  // Strategy C: DOM scraping
  const results = [];
  $('[class*="goods-item"], [class*="product-item"], [class*="search-item"], [data-type="item"]').each((_, el) => {
    const $el   = $(el);
    const title = $el.find('[class*="goods-title"], [class*="title"]').first().text().trim();
    const price = parsePrice($el.find('[class*="price"]').first().text());
    const href  = $el.find('a').first().attr('href') ?? '';
    const img   = $el.find('img').first().attr('src') ?? $el.find('img').first().attr('data-src');
    if (!title || !price) return;
    results.push({ title, price, currency: 'USD', source: 'temu',
      url: href.startsWith('http') ? href : `https://${domain}${href}`,
      imageUrl: img ?? null, discountPct: 0 });
  });
  return results;
}

export async function scrapeTemu(query, pages = 1, country = 'us') {
  const domain = TEMU_DOMAINS[country] ?? 'www.temu.com';
  const results = [];

  for (let page = 1; page <= pages; page++) {
    const url = `https://${domain}/search_result.html?search_key=${encodeURIComponent(query)}&search_method=user`;
    let items = [];

    try {
      const html = await fetchWithBrowser(url, { waitFor: '[class*="goods-item"], [class*="search-result"]', timeout: 35_000, extraWait: 1500 });
      items = extractFromHtml(html, domain, query);
      if (items.length > 0) console.log(`[temu] headless → ${items.length} results`);
    } catch (e) {
      console.warn(`[temu] headless failed: ${e.message?.slice(0, 100)}`);
    }

    if (items.length === 0) console.warn(`[temu] 0 results for "${query}"`);
    results.push(...items);
    if (page < pages && items.length) await delay(3000 + Math.random() * 2000);
  }

  const seen = new Set();
  return results.filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true; });
}
