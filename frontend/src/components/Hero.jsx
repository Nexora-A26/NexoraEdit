import { useLanguage } from '../i18n/LanguageContext.jsx';
import { CheckCircle2, LockKeyhole, Zap } from 'lucide-react';

export default function Hero({ onCta }) {
  const { t, language } = useLanguage();

  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero-classic">
          <p className="hero-eyebrow">{t('smartPlatform')}</p>
          <h1 className="hero-title">
            {language === 'ar' ? 'مرحباً، ماذا تريد أن تفعل بملفك؟' : "Hi, what would you like to do with your file?"}
          </h1>
          <p className="hero-subtitle">{t('heroSubtitle')}</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => onCta?.('all')}>
              {t('startUsingTools')}
            </button>
          </div>
          <div className="hero-trust-row" aria-label={t('serviceBenefits')}>
            <span><CheckCircle2 size={17} />{t('noLoginRequired')}</span>
            <span><LockKeyhole size={17} />{t('filesPrivate')}</span>
            <span><Zap size={17} />{t('fastProcessing')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
