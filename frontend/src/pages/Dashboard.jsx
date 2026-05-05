import { useState, useEffect } from 'react';
import { TopBar, StatCard, LineChart, DonutChart, ProgressBar, Skeleton, StockDot, SourceTag } from '../components.jsx';
import { getScrapeStats, getScrapedProducts } from '../api/client.js';

const MAD = n => n != null ? `${n.toLocaleString('fr-MA')} Dh` : '—';

export default function PageDashboard({ onAnalyze }) {
  const [stats,   setStats]   = useState(null);
  const [top,     setTop]     = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getScrapeStats(),
      getScrapedProducts({ sort: '-potentialScore', limit: 5 }),
      getScrapedProducts({ sort: 'potentialScore',  limit: 4, 'potentialScore[lt]': 40 }),
    ]).then(([s, topData, alertData]) => {
      setStats(s);
      setTop(topData.products ?? []);
      setAlerts(alertData.products ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sourceBreakdown  = stats?.sourceBreakdown ?? [];
  const queryBreakdown   = stats?.queryBreakdown  ?? [];
  const donutData = sourceBreakdown.map((s, i) => ({ name: s._id, value: s.count }));

  // Build a synthetic 6-month price trend from queryBreakdown avgPrices
  const priceData = queryBreakdown.slice(0, 6).map(q => Math.round(q.avgPrice ?? 0));
  const scoreData = queryBreakdown.slice(0, 6).map(q => Math.round(q.avgScore ?? 0));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title="Dashboard" subtitle={`Vue d'ensemble · ${stats?.totalProducts ?? '…'} produits analysés`}/>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={110} rounded={16}/>)}
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              <StatCard label="Produits scrapés" value={stats?.totalProducts ?? 0} change={`${sourceBreakdown.length} sources`} positive icon="📦" sparkData={priceData.length > 1 ? priceData : undefined}/>
              <StatCard label="Prix moyen" value={`${(stats?.avgPrice ?? 0).toLocaleString('fr-MA')} Dh`} change={`Min ${MAD(stats?.minPrice)}`} positive icon="💰" sparkData={priceData.length > 1 ? priceData : undefined}/>
              <StatCard label="Catégories" value={queryBreakdown.length} change={`${sourceBreakdown.length} plateformes`} positive icon="🏷️" sparkData={scoreData.length > 1 ? scoreData : undefined}/>
              <StatCard label="Dernière MAJ" value={stats?.lastJob?.completedAt ? new Date(stats.lastJob.completedAt).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' }) : '—'} change={stats?.lastJob?.query ?? ''} positive icon="🕐"/>
            </div>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 3 }}>Prix moyen & Score IA par catégorie</h3>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Top {queryBreakdown.length} catégories scrapées</p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[{ label: 'Prix moy. (Dh)', color: '#6366F1' }, { label: 'Score IA', color: '#22c55e' }].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }}/>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {priceData.length > 1
                  ? <LineChart data={[priceData, scoreData]} lines={[{ color: '#6366F1' }, { color: '#22c55e' }]} labels={queryBreakdown.slice(0, 6).map(q => q._id?.slice(0, 8))} width={540} height={180}/>
                  : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Lancez des scrapings pour voir les tendances</div>
                }
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Répartition Sources</h3>
                {donutData.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <DonutChart data={donutData} size={130}/>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {sourceBreakdown.map((s, i) => {
                        const colors = ['#6366F1', '#3B82F6', '#22c55e', '#f59e0b', '#ec4899'];
                        return (
                          <div key={s._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 6, height: 6, borderRadius: 2, background: colors[i] }}/>
                              <SourceTag source={s._id}/>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.7)' }}>{s.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Aucune donnée</div>
                )}
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Top Potentiel</h3>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Score IA</span>
                </div>
                {top.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {top.map((p, i) => (
                      <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ width: 20, fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: "'JetBrains Mono',monospace" }}>#{i + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: p.potentialScore >= 78 ? '#22c55e' : '#f59e0b' }}>{p.potentialScore}</span>
                          </div>
                          <ProgressBar value={p.potentialScore} color={p.potentialScore >= 78 ? '#22c55e' : '#f59e0b'} height={4}/>
                        </div>
                        <button onClick={() => onAnalyze(p)} style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 10, cursor: 'pointer' }}>→</button>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingTop: 20 }}>Aucun produit encore scraped</div>}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Produits à éviter</h3>
                  <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>● Risque élevé</span>
                </div>
                {alerts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alerts.map(p => (
                      <div key={p._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <StockDot color="red"/>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.8)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>Score: {p.potentialScore} · {p.competitionLevel}</div>
                          </div>
                        </div>
                        <SourceTag source={p.source}/>
                      </div>
                    ))}
                  </div>
                ) : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center', paddingTop: 20 }}>Aucune alerte pour le moment</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
