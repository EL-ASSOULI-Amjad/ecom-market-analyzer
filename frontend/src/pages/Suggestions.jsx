import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Icon, TopBar, FilterBar, ScoreRing, ProgressBar, Skeleton, SourceTag,
} from '../components.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import {
  getScrapedProducts, runScrape, getScrapeJob,
  getTrending, getAutocomplete,
} from '../api/client.js';

// ── Country config ────────────────────────────────────────────────────────────

const COUNTRY_CFG = {
  ma: { label: 'Maroc',       flag: '🇲🇦', symbol: 'Dh',  locale: 'fr-MA',  sources: ['jumia','avito'] },
  dz: { label: 'Algérie',     flag: '🇩🇿', symbol: 'DA',  locale: 'fr-DZ',  sources: ['jumia'] },
  tn: { label: 'Tunisie',     flag: '🇹🇳', symbol: 'DT',  locale: 'fr-TN',  sources: ['jumia'] },
  fr: { label: 'France',      flag: '🇫🇷', symbol: '€',   locale: 'fr-FR',  sources: ['amazon'] },
  de: { label: 'Allemagne',   flag: '🇩🇪', symbol: '€',   locale: 'de-DE',  sources: ['amazon'] },
  gb: { label: 'Royaume-Uni', flag: '🇬🇧', symbol: '£',   locale: 'en-GB',  sources: ['amazon'] },
  us: { label: 'États-Unis',  flag: '🇺🇸', symbol: '$',   locale: 'en-US',  sources: ['amazon'] },
  sa: { label: 'Arabie',      flag: '🇸🇦', symbol: 'ر.س', locale: 'ar-SA',  sources: ['amazon'] },
  ae: { label: 'Émirats',     flag: '🇦🇪', symbol: 'د.إ', locale: 'ar-AE',  sources: ['amazon'] },
  eg: { label: 'Égypte',      flag: '🇪🇬', symbol: 'E£',  locale: 'ar-EG',  sources: ['jumia'] },
};

// Static fallback trends shown when Google Trends / Reddit return nothing
const FALLBACK_TRENDS = {
  ma: ['iphone','laptop','écouteurs bluetooth','montre connectée','tapis yoga','parfum','sac à main','coques téléphone','chaussures sport','télévision 4K','robot cuisine','enceinte bluetooth'],
  dz: ['iphone','laptop','écouteurs','montre','parfum','sac','chaussures','télévision','aspirateur'],
  tn: ['iphone','laptop','écouteurs','montre connectée','parfum','chaussures','télévision'],
  fr: ['airpods','robot cuiseur','vélo électrique','smart tv','montre connectée','écouteurs','ordinateur portable'],
  de: ['laptop','kopfhörer','smartwatch','kaffeemaschine','smartphone'],
  gb: ['iphone','gaming chair','coffee machine','trainers','smart tv','airpods'],
  us: ['airpods','gaming laptop','standing desk','smartwatch','kindle','robot vacuum'],
  sa: ['iphone','laptop','smartwatch','airpods','parfum'],
  ae: ['iphone','laptop','smartwatch','parfum','chaussures'],
  eg: ['iphone','laptop','écouteurs','sac','chaussures'],
};

const USD_SOURCES  = new Set(['aliexpress','temu','alibaba']);
const CURRENCY_MAP = { USD: '$', EUR: '€', GBP: '£', MAD: 'Dh', DZD: 'DA', TND: 'DT', SAR: 'ر.س', AED: 'د.إ', EGP: 'E£' };

function formatPrice(product, countryCode) {
  if (product.price == null) return '—';
  const cfg    = COUNTRY_CFG[countryCode] ?? COUNTRY_CFG.ma;
  const symbol = (USD_SOURCES.has(product.source) || product.currency === 'USD')
    ? (CURRENCY_MAP[product.currency] ?? '$')
    : cfg.symbol;
  try { return `${product.price.toLocaleString(cfg.locale)} ${symbol}`; }
  catch { return `${product.price} ${symbol}`; }
}

// ── Autocomplete hook ─────────────────────────────────────────────────────────

function useAutocomplete(query, country) {
  const [suggestions, setSuggestions] = useState([]);
  const timer = useRef(null);
  useEffect(() => {
    clearTimeout(timer.current);
    if (!query || query.length < 2) { setSuggestions([]); return; }
    timer.current = setTimeout(async () => {
      try { setSuggestions((await getAutocomplete(query, country)) ?? []); }
      catch  { setSuggestions([]); }
    }, 350);
    return () => clearTimeout(timer.current);
  }, [query, country]);
  return suggestions;
}

// ── Search + Scrape bar (single input) ───────────────────────────────────────
// query / onQueryChange  → live filter of product list (debounced by parent)
// onScrape               → triggered by Enter or "Lancer" button

function ScrapeBar({ query, onQueryChange, onScrape, country, scrapeStatus, scrapeMsg }) {
  const [showAC, setShowAC] = useState(false);
  const ac = useAutocomplete(query, country);

  function submit(q) {
    const trimmed = (q ?? query).trim();
    if (!trimmed) return;
    onQueryChange(trimmed);
    setShowAC(false);
    onScrape(trimmed);
  }

  const borderColor = scrapeStatus === 'done' ? '#22c55e' : scrapeStatus === 'error' ? '#ef4444' : '#4f46e5';

  return (
    <div style={{ position: 'relative', marginBottom: 4 }}>
      <div style={{ display: 'flex', gap: 8, background: 'var(--surface)', borderRadius: 10, border: `1px solid ${borderColor}`, padding: '6px 8px', alignItems: 'center' }}>
        <Icon name="search" size={16} color="var(--text-muted)"/>
        <input
          value={query}
          onChange={e => { onQueryChange(e.target.value); setShowAC(true); }}
          onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setShowAC(false); }}
          onFocus={() => ac.length && setShowAC(true)}
          onBlur={() => setTimeout(() => setShowAC(false), 180)}
          placeholder="Chercher ou scraper un produit…"
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14 }}
        />
        {scrapeStatus === 'running'
          ? <span style={{ fontSize: 13, color: '#a5b4fc', padding: '5px 10px' }}>⏳</span>
          : <button onClick={() => submit()} style={{ padding: '5px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Lancer</button>
        }
      </div>

      {/* Autocomplete */}
      {showAC && ac.length > 0 && (
        <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
          {ac.map((s, i) => (
            <button key={i} onMouseDown={() => submit(s)}
              style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--text)', textAlign: 'left', cursor: 'pointer', fontSize: 13, borderBottom: i < ac.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <Icon name="search" size={11} color="var(--text-muted)"/> &nbsp;{s}
            </button>
          ))}
        </div>
      )}

      {scrapeMsg && (
        <p style={{ margin: '5px 0 0', fontSize: 12, color: scrapeStatus === 'error' ? '#f87171' : scrapeStatus === 'done' ? '#86efac' : '#a5b4fc' }}>
          {scrapeMsg}
        </p>
      )}
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({ p, countryCode, onAnalyze }) {
  const [hovered, setHovered] = useState(false);
  const BADGE_COLOR = { trending: '#6366F1', bestseller: '#f59e0b', opportunity: '#22c55e' };
  const BADGE_LABEL = { trending: '🔥 Trending', bestseller: '⭐ Bestseller', opportunity: '💡 Opportunité' };
  const trendDir = p.trendData?.trendDirection;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onAnalyze(p)}
      style={{
        background: 'var(--surface)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        border: `1px solid ${hovered ? '#4f46e5' : 'var(--border)'}`,
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(79,70,229,0.25)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      {/* Image */}
      <div style={{ height: 160, background: 'var(--bg)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {p.imageUrl
          ? <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }}/>
          : <Icon name="package" size={40} color="var(--text-muted)"/>
        }
        {p.badge && (
          <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: BADGE_COLOR[p.badge] ?? '#6366F1', color: '#fff' }}>
            {BADGE_LABEL[p.badge] ?? p.badge}
          </span>
        )}
        {p.discountPct > 0 && (
          <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#dc2626', color: '#fff' }}>
            -{p.discountPct}%
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {p.title}
          </p>
          <ScoreRing score={p.potentialScore ?? 50} size={36}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#a5b4fc' }}>{formatPrice(p, countryCode)}</span>
          {p.originalPrice && p.originalPrice > p.price && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              {formatPrice({ ...p, price: p.originalPrice }, countryCode)}
            </span>
          )}
        </div>

        {p.trendScore != null && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
              <span>Tendance {trendDir === 'up' ? '📈' : trendDir === 'down' ? '📉' : '➡️'}</span>
              <span style={{ color: p.trendScore > 60 ? '#86efac' : 'var(--text-muted)' }}>{p.trendScore}/100</span>
            </div>
            <ProgressBar value={p.trendScore} color={p.trendScore > 60 ? '#22c55e' : p.trendScore > 35 ? '#f59e0b' : '#ef4444'} height={3}/>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
          <SourceTag source={p.source}/>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {p.rating     && <span style={{ fontSize: 11, color: '#fbbf24' }}>★ {p.rating.toFixed(1)}</span>}
            {p.reviewCount > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({p.reviewCount.toLocaleString()})</span>}
            {p.soldCount  > 0 && <span style={{ fontSize: 10, color: '#86efac' }}>{p.soldCount.toLocaleString()}+</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Trending sidebar ──────────────────────────────────────────────────────────

const SOURCE_CHIP_COLOR = {
  jumia: '#f97316', avito: '#3b82f6', amazon: '#f59e0b',
  aliexpress: '#ef4444', temu: '#8b5cf6', alibaba: '#f59e0b',
};

function TrendingSidebar({ country, onSearch, onAnalyze }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTrending(country)
      .then(data => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setItems(data);
        } else {
          setItems((FALLBACK_TRENDS[country] ?? FALLBACK_TRENDS.ma).map(q => ({
            query: q, traffic: 0, source: 'curated',
          })));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setItems((FALLBACK_TRENDS[country] ?? FALLBACK_TRENDS.ma).map(q => ({
            query: q, traffic: 0, source: 'curated',
          })));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [country]);

  // Products from DB have a `title` field; fallback query objects do not
  const isProducts = items.length > 0 && items[0]?.title != null;
  const isLive     = items.length > 0 && items[0]?.source !== 'curated';

  return (
    <div style={{ width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <Icon name="trending" size={13} color="#a5b4fc"/>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tendances</span>
        {isLive && <span style={{ fontSize: 9, color: '#86efac', fontWeight: 700, background: 'rgba(34,197,94,0.12)', padding: '1px 5px', borderRadius: 4 }}>LIVE</span>}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>
        {isProducts ? 'Produits les plus demandés' : isLive ? 'Niches en tendance' : 'Niches populaires à explorer'}
      </p>

      {loading
        ? Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} height={isProducts ? 56 : 30} rounded={6}/>)
        : isProducts
          ? items.slice(0, 10).map((p, i) => (
              <button key={p._id ?? i}
                onClick={() => onAnalyze ? onAnalyze(p) : onSearch(p.query)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'border-color 0.12s, background 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = 'rgba(79,70,229,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
              >
                {/* Thumbnail */}
                <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--bg)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }}/>
                    : <Icon name="package" size={20} color="var(--text-muted)"/>}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                    {p.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                    {p.price != null && (
                      <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700 }}>
                        {formatPrice(p, country)}
                      </span>
                    )}
                    <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 4, background: (SOURCE_CHIP_COLOR[p.source] ?? '#6366f1') + '28', color: SOURCE_CHIP_COLOR[p.source] ?? '#a5b4fc', fontWeight: 700 }}>
                      {p.source}
                    </span>
                  </div>
                </div>
                {/* Trend score bubble */}
                {p.trendScore != null && (
                  <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: p.trendScore > 60 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: p.trendScore > 60 ? '#86efac' : '#fbbf24' }}>
                    {p.trendScore}
                  </div>
                )}
              </button>
            ))
          : items.slice(0, 14).map((t, i) => (
              <button key={i} onClick={() => onSearch(t.query)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 9px', background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--text)',
                  textAlign: 'left', transition: 'border-color 0.12s, background 0.12s', width: '100%',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = 'rgba(79,70,229,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, marginRight: 5 }}>#{i + 1}</span>
                  {t.query}
                </span>
                {t.traffic > 1000 && (
                  <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 4, flexShrink: 0 }}>
                    {t.traffic >= 100000 ? `${Math.round(t.traffic / 1000)}K` : t.traffic}
                  </span>
                )}
              </button>
            ))
      }

      <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
        {isProducts ? 'Cliquer pour analyser' : isLive ? 'Source: Autocomplete + Reddit' : 'Cliquer pour filtrer ou scraper'}
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PageSuggestions({ onAnalyze }) {
  const { country: settingsCountry } = useSettings();
  const [country,  setCountry]  = useState(settingsCountry ?? 'ma');

  // Single query drives both the filter AND the scrape bar
  const [query,    setQuery]    = useState('');
  const [source,   setSource]   = useState('');
  const [sort,     setSort]     = useState('-potentialScore');

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);

  // Scrape status (separate from the product-load loading)
  const [scrapeStatus, setScrapeStatus] = useState('idle');
  const [scrapeMsg,    setScrapeMsg]    = useState('');

  // Debounce the query so we only hit the DB after the user stops typing
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimer = useRef(null);

  function handleQueryChange(val) {
    setQuery(val);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(val), 400);
  }

  const LIMIT = 20;
  const cfg   = COUNTRY_CFG[country] ?? COUNTRY_CFG.ma;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { country, sort, page: p, limit: LIMIT };
      if (debouncedQuery.trim()) params.query = debouncedQuery.trim();
      if (source)                params.source = source;
      const { products: data, total: t } = await getScrapedProducts(params);
      setProducts(data ?? []);
      setTotal(t ?? 0);
      setPage(p);
    } catch { setProducts([]); setTotal(0); }
    finally { setLoading(false); }
  }, [country, debouncedQuery, source, sort]);

  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  useEffect(() => { load(1); }, [load]);

  // ── Scrape handler ───────────────────────────────────────────────────────────
  async function handleScrape(q) {
    const trimmed = (q ?? query).trim();
    if (!trimmed) return;
    setScrapeStatus('running');
    setScrapeMsg('Scraping en cours…');
    try {
      const { jobId } = await runScrape(trimmed, null, 1, country);
      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const job = await getScrapeJob(jobId);
          if (job.status === 'completed') {
            setScrapeStatus('done');
            setScrapeMsg(`✓ ${job.productsFound} produits trouvés (${job.newProducts} nouveaux)`);
            loadRef.current(1);
          } else if (job.status === 'failed') {
            setScrapeStatus('error'); setScrapeMsg(job.error ?? 'Échec');
          } else if (attempts < 40) {
            setTimeout(poll, 3000);
          } else {
            setScrapeStatus('error'); setScrapeMsg('Timeout — relancer manuellement');
          }
        } catch { setTimeout(poll, 4000); }
      };
      setTimeout(poll, 3000);
    } catch (err) {
      setScrapeStatus('error'); setScrapeMsg(err.message ?? 'Erreur réseau');
    }
  }

  // Clicking a trending term fills search AND auto-launches scrape if no results
  function handleTrendClick(q) {
    handleQueryChange(q);
    // Small delay so debounce can fire and check if we have data
    setTimeout(async () => {
      try {
        const { total: t } = await getScrapedProducts({ country, query: q, limit: 1 });
        if (t === 0) handleScrape(q); // nothing in DB → scrape automatically
      } catch { /* ignore */ }
    }, 500);
  }

  const sources = cfg.sources.map(s => ({
    value: s,
    label: { jumia:'Jumia', avito:'Avito', hmall:'Hmall', marjane:'Marjane', amazon:'Amazon', aliexpress:'AliExpress', dhgate:'DHgate', temu:'Temu', alibaba:'Alibaba' }[s] ?? s,
  }));
  const pages = Math.ceil(total / LIMIT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <TopBar title="Suggestions Produits" subtitle={`${total} produits analysés`}>
        <select value={country} onChange={e => { setCountry(e.target.value); setQuery(''); setDebouncedQuery(''); setScrapeStatus('idle'); setScrapeMsg(''); }}
          style={{ padding: '5px 10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
          {Object.entries(COUNTRY_CFG).map(([code, c]) => (
            <option key={code} value={code}>{c.flag} {c.label}</option>
          ))}
        </select>
      </TopBar>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* ── Main content ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          <ScrapeBar
            query={query}
            onQueryChange={handleQueryChange}
            onScrape={handleScrape}
            country={country}
            scrapeStatus={scrapeStatus}
            scrapeMsg={scrapeMsg}
          />

          <FilterBar
            filters={[
              { key: 'source', label: 'Source', options: sources },
              { key: 'sort',   label: 'Tri',    options: [
                { value: '-potentialScore', label: 'Score ↓' },
                { value: '-trendScore',     label: 'Tendance ↓' },
                { value: 'price',           label: 'Prix ↑' },
                { value: '-price',          label: 'Prix ↓' },
                { value: '-soldCount',      label: 'Ventes ↓' },
                { value: '-rating',         label: 'Note ↓' },
              ]},
            ]}
            values={{ source, sort }}
            onChange={(key, val) => {
              if (key === 'source') setSource(val);
              if (key === 'sort')   setSort(val);
            }}
          />

          {/* Section label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="zap" size={13} color="#a5b4fc"/>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {debouncedQuery ? `Résultats pour "${debouncedQuery}"` : `Meilleures opportunités — ${cfg.flag} ${cfg.label}`}
            </span>
          </div>

          {/* Grid */}
          {loading
            ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={280} rounded={12}/>)}
              </div>
            : products.length === 0
              ? <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Icon name="search" size={36} color="var(--text-muted)"/>
                  <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 14 }}>
                    {debouncedQuery
                      ? `Aucun résultat pour "${debouncedQuery}" — cliquez Lancer pour scraper`
                      : 'Aucun produit — cliquez sur une tendance ou lancez un scraping'}
                  </p>
                </div>
              : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
                  {products.map(p => <ProductCard key={p._id} p={p} countryCode={country} onAnalyze={onAnalyze}/>)}
                </div>
          }

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingBottom: 16 }}>
              {page > 1 && <button onClick={() => load(page - 1)} style={pBtn}>◀</button>}
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => load(n)} style={{ ...pBtn, background: n === page ? '#4f46e5' : 'var(--surface)', color: n === page ? '#fff' : 'var(--text)' }}>{n}</button>
              ))}
              {page < pages && <button onClick={() => load(page + 1)} style={pBtn}>▶</button>}
            </div>
          )}
        </div>

        {/* ── Trending sidebar ── */}
        <div style={{ borderLeft: '1px solid var(--border)', padding: '14px 12px', overflowY: 'auto', flexShrink: 0 }}>
          <TrendingSidebar country={country} onSearch={handleTrendClick} onAnalyze={onAnalyze}/>
        </div>
      </div>
    </div>
  );
}

const pBtn = {
  padding: '4px 11px', background: 'var(--surface)', color: 'var(--text)',
  border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: 12,
};
