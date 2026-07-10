import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-row"><img src="/nexora-mark.jpg" alt="Nexora logo" /><span className="logo-text">NexoraEdit</span></div>
          <p>{t('footerDesc')}</p>
        </div>
        <div className="footer-col">
          <h4>{t('tools')}</h4>
          <Link to="/">PDF</Link>
          <Link to="/">Word</Link>
          <Link to="/">Excel</Link>
        </div>
        <div className="footer-col">
          <h4>{t('support')}</h4>
          <span>{t('phone')}: 03302277</span>
          <span>nexora0126@gmail.com</span>
          <Link to="/contact">{t('contactUs')}</Link>
          <a href="#">{t('privacy')}</a>
          <a href="#">{t('terms')}</a>
        </div>
        <div className="footer-col">
          <h4>NexoraEdit</h4>
          <Link to="/admin" className="footer-admin-link">{t('admin')}</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>© {new Date().getFullYear()} NexoraEdit. {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
}