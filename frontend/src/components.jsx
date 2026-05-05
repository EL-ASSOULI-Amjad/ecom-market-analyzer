// Shared UI components — exact port of the original AI Market Analyzer design
import { useState } from 'react';
import { useSettings } from './context/SettingsContext.jsx';

// ── SVG Icon library ──────────────────────────────────────────────────────────
const ICONS = {
  grid:         <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></>,
  star:         <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  chart:        <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  store:        <><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>,
  package:      <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  file:         <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  bell:         <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  search:       <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  chevronRight: <><polyline points="9 18 15 12 9 6"/></>,
  chevronLeft:  <><polyline points="15 18 9 12 15 6"/></>,
  chevronDown:  <><polyline points="6 9 12 15 18 9"/></>,
  filter:       <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  arrowUp:      <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>,
  arrowDown:    <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
  trending:     <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
  zap:          <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  download:     <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  refresh:      <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
  settings:     <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  cpu:          <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
  user:         <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  x:            <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  plus:         <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  check:        <><polyline points="20 6 9 17 4 12"/></>,
  alert:        <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  globe:        <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
  eye:          <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  map:          <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
  clock:        <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  play:         <><polygon points="5 3 19 12 5 21 5 3"/></>,
  loader:       <><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></>,
};

export function Icon({ name, size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name] ?? <circle cx="12" cy="12" r="10"/>}
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_IDS = [
  { id: 'suggestions', icon: 'star' },
  { id: 'dashboard',   icon: 'grid' },
  { id: 'analysis',    icon: 'trending' },
  { id: 'stores',      icon: 'store' },
  { id: 'stock',       icon: 'package' },
  { id: 'reports',     icon: 'file' },
  { id: 'settings',    icon: 'settings' },
];

export function Sidebar({ page, setPage, collapsed, setCollapsed }) {
  const { t, theme } = useSettings();
  const NAV = NAV_IDS.map(n => ({ ...n, label: t[n.id] ?? n.id }));
  const isDark = theme === 'dark';

  return (
    <div style={{
      width: collapsed ? 60 : 220, minWidth: collapsed ? 60 : 220,
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s',
      overflow: 'hidden', zIndex: 100,
    }}>
      <div style={{ padding: collapsed ? '20px 0' : '20px', display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'linear-gradient(135deg,#6366F1,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cpu" size={16} color="#fff"/>
        </div>
        {!collapsed && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>AI Market</span>}
      </div>

      <nav style={{ flex: 1, padding: '8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8, border: 'none',
                background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
                color: active ? '#a5b4fc' : 'var(--text-muted)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                transition: 'all 0.15s', cursor: 'pointer',
                whiteSpace: 'nowrap', width: '100%',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = 'var(--text)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}}
            >
              <Icon name={item.icon} size={16} color={active ? '#a5b4fc' : 'currentColor'}/>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && active && <div style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#6366F1' }}/>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button onClick={() => setCollapsed(c => !c)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, width: '100%', padding: collapsed ? '8px 0' : '8px 12px', border: 'none', background: 'transparent', color: 'var(--text-muted)', borderRadius: 8, fontSize: 12, cursor: 'pointer', transition: 'color 0.15s', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14}/>
          {!collapsed && <span>{t.reduce}</span>}
        </button>
      </div>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
export function TopBar({ title, subtitle, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 60, flexShrink: 0, borderBottom: '1px solid var(--border)', background: 'var(--bg)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {children}
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="user" size={14} color="#fff"/>
        </div>
      </div>
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
export function FilterBar({ filters, values, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {filters.map(f => (
        <div key={f.key} style={{ position: 'relative' }}>
          <select value={values[f.key] || ''} onChange={e => onChange(f.key, e.target.value)}
            style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, color: values[f.key] ? 'rgba(255,255,255,0.87)' : 'rgba(255,255,255,0.4)', fontSize: 12, padding: '6px 28px 6px 12px', cursor: 'pointer', outline: 'none' }}>
            <option value="">{f.label}</option>
            {f.options.map(o => {
              const v = o?.value ?? o;
              const l = o?.label ?? o;
              return <option key={v} value={v}>{l}</option>;
            })}
          </select>
          <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255,255,255,0.35)' }}>
            <Icon name="chevronDown" size={12}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
export function Sparkline({ data, color = '#6366F1', width = 80, height = 32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  const id = `sg${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${id})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────
export function ScoreRing({ score, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 78 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}/>
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color}
        style={{ fontSize: size > 48 ? '13px' : '11px', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
        {score}
      </text>
    </svg>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ type }) {
  const cfg = {
    trending:    { label: '🔥 Trending',    bg: 'rgba(239,68,68,0.15)',   color: '#f87171' },
    bestseller:  { label: '⭐ Best-seller',  bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
    opportunity: { label: '💎 Opportunité', bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
  };
  const c = cfg[type];
  if (!c) return null;
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, letterSpacing: '0.02em', border: `1px solid ${c.color}22` }}>
      {c.label}
    </span>
  );
}

// ── StockDot ──────────────────────────────────────────────────────────────────
export function StockDot({ color }) {
  const c = { red: '#ef4444', orange: '#f59e0b', green: '#22c55e' }[color] ?? '#6b7280';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 6, flexShrink: 0 }}/>;
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export function StatCard({ label, value, change, positive, icon, sparkData }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${hov ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 8, backdropFilter: 'blur(12px)', transition: 'all 0.2s', cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-0.02em' }}>{value}</span>
        {sparkData && <Sparkline data={sparkData} color={positive ? '#22c55e' : '#ef4444'}/>}
      </div>
      {change != null && (
        <span style={{ fontSize: 12, color: positive ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
          {positive ? '▲' : '▼'} {change}
        </span>
      )}
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = '#6366F1', height = 6 }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 100, height, overflow: 'hidden' }}>
      <div style={{ width: `${(value / max) * 100}%`, height: '100%', background: color, borderRadius: 100, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }}/>
    </div>
  );
}

// ── LineChart ─────────────────────────────────────────────────────────────────
export function LineChart({ data, lines, width = 500, height = 160, labels }) {
  const allVals = data.flat ? data.flat().filter(v => v != null) : data.filter(v => v != null);
  if (!allVals.length) return null;
  const min = Math.min(...allVals) * 0.95;
  const max = Math.max(...allVals) * 1.02;
  const range = max - min || 1;
  const pad = { top: 10, right: 16, bottom: 28, left: 40 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;
  const toPath = (vals) => vals.filter(v => v != null).map((v, i, arr) => {
    const xi = i; const total = arr.length;
    const x = (xi / (total - 1)) * W + pad.left;
    const y = H - ((v - min) / range) * H + pad.top;
    return `${xi === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  const yTicks = 4;
  const xStep = Math.ceil((data[0]?.length ?? 1) / 6) || 2;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = pad.top + (i / yTicks) * H;
        const v = max - (i / yTicks) * range;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" style={{ fontSize: '9px', fontFamily: "'JetBrains Mono',monospace" }}>
              {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}
            </text>
          </g>
        );
      })}
      {labels && labels.map((l, i) => {
        if (i % xStep !== 0 && i !== labels.length - 1) return null;
        const x = (i / (labels.length - 1)) * W + pad.left;
        return <text key={i} x={x} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,0.3)" style={{ fontSize: '9px' }}>{l}</text>;
      })}
      {(lines || [{ color: '#6366F1' }]).map((line, li) => {
        const vals = Array.isArray(data[0]) ? data[li] : data;
        const pathD = toPath(vals);
        return (
          <g key={li}>
            <defs>
              <linearGradient id={`lcg${li}${line.color?.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity="0.2"/>
                <stop offset="100%" stopColor={line.color} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={`${pathD} L${width - pad.right},${H + pad.top} L${pad.left},${H + pad.top} Z`} fill={`url(#lcg${li}${line.color?.replace(/[^a-z0-9]/gi,'')})`}/>
            <path d={pathD} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        );
      })}
    </svg>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
export function DonutChart({ data, size = 120 }) {
  const colors = ['#6366F1', '#3B82F6', '#22c55e', '#f59e0b', '#ec4899'];
  const total = data.reduce((s, d) => s + d.value, 0);
  let angle = -Math.PI / 2;
  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2;
  const segments = data.map((d, i) => {
    const frac = d.value / total;
    const startAngle = angle;
    angle += frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(angle),       y2 = cy + r * Math.sin(angle);
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${frac > 0.5 ? 1 : 0} 1 ${x2},${y2} Z`, color: colors[i % colors.length] };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r - 18} fill="rgba(10,14,26,0.8)"/>
      {segments.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} opacity="0.85"
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0.85}
          style={{ transition: 'opacity 0.2s' }}/>
      ))}
    </svg>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 20, rounded = 8 }) {
  return (
    <div style={{ width, height, borderRadius: rounded, background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}/>
  );
}

// ── Source badge pill ─────────────────────────────────────────────────────────
export const SOURCE_COLORS = {
  jumia:      { bg: 'rgba(249,115,22,0.15)',  color: '#fdba74', label: 'Jumia' },
  avito:      { bg: 'rgba(99,102,241,0.15)',  color: '#c7d2fe', label: 'Avito' },
  hmall:      { bg: 'rgba(34,197,94,0.15)',   color: '#86efac', label: 'Hmall' },
  marjane:    { bg: 'rgba(168,85,247,0.15)',  color: '#d8b4fe', label: 'Marjane' },
  amazon:     { bg: 'rgba(245,158,11,0.15)',  color: '#fcd34d', label: 'Amazon' },
  aliexpress: { bg: 'rgba(239,68,68,0.15)',   color: '#fca5a5', label: 'AliExpress' },
  dhgate:     { bg: 'rgba(20,184,166,0.15)',  color: '#5eead4', label: 'DHgate' },
  temu:       { bg: 'rgba(236,72,153,0.15)',  color: '#f9a8d4', label: 'Temu' },
  alibaba:    { bg: 'rgba(234,88,12,0.15)',   color: '#fb923c', label: 'Alibaba' },
  shopify:    { bg: 'rgba(149,76,233,0.15)',  color: '#c4b5fd', label: 'Shopify' },
};
export function SourceTag({ source }) {
  const c = SOURCE_COLORS[source] ?? { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', label: source };
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: c.bg, color: c.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {c.label}
    </span>
  );
}
