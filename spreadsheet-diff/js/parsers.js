/**
 * parsers.js
 * -----------------------------------------------------------------------
 * Turns an uploaded File (CSV or XLSX) into a plain structure:
 *   { fileName, headers: string[], rows: object[] }
 *
 * Uses PapaParse for CSV and SheetJS (xlsx) for Excel. Both libraries are
 * loaded from a CDN in index.html and are available as globals
 * (Papa, XLSX).
 * -----------------------------------------------------------------------
 */

/** Reads a File as an ArrayBuffer (needed by SheetJS). */
function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsArrayBuffer(file);
  });
}

/** Reads a File as text (needed by PapaParse). */
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsText(file);
  });
}

/** Validates a header row: must exist and contain no blank/duplicate column names. */
function validateHeaders(headers, fileLabel) {
  if (!headers || headers.length === 0) {
    throw new Error(`${fileLabel}: no header row was found. The first row of the file must contain column names.`);
  }
  const blankIndex = headers.findIndex((h) => String(h).trim() === '');
  if (blankIndex !== -1) {
    throw new Error(`${fileLabel}: column ${blankIndex + 1} has a blank header. Every column needs a name.`);
  }
  const seen = new Set();
  headers.forEach((h) => {
    const key = h.trim();
    if (seen.has(key)) {
      throw new Error(`${fileLabel}: the header "${h}" appears more than once. Column names must be unique.`);
    }
    seen.add(key);
  });
}

/** Parses a CSV file using PapaParse. */
async function parseCSVFile(file) {
  const text = await readAsText(file);
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  if (result.errors && result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type !== 'FieldMismatch');
    if (fatal) {
      throw new Error(`${file.name}: could not parse this CSV (${fatal.message}).`);
    }
  }

  const headers = result.meta.fields || [];
  validateHeaders(headers, file.name);

  return { fileName: file.name, headers, rows: result.data };
}

/** Parses an XLSX (or XLS) file using SheetJS, reading the first sheet. */
async function parseXLSXFile(file) {
  const buffer = await readAsArrayBuffer(file);
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error(`${file.name}: this workbook has no sheets.`);
  }
  const sheet = workbook.Sheets[sheetName];

  // Grab the raw first row separately so headers can be validated precisely.
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  const headers = (rawRows[0] || []).map((h) => (h === undefined ? '' : String(h).trim()));
  validateHeaders(headers, file.name);

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return { fileName: file.name, headers, rows };
}

/** Entry point: dispatches to the right parser based on file extension. */
async function parseSpreadsheetFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.csv')) {
    return parseCSVFile(file);
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXLSXFile(file);
  }
  throw new Error(`${file.name}: unsupported file type. Please upload a .csv or .xlsx file.`);
}
