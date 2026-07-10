import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import { useLanguage } from './i18n/LanguageContext.jsx';
import Header from './components/Header.jsx';
import ToolBrowser from './components/ToolBrowser.jsx';
import Footer from './components/Footer.jsx';
import ContactPage from './pages/ContactPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import toolsData from './data/tools.js';
import { getToolSettings } from './api/client.js';

function flattenTools(categories) {
  const all = [];
  for (const cat of categories) {
    for (const sub of cat.subcategories || []) {
      for (const tool of sub.tools || []) {
        all.push({ ...tool, categoryId: cat.id, categoryName: cat.name, subcategoryName: sub.name });
      }
    }
  }
  return all;
}

const ALL_TOOLS = flattenTools(toolsData.categories);

function HomePage() {
  const location = useLocation();
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTool, setActiveTool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toolSettings, setToolSettings] = useState({});


  useEffect(() => {
    getToolSettings()
      .then(setToolSettings)
      .catch(() => setToolSettings({}));
  }, []);

  useEffect(() => {
    if (location.state?.activeCategory) {
      setActiveCategory(location.state.activeCategory);
    }
    if (location.state?.activeTool) {
      setActiveTool(location.state.activeTool);
    }
    if (location.state?.scrollToTools) {
      setTimeout(() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
    window.history.replaceState({}, document.title);
  }, [location.state]);

  useEffect(() => {
    const categoryHandler = (event) => {
      if (event.detail) {
        setActiveCategory(event.detail);
        setActiveTool(null);
      }
    };
    const toolHandler = (event) => {
      if (event.detail?.categoryId && event.detail?.toolId) {
        setActiveCategory(event.detail.categoryId);
        setActiveTool(event.detail.toolId);
      }
    };
    window.addEventListener('nexora:select-category', categoryHandler);
    window.addEventListener('nexora:select-tool', toolHandler);
    return () => {
      window.removeEventListener('nexora:select-category', categoryHandler);
      window.removeEventListener('nexora:select-tool', toolHandler);
    };
  }, []);

  const filteredTools = useMemo(() => {
    let tools = ALL_TOOLS.filter((t) => (activeCategory === 'all' || t.categoryId === activeCategory) && toolSettings[t.id]?.enabled !== false);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      tools = tools.filter((t) => {
        const title = typeof t.title === 'object' ? (t.title[language] || t.title.ar || '') : t.title;
        const desc = typeof t.description === 'object' ? (t.description[language] || t.description.ar || '') : t.description;
        return title.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      });
    }
    if (statusFilter === 'working') tools = tools.filter((t) => t.status === 'working');
    return tools;
  }, [activeCategory, searchQuery, statusFilter, language, toolSettings]);

  return (
    <main>
      <ToolBrowser
        tools={filteredTools}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilter={setStatusFilter}
      />

      <section className="why-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('whyTitle')}</h2>
            <p>{t('whySubtitle')}</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <span className="why-icon">📦</span>
              <h4>{t('whyAllInOne')}</h4>
              <p>{t('whyAllInOneDesc')}</p>
            </div>
            <div className="why-card">
              <span className="why-icon">🌐</span>
              <h4>{t('whyArabic')}</h4>
              <p>{t('whyArabicDesc')}</p>
            </div>
            <div className="why-card">
              <span className="why-icon">⚡</span>
              <h4>{t('whySimple')}</h4>
              <p>{t('whySimpleDesc')}</p>
            </div>
            <div className="why-card">
              <span className="why-icon">🚀</span>
              <h4>{t('whySaaS')}</h4>
              <p>{t('whySaaSDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-cta-section">
        <div className="container contact-cta-inner">
          <div className="contact-cta-content">
            <h2>{t('contactCTATitle')}</h2>
            <p>{t('contactCTADesc')}</p>
            <div className="contact-cta-links">
              <Link to="/contact" className="contact-cta-link">
                <span className="contact-icon">📞</span>
                03302277
              </Link>
              <Link to="/contact" className="contact-cta-link">
                <span className="contact-icon">✉️</span>
                nexora0126@gmail.com
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <>
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      {!isAdmin && <Footer />}
    </>
  );
}
