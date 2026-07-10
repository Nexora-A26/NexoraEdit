import ExcelJS from 'exceljs';
import path from 'node:path';
import { createZip } from './archiveService.js';

function safeSheetName(value, existingNames = []) {
  const base = String(value || 'Sheet').replace(/[\\/?*\[\]:]/g, '-').slice(0, 31) || 'Sheet';
  let candidate = base;
  let suffix = 2;
  while (existingNames.includes(candidate)) {
    const marker = `-${suffix++}`;
    candidate = `${base.slice(0, 31 - marker.length)}${marker}`;
  }
  return candidate;
}

function cellValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || '').join('');
  if ('result' in value) return cellValue(value.result);
  if ('text' in value) return value.text;
  if ('hyperlink' in value) return value.text || value.hyperlink;
  return String(value);
}

function rowValues(worksheet, rowNumber, columnCount = worksheet.columnCount) {
  const row = worksheet.getRow(rowNumber);
  return Array.from({ length: columnCount }, (_, index) => cellValue(row.getCell(index + 1).value));
}

function hasValue(value) {
  return String(cellValue(value)).trim() !== '';
}

function isEmptyRow(values) {
  return values.every((value) => !hasValue(value));
}

function copyWorksheet(source, target) {
  const columnCount = source.columnCount;
  for (let rowNumber = 1; rowNumber <= source.rowCount; rowNumber++) {
    target.addRow(rowValues(source, rowNumber, columnCount));
  }
}

async function loadWorkbook(file) {
  const workbook = new ExcelJS.Workbook();
  const extension = path.extname(file.originalname || file.path).toLowerCase();
  if (extension === '.csv') await workbook.csv.readFile(file.path);
  else await workbook.xlsx.readFile(file.path);
  if (workbook.worksheets.length === 0) throw new Error('الملف لا يحتوي على أوراق عمل.');
  return workbook;
}

async function writeXlsx(workbook, file, name) {
  const outputPath = path.join(path.dirname(file.path), name);
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

export async function analyzeExcel(file) {
  const workbook = await loadWorkbook(file);
  const sheets = workbook.worksheets.map((worksheet) => ({
    name: worksheet.name,
    rows: Math.max(0, worksheet.actualRowCount - 1),
    cols: worksheet.actualColumnCount,
    headers: rowValues(worksheet, 1, worksheet.actualColumnCount).map(String)
  }));
  return { fileName: file.originalname, sheets, message: `تم تحليل الملف. ${sheets.length} ورقة.` };
}

export async function toCsv(file) {
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const outputPath = path.join(path.dirname(file.path), 'converted.csv');
  await workbook.csv.writeFile(outputPath, { sheetName: worksheet.name });
  return { outputPath, downloadName: 'converted.csv', mimeType: 'text/csv', message: 'تم تحويل Excel إلى CSV بنجاح.' };
}

export async function csvToExcel(file) {
  const workbook = await loadWorkbook(file);
  const outputPath = await writeXlsx(workbook, file, 'converted.xlsx');
  return { outputPath, downloadName: 'converted.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: 'تم تحويل CSV إلى Excel بنجاح.' };
}

export async function splitSheets(file) {
  const workbook = await loadWorkbook(file);
  const resultFiles = [];
  for (const worksheet of workbook.worksheets) {
    const outputWorkbook = new ExcelJS.Workbook();
    const outputSheet = outputWorkbook.addWorksheet(safeSheetName(worksheet.name));
    copyWorksheet(worksheet, outputSheet);
    const safeName = safeSheetName(worksheet.name).replace(/\s+/g, '-');
    const outputPath = path.join(path.dirname(file.path), `sheet-${safeName}.xlsx`);
    await outputWorkbook.xlsx.writeFile(outputPath);
    resultFiles.push({ path: outputPath, name: `sheet-${safeName}.xlsx` });
  }
  const zipPath = path.join(path.dirname(file.path), 'split-sheets.zip');
  await createZip(zipPath, resultFiles);
  return { outputPath: zipPath, downloadName: 'split-sheets.zip', mimeType: 'application/zip', message: `تم تقسيم الملف إلى ${resultFiles.length} ورقة داخل ZIP.` };
}

export async function mergeFiles(files, outputDir) {
  const mergedWorkbook = new ExcelJS.Workbook();
  for (const file of files) {
    const workbook = await loadWorkbook(file);
    for (const worksheet of workbook.worksheets) {
      const outputSheet = mergedWorkbook.addWorksheet(safeSheetName(worksheet.name, mergedWorkbook.worksheets.map((sheet) => sheet.name)));
      copyWorksheet(worksheet, outputSheet);
    }
  }
  const outputPath = path.join(outputDir, 'merged.xlsx');
  await mergedWorkbook.xlsx.writeFile(outputPath);
  return { outputPath, downloadName: 'merged.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم دمج ${files.length} ملف في ملف واحد.` };
}

export async function mergeSheets(file) {
  const workbook = await loadWorkbook(file);
  const outputWorkbook = new ExcelJS.Workbook();
  const outputSheet = outputWorkbook.addWorksheet('Merged');
  workbook.worksheets.forEach((worksheet, sheetIndex) => {
    for (let rowNumber = sheetIndex === 0 ? 1 : 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      outputSheet.addRow(rowValues(worksheet, rowNumber));
    }
  });
  const outputPath = await writeXlsx(outputWorkbook, file, 'merged-sheets.xlsx');
  return { outputPath, downloadName: 'merged-sheets.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم دمج ${workbook.worksheets.length} ورقة في ورقة واحدة.` };
}

export async function removeEmptyRows(file) {
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const outputWorkbook = new ExcelJS.Workbook();
  const outputSheet = outputWorkbook.addWorksheet(safeSheetName(worksheet.name));
  let removed = 0;
  for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
    const values = rowValues(worksheet, rowNumber);
    if (isEmptyRow(values)) removed++;
    else outputSheet.addRow(values);
  }
  const outputPath = await writeXlsx(outputWorkbook, file, 'no-empty-rows.xlsx');
  return { outputPath, downloadName: 'no-empty-rows.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم حذف ${removed} صف فارغ.` };
}

export async function removeEmptyColumns(file) {
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const columnCount = worksheet.columnCount;
  const columnsToKeep = [];
  for (let column = 1; column <= columnCount; column++) {
    let containsData = false;
    for (let row = 1; row <= worksheet.rowCount; row++) {
      if (hasValue(worksheet.getRow(row).getCell(column).value)) { containsData = true; break; }
    }
    if (containsData) columnsToKeep.push(column);
  }
  const outputWorkbook = new ExcelJS.Workbook();
  const outputSheet = outputWorkbook.addWorksheet(safeSheetName(worksheet.name));
  for (let row = 1; row <= worksheet.rowCount; row++) {
    outputSheet.addRow(columnsToKeep.map((column) => cellValue(worksheet.getRow(row).getCell(column).value)));
  }
  const outputPath = await writeXlsx(outputWorkbook, file, 'no-empty-cols.xlsx');
  return { outputPath, downloadName: 'no-empty-cols.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم حذف ${columnCount - columnsToKeep.length} عمود فارغ.` };
}

export async function removeDuplicates(file) {
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const outputWorkbook = new ExcelJS.Workbook();
  const outputSheet = outputWorkbook.addWorksheet(safeSheetName(worksheet.name));
  if (worksheet.rowCount > 0) outputSheet.addRow(rowValues(worksheet, 1));
  const seen = new Set();
  let removed = 0;
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const values = rowValues(worksheet, rowNumber);
    if (isEmptyRow(values)) continue;
    const key = JSON.stringify(values);
    if (seen.has(key)) removed++;
    else { seen.add(key); outputSheet.addRow(values); }
  }
  const outputPath = await writeXlsx(outputWorkbook, file, 'no-duplicates.xlsx');
  return { outputPath, downloadName: 'no-duplicates.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم حذف ${removed} صف مكرر.` };
}

export async function cleanSpaces(file) {
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  let count = 0;
  worksheet.eachRow({ includeEmpty: true }, (row) => row.eachCell({ includeEmpty: true }, (cell) => {
    if (typeof cell.value !== 'string') return;
    const cleaned = cell.value.replace(/[ \t]+/g, ' ').trim();
    if (cleaned !== cell.value) { cell.value = cleaned; count++; }
  }));
  const outputPath = await writeXlsx(workbook, file, 'cleaned.xlsx');
  return { outputPath, downloadName: 'cleaned.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم تنظيف ${count} خلية.` };
}

export async function findReplaceExcel(file, findText, replaceText) {
  if (String(findText).length > 500 || String(replaceText).length > 500) throw new Error('قيمة البحث أو الاستبدال طويلة جداً.');
  const workbook = await loadWorkbook(file);
  let count = 0;
  workbook.worksheets.forEach((worksheet) => worksheet.eachRow({ includeEmpty: true }, (row) => row.eachCell((cell) => {
    if (typeof cell.value === 'string' && cell.value.includes(findText)) {
      count += cell.value.split(findText).length - 1;
      cell.value = cell.value.split(findText).join(replaceText);
    }
  })));
  const outputPath = await writeXlsx(workbook, file, 'find-replaced.xlsx');
  return { outputPath, downloadName: 'find-replaced.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم استبدال القيمة في ${count} موضع.` };
}

export async function sortData(file, columnName, direction) {
  if (String(columnName).length > 200) throw new Error('اسم العمود طويل جداً.');
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const headers = rowValues(worksheet, 1).map(String);
  const columnIndex = headers.indexOf(columnName);
  if (columnIndex < 0) throw new Error(`العمود "${columnName}" غير موجود. الأعمدة: ${headers.join(', ')}`);
  const rows = [];
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const values = rowValues(worksheet, row);
    if (!isEmptyRow(values)) rows.push(values);
  }
  const descending = direction === 'desc';
  rows.sort((a, b) => {
    const first = a[columnIndex];
    const second = b[columnIndex];
    const firstNumber = Number(first);
    const secondNumber = Number(second);
    const comparison = Number.isFinite(firstNumber) && Number.isFinite(secondNumber)
      ? firstNumber - secondNumber
      : String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' });
    return descending ? -comparison : comparison;
  });
  const outputWorkbook = new ExcelJS.Workbook();
  const outputSheet = outputWorkbook.addWorksheet(safeSheetName(worksheet.name));
  outputSheet.addRow(headers);
  rows.forEach((row) => outputSheet.addRow(row));
  const outputPath = await writeXlsx(outputWorkbook, file, 'sorted.xlsx');
  return { outputPath, downloadName: 'sorted.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم ترتيب البيانات حسب العمود "${columnName}".` };
}

export async function filterData(file, columnName, filterValue) {
  if (String(columnName).length > 200 || String(filterValue).length > 500) throw new Error('قيمة الفلترة طويلة جداً.');
  if (!String(filterValue || '').trim()) throw new Error('يرجى إدخال قيمة للفلترة.');
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const headers = rowValues(worksheet, 1).map(String);
  const columnIndex = headers.indexOf(columnName);
  if (columnIndex < 0) throw new Error(`العمود "${columnName}" غير موجود.`);
  const rows = [];
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const values = rowValues(worksheet, row);
    if (String(values[columnIndex]).toLowerCase().includes(String(filterValue).toLowerCase())) rows.push(values);
  }
  const outputWorkbook = new ExcelJS.Workbook();
  const outputSheet = outputWorkbook.addWorksheet(safeSheetName(worksheet.name));
  outputSheet.addRow(headers);
  rows.forEach((row) => outputSheet.addRow(row));
  const outputPath = await writeXlsx(outputWorkbook, file, 'filtered.xlsx');
  return { outputPath, downloadName: 'filtered.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تمت الفلترة. ${rows.length} صف مطابق.` };
}

export async function fillEmpty(file, fillValue) {
  if (String(fillValue).length > 500) throw new Error('القيمة البديلة طويلة جداً.');
  if (!String(fillValue || '').trim()) throw new Error('يرجى إدخال قيمة بديلة.');
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const rowCount = worksheet.rowCount;
  const columnCount = worksheet.columnCount;
  let count = 0;
  for (let row = 1; row <= rowCount; row++) {
    for (let column = 1; column <= columnCount; column++) {
      const cell = worksheet.getRow(row).getCell(column);
      if (!hasValue(cell.value)) { cell.value = fillValue; count++; }
    }
  }
  const outputPath = await writeXlsx(workbook, file, 'filled.xlsx');
  return { outputPath, downloadName: 'filled.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', message: `تم ملء ${count} خلية فارغة.` };
}

export async function previewData(file, mode) {
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const rows = [];
  for (let row = 1; row <= worksheet.rowCount; row++) rows.push(rowValues(worksheet, row));
  const data = mode === 'last' ? rows.slice(-10) : rows.slice(0, 10);
  return { data, totalRows: rows.length, previewRows: data.length, outputPath: null, downloadName: null, mimeType: 'application/json', message: `تم عرض ${data.length} صف من أصل ${rows.length}.` };
}

export async function summaryExcel(file) {
  const workbook = await loadWorkbook(file);
  const worksheet = workbook.worksheets[0];
  const headers = rowValues(worksheet, 1).map((value, index) => String(value || `Column ${index + 1}`));
  const rows = [];
  for (let row = 2; row <= worksheet.rowCount; row++) {
    const values = rowValues(worksheet, row, headers.length);
    if (!isEmptyRow(values)) rows.push(values);
  }
  let emptyCells = 0;
  let duplicateCount = 0;
  const seen = new Set();
  const colStats = {};
  const colTypes = {};
  headers.forEach((header) => { colTypes[header] = new Set(); });
  rows.forEach((values) => {
    const key = JSON.stringify(values);
    if (seen.has(key)) duplicateCount++;
    else seen.add(key);
    values.forEach((value, index) => {
      const header = headers[index];
      if (!hasValue(value)) emptyCells++;
      else if (typeof value === 'number') colTypes[header].add('number');
      else if (!Number.isNaN(Date.parse(String(value))) && /[-/]/.test(String(value))) colTypes[header].add('date');
      else colTypes[header].add('text');
    });
  });
  headers.forEach((header, index) => {
    const values = rows.map((row) => Number(row[index])).filter(Number.isFinite);
    if (values.length > 0) {
      const sum = values.reduce((total, value) => total + value, 0);
      colStats[header] = { sum: sum.toFixed(2), avg: (sum / values.length).toFixed(2), min: Math.min(...values), max: Math.max(...values), count: values.length };
    }
  });
  return {
    fileName: file.originalname,
    sheets: workbook.worksheets.length,
    totalRows: rows.length,
    totalCols: headers.length,
    headers,
    emptyCells,
    totalCells: rows.length * headers.length,
    duplicateCount,
    colStats,
    colTypes: Object.fromEntries(Object.entries(colTypes).map(([key, value]) => [key, [...value].join(', ') || 'فارغ'])),
    outputPath: null,
    message: `تم إنشاء التقرير: ${rows.length} صف، ${headers.length} عمود، ${emptyCells} خلية فارغة، ${duplicateCount} مكرر.`
  };
}
