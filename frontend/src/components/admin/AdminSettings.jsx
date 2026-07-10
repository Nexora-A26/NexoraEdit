import { useState, useEffect } from 'react';
import { adminApi } from '../../api/admin.js';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const lang = localStorage.getItem('nexoraedit_language') || 'ar';
  const t = (ar, en) => lang === 'ar' ? ar : en;

  const fetchSettings = () => {
    setLoading(true);
    setError('');
    adminApi.getSettings()
      .then(setSettings)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await adminApi.updateSettings(settings);
      setSuccess(t('تم حفظ الإعدادات بنجاح', 'Settings saved successfully'));
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-section"><div className="admin-loading-spinner" /></div>;
  if (error && !settings) return <div className="admin-section"><div className="admin-error-box">{error}</div></div>;

  return (
    <div className="admin-section">
      <h2 className="admin-section-title">{t('الإعدادات', 'Settings')}</h2>

      <div className="admin-settings-form">
        <div className="input-group">
          <label>{t('اسم الموقع', 'Site Name')}</label>
          <input
            className="text-input"
            value={settings?.siteName || ''}
            onChange={e => handleChange('siteName', e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>{t('رقم الهاتف', 'Phone')}</label>
          <input
            className="text-input"
            value={settings?.phone || ''}
            onChange={e => handleChange('phone', e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>{t('البريد الإلكتروني', 'Email')}</label>
          <input
            className="text-input"
            type="email"
            value={settings?.email || ''}
            onChange={e => handleChange('email', e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>{t('اللغة الافتراضية', 'Default Language')}</label>
          <select
            className="text-input"
            value={settings?.defaultLanguage || 'ar'}
            onChange={e => handleChange('defaultLanguage', e.target.value)}
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="input-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings?.showDisabledTools ?? false}
              onChange={e => handleChange('showDisabledTools', e.target.checked)}
            />
            <span>{t('إظهار الأدوات المعطلة', 'Show Disabled Tools')}</span>
          </label>
        </div>

        <div className="input-group">
          <label>{t('الحد الأقصى للرفع ميغابايت', 'Max Upload Size MB')}</label>
          <input
            className="text-input"
            type="number"
            min="1"
            value={settings?.maxUploadSize || 50}
            onChange={e => handleChange('maxUploadSize', parseInt(e.target.value) || 1)}
          />
        </div>

        {error && <div className="admin-error-box">{error}</div>}
        {success && <div className="admin-success-box">{success}</div>}

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '...' : t('حفظ', 'Save')}
        </button>
      </div>
    </div>
  );
}
