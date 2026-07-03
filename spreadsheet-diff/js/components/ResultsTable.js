/**
 * ResultsTable
 * Filterable, searchable table of discrepancy records, with CSV and
 * Excel exports.
 */
const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'missing', label: 'Missing rows' },
  { id: 'mismatch', label: 'Mismatched values' },
];

const TYPE_GROUP = {
  'Missing in A': 'missing',
  'Missing in B': 'missing',
  'Value Mismatch': 'mismatch',
};

const TYPE_BADGE_CLASS = {
  'Missing in A': 'badge badge--danger',
  'Missing in B': 'badge badge--danger',
  'Value Mismatch': 'badge badge--warn',
};

function ResultsTable({ discrepancies, filter, setFilter, search, setSearch, onExportCsv, onExportExcel, excelExporting }) {
  const counts = React.useMemo(() => {
    const c = { all: discrepancies.length, missing: 0, mismatch: 0 };
    discrepancies.forEach((d) => {
      const g = TYPE_GROUP[d.discrepancyType];
      if (g) c[g] += 1;
    });
    return c;
  }, [discrepancies]);

  const filtered = React.useMemo(() => {
    let rows = discrepancies;
    if (filter !== 'all') {
      rows = rows.filter((d) => TYPE_GROUP[d.discrepancyType] === filter);
    }
    if (search.trim() !== '') {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (d) =>
          String(d.key).toLowerCase().includes(q) ||
          String(d.columnName).toLowerCase().includes(q) ||
          String(d.valueA).toLowerCase().includes(q) ||
          String(d.valueB).toLowerCase().includes(q)
      );
    }
    return rows;
  }, [discrepancies, filter, search]);

  return (
    <div className="results">
      <div className="results__toolbar">
        <div className="tabs" role="tablist">
          {FILTER_TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              className={`tab ${filter === t.id ? 'tab--active' : ''}`}
              onClick={() => setFilter(t.id)}
            >
              {t.label} <span className="tab__count">{counts[t.id]}</span>
            </button>
          ))}
        </div>

        <div className="results__actions">
          <div className="search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search by row or value…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="button" className="btn-secondary" onClick={onExportExcel} disabled={excelExporting}>
            {excelExporting ? 'Building…' : 'Export Excel (side by side)'}
          </button>
          <button type="button" className="btn-primary" onClick={() => onExportCsv(filtered)}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="diff-table">
          <thead>
            <tr>
              <th>Row</th>
              <th>Discrepancy Type</th>
              <th>Column Name</th>
              <th>Source A Value</th>
              <th>Source B Value</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-cell">
                  No discrepancies match the current filter and search.
                </td>
              </tr>
            )}
            {filtered.map((d, i) => {
              const isMismatch = d.discrepancyType === 'Value Mismatch';
              return (
                <tr key={i}>
                  <td className="mono">{d.key}</td>
                  <td>
                    <span className={TYPE_BADGE_CLASS[d.discrepancyType] || 'badge'}>
                      {d.discrepancyType}
                    </span>
                  </td>
                  <td className="mono">{d.columnName}</td>
                  <td className={`mono ${isMismatch ? 'diff-cell diff-cell--a' : ''}`}>{d.valueA || '—'}</td>
                  <td className={`mono ${isMismatch ? 'diff-cell diff-cell--b' : ''}`}>{d.valueB || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
