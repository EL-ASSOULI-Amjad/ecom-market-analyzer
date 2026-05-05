import { useState, useEffect } from 'react';
import { TopBar, ProgressBar, StockDot, Skeleton, SourceTag } from '../components.jsx';
import { getScrapedProducts } from '../api/client.js';

const MAD = n => n != null ? `${n.toLocaleString('fr-MA')} Dh` : '—';

export default function PageStock() {
  const [products, setProducts] = useState([]);
  const [filter,   setFilter]   = useState('all');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getScrapedProducts({ sort: '-potentialScore', limit: 50 })
      .then(d => setProducts(d.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byColor = {
    green:  products.filter(p => p.statusColor === 'green'),
    orange: products.filter(p => p.statusColor === 'orange'),
    red:    products.filter(p => p.statusColor === 'red'),
  };
  const filtered = filter === 'all' ? products : products.filter(p => p.statusColor === filter);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title="Gestion de Stock Intelligente" subtitle="Recommandations IA basées sur potentiel, concurrence & tendance prix">
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3 }}>
          {[
            { k: 'all',    l: 'Tous' },
            { k: 'green',  l: '🟢 À lancer' },
            { k: 'orange', l: '🟠 À tester' },
            { k: 'red',    l: '🔴 À éviter' },
          ].map(f => (
            <button key={f.k} onClick={() => setFilter(f.k)}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: 500, background: filter === f.k ? 'rgba(99,102,241,0.3)' : 'transparent', color: filter === f.k ? '#a5b4fc' : 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
              {f.l}
            </button>
          ))}
        </div>
      </TopBar>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'Produits à lancer',   value: byColor.green.length,  icon: '🟢', sub: 'Fort potentiel de vente' },
            { label: 'Produits à tester',   value: byColor.orange.length, icon: '🟠', sub: 'Tester prudemment' },
            { label: 'Produits à éviter',   value: byColor.red.length,    icon: '🔴', sub: 'Marché saturé / risqué' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: '#fff' }}>{loading ? '…' : s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={44} rounded={8}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>
              Aucun produit disponible. Lancez un scraping depuis la page Suggestions.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                  {['Produit', 'Source', 'Prix', 'Score IA', 'Concurrence', 'Recommandation', 'Unités', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const score = p.potentialScore ?? 50;
                  const statusMap = { green: ['#22c55e', 'rgba(34,197,94,0.1)', 'À lancer'], orange: ['#f59e0b', 'rgba(245,158,11,0.1)', 'Attention'], red: ['#ef4444', 'rgba(239,68,68,0.1)', 'À éviter'] };
                  const [sc, sbg, statusLabel] = statusMap[p.statusColor] ?? statusMap.orange;
                  const reco = p.orderReco;
                  return (
                    <tr key={p._id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}><SourceTag source={p.source}/></td>
                      <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.6)' }}>{MAD(p.price)}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", color: sc, fontWeight: 600 }}>{score}</span>
                          <div style={{ width: 60 }}><ProgressBar value={score} color={sc} height={4}/></div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: p.competitionLevel === 'Faible' ? 'rgba(34,197,94,0.15)' : p.competitionLevel === 'Élevée' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: p.competitionLevel === 'Faible' ? '#22c55e' : p.competitionLevel === 'Élevée' ? '#ef4444' : '#f59e0b' }}>
                          {p.competitionLevel ?? '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: sbg, color: sc, fontSize: 10, fontWeight: 600 }}>{statusLabel}</span>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.6)' }}>
                        {reco ? `${reco.minUnits}–${reco.maxUnits}` : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <button style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${sc}44`, background: `${sc}12`, color: sc, fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {reco?.action ?? 'Analyser'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
