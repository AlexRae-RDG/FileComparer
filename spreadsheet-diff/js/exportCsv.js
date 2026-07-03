/**
 * exportCsv.js
 * -----------------------------------------------------------------------
 * Converts a list of discrepancy records into a downloadable CSV file.
 * -----------------------------------------------------------------------
 */

/** Escapes a single CSV field per RFC 4180. */
function escapeCsvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Builds a CSV string from the discrepancy rows. */
function buildDiscrepancyCsv(rows) {
  const headers = ['Key', 'Discrepancy Type', 'Column Name', 'Source A Value', 'Source B Value'];
  const lines = [headers.map(escapeCsvField).join(',')];
  rows.forEach((r) => {
    lines.push(
      [r.key, r.discrepancyType, r.columnName, r.valueA, r.valueB].map(escapeCsvField).join(',')
    );
  });
  return lines.join('\n');
}

/** Triggers a browser download of the discrepancy report as a CSV file. */
function downloadDiscrepancyReport(rows, fileName = 'discrepancy-report.csv') {
  const csv = buildDiscrepancyCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
