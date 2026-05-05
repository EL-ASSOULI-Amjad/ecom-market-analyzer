import ScrapedProduct from '../models/ScrapedProduct.js';
import ScrapingJob    from '../models/ScrapingJob.js';

// ── Working scrapers ──────────────────────────────────────────────────────────
import { scrapeJumia }       from './scrapers/jumia.js';
import { scrapeAvito }       from './scrapers/avito.js';
import { scrapeHmall }       from './scrapers/hmall.js';
import { scrapeMarjane }     from './scrapers/marjane.js';
import { scrapeAmazon }      from './scrapers/amazon.js';
import { scrapeAliexpress }  from './scrapers/aliexpress.js';
import { scrapeTemu }        from './scrapers/temu.js';
import { scrapeAlibaba }     from './scrapers/alibaba.js';
import { scrapeDhgate }      from './scrapers/dhgate.js';

// ── Utilities ─────────────────────────────────────────────────────────────────
import { getTrendData, discoverTrendingQueries } from './trendService.js';
import { bestQueryFor }                          from '../utils/queryExpander.js';
import { COUNTRIES }                             from '../config/countries.js';

// Classified ad platforms — no reviews by design, score differently
const CLASSIFIED = new Set(['avito', 'leboncoin', 'ouedkniss', 'tayara']);

// ── Demand score ─────────────────────────────────────────────────────────────

function computeDemandScore(product) {
  if (CLASSIFIED.has(product.source)) {
    let score = 52;
    if ((product.discountPct ?? 0) >= 15) score += 8;
    if ((product.priceHistory?.length ?? 0) > 1) score += 6;
    return Math.min(100, score);
  }

  let score = 28;
  const r  = product.rating      ?? 0;
  const rc = product.reviewCount ?? 0;
  const sc = product.soldCount   ?? null;

  if (r >= 4.5) score += 25;
  else if (r >= 4.0) score += 18;
  else if (r >= 3.5) score += 11;
  else if (r > 0)    score += 4;

  if      (rc > 5000) score += 25;
  else if (rc > 1000) score += 20;
  else if (rc > 200)  score += 14;
  else if (rc > 50)   score += 8;
  else if (rc > 0)    score += 3;

  if (sc !== null) {
    if      (sc > 1000) score += 22;
    else if (sc > 200)  score += 16;
    else if (sc > 50)   score += 9;
    else if (sc > 0)    score += 4;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── Potential score ───────────────────────────────────────────────────────────

function computePotentialScore(product, queryAvgPrice, queryListingCount, trendScore = 50) {
  let score = 28;

  // Price advantage vs query average — only compare same-currency products
  if (queryAvgPrice && product.price) {
    const pct = (queryAvgPrice - product.price) / queryAvgPrice;
    score += Math.min(22, Math.max(-12, Math.round(pct * 35)));
  }

  // Demand signal (max +18)
  const demand = computeDemandScore(product);
  score += Math.round((demand / 100) * 18);

  // Market-level trend from Google Trends + Reddit (max +22)
  score += Math.round((trendScore / 100) * 22);

  // Trend direction bonus (±5)
  const dir = product.trendData?.trendDirection ?? 'stable';
  if (dir === 'up')   score += 5;
  if (dir === 'down') score -= 4;

  // Discount = seller motivation (max +8)
  score += Math.min(8, Math.round((product.discountPct ?? 0) * 0.32));

  // Market saturation (max ±12)
  if      (queryListingCount <= 3)  score += 12;
  else if (queryListingCount <= 10) score += 8;
  else if (queryListingCount <= 25) score += 3;
  else if (queryListingCount > 80)  score -= 8;
  else if (queryListingCount > 50)  score -= 4;

  // Price history drop = motivated seller (max ±8)
  const history = product.priceHistory ?? [];
  if (history.length > 1) {
    const oldest = history[0].price;
    const latest = history[history.length - 1].price;
    const drop   = (oldest - latest) / oldest;
    if      (drop > 0.10) score += 8;
    else if (drop > 0.03) score += 4;
    else if (drop < -0.10) score -= 6;
    else if (drop < -0.03) score -= 2;
  }

  // Proven sales velocity (max +5)
  const sc = product.soldCount;
  if (sc !== null) {
    if      (sc > 500) score += 5;
    else if (sc > 100) score += 3;
    else if (sc > 0)   score += 1;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ── Order recommendation ──────────────────────────────────────────────────────

function computeOrderReco(potentialScore, demandScore, trendDirection = 'stable') {
  const ps  = potentialScore;
  const ds  = demandScore;
  const up  = trendDirection === 'up'   ? ' 📈 Tendance en hausse.' : '';
  const dn  = trendDirection === 'down' ? ' 📉 Tendance en baisse.' : '';

  if (ps >= 75) {
    const base = Math.min(200, 60 + Math.round((ds / 100) * 90));
    return { action: 'À lancer', minUnits: Math.round(base * 0.6), maxUnits: base, confidence: 'élevée',
      reasoning: `Score ${ps}/100 — forte demande marché + bon positionnement prix.${up}${dn} Commander en volume.` };
  }
  if (ps >= 60) {
    const base = Math.min(70, 25 + Math.round((ds / 100) * 35));
    return { action: 'À tester', minUnits: Math.round(base * 0.5), maxUnits: base, confidence: 'moyenne',
      reasoning: `Score ${ps}/100 — potentiel modéré.${up}${dn} Tester avec un petit lot.` };
  }
  if (ps >= 42) {
    return { action: 'Tester prudemment', minUnits: 5, maxUnits: 20, confidence: 'faible',
      reasoning: `Score ${ps}/100 — marché incertain.${up}${dn} Minimum pour valider la niche.` };
  }
  return { action: 'À éviter', minUnits: 0, maxUnits: 5, confidence: 'très faible',
    reasoning: `Score ${ps}/100 — demande faible ou marché saturé.${up}${dn} Risque élevé.` };
}

function deriveBadge(ps, discountPct, dir) {
  if (ps >= 75 || (ps >= 68 && dir === 'up')) return 'trending';
  if (ps >= 60) return 'bestseller';
  if (discountPct >= 15 || ps >= 45) return 'opportunity';
  return null;
}

function deriveStatusColor(ps) {
  if (ps >= 65) return 'green';
  if (ps >= 42) return 'orange';
  return 'red';
}

// ── Enrichment — runs after all products saved for a query ───────────────────

export async function enrichQuery(query, country = 'ma') {
  const products = await ScrapedProduct.find({ query, country });
  if (!products.length) return;

  // Group by currency to compute per-currency averages (USD vs MAD don't mix)
  const byCurrency = {};
  for (const p of products) {
    const cur = p.currency ?? 'MAD';
    if (!byCurrency[cur]) byCurrency[cur] = [];
    byCurrency[cur].push(p);
  }

  const avgByCurrency = {};
  for (const [cur, ps] of Object.entries(byCurrency)) {
    const prices = ps.map(p => p.price).filter(Boolean);
    avgByCurrency[cur] = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  }

  const count = products.length;

  let trend = { trendScore: 50, trendDirection: 'stable', googleTrend: 50, redditMentions: 0, regionPeak: null };
  try { trend = await getTrendData(query, country); }
  catch (err) { console.warn(`[scraperService] trendData failed for "${query}": ${err.message}`); }

  for (const p of products) {
    const cur        = p.currency ?? 'MAD';
    const avgPrice   = avgByCurrency[cur] ?? null;
    const demand     = computeDemandScore(p);
    const potential  = computePotentialScore(p, avgPrice, count, trend.trendScore);
    const priceSpread = avgPrice && p.price
      ? Math.round(((avgPrice - p.price) / avgPrice) * 100) : 0;

    p.demandScore      = demand;
    p.potentialScore   = potential;
    p.priceSpread      = priceSpread;
    p.competitionLevel = count <= 5 ? 'Faible' : count <= 25 ? 'Moyenne' : 'Élevée';
    p.badge            = deriveBadge(potential, p.discountPct, trend.trendDirection);
    p.statusColor      = deriveStatusColor(potential);
    p.orderReco        = computeOrderReco(potential, demand, trend.trendDirection);
    p.trendScore       = trend.trendScore;
    p.trendData        = {
      googleTrend:    trend.googleTrend,
      redditMentions: trend.redditMentions,
      trendDirection: trend.trendDirection,
      regionPeak:     trend.regionPeak,
    };
    p.aiScore = potential;
    await p.save();
  }
}

// ── Upsert ────────────────────────────────────────────────────────────────────

async function upsertProduct(raw, query, country = 'ma') {
  const existing = await ScrapedProduct.findOne({ url: raw.url });

  if (existing) {
    if (raw.price != null && raw.price !== existing.price) {
      existing.priceHistory.push({ price: raw.price, scrapedAt: new Date() });
    }
    Object.assign(existing, {
      price:         raw.price         ?? existing.price,
      originalPrice: raw.originalPrice ?? existing.originalPrice,
      discountPct:   raw.discountPct   ?? existing.discountPct,
      currency:      raw.currency      ?? existing.currency ?? 'MAD',
      imageUrl:      raw.imageUrl      ?? existing.imageUrl,
      rating:        raw.rating        ?? existing.rating,
      reviewCount:   raw.reviewCount   ?? existing.reviewCount,
      soldCount:     raw.soldCount     ?? existing.soldCount,
      category:      raw.category      ?? existing.category,
      country,
      lastScraped:   new Date(),
    });
    await existing.save();
    return { isNew: false };
  }

  await new ScrapedProduct({
    ...raw,
    query,
    country,
    currency:     raw.currency ?? 'MAD',
    priceHistory: raw.price != null ? [{ price: raw.price }] : [],
  }).save();
  return { isNew: true };
}

// ── Scraper map ───────────────────────────────────────────────────────────────
// Each entry is a function: (query, pages, country) → Promise<product[]>
// For wholesale sources we translate the query to English first.

const SCRAPER_MAP = {
  jumia:      (q, pages, country)  => scrapeJumia(q, pages, country),
  avito:      (q)                  => scrapeAvito(q),
  hmall:      (q)                  => scrapeHmall(q),
  marjane:    (q)                  => scrapeMarjane(q),
  amazon:     (q, pages, country)  => scrapeAmazon(q, pages, country),
  aliexpress: (q, pages)           => scrapeAliexpress(bestQueryFor(q, 'aliexpress'), pages),
  temu:       (q, pages, country)  => scrapeTemu(bestQueryFor(q, 'temu'), pages, country),
  alibaba:    (q, pages)           => scrapeAlibaba(bestQueryFor(q, 'alibaba'), pages),
  dhgate:     (q, pages)           => scrapeDhgate(bestQueryFor(q, 'dhgate'), pages),
};

// ── Public: start a scrape job ────────────────────────────────────────────────

export async function startScrapeJob({ query, sources, pages = 1, country = 'ma' }) {
  const cfg           = COUNTRIES[country] ?? COUNTRIES.ma;
  const activeSources = sources ?? cfg.sources;
  const job           = await ScrapingJob.create({ sources: activeSources, query, country, status: 'running' });
  _executeScrape(job._id, query, activeSources, pages, country).catch(err =>
    console.error('[scraperService] unhandled error:', err),
  );
  return job._id;
}

async function _executeScrape(jobId, query, sources, pages, country) {
  let totalFound = 0, newCount = 0, errorMsg = null;

  try {
    for (const source of sources) {
      const fn = SCRAPER_MAP[source];
      if (!fn) { console.warn(`[scraperService] unknown source: ${source}`); continue; }
      let raws = [];
      try {
        raws = await fn(query, pages, country);
        raws = raws.map(r => ({ ...r, category: r.category ?? query }));
        console.log(`[scraperService] ${source}: ${raws.length} results`);
      } catch (err) {
        console.error(`[scraperService] ${source} failed: ${err.message}`);
        continue;
      }
      for (const raw of raws) {
        try {
          const { isNew } = await upsertProduct(raw, query, country);
          totalFound++;
          if (isNew) newCount++;
        } catch (err) {
          if (err.code !== 11000) console.error('[scraperService] upsert:', err.message);
        }
      }
    }

    await enrichQuery(query, country);
  } catch (err) {
    errorMsg = err.message;
    console.error('[scraperService] fatal:', err);
  }

  await ScrapingJob.findByIdAndUpdate(jobId, {
    status:        errorMsg ? 'failed' : 'completed',
    productsFound: totalFound,
    newProducts:   newCount,
    error:         errorMsg,
    completedAt:   new Date(),
  });
}

// ── Auto-discovery: scrape trending queries in the background ─────────────────
// Called by the cron job in server.js

export async function autoDiscoverAndScrape(country = 'ma') {
  console.log(`[scraperService] autoDiscoverAndScrape for ${country}`);
  let trending = [];
  try { trending = await discoverTrendingQueries(country); }
  catch (e) { console.warn('[scraperService] discoverTrending failed:', e.message); return; }

  // Scrape only wholesale sources so we don't hammer local marketplaces
  const wholesaleSources = ['aliexpress', 'temu'];
  const cfg = COUNTRIES[country] ?? COUNTRIES.ma;
  const sources = wholesaleSources.filter(s => cfg.sources.includes(s));

  // Process top 5 trending queries sequentially to stay polite
  for (const { query } of trending.slice(0, 5)) {
    try {
      await startScrapeJob({ query, sources, pages: 1, country });
      // Stagger requests by 30 s
      await new Promise(r => setTimeout(r, 30_000));
    } catch (e) {
      console.warn(`[autoDiscover] ${query}: ${e.message}`);
    }
  }
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getScraperStats(country) {
  const matchStage = country ? [{ $match: { country } }] : [];
  const filter     = country ? { country } : {};

  const [total, priceResult, sourceBreakdown, queryBreakdown, lastJob] =
    await Promise.all([
      ScrapedProduct.countDocuments(filter),
      ScrapedProduct.aggregate([
        ...matchStage,
        { $group: { _id: null, avg: { $avg: '$price' }, min: { $min: '$price' }, max: { $max: '$price' } } },
      ]),
      ScrapedProduct.aggregate([
        ...matchStage,
        { $group: { _id: '$source', count: { $sum: 1 }, avgPrice: { $avg: '$price' }, avgScore: { $avg: '$potentialScore' }, avgTrend: { $avg: '$trendScore' } } },
      ]),
      ScrapedProduct.aggregate([
        ...matchStage,
        { $group: { _id: '$query', count: { $sum: 1 }, avgScore: { $avg: '$potentialScore' }, avgTrend: { $avg: '$trendScore' } } },
        { $sort: { avgScore: -1 } },
        { $limit: 8 },
      ]),
      ScrapingJob.findOne(country ? { country } : {}).sort({ createdAt: -1 }),
    ]);

  return { totalProducts: total, avgPrice: Math.round(priceResult[0]?.avg ?? 0),
    minPrice: priceResult[0]?.min ?? 0, maxPrice: priceResult[0]?.max ?? 0,
    sourceBreakdown, queryBreakdown, lastJob };
}
