import { useState, useEffect, useRef, useCallback } from 'react';
import { createJob, getJob, getDownloadUrl } from '../api/client.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';
import { toolIcons, DefaultToolIcon } from '../data/toolIcons.jsx';
import { ArrowLeft, ArrowRight, CheckCircle2, FileCheck2, ShieldCheck, UploadCloud, X } from 'lucide-react';

export default function ToolCard({ tool, isActive, onSelect, onClose, categoryId }) {
  const { t, language } = useLanguage();
  const [job, setJob] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState([]);
  const [pageInput, setPageInput] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [userText, setUserText] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isActive) {
      setJob(null); setIsBusy(false); setError(''); setFiles([]);
      setPageInput(''); setFindText(''); setReplaceText(''); setUserText('');
      setSortColumn(''); setFilterColumn(''); setFilterValue('');
      setIsDragging(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (!job?.id || ['completed', 'failed'].includes(job.status)) return;
    const interval = setInterval(async () => {
      try {
        const updated = await getJob(job.id);
        setJob(updated);
        if (['completed', 'failed'].includes(updated.status)) { setIsBusy(false); clearInterval(interval); }
      } catch (pollError) { setError(pollError.message); setIsBusy(false); clearInterval(interval); }
    }, 1200);
    return () => clearInterval(interval);
  }, [job]);

  const addFiles = useCallback((newFiles) => {
    const accepted = (tool.accept || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
    const incoming = Array.from(newFiles || []).filter((file) => {
      const lowerName = file.name.toLowerCase();
      return accepted.length === 0 || accepted.some((extension) => lowerName.endsWith(extension));
    });
    if (incoming.length !== Array.from(newFiles || []).length) {
      setError(language === 'ar' ? `نوع ملف غير مدعوم. المسموح: ${tool.accept}` : `Unsupported file type. Allowed: ${tool.accept}`);
    } else {
      setError('');
    }
    setFiles((prev) => {
      const next = tool.multiple ? [...prev] : [];
      incoming.forEach((file) => {
        if (next.length < 20 && !next.some((f) => f.name === file.name && f.size === file.size)) next.push(file);
      });
      return next;
    });
  }, [language, tool.accept, tool.multiple]);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const startProcessing = async () => {
    try {
      setError(''); setIsBusy(true); setJob(null);
      const formData = new FormData();

      if (tool.status === 'needs_dependency' || tool.status === 'coming_soon') {
        setError(tool.placeholderMessage || t('toolUnavailable'));
        setIsBusy(false); return;
      }

      if (tool.id === 'create-from-text') {
        if (!userText.trim()) { setError(t('textRequired')); setIsBusy(false); return; }
        formData.append('text', userText);
      } else {
        if (files.length === 0) { setError(t('fileRequired')); setIsBusy(false); return; }
        if (tool.minFiles && files.length < tool.minFiles) { setError(language === 'ar' ? `هذه الأداة تحتاج ${tool.minFiles} ملف على الأقل.` : `This tool needs at least ${tool.minFiles} files.`); setIsBusy(false); return; }
        files.forEach((f) => formData.append('files', f));
      }

      if (tool.needsPageInput && pageInput) formData.append('pages', pageInput);
      if (tool.mode) formData.append('mode', tool.mode);
      if (tool.needsFindReplace && findText) {
        formData.append('find', findText);
        formData.append('replace', replaceText || '');
      }
      if (tool.needsTextInput && userText && tool.id !== 'create-from-text') formData.append('text', userText);
      if (tool.id === 'sort' && sortColumn) { formData.append('column', sortColumn); formData.append('direction', sortDir); }
      if (tool.id === 'filter' && filterColumn && filterValue) { formData.append('column', filterColumn); formData.append('value', filterValue); }

      const created = await createJob(tool.endpoint, formData, language);
      setJob(created);
      if (['completed', 'failed'].includes(created.status)) setIsBusy(false);
    } catch (startError) {
      setError(startError.message); setIsBusy(false);
    }
  };

  const downloadUrl = job?.status === 'completed' && (job?.output?.ready || job?.output?.path) ? getDownloadUrl(job.id) : '';
  const Icon = toolIcons[tool.icon] || DefaultToolIcon;
  const analyzeData = job?.status === 'completed' && job?.analyzeData;
  const infoData = job?.status === 'completed' && job?.info;
  const isPlaceholder = tool.status === 'needs_dependency' || tool.status === 'coming_soon';
  const DirectionArrow = language === 'ar' ? ArrowLeft : ArrowRight;
  const title = tool.title?.[language] || tool.title?.ar || tool.title || '';
  const description = tool.description?.[language] || tool.description?.ar || tool.description || '';

  return (
    <div className={`tool-card-wrapper ${categoryId || 'pdf'} ${isActive ? 'active' : ''}`}>
      <article
        className="tool-card"
        onClick={!isActive ? onSelect : undefined}
        onKeyDown={!isActive ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(); } } : undefined}
        role={!isActive ? 'button' : undefined}
        tabIndex={!isActive ? 0 : undefined}
        aria-expanded={isActive}
      >
        {isActive && (
          <button className="tool-close" type="button" onClick={onClose} aria-label={t('closeTool')}>
            <X size={20} />
          </button>
        )}
        <div className="tool-card-header">
          <div className="tool-icon"><Icon size={24} strokeWidth={2.2} /></div>
          <div className="tool-card-heading">
            <span className="tool-category-label">{categoryId === 'excel' ? 'EXCEL' : categoryId === 'word' ? 'WORD' : 'PDF'}</span>
            <h3 className="tool-card-title">{title}</h3>
          </div>
          {tool.status !== 'working' && (
            <span className={`status-badge ${tool.status}`}>
              {tool.status === 'coming_soon' ? t('comingSoon') : tool.status === 'needs_dependency' ? t('needsDependency') : ''}
            </span>
          )}
        </div>
        <p className="tool-card-desc">{description}</p>

        {!isActive && !isPlaceholder && <span className="tool-card-action">{t('openTool')} <DirectionArrow size={16} /></span>}
        {!isActive && isPlaceholder && <span className="tool-card-action muted">{t('willBeSupported')}</span>}

        {isActive && isPlaceholder && (
          <div className="placeholder-message">{tool.placeholderMessage || t('toolUnavailable')}</div>
        )}

        {isActive && !isPlaceholder && (
          <div className="tool-workspace">
            <div className="tool-workspace-intro">
              <CheckCircle2 size={18} />
              <span>{t('toolReady')}</span>
            </div>
            {tool.needsPageInput && (
              <div className="input-group">
                <label>{typeof tool.pageLabel === 'object' ? (tool.pageLabel[language] || tool.pageLabel.ar) : (tool.pageLabel || t('pagesLabel'))}</label>
                <input type="text" value={pageInput} onChange={(e) => setPageInput(e.target.value)} placeholder={typeof tool.pageLabel === 'object' ? (tool.pageLabel[language] || tool.pageLabel.ar) : (tool.pageLabel || '1-3, 5, 7-9')} className="text-input" />
              </div>
            )}
            {tool.needsFindReplace && (
              <div className="input-group">
                <label>{t('findLabel')}</label>
                <input type="text" value={findText} onChange={(e) => setFindText(e.target.value)} placeholder={t('findPlaceholder')} className="text-input" />
                <label>{t('replaceLabel')}</label>
                <input type="text" value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder={t('replacePlaceholder')} className="text-input" />
              </div>
            )}
            {tool.needsTextInput && !tool.needsFindReplace && tool.id !== 'create-from-text' && (
              <div className="input-group">
                <label>{typeof tool.textLabel === 'object' ? (tool.textLabel[language] || tool.textLabel.ar) : (tool.textLabel || t('textLabel'))}</label>
                <textarea value={userText} onChange={(e) => setUserText(e.target.value)} placeholder={typeof tool.textLabel === 'object' ? (tool.textLabel[language] || tool.textLabel.ar) : (tool.textLabel || t('textPlaceholder'))} className="text-input textarea" rows={4} />
              </div>
            )}
            {tool.id === 'sort' && (
              <div className="input-group">
                <label>{t('columnName')}</label>
                <input type="text" value={sortColumn} onChange={(e) => setSortColumn(e.target.value)} placeholder={t('columnName')} className="text-input" />
                <label>{t('sortOrder')}</label>
                <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="text-input">
                  <option value="asc">{t('ascending')}</option>
                  <option value="desc">{t('descending')}</option>
                </select>
              </div>
            )}
            {tool.id === 'filter' && (
              <div className="input-group">
                <label>{t('filterColumn')}</label>
                <input type="text" value={filterColumn} onChange={(e) => setFilterColumn(e.target.value)} placeholder={t('filterColumn')} className="text-input" />
                <label>{t('filterValue')}</label>
                <input type="text" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} placeholder={t('filterPlaceholder')} className="text-input" />
              </div>
            )}

            {tool.id !== 'create-from-text' && (
              <>
                <div
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false); }}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
                >
                  <span className="upload-dropzone-icon"><UploadCloud size={28} /></span>
                  <strong>{tool.multiple ? t('dropFilesHere') : t('dropFileHere')}</strong>
                  <span>{t('orChooseFromDevice')}</span>
                  <small>{tool.accept?.replaceAll(',', ', ') || t('supportedFile')}</small>
                  <input ref={inputRef} type="file" multiple={tool.multiple} hidden accept={tool.accept} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
                </div>
                {files.length > 0 && (
                  <div className="file-list">
                    {files.map((file, i) => (
                      <div className="file-item" key={`${file.name}-${file.size}`}>
                        <FileCheck2 size={18} className="file-ready-icon" />
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} ${t('mb')}` : `${Math.round(file.size / 1024)} ${t('kb')}`}</span>
                        <button className="file-remove" type="button" aria-label={`${t('removeFile')} ${file.name}`} onClick={() => removeFile(i)}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {tool.id === 'create-from-text' && (
              <div className="input-group">
                <label>{t('textLabel')}</label>
                <textarea value={userText} onChange={(e) => setUserText(e.target.value)} placeholder={t('textPlaceholder')} className="text-input textarea" rows={6} />
              </div>
            )}

            <div className="process-row">
              <div className="privacy-note"><ShieldCheck size={17} />{t('privacyNote')}</div>
              <button className="btn btn-primary process-button" disabled={isBusy} onClick={startProcessing}>
              {isBusy ? t('processing') : t('startProcessing')}
              </button>
            </div>

            {error && <div className="error-box">{error}</div>}

            {job && (
              <div className="job-status">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${job.progress || 0}%` }} />
                </div>
                <p className="status-text">
                  {job.status === 'queued' && t('queued')}
                  {job.status === 'processing' && t('processing')}
                  {job.status === 'completed' && t('completedSuccess')}
                  {job.status === 'failed' && t('failed')}
                  <span className="progress-pct">{job.progress || 0}%</span>
                </p>
                {job.status === 'failed' && <p className="job-message">{language === 'ar' ? job.message : t('processingFailed')}</p>}
                {job.status === 'completed' && downloadUrl && (
                  <a className="btn btn-success" href={downloadUrl} download>{t('download')}</a>
                )}
                {infoData && (
                  <div className="info-result">
                    <p><strong>{language === 'ar' ? 'عدد الصفحات:' : 'Pages:'}</strong> {infoData.pages}</p>
                    <p><strong>{language === 'ar' ? 'الحجم:' : 'Size:'}</strong> {infoData.pageSizeFormatted}</p>
                    <p><strong>{language === 'ar' ? 'العنوان:' : 'Title:'}</strong> {infoData.title}</p>
                    <p><strong>{language === 'ar' ? 'المؤلف:' : 'Author:'}</strong> {infoData.author}</p>
                  </div>
                )}
                {analyzeData && (
                  <div className="analyze-result">
                    {analyzeData.fileName && <p>{language === 'ar' ? 'اسم الملف:' : 'File:'} {analyzeData.fileName}</p>}
                    {analyzeData.totalRows !== undefined && <p>{language === 'ar' ? 'عدد الصفوف:' : 'Rows:'} {analyzeData.totalRows}</p>}
                    {analyzeData.totalCols !== undefined && <p>{language === 'ar' ? 'عدد الأعمدة:' : 'Columns:'} {analyzeData.totalCols}</p>}
                    {analyzeData.headers?.length > 0 && <p>{language === 'ar' ? 'الأعمدة:' : 'Headers:'} {analyzeData.headers.join('، ')}</p>}
                    {analyzeData.sheets?.map((s, i) => <div key={i} className="sheet-info"><strong>{s.name}</strong> — {s.rows} {language === 'ar' ? 'صف' : 'rows'}, {s.cols} {language === 'ar' ? 'عمود' : 'columns'}</div>)}
                    {analyzeData.emptyCells !== undefined && <p>{language === 'ar' ? 'خلايا فارغة:' : 'Empty cells:'} {analyzeData.emptyCells}</p>}
                    {analyzeData.duplicateCount !== undefined && <p>{language === 'ar' ? 'تكرارات:' : 'Duplicates:'} {analyzeData.duplicateCount}</p>}
                    {analyzeData.data?.length > 0 && (
                      <div className="preview-table-wrapper">
                        <table className="preview-table">
                          <thead><tr>{Object.keys(analyzeData.data[0]).map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
                          <tbody>{analyzeData.data.map((row, ri) => <tr key={ri}>{Object.values(row).map((v, ci) => <td key={ci}>{String(v).slice(0, 30)}</td>)}</tr>)}</tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </article>
    </div>
  );
}
