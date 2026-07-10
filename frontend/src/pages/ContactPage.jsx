import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <>
      <section className="contact-page-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('contactPageTitle')}</h2>
            <p>{t('contactPageDesc')}</p>
          </div>

          <div className="contact-page-grid">
            <div className="contact-page-card">
              <div className="contact-page-icon">📞</div>
              <h3>{t('phoneCall')}</h3>
              <p>{t('phoneCallDesc')}</p>
              <a href="tel:03302277" className="contact-page-link">03302277</a>
            </div>

            <div className="contact-page-card">
              <div className="contact-page-icon">✉️</div>
              <h3>{t('email')}</h3>
              <p>{t('emailDesc')}</p>
              <a href="mailto:nexora0126@gmail.com" className="contact-page-link">nexora0126@gmail.com</a>
            </div>

            <div className="contact-page-card">
              <div className="contact-page-icon">💬</div>
              <h3>{t('techSupport')}</h3>
              <p>{t('techSupportDesc')}</p>
              <p className="contact-page-text">{t('responseTime')}</p>
            </div>
          </div>

          <div className="contact-page-info">
            <div className="contact-page-info-card">
              <h4>NexoraEdit</h4>
              <p>{t('aboutNexoraEdit')}</p>
              <Link to="/" className="btn btn-primary">{t('backToHome')}</Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .contact-page-section {
          padding: 120px 0 80px;
          min-height: 100vh;
        }
        .contact-page-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 48px;
        }
        .contact-page-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-lg);
          padding: 40px 24px;
          text-align: center;
          backdrop-filter: blur(12px);
          transition: all 0.3s ease;
        }
        .contact-page-card:hover {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 8px 30px rgba(56,189,248,0.15);
        }
        .contact-page-icon {
          font-size: 48px;
          margin-bottom: 16px;
          display: block;
        }
        .contact-page-card h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .contact-page-card p {
          color: var(--text-muted);
          font-size: 14px;
          margin-bottom: 16px;
        }
        .contact-page-link {
          display: inline-block;
          padding: 10px 24px;
          background: var(--gradient-main);
          color: white;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        .contact-page-link:hover {
          box-shadow: 0 0 30px rgba(37,99,235,0.4);
          transform: translateY(-1px);
        }
        .contact-page-text {
          color: var(--accent) !important;
          font-weight: 500;
        }
        .contact-page-info {
          display: flex;
          justify-content: center;
        }
        .contact-page-info-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-lg);
          padding: 40px;
          text-align: center;
          max-width: 600px;
          backdrop-filter: blur(12px);
        }
        .contact-page-info-card h4 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 12px;
          background: var(--gradient-main);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .contact-page-info-card p {
          color: var(--text-muted);
          font-size: 15px;
          margin-bottom: 24px;
          line-height: 1.8;
        }
        @media (max-width: 768px) {
          .contact-page-grid {
            grid-template-columns: 1fr;
          }
          .contact-page-section {
            padding: 100px 0 60px;
          }
        }
      `}</style>
    </>
  );
}
