import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function CategoryCards({ onSelect }) {
  const { t } = useLanguage();
  const cards = [
    { id: 'pdf', icon: '📄', title: t('pdfTools'), desc: t('pdfToolsDesc'), cls: 'pdf' },
    { id: 'word', icon: '📝', title: t('wordTools'), desc: t('wordToolsDesc'), cls: 'word' },
    { id: 'excel', icon: '📊', title: t('excelTools'), desc: t('excelToolsDesc'), cls: 'excel' }
  ];

  return (
    <section className="categories-section" id="categories">
      <div className="container">
        <div className="section-header">
          <h2>{t('chooseFileType')}</h2>
          <p>{t('chooseFileTypeDesc')}</p>
        </div>
        <div className="categories-grid">
          {cards.map((card) => (
            <div className={`category-card ${card.cls}`} key={card.id} onClick={() => onSelect?.(card.id)}>
              <span className="cat-big-icon">{card.icon}</span>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <button className="cat-btn">{t('viewTools')} ←</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}