import express   from 'express';
import cors      from 'cors';
import dotenv    from 'dotenv';
import cron      from 'node-cron';
import connectDB from './config/db.js';

import productsRouter   from './routes/products.js';
import kpiRouter        from './routes/kpi.js';
import revenueRouter    from './routes/revenue.js';
import categoriesRouter from './routes/categories.js';
import storesRouter     from './routes/stores.js';
import reportsRouter    from './routes/reports.js';
import scrapeRouter     from './routes/scrape.js';
import { startScrapeJob, autoDiscoverAndScrape } from './services/scraperService.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/products',   productsRouter);
app.use('/api/kpi',        kpiRouter);
app.use('/api/revenue',    revenueRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/stores',     storesRouter);
app.use('/api/reports',    reportsRouter);
app.use('/api/scrape',     scrapeRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── Cron 1: rotate through curated queries every 6 h ─────────────────────────
const SEED_QUERIES = [
  { q: 'telephone portable',  country: 'ma' },
  { q: 'laptop',              country: 'ma' },
  { q: 'television led',      country: 'ma' },
  { q: 'casque bluetooth',    country: 'ma' },
  { q: 'montre connectée',    country: 'ma' },
  { q: 'chaussures sport',    country: 'ma' },
  { q: 'sac femme',           country: 'ma' },
  { q: 'parfum',              country: 'ma' },
];
let seedIdx = 0;

cron.schedule('0 */6 * * *', () => {
  const { q, country } = SEED_QUERIES[seedIdx % SEED_QUERIES.length];
  seedIdx++;
  console.log(`[cron] seed scrape: "${q}" (${country})`);
  startScrapeJob({ query: q, country, sources: ['jumia', 'avito', 'aliexpress', 'temu'], pages: 2 })
    .catch(err => console.error('[cron] seed error:', err.message));
});

// ── Cron 2: auto-discover trending products every 8 h ────────────────────────
cron.schedule('0 */8 * * *', () => {
  console.log('[cron] auto-discovering trending queries...');
  autoDiscoverAndScrape('ma').catch(err => console.error('[cron] discover error:', err.message));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
);
