import { useSettings } from '../context/SettingsContext.jsx';
import { TopBar, Icon } from '../components.jsx';

const COUNTRY_LIST = [
  { code: 'ma', label: 'Maroc',        flag: '🇲🇦' },
  { code: 'dz', label: 'Algérie',      flag: '🇩🇿' },
  { code: 'tn', label: 'Tunisie',      flag: '🇹🇳' },
  { code: 'fr', label: 'France',       flag: '🇫🇷' },
  { code: 'de', label: 'Allemagne',    flag: '🇩🇪' },
  { code: 'es', label: 'Espagne',      flag: '🇪🇸' },
  { code: 'gb', label: 'Royaume-Uni',  flag: '🇬🇧' },
  { code: 'us', label: 'États-Unis',   flag: '🇺🇸' },
  { code: 'sa', label: 'Arabie Saoud.', flag: '🇸🇦' },
  { code: 'ae', label: 'Émirats',      flag: '🇦🇪' },
  { code: 'eg', label: 'Égypte',       flag: '🇪🇬' },
  { code: 'ng', label: 'Nigéria',      flag: '🇳🇬' },
  { code: 'ke', label: 'Kenya',        flag: '🇰🇪' },
  { code: 'tr', label: 'Türkiye',      flag: '🇹🇷' },
];

export default function Settings() {
  const { theme, setTheme, language, setLanguage, country, setCountry, t, THEMES, LANGUAGES } = useSettings();

  const card = {
    background: 'var(--card-bg)',
    border: '1px solid var(--border)',
    borderRadius: 14,
    padding: '24px 28px',
    marginBottom: 20,
  };

  const label = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 12,
  };

  const optionGrid = {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
      <TopBar title={t.settings} subtitle={t.personalization}/>

      <div style={{ maxWidth: 640, margin: '32px auto', padding: '0 24px' }}>

        {/* Theme */}
        <div style={card}>
          <p style={label}>{t.appearance} — {t.theme}</p>
          <div style={optionGrid}>
            {Object.entries(THEMES).map(([key, val]) => (
              <OptionTile
                key={key}
                active={theme === key}
                onClick={() => setTheme(key)}
                preview={<ThemePreview dark={key === 'dark'}/>}
                label={val.label}
              />
            ))}
          </div>
        </div>

        {/* Language */}
        <div style={card}>
          <p style={label}>{t.language}</p>
          <div style={optionGrid}>
            {Object.entries(LANGUAGES).map(([code, cfg]) => (
              <OptionTile
                key={code}
                active={language === code}
                onClick={() => setLanguage(code)}
                label={cfg.label}
              />
            ))}
          </div>
        </div>

        {/* Default country */}
        <div style={card}>
          <p style={label}>{t.country}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {COUNTRY_LIST.map(c => (
              <button
                key={c.code}
                onClick={() => setCountry(c.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 12px', borderRadius: 10,
                  border: country === c.code ? '1.5px solid #6366F1' : '1px solid var(--border)',
                  background: country === c.code ? 'rgba(99,102,241,0.12)' : 'transparent',
                  color: country === c.code ? '#a5b4fc' : 'var(--text-muted)',
                  fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                  fontWeight: country === c.code ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 18 }}>{c.flag}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function OptionTile({ active, onClick, label, preview }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        padding: '12px 20px', borderRadius: 12,
        border: active ? '1.5px solid #6366F1' : '1px solid var(--border)',
        background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
        color: active ? '#a5b4fc' : 'var(--text)',
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'inherit', fontSize: 13, fontWeight: active ? 600 : 400,
        minWidth: 90,
      }}
    >
      {preview}
      <span>{label}</span>
      {active && <Icon name="check" size={13} color="#6366F1"/>}
    </button>
  );
}

function ThemePreview({ dark }) {
  return (
    <div style={{
      width: 60, height: 36, borderRadius: 6, overflow: 'hidden',
      background: dark ? '#0A0E1A' : '#F0F2F8',
      border: '1px solid rgba(128,128,128,0.2)',
      display: 'flex',
    }}>
      <div style={{ width: 16, background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)', borderRight: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}` }}/>
      <div style={{ flex: 1, padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[70, 50, 85].map((w, i) => (
          <div key={i} style={{ height: 4, borderRadius: 2, width: `${w}%`, background: dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }}/>
        ))}
      </div>
    </div>
  );
}
