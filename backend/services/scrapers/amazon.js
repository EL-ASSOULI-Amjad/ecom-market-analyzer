import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';
import { AMAZON_DOMAINS } from '../../config/countries.js';

// Rotate user agents to reduce blocking
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
];

function getHeaders(country) {
  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const langMap = { fr: 'fr-FR,fr', de: 'de-DE,de', es: 'es-ES,es', gb: 'en-GB,en', us: 'en-US,en', sa: 'ar-SA,ar', ae: 'ar-AE,ar' };
  return {
    'User-Agent': ua,
    'Accept-Language': `${langMap[country] ?? 'fr-FR,fr'};q=0.9,en;q=0.7`,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  };
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseSoldCount(text) {
  if (!text) return null;
  // "1 000+ achetés au cours du dernier mois" / "1K+ bought in past month"
  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*[kK]\+/);
  if (kMatch) return Math.round(parseFloat(kMatch[1].replace(',', '.')) * 1000);
  const nMatch = text.match(/(\d[\d\s,.']*)/);
  if (nMatch) return parseInt(nMatch[1].replace(/[\s,.']/g, ''), 10) || null;
  return null;
}

export async function scrapeAmazon(query, pages = 1, country = 'fr') {
  const domain = AMAZON_DOMAINS[country] ?? AMAZON_DOMAINS.fr;
  const BASE   = `https://${domain}`;
  const results = [];

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `${BASE}/s?k=${encodeURIComponent(query)}&page=${page}`;
      const { data } = await axios.get(url, { headers: getHeaders(country), timeout: 25_000 });
      const $ = cheerio.load(data);

      $('[data-component-type="s-search-result"]').each((_, el) => {
        const $el = $(el);

        const title = $el.find('h2 a span').first().text().trim()
                   || $el.find('.s-title-instructions-style span').first().text().trim();
        const href  = $el.find('h2 a').first().attr('href') ?? '';
        if (!title) return;

        // Price — Amazon uses a split whole+fraction structure
        const priceWhole  = $el.find('.a-price-whole').first().text().replace(/[^\d.,]/g, '');
        const priceFrac   = $el.find('.a-price-fraction').first().text().replace(/[^\d]/g, '');
        let priceText = '';
        if (priceWhole) {
          priceText = priceFrac ? `${priceWhole}.${priceFrac}` : priceWhole;
        } else {
          priceText = $el.find('.a-offscreen').first().text()
                   || $el.find('[class*="price"]').first().text();
        }
        const price = parsePrice(priceText);
        if (!price) return;

        // Original (struck-out) price
        const origText  = $el.find('.a-text-price .a-offscreen').first().text()
                       || $el.find('[data-a-strike="true"] .a-offscreen').first().text();
        const origPrice = parsePrice(origText);
        const discountPct = origPrice && origPrice > price
          ? Math.round((1 - price / origPrice) * 100) : 0;

        const image = $el.find('img.s-image').attr('src') ?? null;

        // Rating — "4,5 sur 5 étoiles" or "4.5 out of 5 stars"
        const ratingText  = $el.find('.a-icon-alt').first().text();
        const ratingMatch = ratingText.match(/(\d[.,]\d)/);
        const rating      = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;

        // Review count — span next to the star aria-label
        const reviewSpan = $el.find('[aria-label*="étoile"] ~ span, [aria-label*="star"] ~ span').first().text();
        const reviewAlt  = $el.find('.a-size-base.s-underline-text').first().text();
        const rawReviews = (reviewSpan || reviewAlt).replace(/[^\d]/g, '');
        const reviewCount = rawReviews ? parseInt(rawReviews, 10) : null;

        // "X+ achetés au cours du dernier mois" — strong demand signal
        const boughtEl  = $el.find('[data-csa-c-slot-id] span').filter((_, e) => {
          const t = $(e).text();
          return t.includes('acheté') || t.includes('bought') || t.includes('bestellt');
        }).first();
        const boughtText = boughtEl.text() || $el.find('.a-color-secondary').filter((_, e) => {
          const t = $(e).text();
          return t.includes('acheté') || t.includes('bought');
        }).first().text();
        const soldCount = parseSoldCount(boughtText);

        results.push({
          title,
          price,
          originalPrice: origPrice ?? null,
          discountPct,
          source: 'amazon',
          url: href.startsWith('http') ? href : `${BASE}${href}`,
          imageUrl: image,
          rating,
          reviewCount,
          soldCount,
        });
      });

      if (page < pages) await delay(2000 + Math.random() * 1000);
    } catch (err) {
      console.error(`[amazon/${country}] page ${page}: ${err.message}`);
      break;
    }
  }

  return results;
}
