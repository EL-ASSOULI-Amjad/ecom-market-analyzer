import { useState } from 'react';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { Sidebar } from './components.jsx';
import PageDashboard   from './pages/Dashboard.jsx';
import PageSuggestions from './pages/Suggestions.jsx';
import PageAnalysis    from './pages/Analysis.jsx';
import PageStores      from './pages/Stores.jsx';
import PageStock       from './pages/Stock.jsx';
import PageReports     from './pages/Reports.jsx';
import PageSettings    from './pages/Settings.jsx';

function AppInner() {
  const [page,            setPage]            = useState('suggestions');
  const [collapsed,       setCollapsed]       = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const handleAnalyze = product => {
    setSelectedProduct(product);
    setPage('analysis');
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':   return <PageDashboard   onAnalyze={handleAnalyze}/>;
      case 'suggestions': return <PageSuggestions onAnalyze={handleAnalyze}/>;
      case 'analysis':    return <PageAnalysis    selectedProduct={selectedProduct}/>;
      case 'stores':      return <PageStores/>;
      case 'stock':       return <PageStock/>;
      case 'reports':     return <PageReports/>;
      case 'settings':    return <PageSettings/>;
      default:            return <PageSuggestions onAnalyze={handleAnalyze}/>;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar
        page={page}
        setPage={setPage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppInner/>
    </SettingsProvider>
  );
}
