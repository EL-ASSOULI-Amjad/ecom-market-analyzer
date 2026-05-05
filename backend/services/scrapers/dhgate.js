/**
 * DHgate — wholesale marketplace similar to AliExpress but far less bot-protected.
 * Products are priced in USD (usually very cheap, 1–50 USD range).
 * Great for finding the same products as AliExpress when that source is blocked.
 */
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const delay = ms => new Promise(r => setTimeout(r, ms));

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  Referer: 'https://www.dhgate.com/',
};

function parseSoldCount(text) {
  if (!text) return null;
  const s = String(text).replace(/\s/g, '').toLowerCase();
  const k = s.match(/(\d+(?:\.\d+)?)[kk]/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const n = s.match(/(\d+)/);
  return n ? parseInt(n[1], 10) : null;
}

function parseRating(text) {
  if (!text) return null;
  const m = String(text).match(/(\d[.,]\d|\d)/);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

// DHgate has JSON-LD on some pages — try that first
function extractJsonLd($) {
  const results = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).html());
      const items = j['@type'] === 'ItemList' ? (j.itemListElement ?? []) : j['@type'] === 'Product' ? [j] : [];
      for (const entry of items) {
        const p     = entry.item ?? entry;
        const price = p.offers?.price ?? p.offers?.[0]?.price ?? null;
        if (!p.name || !price) continue;
        results.push({
          title:       p.name,
          price:       parseFloat(String(price)),
          currency:    'USD',
          source:      'dhgate',
          url:         p.url ?? p['@id'] ?? '',
          imageUrl:    p.image?.url ?? p.image ?? null,
          rating:      parseFloat(String(p.aggregateRating?.ratingValue ?? 0)) || null,
          reviewCount: parseInt(String(p.aggregateRating?.reviewCount ?? 0), 10) || null,
          discountPct: 0,
        });
      }
    } catch { /* continue */ }
  });
  return results;
}

// Main HTML parsing — DHgate has stable class names
function extractFromHtml($, url) {
  const results = [];

  // DHgate product cards — several layouts depending on page type
  const cardSelectors = [
    '.storeProduct',          // classic listing
    '.gallery-box',            // gallery view
    '[class*="product-list"] li',
    'ul.listingBox li',
    '.img-box',
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const $el = $(el);

      const title =
        $el.find('.picTitle-box, a[title], .pro-name, [class*="title"]').first().attr('title')
        || $el.find('.picTitle-box, a[title], .pro-name, [class*="title"]').first().text().trim();
      if (!title) return;

      // DHgate shows price ranges like "$2.50 - $4.99"
      const priceText = $el.find('.store-price-range, .sale-block .price, [class*="price"]').first().text();
      const price = parsePrice(priceText);
      if (!price) return;

      const href = $el.find('a').first().attr('href') ?? '';
      const img  = $el.find('img').first().attr('src') ?? $el.find('img').first().attr('data-original');

      const ratingText = $el.find('.rate-box, [class*="rating"], .rate').first().attr('title')
                      ?? $el.find('.rate-box, [class*="rating"]').first().text();
      const soldText   = $el.find('.feedback, [class*="order"], [class*="sold"]').first().text();

      results.push({
        title,
        price,
        currency:    'USD',
        source:      'dhgate',
        url:         href.startsWith('http') ? href : href.startsWith('//') ? `https:${href}` : `https://www.dhgate.com${href}`,
        imageUrl:    img ? (img.startsWith('//') ? `https:${img}` : img) : null,
        rating:      parseRating(ratingText),
        soldCount:   parseSoldCount(soldText),
        discountPct: 0,
      });
    });
    if (results.length >= 5) break; // found enough with this selector
  }
  return results;
}

export async function scrapeDhgate(query, pages = 1) {
  const results = [];

  for (let page = 1; page <= pages; page++) {
    const url = `https://www.dhgate.com/wholesale/search.do?searchkey=${encodeURIComponent(query)}&sortby=bestselling&page=${page}`;
    let html;
    try {
      const { data } = await axios.get(url, { headers: HEADERS, timeout: 22_000 });
      html = data;
    } catch (err) {
      console.error(`[dhgate] fetch error page ${page}: ${err.message}`);
      break;
    }

    const $ = cheerio.load(html);
    let items = extractJsonLd($);
    if (!items.length) items = extractFromHtml($, url);

    if (items.length > 0) {
      console.log(`[dhgate] "${query}" page ${page}: ${items.length} results`);
      results.push(...items);
    } else {
      console.warn(`[dhgate] no results for "${query}" page ${page}`);
      break;
    }

    if (page < pages) await delay(1500 + Math.random() * 1000);
  }

  const seen = new Set();
  return results.filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true; });
}
