# SmartScraper — AI Market Analyzer

A multi-source e-commerce scraper and scoring engine that finds products worth reselling by combining price positioning, demand signals, and trend data (Google Trends + Reddit) into a single 0–100 "potential score" with a buy/test/avoid recommendation.

<!-- TODO: confirm — add a one-line author/purpose blurb if this was built for a specific course (project name suggests "Projet PFA", i.e. a French-system final-year project) -->
⚠️ **Note:** yes, I did use Claude for this project because I wanted to see how much I can increase my productivity while working on this project and to adapt to the new job market trend (using ai).

Dropshippers and small e-commerce sellers manually check multiple marketplaces (Jumia, Avito, Amazon, AliExpress, Temu, ...) to spot which products are cheap relative to the market, trending, and not oversaturated. This project automates that: it scrapes several sources for a given search query, cross-references live demand signals, and scores each listing so a seller can decide how many units to order.

<!-- TODO: confirm the original motivation/target audience if different from the above inference -->

## Tech stack

**Backend** — Node.js (ESM, `"type": "module"`)
- Express 4.19
- Mongoose 8.4 (MongoDB)
- axios 1.7 + cheerio 1.0 — static HTML scraping
- puppeteer-core 24.42 + puppeteer-extra 3.3 + puppeteer-extra-plugin-stealth 2.11 — headless-browser scraping for JS-heavy sites
- google-trends-api 4.9 — Google Trends data
- node-cron 3.0 — scheduled background jobs
- dotenv 16.4, cors 2.8
- nodemon 3.1 (dev)

**Frontend** — React 18.3 + Vite 5.3
- axios 1.7 for API calls
- @vitejs/plugin-react 4.3
- No CSS framework or component library — hand-rolled inline styles + a shared `components.jsx`

**Database**: MongoDB (via Mongoose, no version pinned — `MONGO_URI` connection string)

**Root**: npm workspace-style orchestration via `concurrently` 8.2 (not an actual npm workspace — `backend` and `frontend` are separate `package.json`s wired together with `--prefix`)

No test runner, linter, Docker setup, or CI config is present in the repo.


- The frontend never talks to MongoDB directly; everything goes through the Express REST API, proxied by Vite (`/api` → `http://localhost:5000`) in dev, or via `VITE_API_BASE_URL` in a production build.
- Scraping runs asynchronously: `POST /api/scrape/run` creates a `ScrapingJob` document and returns immediately; the actual scraping + scoring happens in the background and the frontend polls `GET /api/scrape/jobs/:id`.
- `scraperService.js` re-scores an entire query's listings together (`enrichQuery`) so scores are relative to that query's own price/competition distribution, not absolute.

## Features

- **Multi-source scraping** — 9 sources are actively wired: `jumia`, `avito`, `hmall`, `marjane`, `amazon`, `aliexpress`, `temu`, `alibaba`, `dhgate` ([scraperService.js](backend/services/scraperService.js) `SCRAPER_MAP`). Jumia/Avito/Amazon use plain HTTP + cheerio; wholesale sources are query-translated to English first via [queryExpander.js](backend/utils/queryExpander.js).
- **7 additional scraper modules exist but aren't wired into the active map**: `ebay`, `cdiscount`, `leboncoin`, `ouedkniss`, `shopify`, `tayara`, `trendyol`. <!-- TODO: confirm whether these are in-progress or dead code -->
- **Headless-browser scraping** ([headless.js](backend/services/scrapers/headless.js)) via `puppeteer-extra` + stealth plugin, intended for Temu/Alibaba. Per a code comment in [countries.js](backend/config/countries.js), both currently fail from Moroccan IPs (Temu forces login, Alibaba serves a CAPTCHA) without residential proxies or a CAPTCHA-solving service.
- **Scoring engine** — computes a `demandScore` (ratings, review count, sold count) and a `potentialScore` (price vs. market average, demand, trend momentum, discount, listing count/saturation, price-drop history, sales velocity), then derives a badge (`trending` / `bestseller` / `opportunity`), a traffic-light `statusColor`, and an order recommendation (unit range + confidence) — see [scraperService.js](backend/services/scraperService.js).
- **Trend intelligence** ([trendService.js](backend/services/trendService.js)) — blends Google Trends interest-over-time (70%) with Reddit mention counts (30%), plus Google Autocomplete for live search suggestions and trending-query discovery. Results are cached in-memory (6h / 4h / 1h TTLs, non-persistent).
- **Scheduled jobs** ([server.js](backend/server.js)) — cron rotates through 8 curated seed queries every 6 hours, and auto-discovers + scrapes trending wholesale queries every 8 hours.
- **Multi-country config** — 10 countries (MA, DZ, TN, FR, DE, GB, US, SA, AE, EG) each mapped to currency, locale, and applicable sources ([countries.js](backend/config/countries.js)).
- **React dashboard** with 7 pages: Suggestions (search + live scrape + autocomplete), Dashboard (KPIs + charts), Analysis (single-product deep dive with price history and competitors), Stores, Stock (traffic-light reorder view), Reports, Settings.
- **i18n** — FR / EN / AR (with RTL layout for Arabic), theme (dark/light) and target-country preference persisted to `localStorage` ([SettingsContext.jsx](frontend/src/context/SettingsContext.jsx)).
- **Legacy/demo endpoints** — `/api/products`, `/api/kpi`, `/api/revenue`, `/api/categories`, `/api/stores`, `/api/reports` and `backend/seed/seed.js` populate a separate, static mock dataset. The current UI pages all consume the live `/api/scrape/*` endpoints instead — these legacy routes appear to be left over from an earlier iteration. <!-- TODO: confirm if these are still needed or can be removed -->
- A **standalone single-file prototype** (`AI Market Analyzer.html` + `components.jsx` + `data.js` + `tweaks-panel.jsx` at the repo root) loads React/Babel from a CDN with no build step — an earlier, self-contained version of the dashboard kept alongside the real `frontend/` app. <!-- TODO: confirm if this should be kept, moved to a `/prototype` folder, or deleted -->

## Getting started

### Prerequisites

- Node.js (ESM support required — no `engines` field is declared in any `package.json`; use a current LTS) <!-- TODO: confirm minimum Node version -->
- A running MongoDB instance (local or hosted) — no Docker Compose file is provided for this
- For Temu/Alibaba scraping only: a local Chrome install — the path is hardcoded to `C:\Program Files\Google\Chrome\Application\chrome.exe` in [headless.js](backend/services/scrapers/headless.js), i.e. **Windows-only as written**. Not required for the other 7 sources.

### Install

```bash
cd Projet_PFA_SmartScraper
npm run install:all
```

This runs `npm install --prefix backend && npm install --prefix frontend` ([package.json](package.json)).

### Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env` ([.env.example](backend/.env.example)):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ecom_platform
CLIENT_ORIGIN=http://localhost:5173
```

`frontend/.env` ([.env.example](frontend/.env.example)) — only needed for a production build, since the Vite dev server proxies `/api` to `localhost:5000`:
```
VITE_API_BASE_URL=http://localhost:5000
```

### Run

```bash
npm run dev
```

Runs backend (`nodemon server.js`) and frontend (`vite`) concurrently ([package.json](package.json)). Backend listens on `:5000`, frontend on `:5173`.

Optional — seed the legacy demo collections (`Product`, `KpiMetrics`, `RevenueData`, `Category`, `Store`, `Report`); this does **not** populate the scraped-product data the main UI uses:
```bash
npm run seed
```

Open `http://localhost:5173`.

## Usage

The frontend drives everything through the REST API. Key endpoints ([routes/scrape.js](backend/routes/scrape.js)):

**Health check**
```bash
curl http://localhost:5000/api/health
```

**Start a scrape job** (runs in the background, returns a job ID immediately):
```bash
curl -X POST http://localhost:5000/api/scrape/run \
  -H "Content-Type: application/json" \
  -d '{"query": "montre connectée", "country": "ma", "sources": ["jumia", "avito"], "pages": 2}'
```

**Poll job status:**
```bash
curl http://localhost:5000/api/scrape/jobs/<jobId>
```

**List scraped products, sorted by potential score:**
```bash
curl "http://localhost:5000/api/scrape/products?query=montre&sort=-potentialScore&limit=24"
```

**Top trending products for a country:**
```bash
curl "http://localhost:5000/api/scrape/trending?country=ma&limit=10"
```

**Aggregate stats (used by the Dashboard page):**
```bash
curl "http://localhost:5000/api/scrape/stats?country=ma"
```

**Search-as-you-type suggestions:**
```bash
curl "http://localhost:5000/api/scrape/autocomplete?q=lapt&country=ma"
```

## Project structure

```
Projet_PFA_SmartScraper/
├── package.json                    # root orchestration (install:all, dev, seed)
├── backend/
│   ├── server.js                   # Express app entry point + cron schedules
│   ├── config/
│   │   ├── db.js                   # Mongoose connection
│   │   └── countries.js            # per-country source/currency/locale config
│   ├── models/                     # Mongoose schemas
│   │   ├── ScrapedProduct.js       # core product + scoring fields (used by live UI)
│   │   ├── ScrapingJob.js          # background job tracking
│   │   └── Product.js, KpiMetrics.js, RevenueData.js, Category.js, Store.js, Report.js  # legacy/demo collections
│   ├── routes/                     # one file per resource, mounted under /api/*
│   ├── services/
│   │   ├── scraperService.js       # orchestrates scrapers, upsert, scoring, order reco
│   │   ├── trendService.js         # Google Trends + Reddit + Autocomplete
│   │   └── scrapers/               # one file per source (9 active, 7 unwired)
│   ├── utils/
│   │   ├── parsePrice.js           # locale-aware price string parser
│   │   └── queryExpander.js        # FR/AR → EN translation for wholesale sources
│   └── seed/seed.js                # seeds the legacy/demo collections only
├── frontend/
│   ├── vite.config.js              # dev server + /api proxy to :5000
│   └── src/
│       ├── main.jsx / App.jsx      # entry point + page router (simple useState switch, no react-router)
│       ├── api/client.js           # all backend API calls
│       ├── context/SettingsContext.jsx  # theme / language / country, persisted to localStorage
│       ├── components.jsx          # shared UI primitives (charts, cards, badges, etc.)
│       └── pages/                  # Suggestions, Dashboard, Analysis, Stores, Stock, Reports, Settings
├── AI Market Analyzer.html         # standalone CDN-based prototype (no build step)
├── components.jsx, data.js, tweaks-panel.jsx  # supporting files for the standalone prototype
```


