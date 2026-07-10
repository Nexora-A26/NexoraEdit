import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.js';
import AdminHeader from '../components/admin/AdminHeader.jsx';
import AdminStats from '../components/admin/AdminStats.jsx';
import AdminFilesTable from '../components/admin/AdminFilesTable.jsx';
import AdminJobsTable from '../components/admin/AdminJobsTable.jsx';
import AdminToolsManager from '../components/admin/AdminToolsManager.jsx';
import AdminSettings from '../components/admin/AdminSettings.jsx';

export default function AdminPage() {
  const [locked, setLocked] = useState(true);
  const [checking, setChecking] = useState(true);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  const lang = localStorage.getItem('nexoraedit_language') || 'ar';
  const t = (ar, en) => lang === 'ar' ? ar : en;

  useEffect(() => {
    const existingKey = sessionStorage.getItem('nexoraedit_admin_key');
    if (existingKey) {
      adminApi.getStats()
        .then(() => setLocked(false))
        .catch(() => {
          sessionStorage.removeItem('nexoraedit_admin_key');
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  const handleUnlock = () => {
    setError('');
    const key = keyInput.trim();
    if (!key) return;
    sessionStorage.setItem('nexoraedit_admin_key', key);
    adminApi.getStats()
      .then(() => setLocked(false))
      .catch(() => {
        setError(t('المفتاح خطأ', 'Wrong key'));
        sessionStorage.removeItem('nexoraedit_admin_key');
      });
  };

  if (checking) {
    return (
      <div className="admin-unlock-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="admin-loading-spinner" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="admin-unlock-screen" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="admin-unlock-card">
          <div className="admin-unlock-logo"><img src="/nexora-logo.jpg" alt="Nexora" /><span>NexoraEdit</span></div>
          <h1>{t('لوحة تحكم NexoraEdit', 'NexoraEdit Admin Dashboard')}</h1>
          <input
            className="text-input"
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleUnlock(); }}
            placeholder={t('أدخل مفتاح الإدارة', 'Enter admin key')}
            autoFocus
          />
          {error && <div className="admin-unlock-error">{error}</div>}
          <button className="btn btn-primary unlock-btn" onClick={handleUnlock}>
            {t('دخول', 'Enter')}
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <AdminStats />;
      case 'files': return <AdminFilesTable />;
      case 'jobs': return <AdminJobsTable />;
      case 'tools': return <AdminToolsManager />;
      case 'settings': return <AdminSettings />;
      default: return <AdminStats />;
    }
  };

  return (
    <div className="admin-layout" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <AdminHeader activeSection={activeSection} onNavigate={setActiveSection} lang={lang} />
      <main className="admin-content">
        {renderContent()}
      </main>
    </div>
  );
}
