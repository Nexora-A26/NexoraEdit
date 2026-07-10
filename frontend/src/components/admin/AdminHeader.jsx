import { useState } from 'react';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { key: 'dashboard', icon: '📊', labelAr: 'لوحة التحكم', labelEn: 'Dashboard' },
  { key: 'files', icon: '📁', labelAr: 'الملفات', labelEn: 'Files' },
  { key: 'jobs', icon: '📋', labelAr: 'العمليات', labelEn: 'Jobs' },
  { key: 'tools', icon: '🔧', labelAr: 'الأدوات', labelEn: 'Tools' },
  { key: 'settings', icon: '⚙️', labelAr: 'الإعدادات', labelEn: 'Settings' },
];

export default function AdminHeader({ activeSection, onNavigate, lang }) {
  const [open, setOpen] = useState(false);
  const t = (ar, en) => lang === 'ar' ? ar : en;

  return (
    <>
      <button className="admin-hamburger" onClick={() => setOpen(!open)}>
        {open ? '✕' : '☰'}
      </button>
      {open && <div className="admin-overlay" onClick={() => setOpen(false)} />}
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo"><img src="/nexora-mark.jpg" alt="Nexora" /> <span>NexoraEdit</span></div>
        </div>
        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => { onNavigate(item.key); setOpen(false); }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{t(item.labelAr, item.labelEn)}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item back-link" onClick={() => setOpen(false)}>
            <span className="admin-nav-icon">🏠</span>
            <span className="admin-nav-label">{t('العودة للموقع', 'Back to Website')}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
