import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../../api/admin.js';

const FILE_TYPES = ['all', 'pdf', 'word', 'excel', 'image', 'other'];
const TYPE_LABELS = { ar: { all: 'الكل', pdf: 'PDF', word: 'Word', excel: 'Excel', image: 'صورة', other: 'أخرى' }, en: { all: 'All', pdf: 'PDF', word: 'Word', excel: 'Excel', image: 'Image', other: 'Other' } };

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminFilesTable() {
  const [tab, setTab] = useState('uploads');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const lang = localStorage.getItem('nexoraedit_language') || 'ar';
  const t = (ar, en) => lang === 'ar' ? ar : en;
  const tl = TYPE_LABELS[lang];

  const fetchFiles = () => {
    setLoading(true);
    setError('');
    const api = tab === 'uploads' ? adminApi.getUploadedFiles() : adminApi.getResultFiles();
    api.then(setFiles).catch(e => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchFiles(); }, [tab]);

  const handleDelete = (filename) => {
    if (!window.confirm(t('هل أنت متأكد من حذف هذا الملف؟', 'Are you sure you want to delete this file?'))) return;
    setDeleting(filename);
    adminApi.deleteFile(tab === 'uploads' ? 'uploads' : 'results', filename)
      .then(() => { setFiles(prev => prev.filter(f => f.filename !== filename)); })
      .catch(e => alert(e.message))
      .finally(() => setDeleting(null));
  };

  const handleDownload = (filename) => {
    setDownloading(filename);
    adminApi.downloadFile(tab === 'uploads' ? 'uploads' : 'results', filename)
      .catch(e => alert(e.message))
      .finally(() => setDownloading(null));
  };

  const filtered = useMemo(() => {
    let list = [...files];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(f => (f.filename || '').toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') {
      list = list.filter(f => (f.type || '').toLowerCase() === typeFilter);
    }
    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });
    return list;
  }, [files, search, typeFilter, sortOrder]);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">{t('إدارة الملفات', 'File Management')}</h2>
        <button className="btn btn-secondary" onClick={fetchFiles} disabled={loading}>
          {loading ? '...' : '🔄'}
        </button>
      </div>

      <div className="admin-tabs">
        {['uploads', 'results'].map(tabKey => (
          <button key={tabKey} className={`admin-tab ${tab === tabKey ? 'active' : ''}`} onClick={() => setTab(tabKey)}>
            {tabKey === 'uploads' ? t('الملفات المرفوعة', 'Uploads') : t('الملفات الناتجة', 'Results')}
          </button>
        ))}
      </div>

      <div className="admin-filters">
        <input
          className="text-input"
          placeholder={t('بحث باسم الملف...', 'Search by filename...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="text-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {FILE_TYPES.map(ft => <option key={ft} value={ft}>{tl[ft]}</option>)}
        </select>
        <select className="text-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
          <option value="newest">{t('الأحدث', 'Newest')}</option>
          <option value="oldest">{t('الأقدم', 'Oldest')}</option>
        </select>
      </div>

      {error && <div className="admin-error-box">{error}</div>}

      {loading ? (
        <div className="admin-loading-spinner" />
      ) : filtered.length === 0 ? (
        <div className="admin-empty">{t('لا توجد ملفات', 'No files found')}</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('اسم الملف', 'File Name')}</th>
                <th>{t('النوع', 'Type')}</th>
                <th>{t('الحجم', 'Size')}</th>
                <th>{t('تاريخ الرفع', 'Date')}</th>
                <th>{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.filename}>
                  <td className="admin-cell-filename">{f.filename}</td>
                  <td><span className="admin-type-badge">{f.type || '-'}</span></td>
                  <td>{formatSize(f.size)}</td>
                  <td>{formatDate(f.createdAt)}</td>
                  <td className="admin-cell-actions">
                    <button
                      type="button"
                      onClick={() => handleDownload(f.filename)}
                      className="btn btn-primary btn-sm"
                      disabled={downloading === f.filename}
                    >
                      {downloading === f.filename ? '...' : t('تحميل', 'Download')}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(f.filename)}
                      disabled={deleting === f.filename}
                    >
                      {deleting === f.filename ? '...' : t('حذف', 'Delete')}
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
