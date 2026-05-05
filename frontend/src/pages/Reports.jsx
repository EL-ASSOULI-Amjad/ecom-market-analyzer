import { useState, useEffect } from 'react';
import { TopBar, Icon, Skeleton, SourceTag } from '../components.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { getScrapeJobs, getScrapeQueries, runScrape } from '../api/client.js';

const STATUS_CFG = {
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: 'Terminé'   },
  running:   { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'En cours'  },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Échoué'    },
};

const COUNTRY_SOURCES = {
  ma: ['jumia','avito'],
  dz: ['jumia'],
  tn: ['jumia'],
  fr: ['amazon'],
  de: ['amazon'],
  gb: ['amazon'],
  us: ['amazon'],
  sa: ['amazon'],
  ae: ['amazon'],
  eg: ['jumia'],
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-MA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function dur(start, end) {
  if (!start || !end) return '—';
  const s = Math.round((new Date(end) - new Date(start)) / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function PageReports() {
  const { country } = useSettings();
  const [jobs,    setJobs]    = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const activeSources = COUNTRY_SOURCES[country] ?? COUNTRY_SOURCES.ma;
  const [form,    setForm]    = useState({ query: '', sources: activeSources, pages: 2 });
  const [msg,     setMsg]     = useState(null);

  useEffect(() => {
    setForm(f => ({ ...f, sources: COUNTRY_SOURCES[country] ?? COUNTRY_SOURCES.ma }));
  }, [country]);

  useEffect(() => {
    Promise.all([getScrapeJobs(30), getScrapeQueries(country)])
      .then(([j, q]) => { setJobs(j ?? []); setQueries(q ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    getScrapeJobs(30).then(j => setJobs(j ?? [])).catch(() => {});
  };

  const toggleSource = s => setForm(f => ({
    ...f,
    sources: f.sources.includes(s) ? f.sources.filter(x => x !== s) : [...f.sources, s],
  }));

  const handleRun = async () => {
    if (!form.query.trim() || form.sources.length === 0) {
      setMsg({ type: 'error', text: 'Entrez un mot-clé et choisissez au moins une source.' });
      return;
    }
    setRunning(true);
    setMsg(null);
    try {
      const res = await runScrape(form.query.trim(), form.sources, form.pages, country);
      setMsg({ type: 'ok', text: `Job lancé (ID: ${res.jobId}). Résultats disponibles dans quelques minutes.` });
      refresh();
    } catch {
      setMsg({ type: 'error', text: 'Échec du lancement. Vérifiez que le backend est actif.' });
    } finally {
      setRunning(false);
    }
  };

  const completed = jobs.filter(j => j.status === 'completed').length;
  const failed    = jobs.filter(j => j.status === 'failed').length;
  const total     = jobs.reduce((s, j) => s + (j.productsFound ?? 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title="Rapports & Historique" subtitle="Historique des scrapings + lancement manuel">
        <button onClick={refresh}
          style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="refresh" size={11}/> Actualiser
        </button>
      </TopBar>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Summary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            { icon: '📋', label: 'Jobs total',    value: loading ? '…' : jobs.length },
            { icon: '✅', label: 'Terminés',       value: loading ? '…' : completed },
            { icon: '❌', label: 'Échoués',        value: loading ? '…' : failed },
            { icon: '📦', label: 'Produits scrap.', value: loading ? '…' : total.toLocaleString('fr-MA') },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 16, alignItems: 'start' }}>

          {/* Launch form */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Nouveau Scraping</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Mot-clé produit</label>
              <input
                value={form.query}
                onChange={e => setForm(f => ({ ...f, query: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleRun()}
                placeholder="ex: téléphone portable, laptop gaming…"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '8px 12px', color: 'rgba(255,255,255,0.85)', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box' }}
              />
              {queries.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                  {queries.slice(0, 8).map(q => (
                    <button key={q} onClick={() => setForm(f => ({ ...f, query: q }))}
                      style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, background: form.query === q ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.04)', border: form.query === q ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)', color: form.query === q ? '#a5b4fc' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Sources</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {activeSources.map(s => (
                  <button key={s} onClick={() => toggleSource(s)}
                    style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: form.sources.includes(s) ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)', background: form.sources.includes(s) ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', color: form.sources.includes(s) ? '#a5b4fc' : 'rgba(255,255,255,0.35)' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Pages par source: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{form.pages}</strong></label>
              <input type="range" min={1} max={5} value={form.pages} onChange={e => setForm(f => ({ ...f, pages: +e.target.value }))}
                style={{ accentColor: '#6366F1', width: '100%' }}/>
            </div>

            {msg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 11, background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, color: msg.type === 'ok' ? '#86efac' : '#fca5a5' }}>
                {msg.text}
              </div>
            )}

            <button onClick={handleRun} disabled={running}
              style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: running ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.8)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {running ? <><Icon name="loader" size={13}/> Lancement…</> : <><Icon name="play" size={13}/> Lancer le scraping</>}
            </button>
          </div>

          {/* Jobs table */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>Historique des jobs</h3>
            </div>
            {loading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={40} rounded={8}/>)}
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                Aucun job — lancez votre premier scraping.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                      {['Requête', 'Sources', 'Statut', 'Produits', 'Durée', 'Date'].map(h => (
                        <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(j => {
                      const cfg = STATUS_CFG[j.status] ?? STATUS_CFG.failed;
                      return (
                        <tr key={j._id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, maxWidth: 160 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.query}</div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {(j.sources ?? []).map(s => <SourceTag key={s} source={s}/>)}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
                              {j.status === 'running' && <span style={{ display: 'inline-block', marginRight: 4, animation: 'spin 1s linear infinite' }}>⟳</span>}
                              {cfg.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.6)' }}>
                            {j.productsFound != null ? (
                              <span>{j.productsFound} <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>(+{j.newProducts ?? 0})</span></span>
                            ) : '—'}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                            {dur(j.startedAt, j.completedAt)}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.35)', fontSize: 11, whiteSpace: 'nowrap' }}>
                            {fmt(j.startedAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Auto-schedule info */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Icon name="clock" size={14} color="rgba(99,102,241,0.8)"/>
            <h3 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Scraping automatique</h3>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: 0, lineHeight: 1.7 }}>
            Un scraping automatique tourne <strong style={{ color: 'rgba(255,255,255,0.6)' }}>toutes les 6 heures</strong> sur les requêtes: téléphone portable, laptop maroc, television led, électroménager, parfum, chaussures sport, sac femme.
            <br/>Sources: Jumia · Avito · Hmall · Marjane · Shopify Maroc.
          </p>
        </div>

      </div>
    </div>
  );
}
