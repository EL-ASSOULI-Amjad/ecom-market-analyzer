
// ── Shared UI Components ──────────────────────────────────────────────────────

// ── Mini Chart (SVG sparkline) ────────────────────────────────────────────────
function Sparkline({ data, color = "#6366F1", width = 80, height = 32 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} ${width},${height}`}
        fill={`url(#sg-${color.replace('#','')})`}
      />
    </svg>
  );
}

// ── Score Ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 85 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:"stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)"}}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color}
        style={{fontSize: size > 48 ? "13px" : "11px", fontFamily:"'JetBrains Mono', monospace", fontWeight:700}}>
        {score}
      </text>
    </svg>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ type }) {
  const cfg = {
    trending:    { label: "🔥 Trending",    bg: "rgba(239,68,68,0.15)",   color: "#f87171" },
    bestseller:  { label: "⭐ Best-seller",  bg: "rgba(245,158,11,0.15)",  color: "#fbbf24" },
    opportunity: { label: "💎 Opportunité", bg: "rgba(99,102,241,0.15)",  color: "#a5b4fc" },
  };
  const { label, bg, color } = cfg[type] || cfg.opportunity;
  return (
    <span style={{
      background: bg, color, fontSize: "11px", fontWeight: 600,
      padding: "3px 8px", borderRadius: "100px", letterSpacing: "0.02em",
      border: `1px solid ${color}22`
    }}>{label}</span>
  );
}

// ── Stock Color ───────────────────────────────────────────────────────────────
function StockDot({ color }) {
  const c = { red: "#ef4444", orange: "#f59e0b", green: "#22c55e" }[color] || "#6b7280";
  return <span style={{ display:"inline-block", width:8, height:8, borderRadius:"50%", background:c, marginRight:6 }}/>;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, change, positive, icon, sparkData }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 8,
      backdropFilter: "blur(12px)",
      transition: "all 0.2s",
      cursor: "default"
    }}
    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.35)"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <span style={{ fontSize:12, color:"rgba(255,255,255,0.45)", fontWeight:500, letterSpacing:"0.04em", textTransform:"uppercase" }}>{label}</span>
        <span style={{ fontSize:18 }}>{icon}</span>
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
        <span style={{ fontSize:28, fontWeight:700, color:"#fff", fontFamily:"'JetBrains Mono', monospace", letterSpacing:"-0.02em" }}>{value}</span>
        {sparkData && <Sparkline data={sparkData} color={positive ? "#22c55e" : "#ef4444"}/>}
      </div>
      <span style={{ fontSize:12, color: positive ? "#22c55e" : "#ef4444", fontWeight:600 }}>
        {positive ? "▲" : "▼"} {change}
      </span>
    </div>
  );
}

// ── Mini Bar Chart (SVG) ──────────────────────────────────────────────────────
function MiniBarChart({ data, width = 280, height = 80, color = "#6366F1" }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.value || d));
  const barW = Math.floor(width / data.length) - 3;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const v = d.value || d;
        const h = Math.max(4, (v / max) * (height - 12));
        const x = i * (barW + 3);
        return (
          <rect key={i} x={x} y={height - h} width={barW} height={h}
            rx={3} fill={color} opacity={0.7 + 0.3 * (i === data.length - 1 ? 1 : 0)}/>
        );
      })}
    </svg>
  );
}

// ── Line Chart (SVG) ─────────────────────────────────────────────────────────
function LineChart({ data, lines, width = 500, height = 160, labels }) {
  // data: array of arrays or single array
  // lines: [{key, color, label}]
  const allVals = data.flat ? data.flat() : data;
  const min = Math.min(...allVals) * 0.95;
  const max = Math.max(...allVals) * 1.02;
  const range = max - min || 1;
  const pad = { top:10, right:16, bottom:28, left:40 };
  const W = width - pad.left - pad.right;
  const H = height - pad.top - pad.bottom;

  const toPath = (vals) => vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W + pad.left;
    const y = H - ((v - min) / range) * H + pad.top;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const yTicks = 4;
  const xStep = Math.ceil(data[0]?.length / 6) || 2;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {Array.from({length: yTicks+1}).map((_, i) => {
        const y = pad.top + (i / yTicks) * H;
        const v = max - (i / yTicks) * range;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <text x={pad.left - 6} y={y + 4} textAnchor="end"
              fill="rgba(255,255,255,0.3)" style={{fontSize:"9px", fontFamily:"'JetBrains Mono', monospace"}}>
              {v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toFixed(0)}
            </text>
          </g>
        );
      })}
      {/* X labels */}
      {labels && labels.map((l, i) => {
        if (i % xStep !== 0 && i !== labels.length - 1) return null;
        const x = (i / (labels.length - 1)) * W + pad.left;
        return (
          <text key={i} x={x} y={height - 6} textAnchor="middle"
            fill="rgba(255,255,255,0.3)" style={{fontSize:"9px"}}>
            {l}
          </text>
        );
      })}
      {/* Lines */}
      {(lines || [{color:"#6366F1"}]).map((line, li) => {
        const vals = Array.isArray(data[0]) ? data[li] : data;
        return (
          <g key={li}>
            <defs>
              <linearGradient id={`lcg${li}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={line.color} stopOpacity="0.2"/>
                <stop offset="100%" stopColor={line.color} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={toPath(vals) + ` L${width - pad.right},${H + pad.top} L${pad.left},${H + pad.top} Z`}
              fill={`url(#lcg${li})`}/>
            <path d={toPath(vals)} fill="none" stroke={line.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut Chart (SVG) ─────────────────────────────────────────────────────────
function DonutChart({ data, size = 120 }) {
  const colors = ["#6366F1","#3B82F6","#22c55e","#f59e0b","#ec4899"];
  const total = data.reduce((s,d) => s + d.value, 0);
  let angle = -Math.PI / 2;
  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2;
  const segments = data.map((d, i) => {
    const frac = d.value / total;
    const startAngle = angle;
    angle += frac * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const largeArc = frac > 0.5 ? 1 : 0;
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`, color: colors[i % colors.length], name: d.name, value: d.value };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r - 18} fill="rgba(10,14,26,0.8)"/>
      {segments.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} opacity="0.85" style={{transition:"opacity 0.2s"}}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0.85}/>
      ))}
    </svg>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = "#6366F1", height = 6 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 100, height, overflow:"hidden" }}>
      <div style={{
        width: `${(value/max)*100}%`, height:"100%",
        background: color, borderRadius: 100,
        transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)"
      }}/>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function Skeleton({ width = "100%", height = 20, rounded = 8 }) {
  return (
    <div style={{
      width, height, borderRadius: rounded,
      background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite"
    }}/>
  );
}

// Export all to global scope
Object.assign(window, {
  Sparkline, ScoreRing, Badge, StockDot, StatCard, MiniBarChart, LineChart, DonutChart, ProgressBar, Skeleton
});
