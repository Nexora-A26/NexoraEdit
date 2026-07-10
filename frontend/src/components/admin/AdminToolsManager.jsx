import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../api/admin.js';

const CATEGORIES = ['all', 'pdf', 'word', 'excel'];

export default function AdminToolsManager() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [toggling, setToggling] = useState(null);

  const lang = localStorage.getItem('nexoraedit_language') || 'ar';
  const t = (ar, en) => lang === 'ar' ? ar : en;

  const catLabels = {
    ar: { all: 'الكل', pdf: 'PDF', word: 'Word', excel: 'Excel' },
    en: { all: 'All', pdf: 'PDF', word: 'Word', excel: 'Excel' }
  };
  const cl = catLabels[lang];

  const fetchTools = () => {
    setLoading(true);
    setError('');
    adminApi.getTools()
      .then(setTools)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTools(); }, []);

  const handleToggle = (toolId) => {
    setToggling(toolId);
    adminApi.toggleTool(toolId)
      .then(updated => {
        setTools(prev => prev.map(t => t.id === toolId ? { ...t, status: updated.status } : t));
      })
      .catch(e => alert(e.message))
      .finally(() => setToggling(null));
  };

  const handleFeature = (toolId, currentFeatured) => {
    adminApi.updateTool(toolId, { featured: !currentFeatured })
      .then(updated => {
        setTools(prev => prev.map(t => t.id === toolId ? { ...t, featured: updated.featured } : t));
      })
      .catch(e => alert(e.message));
  };

  const filtered = useMemo(() => {
    let list = [...tools];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t => (t.title || '').toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') {
      list = list.filter(t => t.category === categoryFilter);
    }
    return list;
  }, [tools, search, categoryFilter]);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">{t('إدارة الأدوات', 'Tools Management')}</h2>
        <button className="btn btn-secondary" onClick={fetchTools} disabled={loading}>
          {loading ? '...' : '🔄'}
        </button>
      </div>

      <div className="admin-filters">
        <input
          className="text-input"
          placeholder={t('بحث باسم الأداة...', 'Search by tool name...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="text-input" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          {CATEGORIES.map(c => <option key={c} value={c}>{cl[c]}</option>)}
        </select>
      </div>

      {error && <div className="admin-error-box">{error}</div>}

      {loading ? (
        <div className="admin-loading-spinner" />
      ) : filtered.length === 0 ? (
        <div className="admin-empty">{t('لا توجد أدوات', 'No tools found')}</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('الأداة', 'Tool')}</th>
                <th>{t('القسم', 'Category')}</th>
                <th>{t('الحالة', 'Status')}</th>
                <th>{t('مميزة', 'Featured')}</th>
                <th>{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tool => (
                <tr key={tool.id}>
                  <td className="admin-cell-tool">{tool.title}</td>
                  <td><span className="admin-type-badge">{cl[tool.category] || tool.category}</span></td>
                  <td>
                    <span className={`admin-status-badge ${tool.status === 'working' ? 'completed' : 'failed'}`}>
                      {tool.status === 'working' ? t('مفعّلة', 'Enabled') : t('معطّلة', 'Disabled')}
                    </span>
                  </td>
                  <td>
                    {tool.featured ? (
                      <span className="admin-featured-badge">⭐ {t('مميزة', 'Featured')}</span>
                    ) : (
                      <span className="admin-text-muted">-</span>
                    )}
                  </td>
                  <td className="admin-cell-actions">
                    <button
                      className={`btn btn-sm ${tool.status === 'working' ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => handleToggle(tool.id)}
                      disabled={toggling === tool.id}
                    >
                      {toggling === tool.id
                        ? '...'
                        : tool.status === 'working'
                          ? t('تعطيل', 'Disable')
                          : t('تفعيل', 'Enable')}
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleFeature(tool.id, tool.featured)}
                    >
                      {tool.featured ? t('إزالة التمييز', 'Unfeature') : t('تمييز', 'Feature')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
