import axios from 'axios';

const base = import.meta.env.VITE_API_BASE_URL ?? '';
const http = axios.create({ baseURL: base });

// ── Scraping ──────────────────────────────────────────────────────────────────
export const runScrape       = (query, sources, pages, country) =>
  http.post('/api/scrape/run',      { query, sources, pages, country }).then(r => r.data);
export const getScrapeJobs   = (limit = 10) =>
  http.get('/api/scrape/jobs',      { params: { limit } }).then(r => r.data);
export const getScrapeJob    = id =>
  http.get(`/api/scrape/jobs/${id}`).then(r => r.data);
export const getScrapedProducts = params =>
  http.get('/api/scrape/products',  { params }).then(r => r.data);
export const getProductDetail = id =>
  http.get(`/api/scrape/products/${id}`).then(r => r.data);
export const getScrapeStats  = (country) =>
  http.get('/api/scrape/stats',     { params: country ? { country } : {} }).then(r => r.data);
export const getScrapeQueries = (country) =>
  http.get('/api/scrape/queries',   { params: country ? { country } : {} }).then(r => r.data);
export const getCountries    = () =>
  http.get('/api/scrape/countries').then(r => r.data);
export const getTopQueries   = (country) =>
  http.get('/api/scrape/top-queries', { params: country ? { country } : {} }).then(r => r.data);
export const getTrending     = (country) =>
  http.get('/api/scrape/trending',    { params: { country } }).then(r => r.data);
export const getAutocomplete = (q, country) =>
  http.get('/api/scrape/autocomplete', { params: { q, country } }).then(r => r.data);

// ── Legacy / managed data ─────────────────────────────────────────────────────
export const getProducts   = ()       => http.get('/api/products').then(r => r.data);
export const getKpi        = ()       => http.get('/api/kpi').then(r => r.data);
export const getRevenue    = ()       => http.get('/api/revenue').then(r => r.data);
export const getCategories = ()       => http.get('/api/categories').then(r => r.data);
export const getStores     = ()       => http.get('/api/stores').then(r => r.data);
export const getReports    = ()       => http.get('/api/reports').then(r => r.data);
