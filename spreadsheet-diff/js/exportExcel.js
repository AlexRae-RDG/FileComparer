/**
 * exportExcel.js
 * -----------------------------------------------------------------------
 * Builds a single-sheet Excel workbook that lists Source A and Source B
 * side by side, column by column, with:
 *   - rows missing from one side filled solid orange
 *   - mismatched cell pairs filled light amber
 *
 * Uses ExcelJS rather than SheetJS for this, since SheetJS's free/
 * community build can only write plain data - it can't write cell fills.
 * ExcelJS is loaded from a CDN in index.html as the global `ExcelJS`.
 * -----------------------------------------------------------------------
 */

const EXCEL_FILL_MISSING = 'FFF6A400'; // solid orange - entire row missing from one side
const EXCEL_FILL_MISMATCH = 'FFFFE8A3'; // light amber - a specific mismatched cell pair
const EXCEL_FILL_HEADER = 'FF1F2430'; // dark header band

/** Groups discrepancies by row number for quick lookup while building the sheet. */
function indexDiscrepanciesByRow(discrepancies) {
  const missingRows = new Set();
  const mismatchColumnsByRow = new Map();

  discrepancies.forEach((d) => {
    const rowNumber = parseInt(String(d.key).replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(rowNumber)) return;

    if (d.discrepancyType === 'Missing in A' || d.discrepancyType === 'Missing in B') {
      missingRows.add(rowNumber);
    } else if (d.discrepancyType === 'Value Mismatch') {
      if (!mismatchColumnsByRow.has(rowNumber)) mismatchColumnsByRow.set(rowNumber, new Set());
      mismatchColumnsByRow.get(rowNumber).add(d.columnName);
    }
  });

  return { missingRows, mismatchColumnsByRow };
}

/**
 * Builds and downloads the side-by-side Excel report.
 *
 * @param {object} params
 * @param {object}   params.fileA        - parsed Source A ({ rows, fileName })
 * @param {object}   params.fileB        - parsed Source B ({ rows, fileName })
 * @param {string[]} params.commonColumns - the columns actually compared (in order)
 * @param {object[]} params.discrepancies - the full (unfiltered) discrepancy list
 * @param {string}   [params.fileName]
 */
async function downloadComparisonExcel({ fileA, fileB, commonColumns, discrepancies, fileName = 'comparison-side-by-side.xlsx' }) {
  const { missingRows, mismatchColumnsByRow } = indexDiscrepanciesByRow(discrepancies);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Comparison');

  // Header: "Row" then, for each compared column, an A/B pair.
  const headerCells = ['Row'];
  commonColumns.forEach((col) => {
    headerCells.push(`${col} (Source A)`, `${col} (Source B)`);
  });
  const headerRow = sheet.addRow(headerCells);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_FILL_HEADER } };
    cell.alignment = { vertical: 'middle' };
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const maxLen = Math.max(fileA.rows.length, fileB.rows.length);

  for (let i = 0; i < maxLen; i += 1) {
    const rowA = fileA.rows[i];
    const rowB = fileB.rows[i];
    const rowNumber = i + 1;

    const values = [rowNumber];
    commonColumns.forEach((col) => {
      values.push(rowA ? cleanValue(rowA[col]) : '');
      values.push(rowB ? cleanValue(rowB[col]) : '');
    });

    const excelRow = sheet.addRow(values);

    if (missingRows.has(rowNumber)) {
      excelRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_FILL_MISSING } };
      });
    } else {
      const mismatchedCols = mismatchColumnsByRow.get(rowNumber);
      if (mismatchedCols) {
        commonColumns.forEach((col, idx) => {
          if (!mismatchedCols.has(col)) return;
          const colOffset = 2 + idx * 2; // 1-based: col 1 is "Row"
          [colOffset, colOffset + 1].forEach((colNum) => {
            excelRow.getCell(colNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_FILL_MISMATCH } };
          });
        });
      }
    }
  }

  // Light borders + sensible column widths for readability.
  sheet.getColumn(1).width = 8;
  for (let c = 2; c <= headerCells.length; c += 1) {
    sheet.getColumn(c).width = 22;
  }
  sheet.eachRow((row) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      };
    });
  });

  // A short legend a couple of rows below the data so the colors are self-explanatory.
  const legendStartRow = sheet.rowCount + 2;
  const legendMissing = sheet.getRow(legendStartRow);
  legendMissing.getCell(1).value = 'Orange = row missing from one side';
  legendMissing.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_FILL_MISSING } };
  const legendMismatch = sheet.getRow(legendStartRow + 1);
  legendMismatch.getCell(1).value = 'Amber = mismatched value';
  legendMismatch.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXCEL_FILL_MISMATCH } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
