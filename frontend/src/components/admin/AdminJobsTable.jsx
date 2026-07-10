import { useState, useEffect, useMemo, Fragment } from 'react';
import { adminApi } from '../../api/admin.js';

const STATUS_LIST = ['all', 'queued', 'processing', 'completed', 'failed'];
const STATUS_LABELS = {
  ar: { all: 'الكل', queued: 'في الانتظار', processing: 'قيد المعالجة', completed: 'مكتملة', failed: 'فاشلة' },
  en: { all: 'All', queued: 'Queued', processing: 'Processing', completed: 'Completed', failed: 'Failed' }
};

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminJobsTable() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const lang = localStorage.getItem('nexoraedit_language') || 'ar';
  const t = (ar, en) => lang === 'ar' ? ar : en;
  const sl = STATUS_LABELS[lang];

  const fetchJobs = () => {
    setLoading(true);
    setError('');
    adminApi.getJobs()
      .then(setJobs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleDelete = (jobId) => {
    if (!window.confirm(t('هل أنت متأكد من حذف هذه العملية؟', 'Are you sure you want to delete this job?'))) return;
    setDeleting(jobId);
    adminApi.deleteJob(jobId)
      .then(() => setJobs(prev => prev.filter(j => j.id !== jobId)))
      .catch(e => alert(e.message))
      .finally(() => setDeleting(null));
  };

  const handleDownload = (jobId, fileName) => {
    setDownloading(jobId);
    adminApi.downloadJob(jobId, fileName)
      .catch(e => alert(e.message))
      .finally(() => setDownloading(null));
  };

  const filtered = useMemo(() => {
    let list = [...jobs];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(j => (j.id || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      list = list.filter(j => j.status === statusFilter);
    }
    return list;
  }, [jobs, search, statusFilter]);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">{t('إدارة العمليات', 'Job Management')}</h2>
        <button className="btn btn-secondary" onClick={fetchJobs} disabled={loading}>
          {loading ? '...' : '🔄'}
        </button>
      </div>

      <div className="admin-filters">
        <input
          className="text-input"
          placeholder={t('بحث برقم العملية...', 'Search by job ID...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="text-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUS_LIST.map(s => <option key={s} value={s}>{sl[s]}</option>)}
        </select>
      </div>

      {error && <div className="admin-error-box">{error}</div>}

      {loading ? (
        <div className="admin-loading-spinner" />
      ) : filtered.length === 0 ? (
        <div className="admin-empty">{t('لا توجد عمليات', 'No jobs found')}</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('رقم العملية', 'Job ID')}</th>
                <th>{t('الأداة', 'Tool')}</th>
                <th>{t('الحالة', 'Status')}</th>
                <th>{t('الملف', 'File')}</th>
                <th>{t('تاريخ الإنشاء', 'Created At')}</th>
                <th>{t('تاريخ الانتهاء', 'Completed At')}</th>
                <th>{t('الإجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <Fragment key={j.id}>
                  <tr
                    className={`admin-job-row ${expanded === j.id ? 'expanded' : ''}`}
                    onClick={() => setExpanded(expanded === j.id ? null : j.id)}
                  >
                    <td className="admin-cell-id">{j.id}</td>
                    <td>{j.tool || '-'}</td>
                    <td>
                      <span className={`admin-status-badge ${j.status}`}>
                        {sl[j.status] || j.status}
                      </span>
                    </td>
                    <td>{j.files?.map(file => file.originalname).join(', ') || '-'}</td>
                    <td>{formatDate(j.createdAt)}</td>
                    <td>{formatDate(j.completedAt)}</td>
                    <td className="admin-cell-actions" onClick={e => e.stopPropagation()}>
                      {j.status === 'completed' && j.id && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleDownload(j.id, j.output?.downloadName)}
                          disabled={downloading === j.id}
                        >
                          {downloading === j.id ? '...' : t('تحميل', 'Download')}
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(j.id)}
                        disabled={deleting === j.id}
                      >
                        {deleting === j.id ? '...' : t('حذف', 'Delete')}
                      </button>
                    </td>
                  </tr>
                  {expanded === j.id && (
                    <tr className="admin-job-detail-row">
                      <td colSpan={7}>
                        <div className="admin-job-detail">
                          <pre>{JSON.stringify(j, null, 2)}</pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
