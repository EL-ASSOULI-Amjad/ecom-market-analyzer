import { Router }         from 'express';
import ScrapedProduct     from '../models/ScrapedProduct.js';
import ScrapingJob        from '../models/ScrapingJob.js';
import { startScrapeJob, getScraperStats } from '../services/scraperService.js';
import { discoverTrendingQueries, getAutocompleteSuggestions } from '../services/trendService.js';
import { COUNTRIES, SOURCE_LABELS }        from '../config/countries.js';

const router = Router();

// POST /api/scrape/run  { query, sources?, pages?, country? }
// Starts a background scraping job; returns jobId immediately.
router.post('/run', async (req, res) => {
  const { query, sources, pages = 1, country = 'ma' } = req.body;
  if (!query?.trim()) return res.status(400).json({ message: 'query is required' });

  try {
    const jobId = await startScrapeJob({ query: query.trim(), sources, pages, country });
    res.json({ jobId, message: `Scraping "${query}" lancé` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/jobs?limit=20
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await ScrapingJob.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit ?? 20, 10));
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/jobs/:id
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await ScrapingJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job introuvable' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/products?query=&source=&country=&sort=-aiScore&page=1&limit=24
router.get('/products', async (req, res) => {
  try {
    const { query, source, country, sort = '-aiScore', page = 1, limit = 24 } = req.query;
    const filter = {};
    if (query)   filter.query   = { $regex: query, $options: 'i' };
    if (source)  filter.source  = source;
    if (country) filter.country = country;

    const [products, total] = await Promise.all([
      ScrapedProduct.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .select('-priceHistory'),   // omit history on list view
      ScrapedProduct.countDocuments(filter),
    ]);

    res.json({ products, total, page: parseInt(page, 10), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/products/:id  (includes full priceHistory)
router.get('/products/:id', async (req, res) => {
  try {
    const p = await ScrapedProduct.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/stats?country=
router.get('/stats', async (req, res) => {
  try {
    const { country } = req.query;
    res.json(await getScraperStats(country));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/queries?country=  – distinct queries scraped so far
router.get('/queries', async (req, res) => {
  try {
    const { country } = req.query;
    const filter = country ? { country } : {};
    const queries = await ScrapedProduct.distinct('query', filter);
    res.json(queries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/countries  – available country configs + source labels
router.get('/countries', (_req, res) => {
  res.json({ countries: COUNTRIES, sourceLabels: SOURCE_LABELS });
});

// GET /api/scrape/trending?country=ma&limit=10
// Returns top trending products from MongoDB sorted by trend + potential score
router.get('/trending', async (req, res) => {
  try {
    const { country = 'ma', limit = 10 } = req.query;
    const select = 'title imageUrl price currency source query trendScore potentialScore trendData discountPct badge';
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

    let products = await ScrapedProduct.find({
      country,
      trendScore: { $gt: 0 },
      scrapedAt: { $gte: sevenDaysAgo },
    })
      .sort({ trendScore: -1, potentialScore: -1 })
      .limit(parseInt(limit, 10))
      .select(select);

    // Fall back to all-time best if last 7 days is thin
    if (products.length < 5) {
      products = await ScrapedProduct.find({ country, trendScore: { $gt: 0 } })
        .sort({ trendScore: -1, potentialScore: -1 })
        .limit(parseInt(limit, 10))
        .select(select);
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/autocomplete?q=laptop&country=ma
// Returns Google Autocomplete suggestions for a partial query
router.get('/autocomplete', async (req, res) => {
  try {
    const { q = '', country = 'ma' } = req.query;
    if (!q.trim()) return res.json([]);
    const suggestions = await getAutocompleteSuggestions(q.trim(), country);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/scrape/top-queries?country=  – top 10 niches by avg potential score
router.get('/top-queries', async (req, res) => {
  try {
    const { country } = req.query;
    const matchStage = country ? [{ $match: { country } }] : [];

    const data = await ScrapedProduct.aggregate([
      ...matchStage,
      {
        $group: {
          _id:            '$query',
          count:          { $sum: 1 },
          avgScore:       { $avg: '$potentialScore' },
          avgTrend:       { $avg: '$trendScore' },
          trendDirection: { $first: '$trendData.trendDirection' },
          sources:        { $addToSet: '$source' },
          avgPrice:       { $avg: '$price' },
          topProduct:     { $first: '$$ROOT' },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      {
        $project: {
          query:          '$_id',
          count:          1,
          avgScore:       { $round: ['$avgScore', 0] },
          avgTrend:       { $round: ['$avgTrend', 0] },
          trendDirection: 1,
          sources:        1,
          avgPrice:       { $round: ['$avgPrice', 0] },
          topImage:       '$topProduct.imageUrl',
          _id:            0,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
