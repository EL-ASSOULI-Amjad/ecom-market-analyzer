import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const JUMIA_DOMAINS = {
  ma: 'https://www.jumia.ma',
  dz: 'https://www.jumia.dz',
  tn: 'https://www.jumia.com.tn',
  eg: 'https://www.jumia.com.eg',
  ng: 'https://www.jumia.com.ng',
  ke: 'https://www.jumia.co.ke',
  gh: 'https://www.jumia.com.gh',
  sn: 'https://www.jumia.sn',
  ci: 'https://www.jumia.ci',
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-MA,fr;q=0.9,ar;q=0.8,en;q=0.7',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseSoldCount(text) {
  if (!text) return null;
  // "1234 vendus", "1.2k vendus", "+500 vendus"
  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*[kK]/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000);
  const nMatch = text.match(/(\d[\d, ]*)/);
  if (nMatch) return parseInt(nMatch[1].replace(/[, ]/g, ''), 10) || null;
  return null;
}

export async function scrapeJumia(query, pages = 1, country = 'ma') {
  const BASE = JUMIA_DOMAINS[country] ?? JUMIA_DOMAINS.ma;
  const results = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `${BASE}/catalog/?q=${encodeURIComponent(query)}&page=${page}`;
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 20_000 });
      const $ = cheerio.load(data);

      $('article.prd').each((_, el) => {
        const $el = $(el);
        const href      = $el.find('a.core').attr('href') ?? '';
        const title     = $el.find('.name').text().trim();
        const priceText = $el.find('.prc').text().trim();
        const oldText   = $el.find('.old').text().trim();
        const price     = parsePrice(priceText);
        const origPrice = parsePrice(oldText);
        const image     = $el.find('img.img').attr('data-src') ?? $el.find('img.img').attr('src');

        if (!title || !price) return;

        // Rating — "4.5 sur 5 étoiles" in aria-label
        const ratingLabel = $el.find('[class*="stars"]').attr('aria-label') ?? '';
        const ratingMatch = ratingLabel.match(/(\d+(?:[.,]\d+)?)/);
        const rating      = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;

        // Review count — "(127)" or "127 avis"
        const reviewRaw = $el.find('.rev span').last().text().replace(/[^\d]/g, '');
        const reviewCount = reviewRaw ? parseInt(reviewRaw, 10) : null;

        // Sold count — Jumia sometimes shows "1234 vendus" badge
        const soldEl  = $el.find('[class*="sold"], [class*="vendus"], .htags .sold');
        const soldRaw = soldEl.text().trim();
        const soldCount = soldRaw ? parseSoldCount(soldRaw) : null;

        // Express delivery badge = better seller = slight quality signal
        const isExpress = $el.find('[class*="express"], [class*="jumia-express"]').length > 0;

        const discountPct = origPrice && origPrice > price
          ? Math.round((1 - price / origPrice) * 100) : 0;

        results.push({
          title,
          price,
          originalPrice: origPrice ?? null,
          discountPct,
          source: 'jumia',
          url: `${BASE}${href}`,
          imageUrl: image ?? null,
          rating,
          reviewCount,
          soldCount,
          isExpress,
        });
      });

      if (page < pages) await delay(1200 + Math.random() * 800);
    } catch (err) {
      console.error(`[jumia/${country}] page ${page}: ${err.message}`);
      break;
    }
  }

  return results;
}
