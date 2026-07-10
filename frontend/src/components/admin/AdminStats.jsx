import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.js';

export default function AdminStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const lang = localStorage.getItem('nexoraedit_language') || 'ar';
  const t = (ar, en) => lang === 'ar' ? ar : en;

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(e => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="admin-section">
        <div className="admin-error-box">{error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-section">
        <div className="admin-loading-spinner" />
      </div>
    );
  }

  const cards = [
    { icon: '📁', value: stats.uploadedFiles ?? 0, label: t('عدد الملفات المرفوعة', 'Uploaded Files') },
    { icon: '📄', value: stats.resultFiles ?? 0, label: t('عدد الملفات الناتجة', 'Result Files') },
    { icon: '📋', value: stats.jobs ?? 0, label: t('عدد العمليات', 'Jobs') },
    { icon: '✅', value: stats.enabledTools ?? 0, label: t('الأدوات المفعّلة', 'Enabled Tools') },
    { icon: '❌', value: stats.disabledTools ?? 0, label: t('الأدوات المعطّلة', 'Disabled Tools') },
    {
      icon: '🕐',
      value: stats.latestJob
        ? (typeof stats.latestJob === 'object'
          ? (stats.latestJob.tool || stats.latestJob.id || t('آخر عملية', 'Latest Job'))
          : stats.latestJob)
        : t('لا توجد', 'None'),
      label: t('آخر عملية', 'Latest Job')
    },
  ];

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">{t('لوحة التحكم', 'Dashboard')}</h2>
      <div className="admin-stats-grid">
        {cards.map((card, i) => (
          <div className="admin-stat-card" key={i}>
            <span className="admin-stat-icon">{card.icon}</span>
            <span className="admin-stat-value">{card.value}</span>
            <span className="admin-stat-label">{card.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
