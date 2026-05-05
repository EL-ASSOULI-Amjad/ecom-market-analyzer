import axios from 'axios';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../utils/parsePrice.js';

const delay = ms => new Promise(r => setTimeout(r, ms));

const UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
];

// aep_usuc_f tells AliExpress: global site, USD, Morocco region, English
const AE_COOKIE = 'aep_usuc_f=site%3Dglb%26c_tp%3DUSD%26region%3DMA%26b_locale%3Den_US; xman_us_f=x_locale%3Den_US%26x_site%3Dglb';

function getHeaders(json = false) {
  return {
    'User-Agent':      UAS[Math.floor(Math.random() * UAS.length)],
    Accept:            json ? 'application/json, */*' : 'text/html,application/xhtml+xml,*/*;q=0.9',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    Cookie:            AE_COOKIE,
    Referer:           'https://www.aliexpress.com/',
    Connection:        'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };
}

// Brace-matched JSON extraction from an inline JS variable
function extractJSVar(html, varName) {
  const tag   = `${varName} = `;
  const idx   = html.indexOf(tag);
  if (idx === -1) return null;
  const start = html.indexOf('{', idx + tag.length);
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (esc)       { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; } }
    }
  }
  return null;
}

function parseSoldCount(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/\s/g, '').toLowerCase();
  const k = s.match(/(\d+(?:\.\d+)?)[kk]/);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const n = s.match(/(\d+)/);
  return n ? parseInt(n[1], 10) : null;
}

function mapItem(item, eval_, trade, imageUrl) {
  const sku = item.sku?.def ?? {};
  const priceRaw = sku.actSkuCalPrice ?? sku.skuCalPrice ?? sku.actSkuBulkCalPrice
    ?? item.salePrice?.minAmount?.value ?? item.price?.minAmount?.value ?? null;
  return {
    title:       item.title ?? item.name ?? null,
    price:       priceRaw != null ? parseFloat(priceRaw) : null,
    currency:    'USD',
    source:      'aliexpress',
    url:         `https://www.aliexpress.com/item/${item.itemId ?? item.productId}.html`,
    imageUrl:    imageUrl ? (imageUrl.startsWith('//') ? `https:${imageUrl}` : imageUrl) : null,
    rating:      parseFloat(eval_?.averageStar ?? eval_?.starRating ?? item.averageStarRate ?? item.feedbackRating?.averageStar ?? 0) || null,
    reviewCount: parseInt(eval_?.totalValidNum ?? item.feedbackRating?.totalValidNum ?? 0, 10) || null,
    soldCount:   parseSoldCount(trade?.realSales ?? trade?.tradeDesc ?? item.totalSoldCount),
    discountPct: 0,
  };
}

// ── Strategy A: internal JSON search API ──────────────────────────────────────
async function tryJsonApi(query, page) {
  const url = `https://www.aliexpress.com/glosearch/api/product?q=${encodeURIComponent(query)}&origin=y&page=${page}&sortType=total_tranRanking_desc`;
  const { data } = await axios.get(url, { headers: getHeaders(true), timeout: 20_000 });

  const items =
    data?.mods?.itemList?.content ??
    data?.data?.result?.resultList?.map(r => r.item ?? r) ??
    data?.result?.resultList ??
    [];

  return items.map(item => mapItem(
    item,
    item.evaluation ?? item.feedbackRating,
    item.trade,
    item.imageUrl ?? item.image?.imgUrl,
  )).filter(p => p.title && p.price);
}

// ── Strategy B: HTML page + window.runParams extraction ───────────────────────
async function tryHtmlRunParams(query, page) {
  const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&sortType=total_tranRanking_desc&page=${page}`;
  const { data } = await axios.get(url, { headers: getHeaders(), timeout: 25_000 });

  const rp = extractJSVar(data, 'window.runParams');
  if (!rp) return [];

  const list =
    rp?.data?.result?.resultList ??
    rp?.data?.mods?.itemList?.content ??
    [];

  return list.map(entry => {
    const item  = entry.item  ?? entry;
    const eval_ = entry.evaluation ?? item.evaluation ?? {};
    const trade = entry.trade ?? item.trade ?? {};
    return mapItem(item, eval_, trade, item.image?.imgUrl ?? item.imageUrl);
  }).filter(p => p.title && p.price);
}

// ── Strategy C: mobile site (less bot protection) ─────────────────────────────
async function tryMobileSite(query, page) {
  const url = `https://m.aliexpress.com/wholesale.html?SearchText=${encodeURIComponent(query)}&page=${page}`;
  const { data } = await axios.get(url, {
    headers: { ...getHeaders(), Accept: 'text/html,*/*' },
    timeout: 22_000,
  });
  const $ = cheerio.load(data);
  const results = [];

  $('[class*="product"], [data-item], .list-items li').each((_, el) => {
    const $el   = $(el);
    const title = $el.find('[class*="title"], h3').first().text().trim();
    const price = parsePrice($el.find('[class*="price"]').first().text());
    const href  = $el.find('a').first().attr('href') ?? '';
    const img   = $el.find('img').first().attr('src') ?? $el.find('img').first().attr('data-src');
    if (!title || !price) return;
    results.push({
      title, price, currency: 'USD', source: 'aliexpress',
      url: href.startsWith('http') ? href : href.startsWith('//') ? `https:${href}` : `https://m.aliexpress.com${href}`,
      imageUrl: img ?? null, discountPct: 0,
    });
  });

  return results;
}

// ── Strategy D: Cheerio on desktop HTML ──────────────────────────────────────
async function tryDesktopHtml(query, page) {
  const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}&sortType=total_tranRanking_desc&page=${page}`;
  const { data } = await axios.get(url, { headers: getHeaders(), timeout: 25_000 });
  const $ = cheerio.load(data);
  const results = [];

  $('[class*="manhattan--open"] [class*="item"], [class*="product-snippet"], ' +
    '[data-item-type="normal"], .list-items .item, [class*="search-item"]').each((_, el) => {
    const $el   = $(el);
    const title = $el.find('[class*="title"]').first().text().trim() || $el.find('h3,h2').first().text().trim();
    const price = parsePrice($el.find('[class*="price"]').first().text());
    const href  = $el.find('a').first().attr('href') ?? '';
    const img   = $el.find('img').first().attr('src') ?? $el.find('img').first().attr('data-src');
    if (!title || !price) return;
    results.push({
      title, price, currency: 'USD', source: 'aliexpress',
      url: href.startsWith('http') ? href : `https://www.aliexpress.com${href}`,
      imageUrl: img ?? null, discountPct: 0,
    });
  });

  return results;
}

export async function scrapeAliexpress(query, pages = 1) {
  const results = [];

  for (let page = 1; page <= pages; page++) {
    let items = [];

    // Try each strategy — move to next if current returns empty OR throws
    const strategies = [tryJsonApi, tryHtmlRunParams, tryMobileSite, tryDesktopHtml];
    for (const strategy of strategies) {
      if (items.length > 0) break;
      try { items = await strategy(query, page); }
      catch (e) { console.warn(`[aliexpress] ${strategy.name} failed: ${e.message?.slice(0, 80)}`); }
    }

    if (items.length > 0) {
      console.log(`[aliexpress] "${query}" page ${page}: ${items.length} results`);
      results.push(...items);
    } else {
      console.warn(`[aliexpress] all strategies returned 0 for "${query}" page ${page}`);
      break;
    }

    if (page < pages) await delay(2500 + Math.random() * 1500);
  }

  const seen = new Set();
  return results.filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true; });
}
