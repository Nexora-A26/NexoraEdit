import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function Header() {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const goToTools = (catId, toolId = null) => {
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollToTools: true, activeCategory: catId, activeTool: toolId } });
    } else {
      if (toolId) {
        window.dispatchEvent(new CustomEvent('nexora:select-tool', { detail: { categoryId: catId, toolId } }));
      } else if (catId) {
        window.dispatchEvent(new CustomEvent('nexora:select-category', { detail: catId }));
      }
      const el = document.getElementById('tools');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          <img src="/nexora-mark.jpg" alt="Nexora logo" className="logo-image" />
          <span className="logo-text">NexoraEdit</span>
        </Link>
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
        <div className={`header-menu ${menuOpen ? 'open' : ''}`}>
          <nav className="nav-links" aria-label={t('mainNavigation')}>
            <a href="#tools" onClick={(e) => { e.preventDefault(); goToTools('pdf', 'pdf-merge'); }}>{t('mergePdf')}</a>
            <a href="#tools" onClick={(e) => { e.preventDefault(); goToTools('pdf', 'pdf-split'); }}>{t('splitPdf')}</a>
            <a href="#tools" onClick={(e) => { e.preventDefault(); goToTools('pdf', 'pdf-compress'); }}>{t('compressPdf')}</a>
            <a href="#tools" onClick={(e) => { e.preventDefault(); goToTools('word'); }}>{t('wordTools')}</a>
            <a href="#tools" onClick={(e) => { e.preventDefault(); goToTools('excel'); }}>{t('excelTools')}</a>
            <a href="#tools" onClick={(e) => { e.preventDefault(); goToTools('all'); }}>{t('allTools')}</a>
          </nav>
          <div className="header-actions">
            <button
              className="lang-switch"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>
            <Link to="/contact" className="header-contact">{t('contactUs')}</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
