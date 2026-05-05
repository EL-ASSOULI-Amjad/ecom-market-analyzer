import { useState, useEffect } from 'react';
import { TopBar, Icon, Badge, ScoreRing, LineChart, ProgressBar, Sparkline, SourceTag, Skeleton } from '../components.jsx';
import { getScrapedProducts, getProductDetail } from '../api/client.js';

const MAD = n => n != null ? `${n.toLocaleString('fr-MA')} Dh` : '—';

function genKeywords(title) {
  return title.split(' ').filter(w => w.length > 3).slice(0, 5);
}

export default function PageAnalysis({ selectedProduct }) {
  const [products, setProducts] = useState([]);
  const [picked,   setPicked]   = useState(null);
  const [detail,   setDetail]   = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getScrapedProducts({ sort: '-potentialScore', limit: 50 })
      .then(d => {
        const list = d.products ?? [];
        setProducts(list);
        const initial = selectedProduct ?? list[0] ?? null;
        if (initial) setPicked(initial);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedProduct]);

  // Load full detail (includes priceHistory) when picked changes
  useEffect(() => {
    if (!picked?._id) return;
    getProductDetail(picked._id).then(setDetail).catch(() => setDetail(null));
  }, [picked?._id]);

  const product = detail ?? picked;
  const priceHistory = product?.priceHistory?.map(ph => ph.price) ?? (product?.price ? [product.price] : []);
  const months = product?.priceHistory?.map((ph, i) => `J-${product.priceHistory.length - i - 1}`) ?? [];

  const score = product?.potentialScore ?? 50;
  const reco  = product?.orderReco;
  const recoCfg = score >= 78 ? { label: 'À lancer', color: '#22c55e', icon: '✅' }
               : score >= 55  ? { label: 'À tester',  color: '#f59e0b', icon: '🧪' }
               :                { label: 'À éviter',  color: '#ef4444', icon: '❌' };

  // Competitors = other products with the same query
  const competitors = products.filter(p => p.query === product?.query && p._id !== product?._id).slice(0, 6);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar title="Analyse de Marché Produit" subtitle="Données en temps réel + prédictions IA"/>
        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height={100} rounded={16}/><Skeleton height={200} rounded={16}/><Skeleton height={160} rounded={16}/>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title="Analyse de Marché Produit" subtitle="Comparaison concurrentielle + recommandation IA">
        <select value={picked?._id ?? ''} onChange={e => { const p = products.find(x => x._id === e.target.value); if (p) setPicked(p); }}
          style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: 'rgba(255,255,255,0.8)', fontSize: 12, padding: '6px 12px', cursor: 'pointer', outline: 'none', maxWidth: 280 }}>
          <option value="">— Sélectionner un produit —</option>
          {products.map(p => <option key={p._id} value={p._id}>{p.title.slice(0, 50)}</option>)}
        </select>
      </TopBar>

      {!product ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
          Aucun produit disponible — lancez d'abord un scraping depuis la page Suggestions.
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 20, alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {product.imageUrl
                ? <img src={product.imageUrl} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
                : <Icon name="package" size={28} color="#6366F1"/>}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{product.title}</h2>
                <Badge type={product.badge}/>
                <SourceTag source={product.source}/>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Prix actuel',    value: MAD(product.price) },
                  { label: 'Remise',          value: product.discountPct > 0 ? `-${product.discountPct}%` : '—' },
                  { label: 'Note',            value: product.rating ? `${product.rating}★` : '—' },
                  { label: 'Avis clients',    value: product.reviewCount?.toLocaleString('fr-MA') ?? '—' },
                  { label: 'Concurrence',     value: product.competitionLevel ?? '—' },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace", color: 'rgba(255,255,255,0.87)' }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{recoCfg.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: recoCfg.color, marginBottom: 8 }}>{recoCfg.label}</div>
              <ScoreRing score={score} size={64}/>
            </div>
          </div>

          {/* Order Recommendation card */}
          {reco && (
            <div style={{ background: score >= 78 ? 'rgba(34,197,94,0.06)' : score >= 55 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${score >= 78 ? 'rgba(34,197,94,0.25)' : score >= 55 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 16, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: recoCfg.color }}>📦 Recommandation de commande</h3>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Confiance : <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{reco.confidence}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: recoCfg.color }}>{reco.minUnits}–{reco.maxUnits}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>unités recommandées</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{reco.reasoning}</div>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Historique des Prix (Dh)</h3>
              {priceHistory.length > 1
                ? <LineChart data={[priceHistory]} lines={[{ color: '#6366F1' }]} labels={months} width={440} height={160}/>
                : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Pas encore d'historique — re-scraper dans quelques heures</div>}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 16 }}>Analyse de la demande</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Score potentiel',  value: score,                        color: score >= 78 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444' },
                  { label: 'Score demande',     value: product.demandScore ?? 50,   color: '#3B82F6' },
                  { label: 'Remise prix',       value: product.discountPct ?? 0,    color: '#f59e0b' },
                  { label: 'Avantage prix',     value: Math.max(0, product.priceSpread ?? 0), color: '#22c55e' },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{m.label}</span>
                      <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: m.color }}>{m.value}/100</span>
                    </div>
                    <ProgressBar value={m.value} color={m.color} height={7}/>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600, marginBottom: 4 }}>Insight IA</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  {score >= 78 ? 'Fort potentiel détecté. Concurrence faible et demande en hausse. Recommande lancement en volume.'
                   : score >= 55 ? 'Potentiel modéré. Tester avec un petit lot avant de scaler. Surveiller l\'évolution des prix.'
                   : 'Marché saturé ou demande insuffisante. Chercher un angle de différenciation ou choisir un autre produit.'}
                </div>
              </div>
            </div>
          </div>

          {/* Keywords + competitors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Mots-clés du produit</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {genKeywords(product.title).map((k, i) => (
                  <span key={k} style={{ padding: '5px 12px', borderRadius: 100, background: i === 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: i === 0 ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(255,255,255,0.08)', color: i === 0 ? '#a5b4fc' : 'rgba(255,255,255,0.6)', fontSize: 12 }}>{k}</span>
                ))}
              </div>
              {product.url && (
                <a href={product.url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 16, padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>
                  <Icon name="eye" size={12}/> Voir sur {product.source}
                </a>
              )}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Produits similaires ({competitors.length})</h3>
              {competitors.length === 0 ? (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', paddingTop: 20 }}>Scraper d'autres sources pour voir la concurrence</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {competitors.map(c => (
                    <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <SourceTag source={c.source}/>
                      <span style={{ flex: 1, fontSize: 11, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
                      <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: c.price < (product.price ?? Infinity) ? '#22c55e' : '#f87171', flexShrink: 0 }}>{MAD(c.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
