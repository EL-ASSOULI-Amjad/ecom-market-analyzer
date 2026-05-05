import { useState, useEffect } from 'react';
import { TopBar, Icon, ProgressBar, Skeleton, SourceTag, SOURCE_COLORS } from '../components.jsx';
import { getScrapeStats, getScrapedProducts } from '../api/client.js';

const MAD = n => n != null ? `${n.toLocaleString('fr-MA')} Dh` : '—';

export default function PageStores() {
  const [stats,    setStats]    = useState(null);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      getScrapeStats(),
      getScrapedProducts({ sort: '-potentialScore', limit: 10 }),
    ]).then(([s, d]) => {
      setStats(s);
      setProducts(d.products ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sourceBreakdown = stats?.sourceBreakdown ?? [];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title="Analyse Multi-Sources" subtitle="Comparaison des performances sur toutes les plateformes marocaines"/>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={160} rounded={14}/>)}
          </div>
        ) : (
          <>
            {/* Source cards */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, sourceBreakdown.length)},1fr)`, gap: 12 }}>
              {sourceBreakdown.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
                  Aucune source encore scrapée. Lancez un scraping depuis la page Suggestions.
                </div>
              ) : sourceBreakdown.map(s => {
                const sc = SOURCE_COLORS[s._id] ?? { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', label: s._id };
                return (
                  <div key={s._id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="store" size={13} color={sc.color}/>
                      </div>
                      <SourceTag source={s._id}/>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Produits',    value: s.count.toString() },
                        { label: 'Prix moyen',  value: MAD(Math.round(s.avgPrice ?? 0)) },
                        { label: 'Score IA moy', value: `${Math.round(s.avgScore ?? 0)}/100`, color: (s.avgScore ?? 0) >= 65 ? '#22c55e' : '#f59e0b' },
                      ].map(m => (
                        <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{m.label}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: m.color ?? 'rgba(255,255,255,0.75)', fontFamily: "'JetBrains Mono',monospace" }}>{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comparison matrix */}
            {products.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Top produits par potentiel</h3>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Score 0–100</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.025)' }}>
                        {['Produit', 'Source', 'Prix', 'Remise', 'Demande', 'Concurrence', 'Potentiel', 'Recommandation'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const score = p.potentialScore ?? 50;
                        const sc = score >= 78 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444';
                        return (
                          <tr key={p._id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.025)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, maxWidth: 200 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                            </td>
                            <td style={{ padding: '10px 14px' }}><SourceTag source={p.source}/></td>
                            <td style={{ padding: '10px 14px', fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.75)' }}>{MAD(p.price)}</td>
                            <td style={{ padding: '10px 14px', color: p.discountPct > 0 ? '#22c55e' : 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono',monospace' " }}>{p.discountPct > 0 ? `-${p.discountPct}%` : '—'}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <div style={{ width: 60 }}><ProgressBar value={p.demandScore ?? 50} color="#3B82F6" height={4}/></div>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: p.competitionLevel === 'Faible' ? 'rgba(34,197,94,0.15)' : p.competitionLevel === 'Élevée' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: p.competitionLevel === 'Faible' ? '#22c55e' : p.competitionLevel === 'Élevée' ? '#ef4444' : '#f59e0b' }}>
                                {p.competitionLevel ?? '—'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 22, borderRadius: 6, background: `${sc}18`, color: sc, fontSize: 11, fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>{score}</span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: sc }}>{p.orderReco?.action ?? '—'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Source discovery info */}
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '18px 20px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Sources disponibles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { id: 'jumia',  label: 'Jumia.ma',  desc: 'Marketplace Maroc',        flag: '🛒' },
                  { id: 'avito',  label: 'Avito.ma',  desc: 'Annonces classifiées',      flag: '📌' },
                  { id: 'amazon', label: 'Amazon',     desc: 'EU / US / SA / AE',        flag: '📦' },
                ].map(src => {
                  const sc = SOURCE_COLORS[src.id] ?? { bg: 'rgba(255,255,255,0.05)', color: '#fff' };
                  const found = sourceBreakdown.find(s => s._id === src.id);
                  return (
                    <div key={src.id} style={{ borderRadius: 10, padding: '12px 14px', background: found ? sc.bg : 'rgba(255,255,255,0.02)', border: `1px solid ${found ? sc.color + '44' : 'rgba(255,255,255,0.05)'}`, opacity: found ? 1 : 0.5 }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{src.flag}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: found ? sc.color : 'rgba(255,255,255,0.4)' }}>{src.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{src.desc}</div>
                      {found && <div style={{ fontSize: 10, color: sc.color, marginTop: 4, fontFamily: "'JetBrains Mono',monospace" }}>{found.count} produits</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
