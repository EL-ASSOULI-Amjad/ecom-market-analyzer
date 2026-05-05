/**
 * trendService — multi-source demand intelligence
 *
 * Sources:
 *   1. Google Trends  — real search interest over time (via google-trends-api)
 *   2. Reddit         — community buzz (public JSON API, no auth)
 *   3. Google Autocomplete — what people are actually typing (free, no key)
 *
 * All results are cached:
 *   - getTrendData              6 h
 *   - discoverTrendingQueries   4 h
 *   - getAutocompleteSuggestions 1 h
 */

import { createRequire } from 'module';
import axios from 'axios';

const require = createRequire(import.meta.url);

let googleTrends = null;
try {
  googleTrends = require('google-trends-api');
} catch (e) {
  console.warn('[trendService] google-trends-api not installed:', e.message);
}

// ISO-2 country → Google geo code + locale + local subreddits
const GEO = {
  ma: { geo: 'MA', hl: 'fr', reddit: ['r/morocco', 'r/Maroc'] },
  dz: { geo: 'DZ', hl: 'fr', reddit: ['r/algeria'] },
  tn: { geo: 'TN', hl: 'fr', reddit: ['r/Tunisia'] },
  fr: { geo: 'FR', hl: 'fr', reddit: ['r/france', 'r/AskFrance'] },
  de: { geo: 'DE', hl: 'de', reddit: ['r/de', 'r/Germany'] },
  gb: { geo: 'GB', hl: 'en', reddit: ['r/unitedkingdom'] },
  us: { geo: 'US', hl: 'en', reddit: ['r/deals', 'r/frugal', 'r/Flipping'] },
  sa: { geo: 'SA', hl: 'ar', reddit: ['r/saudiarabia'] },
  ae: { geo: 'AE', hl: 'ar', reddit: ['r/dubai'] },
  eg: { geo: 'EG', hl: 'ar', reddit: ['r/egypt'] },
  tr: { geo: 'TR', hl: 'tr', reddit: ['r/Turkey'] },
};

const trendCache    = new Map();
const discoverCache = new Map();
const acCache       = new Map();

const TTL_TREND    = 6 * 3_600_000;
const TTL_DISCOVER = 4 * 3_600_000;
const TTL_AC       = 1 * 3_600_000;

// ── Google Trends: interest over time ────────────────────────────────────────

async function googleInterestOverTime(keyword, country) {
  if (!googleTrends) return { score: 50, direction: 'stable', regionPeak: null };
  const { geo, hl } = GEO[country] ?? GEO.ma;
  const startTime   = new Date(Date.now() - 90 * 86_400_000);

  const raw    = await googleTrends.interestOverTime({ keyword, geo, startTime, hl });
  const parsed = JSON.parse(raw);
  const points = parsed?.default?.timelineData ?? [];
  if (points.length < 3) return { score: 50, direction: 'stable', regionPeak: null };

  const values  = points.map(p => p.value?.[0] ?? 0);
  const nonZero = values.filter(v => v > 0);
  const score   = nonZero.length
    ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length)
    : 0;

  const third  = Math.max(1, Math.floor(values.length / 3));
  const early  = values.slice(0, third).reduce((a, b) => a + b, 0) / third;
  const late   = values.slice(-third).reduce((a, b) => a + b, 0) / third;
  const direction = late > early * 1.15 ? 'up' : late < early * 0.85 ? 'down' : 'stable';

  let regionPeak = null;
  try {
    const regRaw  = await googleTrends.interestByRegion({ keyword, geo, resolution: 'REGION', hl });
    const regions = JSON.parse(regRaw)?.default?.geoMapData ?? [];
    if (regions.length) {
      regionPeak = regions.sort((a, b) => (b.value?.[0] ?? 0) - (a.value?.[0] ?? 0))[0]?.geoName ?? null;
    }
  } catch { /* non-fatal */ }

  return { score, direction, regionPeak };
}

// ── Reddit: community buzz ────────────────────────────────────────────────────

async function getRedditMentions(query, country) {
  const { reddit } = GEO[country] ?? GEO.ma;
  let mentions = 0;

  try {
    const resp = await axios.get('https://www.reddit.com/search.json', {
      params: { q: query, limit: 25, sort: 'new', t: 'month' },
      headers: { 'User-Agent': 'AIMarketAnalyzer/1.0 (educational research)' },
      timeout: 8_000,
    });
    mentions = resp.data?.data?.children?.length ?? 0;
  } catch { /* non-fatal */ }

  // Country subreddit mentions count double
  for (const sub of (reddit ?? [])) {
    try {
      const resp = await axios.get(`https://www.reddit.com/${sub}/search.json`, {
        params: { q: query, limit: 15, sort: 'hot', restrict_sr: 1 },
        headers: { 'User-Agent': 'AIMarketAnalyzer/1.0' },
        timeout: 6_000,
      });
      mentions += (resp.data?.data?.children?.length ?? 0) * 2;
    } catch { /* non-fatal */ }
  }

  return Math.min(mentions, 50);
}

// ── Google Autocomplete — what people are actually typing ─────────────────────

export async function getAutocompleteSuggestions(query, country = 'ma') {
  const key = `ac:${query.toLowerCase()}:${country}`;
  const hit = acCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.data;

  const { hl } = GEO[country] ?? GEO.ma;
  let suggestions = [];

  try {
    const resp = await axios.get('https://suggestqueries.google.com/complete/search', {
      params: { client: 'firefox', q: query, hl, gl: country.toUpperCase() },
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 6_000,
    });
    const arr = Array.isArray(resp.data) && Array.isArray(resp.data[1]) ? resp.data[1] : [];
    suggestions = arr.slice(0, 8);
  } catch { /* non-fatal */ }

  acCache.set(key, { data: suggestions, exp: Date.now() + TTL_AC });
  return suggestions;
}

// ── Daily trending query discovery ───────────────────────────────────────────

const ECOM_KEYWORDS = [
  'buy','price','cheap','review','best','phone','laptop','shoes','bag','watch',
  'camera','tv','headphones','deal','order',
  'acheter','prix','pas cher','meilleur','téléphone','ordinateur','chaussure',
  'sac','montre','casque','offre','commande','livraison',
  'شراء','سعر','رخيص','أفضل','هاتف','لابتوب',
  'samsung','apple','iphone','xiaomi','huawei','nike','adidas','temu','aliexpress',
];

function isEcomRelated(term) {
  const lower = term.toLowerCase();
  return ECOM_KEYWORDS.some(kw => lower.includes(kw));
}

// Product-category seeds per country — starting points for autocomplete expansion.
// These generate specific, scrapeable queries instead of relying on Google Daily Trends
// (which returns news/politics, not products).
const CATEGORY_SEEDS = {
  ma: ['iphone', 'laptop', 'écouteurs bluetooth', 'montre connectée', 'sac', 'chaussures sport', 'télévision 4K', 'parfum', 'robot cuisine', 'enceinte bluetooth'],
  dz: ['iphone', 'laptop', 'écouteurs', 'montre connectée', 'parfum', 'chaussures', 'télévision', 'aspirateur'],
  tn: ['iphone', 'laptop', 'écouteurs', 'montre connectée', 'parfum', 'chaussures', 'smart tv'],
  fr: ['iphone', 'airpods', 'laptop', 'montre connectée', 'robot cuiseur', 'vélo électrique', 'smart tv'],
  de: ['laptop', 'kopfhörer', 'smartwatch', 'kaffeemaschine', 'smartphone', 'tablet'],
  gb: ['iphone', 'airpods', 'laptop', 'smartwatch', 'gaming chair', 'coffee machine'],
  us: ['airpods', 'gaming laptop', 'smartwatch', 'kindle', 'robot vacuum', 'standing desk'],
  sa: ['iphone', 'laptop', 'smartwatch', 'airpods', 'parfum', 'gaming'],
  ae: ['iphone', 'laptop', 'smartwatch', 'parfum', 'gaming', 'camera'],
  eg: ['iphone', 'laptop', 'écouteurs', 'montre', 'chaussures', 'téléviseur'],
};

export async function discoverTrendingQueries(country = 'ma') {
  const key = `discover:${country}`;
  const hit = discoverCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.data;

  let trending = [];
  const seeds = CATEGORY_SEEDS[country] ?? CATEGORY_SEEDS.ma;

  // 1. Autocomplete expansion — each seed yields specific queries people are actually typing
  for (const seed of seeds.slice(0, 6)) {
    try {
      const suggestions = await getAutocompleteSuggestions(seed, country);
      for (const s of suggestions.slice(0, 4)) {
        trending.push({ query: s, traffic: 800, source: 'autocomplete' });
      }
      trending.push({ query: seed, traffic: 1000, source: 'seed' });
    } catch { /* non-fatal */ }
  }

  // 2. Reddit hot posts from global shopping subs only.
  // Local country subs (r/morocco etc.) post news/politics, not products — keep them
  // out of discovery and only use them in getRedditMentions for buzz scoring.
  for (const sub of ['r/deals', 'r/ProductReviews', 'r/shutupandtakemymoney']) {
    try {
      const resp = await axios.get(`https://www.reddit.com/${sub}/hot.json?limit=25`, {
        headers: { 'User-Agent': 'AIMarketAnalyzer/1.0' },
        timeout: 6_000,
      });
      for (const post of resp.data?.data?.children ?? []) {
        const title = post.data?.title ?? '';
        const score = post.data?.score ?? 0;
        if (title && score > 30) trending.push({ query: title, traffic: score, source: 'reddit' });
      }
    } catch { /* non-fatal */ }
  }

  const seen = new Set();
  const filtered = trending
    .filter(t => isEcomRelated(t.query))
    .sort((a, b) => b.traffic - a.traffic)
    .filter(t => { const k = t.query.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, 20);

  discoverCache.set(key, { data: filtered, exp: Date.now() + TTL_DISCOVER });
  console.log(`[trendService] discovered ${filtered.length} trending queries for ${country}`);
  return filtered;
}

// ── Main export: per-query trend data (used by scraperService) ────────────────

export async function getTrendData(query, country = 'ma') {
  const key = `trend:${query.toLowerCase()}:${country}`;
  const hit = trendCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.data;

  // Run Google + Reddit in parallel; neither blocks the other
  const [googleResult, redditResult] = await Promise.allSettled([
    googleInterestOverTime(query, country),
    getRedditMentions(query, country),
  ]);

  const g  = googleResult.status === 'fulfilled' ? googleResult.value : { score: 50, direction: 'stable', regionPeak: null };
  const rm = redditResult.status === 'fulfilled'  ? redditResult.value  : 0;

  // 70% Google Trends + 30% Reddit buzz
  const trendScore = Math.min(100, Math.max(0,
    Math.round(g.score * 0.70 + Math.min(30, rm * 0.8)),
  ));

  const data = {
    trendScore,
    googleTrend:    g.score,
    redditMentions: rm,
    trendDirection: g.direction,
    regionPeak:     g.regionPeak,
  };
  trendCache.set(key, { data, exp: Date.now() + TTL_TREND });
  console.log(`[trendService] "${query}" (${country}) → score=${trendScore} dir=${g.direction} reddit=${rm}`);
  return data;
}
