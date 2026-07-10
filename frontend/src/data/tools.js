const toolsData = {
  categories: [
    {
      id: 'pdf',
      name: 'PDF',
      icon: 'FileText',
      subcategories: [
        {
          name: { ar: 'أدوات PDF الأساسية', en: 'Core PDF Tools' },
          tools: [
            { id: 'pdf-merge', category: 'pdf', title: { ar: 'دمج ملفات PDF', en: 'Merge PDF Files' }, description: { ar: 'ادمج أكثر من ملف PDF في ملف واحد.', en: 'Combine multiple PDF files into one PDF.' }, endpoint: '/pdf/merge', accept: '.pdf', multiple: true, status: 'working', minFiles: 2, icon: 'Merge' },
            { id: 'pdf-split', category: 'pdf', title: { ar: 'تقسيم ملف PDF', en: 'Split PDF' }, description: { ar: 'قسّم ملف PDF إلى ملف منفصل لكل صفحة داخل ZIP.', en: 'Split a PDF into one file per page inside a ZIP.' }, endpoint: '/pdf/split', accept: '.pdf', multiple: false, status: 'working', icon: 'Split' },
            { id: 'pdf-rotate', category: 'pdf', title: { ar: 'تدوير الصفحات', en: 'Rotate Pages' }, description: { ar: 'دوّر جميع صفحات PDF بزاوية 90 درجة.', en: 'Rotate all PDF pages by 90 degrees.' }, endpoint: '/pdf/rotate', accept: '.pdf', multiple: false, status: 'working', icon: 'RotateCw' },
            { id: 'pdf-compress', category: 'pdf', title: { ar: 'تحسين حجم PDF', en: 'Optimize PDF Size' }, description: { ar: 'أعد حفظ PDF بطريقة محسّنة لتقليل الحجم عند الإمكان.', en: 'Re-save the PDF with optimization where possible.' }, endpoint: '/pdf/compress', accept: '.pdf', multiple: false, status: 'working', icon: 'Archive' },
            { id: 'pdf-info', category: 'pdf', title: { ar: 'معلومات الملف', en: 'PDF Info' }, description: { ar: 'اعرض عدد الصفحات والحجم والعنوان والمؤلف.', en: 'Show page count, size, title, and author.' }, endpoint: '/pdf/info', accept: '.pdf', multiple: false, status: 'working', icon: 'Info' },
            { id: 'pdf-extract-pages', category: 'pdf', title: { ar: 'استخراج صفحات محددة', en: 'Extract Pages' }, description: { ar: 'استخرج صفحات معينة مثل 1-3,5 في ملف PDF جديد.', en: 'Extract selected pages like 1-3,5 into a new PDF.' }, endpoint: '/pdf/extract-pages', accept: '.pdf', multiple: false, status: 'working', icon: 'FileOutput', needsPageInput: true, pageLabel: { ar: 'الصفحات المطلوبة مثل 1-3,5', en: 'Pages to extract, e.g. 1-3,5' } },
            { id: 'pdf-delete-pages', category: 'pdf', title: { ar: 'حذف صفحات', en: 'Delete Pages' }, description: { ar: 'احذف صفحات محددة من ملف PDF.', en: 'Delete selected pages from a PDF.' }, endpoint: '/pdf/delete-pages', accept: '.pdf', multiple: false, status: 'working', icon: 'Trash2', needsPageInput: true, pageLabel: { ar: 'الصفحات المراد حذفها مثل 2,4-5', en: 'Pages to delete, e.g. 2,4-5' } },
            { id: 'pdf-reorder-pages', category: 'pdf', title: { ar: 'إعادة ترتيب الصفحات', en: 'Reorder Pages' }, description: { ar: 'اكتب الترتيب الجديد للصفحات مثل 3,1,2.', en: 'Enter a new page order like 3,1,2.' }, endpoint: '/pdf/reorder-pages', accept: '.pdf', multiple: false, status: 'working', icon: 'ArrowUpDown', needsPageInput: true, pageLabel: { ar: 'ترتيب الصفحات الجديد', en: 'New page order' } },
            { id: 'pdf-reverse-pages', category: 'pdf', title: { ar: 'عكس ترتيب الصفحات', en: 'Reverse Pages' }, description: { ar: 'اعكس ترتيب صفحات PDF بالكامل.', en: 'Reverse the order of all PDF pages.' }, endpoint: '/pdf/reverse-pages', accept: '.pdf', multiple: false, status: 'working', icon: 'RefreshCcw' },
            { id: 'pdf-to-text', category: 'pdf', title: { ar: 'استخراج النص', en: 'Extract Text' }, description: { ar: 'استخرج النص الحقيقي من PDF واحفظه كملف TXT.', en: 'Extract real text from a PDF and save it as TXT.' }, endpoint: '/pdf/text', accept: '.pdf', multiple: false, status: 'working', icon: 'FileSearch' },
            { id: 'pdf-images-to-pdf', category: 'pdf', title: { ar: 'تحويل الصور إلى PDF', en: 'Images to PDF' }, description: { ar: 'حوّل صور JPG و PNG إلى ملف PDF واحد.', en: 'Convert JPG and PNG images into one PDF.' }, endpoint: '/pdf/images-to-pdf', accept: '.jpg,.jpeg,.png', multiple: true, status: 'working', icon: 'ImagePlus' },
            { id: 'pdf-add-watermark', category: 'pdf', title: { ar: 'إضافة علامة مائية', en: 'Add Watermark' }, description: { ar: 'أضف نصاً كعلامة مائية على كل الصفحات.', en: 'Add a text watermark to all pages.' }, endpoint: '/pdf/add-watermark', accept: '.pdf', multiple: false, status: 'working', icon: 'Badge', needsTextInput: true, textLabel: { ar: 'نص العلامة المائية', en: 'Watermark text' } },
            { id: 'pdf-add-page-numbers', category: 'pdf', title: { ar: 'ترقيم الصفحات', en: 'Add Page Numbers' }, description: { ar: 'أضف أرقام الصفحات إلى ملف PDF.', en: 'Add page numbers to a PDF.' }, endpoint: '/pdf/add-page-numbers', accept: '.pdf', multiple: false, status: 'working', icon: 'ListOrdered' }
          ]
        }
      ]
    },
    {
      id: 'word',
      name: 'Word',
      icon: 'FileType',
      subcategories: [
        {
          name: { ar: 'أدوات Word العاملة', en: 'Working Word Tools' },
          tools: [
            { id: 'word-extract-text', category: 'word', title: { ar: 'استخراج النص', en: 'Extract Text' }, description: { ar: 'استخرج نص ملف Word واحفظه كملف TXT.', en: 'Extract Word text and save it as TXT.' }, endpoint: '/word/extract-text', accept: '.docx', multiple: false, status: 'working', icon: 'FileText' },
            { id: 'word-count', category: 'word', title: { ar: 'عدّ الكلمات والحروف', en: 'Word & Character Count' }, description: { ar: 'احسب الكلمات والحروف والفقرات داخل ملف Word.', en: 'Count words, characters, and paragraphs in a Word file.' }, endpoint: '/word/word-count', accept: '.docx', multiple: false, status: 'working', icon: 'Hash' },
            { id: 'word-clean-text', category: 'word', title: { ar: 'تنظيف النص', en: 'Clean Text' }, description: { ar: 'نظّف النص من المسافات الزائدة والأسطر الفارغة.', en: 'Clean extra spaces and empty lines.' }, endpoint: '/word/clean-text', accept: '.docx', multiple: false, status: 'working', icon: 'Sparkles' },
            { id: 'word-find-replace', category: 'word', title: { ar: 'البحث والاستبدال', en: 'Find & Replace' }, description: { ar: 'ابحث عن نص واستبدله داخل ملف Word.', en: 'Find and replace text inside a Word document.' }, endpoint: '/word/find-replace', accept: '.docx', multiple: false, status: 'working', icon: 'Replace', needsFindReplace: true },
            { id: 'word-to-txt', category: 'word', title: { ar: 'تحويل إلى TXT', en: 'Word to TXT' }, description: { ar: 'حوّل ملف Word إلى ملف نصي TXT.', en: 'Convert Word to a TXT file.' }, endpoint: '/word/to-txt', accept: '.docx', multiple: false, status: 'working', icon: 'FileType' },
            { id: 'word-to-html', category: 'word', title: { ar: 'تحويل إلى HTML', en: 'Word to HTML' }, description: { ar: 'حوّل ملف Word إلى HTML منسّق.', en: 'Convert Word content to formatted HTML.' }, endpoint: '/word/to-html', accept: '.docx', multiple: false, status: 'working', icon: 'Code2' },
            { id: 'word-extract-headings', category: 'word', title: { ar: 'استخراج العناوين', en: 'Extract Headings' }, description: { ar: 'استخرج عناوين Heading من ملف Word.', en: 'Extract Heading styles from a Word file.' }, endpoint: '/word/extract-headings', accept: '.docx', multiple: false, status: 'working', icon: 'Heading' },
            { id: 'word-extract-links', category: 'word', title: { ar: 'استخراج الروابط', en: 'Extract Links' }, description: { ar: 'استخرج جميع الروابط الموجودة داخل Word.', en: 'Extract all hyperlinks from Word.' }, endpoint: '/word/extract-links', accept: '.docx', multiple: false, status: 'working', icon: 'Link' },
            { id: 'create-from-text', category: 'word', title: { ar: 'إنشاء Word من نص', en: 'Create Word from Text' }, description: { ar: 'اكتب نصاً وأنشئ منه ملف Word جديد.', en: 'Write text and generate a new Word document.' }, endpoint: '/word/create-from-text', accept: '', multiple: false, status: 'working', icon: 'FilePlus2', needsTextInput: true }
          ]
        }
      ]
    },
    {
      id: 'excel',
      name: 'Excel',
      icon: 'FileSpreadsheet',
      subcategories: [
        {
          name: { ar: 'أدوات Excel العاملة', en: 'Working Excel Tools' },
          tools: [
            { id: 'excel-analyze', category: 'excel', title: { ar: 'تحليل Excel', en: 'Analyze Excel' }, description: { ar: 'اعرض الأوراق والصفوف والأعمدة ومعلومات الملف.', en: 'Show sheets, rows, columns, and file information.' }, endpoint: '/excel/analyze', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'BarChart3' },
            { id: 'excel-to-csv', category: 'excel', title: { ar: 'Excel إلى CSV', en: 'Excel to CSV' }, description: { ar: 'حوّل أول Sheet إلى ملف CSV.', en: 'Convert the first sheet to CSV.' }, endpoint: '/excel/to-csv', accept: '.xlsx', multiple: false, status: 'working', icon: 'FileSpreadsheet' },
            { id: 'excel-csv-to-excel', category: 'excel', title: { ar: 'CSV إلى Excel', en: 'CSV to Excel' }, description: { ar: 'حوّل ملف CSV إلى Excel منظم.', en: 'Convert CSV to an organized Excel file.' }, endpoint: '/excel/csv-to-excel', accept: '.csv', multiple: false, status: 'working', icon: 'Table' },
            { id: 'excel-split-sheets', category: 'excel', title: { ar: 'تقسيم حسب Sheets', en: 'Split by Sheets' }, description: { ar: 'قسّم كل Sheet في ملف Excel إلى ملف منفصل داخل ZIP.', en: 'Split each sheet into a separate workbook inside a ZIP.' }, endpoint: '/excel/split-sheets', accept: '.xlsx', multiple: false, status: 'working', icon: 'Sheet' },
            { id: 'excel-merge-files', category: 'excel', title: { ar: 'دمج ملفات Excel', en: 'Merge Excel Files' }, description: { ar: 'ادمج عدة ملفات Excel أو CSV في ملف واحد.', en: 'Merge several Excel or CSV files into one workbook.' }, endpoint: '/excel/merge-files', accept: '.xlsx,.csv', multiple: true, status: 'working', minFiles: 2, icon: 'Combine' },
            { id: 'excel-merge-sheets', category: 'excel', title: { ar: 'دمج Sheets', en: 'Merge Sheets' }, description: { ar: 'ادمج كل Sheets داخل الملف في Sheet واحد.', en: 'Merge all sheets in a workbook into one sheet.' }, endpoint: '/excel/merge-sheets', accept: '.xlsx', multiple: false, status: 'working', icon: 'Layers' },
            { id: 'excel-remove-empty-rows', category: 'excel', title: { ar: 'حذف الصفوف الفارغة', en: 'Remove Empty Rows' }, description: { ar: 'احذف الصفوف الفارغة من أول Sheet.', en: 'Remove empty rows from the first sheet.' }, endpoint: '/excel/remove-empty-rows', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'Rows3' },
            { id: 'excel-remove-empty-columns', category: 'excel', title: { ar: 'حذف الأعمدة الفارغة', en: 'Remove Empty Columns' }, description: { ar: 'احذف الأعمدة الفارغة من أول Sheet.', en: 'Remove empty columns from the first sheet.' }, endpoint: '/excel/remove-empty-columns', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'Columns3' },
            { id: 'excel-remove-duplicates', category: 'excel', title: { ar: 'حذف التكرارات', en: 'Remove Duplicates' }, description: { ar: 'احذف الصفوف المكررة من ملف Excel.', en: 'Remove duplicate rows from Excel.' }, endpoint: '/excel/remove-duplicates', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'CopyX' },
            { id: 'excel-clean-spaces', category: 'excel', title: { ar: 'تنظيف المسافات', en: 'Clean Spaces' }, description: { ar: 'نظّف الخلايا النصية من المسافات الزائدة.', en: 'Clean extra spaces from text cells.' }, endpoint: '/excel/clean-spaces', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'Sparkles' },
            { id: 'excel-find-replace', category: 'excel', title: { ar: 'البحث والاستبدال', en: 'Find & Replace' }, description: { ar: 'ابحث عن قيمة واستبدلها في كل Sheets.', en: 'Find and replace a value across all sheets.' }, endpoint: '/excel/find-replace', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'SearchCheck', needsFindReplace: true },
            { id: 'excel-fill-empty', category: 'excel', title: { ar: 'ملء القيم الفارغة', en: 'Fill Empty Cells' }, description: { ar: 'استبدل الخلايا الفارغة بقيمة تختارها.', en: 'Replace empty cells with your chosen value.' }, endpoint: '/excel/fill-empty', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'PaintBucket', needsTextInput: true, textLabel: { ar: 'القيمة البديلة', en: 'Replacement value' } },
            { id: 'excel-summary', category: 'excel', title: { ar: 'ملخص وتحليل', en: 'Summary Report' }, description: { ar: 'أنشئ تقريراً عن الصفوف والأعمدة والقيم الفارغة والتكرارات.', en: 'Generate a report for rows, columns, empty values, and duplicates.' }, endpoint: '/excel/summary', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'ClipboardList' },
            { id: 'excel-preview-first', category: 'excel', title: { ar: 'أول 10 صفوف', en: 'First 10 Rows' }, description: { ar: 'اعرض أول 10 صفوف من الملف.', en: 'Preview the first 10 rows.' }, endpoint: '/excel/preview/first', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'Eye', mode: 'first' },
            { id: 'excel-preview-last', category: 'excel', title: { ar: 'آخر 10 صفوف', en: 'Last 10 Rows' }, description: { ar: 'اعرض آخر 10 صفوف من الملف.', en: 'Preview the last 10 rows.' }, endpoint: '/excel/preview/last', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'Eye', mode: 'last' },
            { id: 'sort', category: 'excel', title: { ar: 'ترتيب البيانات', en: 'Sort Data' }, description: { ar: 'رتّب البيانات حسب اسم عمود تختاره.', en: 'Sort rows by a selected column name.' }, endpoint: '/excel/sort', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'ArrowDownAZ' },
            { id: 'filter', category: 'excel', title: { ar: 'فلترة البيانات', en: 'Filter Data' }, description: { ar: 'استخرج الصفوف التي تحتوي على قيمة معينة.', en: 'Keep rows containing a specific value.' }, endpoint: '/excel/filter', accept: '.xlsx,.csv', multiple: false, status: 'working', icon: 'Filter' }
          ]
        }
      ]
    }
  ]
};

export default toolsData;
