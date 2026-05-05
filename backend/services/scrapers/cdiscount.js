import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const BASE = 'https://www.cdiscount.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9',
  Accept: 'text/html,application/xhtml+xml,*/*;q=0.9',
};

export async function scrapeCdiscount(query) {
  const results = [];
  try {
    const altUrl = `${BASE}/search/1/${encodeURIComponent(query)}.html`;
    const fallUrl = `${BASE}/search/10/results.html#SearchState|{"KeyWord":"${encodeURIComponent(query)}","IDRayon":"","CurrentPage":1}`;

    let data;
    try {
      ({ data } = await axios.get(altUrl, { headers: HEADERS, timeout: 20_000 }));
    } catch {
      ({ data } = await axios.get(fallUrl, { headers: HEADERS, timeout: 20_000 }));
    }
    const $ = cheerio.load(data);

    // Strategy 1: JSON-LD ItemList (richest data)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json  = JSON.parse($(el).html());
        const items = json['@type'] === 'ItemList' ? (json.itemListElement ?? []) : [];
        for (const item of items) {
          const p     = item.item ?? item;
          const price = parsePrice(String(p.offers?.price ?? p.offers?.[0]?.price ?? ''));
          if (!p.name || !price) continue;

          const agg = p.aggregateRating ?? {};
          results.push({
            title:       p.name, price,
            source:      'cdiscount',
            url:         p.url ?? altUrl,
            imageUrl:    Array.isArray(p.image) ? p.image[0] : (p.image ?? null),
            category:    query, discountPct: 0,
            rating:      agg.ratingValue ? parseFloat(String(agg.ratingValue)) : null,
            reviewCount: agg.reviewCount ? parseInt(String(agg.reviewCount), 10) : null,
          });
        }
      } catch (_) {}
    });

    if (results.length > 0) return results;

    // Strategy 2: HTML with rating extraction
    const selectors = [
      {
        wrap:        '.prdtBlkLst',
        title:       '.prdtDesc h3, .prdtBILTit',
        price:       '.price, .priceMain',
        rating:      '.prdtBILNote, .globalNote, [class*="stars"]',
        reviewCount: '.prdtBILReviewCount, .reviewsCount',
      },
      {
        wrap:        '.product-list-item',
        title:       'h2, h3',
        price:       '[class*="price"]',
        rating:      '[class*="rating"], [class*="note"]',
        reviewCount: '[class*="review"]',
      },
    ];

    for (const sel of selectors) {
      $(sel.wrap).each((_, el) => {
        const $el    = $(el);
        const title  = $el.find(sel.title).first().text().trim();
        const price  = parsePrice($el.find(sel.price).first().text());
        const href   = $el.find('a').first().attr('href');
        if (!title || !price) return;

        const ratingText  = sel.rating ? $el.find(sel.rating).first().text().trim() : '';
        const ratingMatch = ratingText.match(/(\d[.,]\d)/);
        const reviewText  = sel.reviewCount ? $el.find(sel.reviewCount).first().text().replace(/\D/g, '') : '';

        results.push({
          title, price,
          source:      'cdiscount',
          url:         href?.startsWith('http') ? href : `${BASE}${href ?? ''}`,
          imageUrl:    $el.find('img').first().attr('src') ?? null,
          category:    query, discountPct: 0,
          rating:      ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null,
          reviewCount: reviewText  ? parseInt(reviewText, 10) : null,
        });
      });
      if (results.length > 0) return results;
    }
  } catch (err) {
    console.error(`[cdiscount] ${err.message}`);
  }
  return results;
}
