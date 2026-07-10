import ToolCard from './ToolCard.jsx';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { FileSpreadsheet, FileText, Search, X } from 'lucide-react';

export default function ToolBrowser({ tools, activeCategory, onSelectCategory, activeTool, onSelectTool, searchQuery, onSearchChange, statusFilter, onStatusFilter }) {
  const { t, language } = useLanguage();

  const statusLabels = {
    all: t('allTools'),
    working: t('workingTools')
  };

  const categoryTabs = [
    { id: 'all', label: t('all'), icon: null },
    { id: 'pdf', label: 'PDF', icon: FileText },
    { id: 'word', label: 'Word', icon: FileText },
    { id: 'excel', label: 'Excel', icon: FileSpreadsheet }
  ];

  return (
    <section className="tool-browser-section" id="tools">
      <div className="container">
        <div className="section-header">
          <h2>{t('chooseRightTool')}</h2>
          <p>{t('selectTool')}</p>
        </div>
        <div className="browser-top">
          <div className="browser-search" role="search">
            <Search className="browser-search-icon" size={20} aria-hidden="true" />
            <input
              type="text"
              placeholder={t('searchTool')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label={t('searchTool')}
            />
            {searchQuery && (
              <button className="search-clear" type="button" onClick={() => onSearchChange('')} aria-label={t('clearSearch')}>
                <X size={17} />
              </button>
            )}
          </div>
          <div className="browser-tabs" role="tablist" aria-label={t('fileCategories')}>
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                className={`browser-tab ${activeCategory === tab.id ? 'active' : ''}`}
                onClick={() => { onSelectCategory(tab.id); onSelectTool(null); }}
                type="button"
                role="tab"
                aria-selected={activeCategory === tab.id}
              >
                {tab.icon && <tab.icon size={17} />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="browser-utility-row">
          <p className="results-count">
            {language === 'ar' ? `${tools.length} أداة متاحة` : `${tools.length} tool${tools.length === 1 ? '' : 's'} available`}
          </p>
          <div className="browser-filters">
          {Object.entries(statusLabels).map(([key, label]) => (
            <button
              key={key}
              className={`filter-chip ${statusFilter === key ? 'active' : ''}`}
              onClick={() => onStatusFilter(key)}
            >
              {label}
            </button>
          ))}
          </div>
        </div>
        <div className="tools-grid">
          {tools.length > 0 ? tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onSelect={() => onSelectTool(tool.id)}
              onClose={() => onSelectTool(null)}
              categoryId={tool.categoryId || tool.category}
            />
          )) : (
            <div className="empty-state">
              {t('noResults')}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
