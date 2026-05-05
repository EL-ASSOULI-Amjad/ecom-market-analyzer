import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';
import { EBAY_DOMAINS } from '../../config/countries.js';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseSoldCount(text) {
  if (!text) return null;
  const clean = text.replace(/\s+/g, ' ').trim();
  // "1,234 vendus", "127 sold", "1.2K+ sold", "+de 50 vendus"
  const kMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*[kK]\+?/);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000);
  const numMatch = clean.match(/(\d[\d,. ]*\d|\d)/);
  if (numMatch) return parseInt(numMatch[1].replace(/[,. ]/g, ''), 10) || null;
  return null;
}

export async function scrapeEbay(query, pages = 1, country = 'fr') {
  const domain = EBAY_DOMAINS[country] ?? EBAY_DOMAINS.fr;
  const BASE   = `https://${domain}`;
  const results = [];

  for (let page = 1; page <= pages; page++) {
    try {
      // LH_BIN=1 → Buy It Now only (skip auction noise)
      const url = `${BASE}/sch/i.html?_nkw=${encodeURIComponent(query)}&_pgn=${page}&LH_BIN=1&_sop=12`;
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 20_000 });
      const $ = cheerio.load(data);

      $('.s-item').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.s-item__title').first().text().trim();
        const href  = $el.find('a.s-item__link').attr('href') ?? '';
        const priceText = $el.find('.s-item__price').first().text().trim();
        const price = parsePrice(priceText);

        if (!title || !price || title === 'Shop on eBay') return;

        const image = $el.find('.s-item__image-img').attr('src')
                   ?? $el.find('img').first().attr('src') ?? null;

        const origText  = $el.find('.STRIKETHROUGH, .s-item__price--discounted').first().text();
        const origPrice = parsePrice(origText);
        const discountPct = origPrice && origPrice > price
          ? Math.round((1 - price / origPrice) * 100) : 0;

        // Sold count — eBay shows "127 vendus" or "1,2K+ vendus" in .s-item__hotness
        const soldText = $el.find('.s-item__hotness, .s-item__quantitySold, [class*="sold"]').text();
        const soldCount = parseSoldCount(soldText);

        // Seller feedback score (visible as numeric badge in some locales)
        const feedbackText = $el.find('.s-item__seller-info-text, [class*="feedback"]').text();
        const feedbackMatch = feedbackText.match(/(\d[\d,.]+)/);
        const sellerScore = feedbackMatch ? parseFloat(feedbackMatch[1].replace(',', '.')) : null;

        // Watchers / bids can proxy demand when sold is missing
        const watchText = $el.find('.s-item__watchCountTotal, [class*="watch"]').text();
        const watchMatch = watchText.match(/(\d+)/);
        const watchers = watchMatch ? parseInt(watchMatch[1], 10) : null;

        results.push({
          title,
          price,
          originalPrice: origPrice ?? null,
          discountPct,
          source: 'ebay',
          url: href,
          imageUrl: image,
          soldCount,
          rating: sellerScore && sellerScore <= 5 ? sellerScore : null,
          reviewCount: watchers, // watchers as demand proxy
        });
      });

      if (page < pages) await delay(1500 + Math.random() * 500);
    } catch (err) {
      console.error(`[ebay/${country}] page ${page}: ${err.message}`);
      break;
    }
  }

  return results;
}
