/**
 * compareEngine.js
 * -----------------------------------------------------------------------
 * Pure functions that compare two parsed datasets and produce a flat list
 * of discrepancy records plus a summary. No DOM/React code lives here so
 * it can be tested or reused independently of the UI.
 *
 * Matching strategy: rows are compared by POSITION (row 1 vs row 1, row 2
 * vs row 2, ...). This needs no configuration, which is the point - but
 * it means results are most meaningful when both files list rows in the
 * same order. If a row is inserted or removed in the middle of one file,
 * every row after that point will look mismatched, since it's now lined
 * up against the wrong row on the other side.
 * -----------------------------------------------------------------------
 */

const DISCREPANCY_TYPES = {
  MISSING_IN_A: 'Missing in A',
  MISSING_IN_B: 'Missing in B',
  VALUE_MISMATCH: 'Value Mismatch',
};

/** Treats null/undefined/blank consistently and trims whitespace. */
function cleanValue(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/** Normalizes a value for comparison purposes (case folding, blank handling). */
function normalizeForCompare(value, caseSensitive) {
  const cleaned = cleanValue(value);
  return caseSensitive ? cleaned : cleaned.toLowerCase();
}

/**
 * Compares two datasets and returns { discrepancies, columnNotice, summary }.
 *
 * @param {object} params
 * @param {object[]} params.rowsA
 * @param {object[]} params.rowsB
 * @param {string[]} params.headersA
 * @param {string[]} params.headersB
 * @param {string[]} params.ignoredColumns - columns excluded from comparison
 * @param {boolean}  params.caseSensitive
 */
function compareDatasets({ rowsA, rowsB, headersA, headersB, ignoredColumns, caseSensitive }) {
  const ignoredSet = new Set(ignoredColumns);
  const commonColumns = headersA.filter((h) => headersB.includes(h) && !ignoredSet.has(h));
  const onlyInA = headersA.filter((h) => !headersB.includes(h));
  const onlyInB = headersB.filter((h) => !headersA.includes(h));

  const discrepancies = [];

  // Row-by-row (positional) comparison.
  const maxLen = Math.max(rowsA.length, rowsB.length);
  let matched = 0;
  const mismatchedRowLabels = new Set();
  let missing = 0;

  for (let i = 0; i < maxLen; i += 1) {
    const rowA = rowsA[i];
    const rowB = rowsB[i];
    const label = `Row ${i + 1}`;

    if (rowA && !rowB) {
      missing += 1;
      discrepancies.push({
        key: label,
        discrepancyType: DISCREPANCY_TYPES.MISSING_IN_B,
        columnName: '(entire row)',
        valueA: 'Row present',
        valueB: '',
      });
      continue;
    }
    if (!rowA && rowB) {
      missing += 1;
      discrepancies.push({
        key: label,
        discrepancyType: DISCREPANCY_TYPES.MISSING_IN_A,
        columnName: '(entire row)',
        valueA: '',
        valueB: 'Row present',
      });
      continue;
    }

    let rowHasMismatch = false;
    commonColumns.forEach((col) => {
      const rawA = cleanValue(rowA[col]);
      const rawB = cleanValue(rowB[col]);
      if (normalizeForCompare(rawA, caseSensitive) !== normalizeForCompare(rawB, caseSensitive)) {
        rowHasMismatch = true;
        discrepancies.push({
          key: label,
          discrepancyType: DISCREPANCY_TYPES.VALUE_MISMATCH,
          columnName: col,
          valueA: rawA,
          valueB: rawB,
        });
      }
    });

    if (rowHasMismatch) {
      mismatchedRowLabels.add(label);
    } else {
      matched += 1;
    }
  }

  // Sort by row number so results read top-to-bottom in the same order
  // as the source files, making it easy to scan for what's missing or
  // different without hunting through the list.
  discrepancies.sort((a, b) => {
    const rowNumber = (label) => parseInt(String(label).replace(/[^0-9]/g, ''), 10) || 0;
    return rowNumber(a.key) - rowNumber(b.key);
  });

  return {
    discrepancies,
    commonColumns,
    columnNotice: { onlyInA, onlyInB },
    summary: {
      totalA: rowsA.length,
      totalB: rowsB.length,
      matched,
      mismatched: mismatchedRowLabels.size,
      missing,
    },
  };
}
