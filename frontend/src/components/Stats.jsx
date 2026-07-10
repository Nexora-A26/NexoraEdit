import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function Stats({ stats }) {
  const { t, language } = useLanguage();
  const items = [
    { icon: '📦', value: `${stats?.all || 50}+`, label: language === 'ar' ? 'أداة' : 'Tools' },
    { icon: '📂', value: '3', label: language === 'ar' ? 'أنواع ملفات' : 'File Types' },
    { icon: '🌐', value: '100%', label: language === 'ar' ? 'واجهة عربية' : 'Arabic Interface' },
    { icon: '🔓', value: '—', label: t('noLoginRequired') }
  ];

  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {items.map((item, i) => (
            <div className="stat-glass" key={i}>
              <span className="stat-icon">{item.icon}</span>
              <span className="stat-number">{item.value}</span>
              <span className="stat-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}