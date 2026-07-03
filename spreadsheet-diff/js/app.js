/**
 * App
 * Top-level component. Flow: upload two files -> comparison runs
 * automatically by row position -> results update live as options change.
 * There is no key-column setup step - see compareEngine.js for the
 * matching strategy and its tradeoffs.
 */
function App() {
  const [fileA, setFileA] = React.useState(null);
  const [fileB, setFileB] = React.useState(null);
  const [errorA, setErrorA] = React.useState(null);
  const [errorB, setErrorB] = React.useState(null);

  const [ignoredColumns, setIgnoredColumns] = React.useState([]);
  const [caseSensitive, setCaseSensitive] = React.useState(false);

  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [excelExporting, setExcelExporting] = React.useState(false);

  const bothFilesReady = Boolean(fileA && fileB && !errorA && !errorB);

  const commonHeaders = React.useMemo(() => {
    if (!bothFilesReady) return [];
    return fileA.headers.filter((h) => fileB.headers.includes(h));
  }, [fileA, fileB, bothFilesReady]);

  // Comparison recomputes automatically whenever the files or options
  // change - there's no separate "Compare" step.
  const result = React.useMemo(() => {
    if (!bothFilesReady) return null;
    return compareDatasets({
      rowsA: fileA.rows,
      rowsB: fileB.rows,
      headersA: fileA.headers,
      headersB: fileB.headers,
      ignoredColumns,
      caseSensitive,
    });
  }, [fileA, fileB, bothFilesReady, ignoredColumns, caseSensitive]);

  async function handleFileSelected(source, file) {
    const setFile = source === 'A' ? setFileA : setFileB;
    const setError = source === 'A' ? setErrorA : setErrorB;
    setError(null);
    setFile(null);
    try {
      const parsed = await parseSpreadsheetFile(file);
      setFile(parsed);
    } catch (err) {
      setError(err.message || 'Could not read this file.');
    }
  }

  function handleClear(source) {
    if (source === 'A') { setFileA(null); setErrorA(null); }
    else { setFileB(null); setErrorB(null); }
  }

  function handleStartOver() {
    setFileA(null);
    setFileB(null);
    setErrorA(null);
    setErrorB(null);
    setIgnoredColumns([]);
    setCaseSensitive(false);
    setFilter('all');
    setSearch('');
  }

  async function handleExportExcel() {
    if (!result) return;
    setExcelExporting(true);
    try {
      await downloadComparisonExcel({
        fileA,
        fileB,
        commonColumns: result.commonColumns,
        discrepancies: result.discrepancies,
      });
    } catch (err) {
      window.alert(`Could not build the Excel report: ${err.message || err}`);
    } finally {
      setExcelExporting(false);
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar__brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </span>
          <span className="brand-name">Spreadsheet Diff</span>
        </div>
        <span className="privacy-badge">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Runs entirely in your browser
        </span>
      </div>

      <header className="page__header">
        <h1>Compare two spreadsheets, spot every discrepancy</h1>
        <p className="page__subtitle">
          Upload a CSV or Excel file for each source. Rows and columns are compared
          automatically, row by row — no setup required.
        </p>
      </header>

      <section className="upload-grid">
        <FileUploadCard
          label="Source A"
          sourceTag="A"
          file={fileA}
          error={errorA}
          onFileSelected={(f) => handleFileSelected('A', f)}
          onClear={() => handleClear('A')}
        />
        <FileUploadCard
          label="Source B"
          sourceTag="B"
          file={fileB}
          error={errorB}
          onFileSelected={(f) => handleFileSelected('B', f)}
          onClear={() => handleClear('B')}
        />
      </section>

      {result && (
        <section className="panel">
          {(result.columnNotice.onlyInA.length > 0 || result.columnNotice.onlyInB.length > 0) && (
            <div className="column-notice">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
              <span>
                {result.columnNotice.onlyInA.length > 0 && (
                  <>Columns only in Source A ({result.columnNotice.onlyInA.join(', ')}) </>
                )}
                {result.columnNotice.onlyInB.length > 0 && (
                  <>Columns only in Source B ({result.columnNotice.onlyInB.join(', ')}) </>
                )}
                were excluded from the comparison.
              </span>
            </div>
          )}

          <SummaryBar summary={result.summary} />

          <OptionsPanel
            ignorableHeaders={commonHeaders}
            ignoredColumns={ignoredColumns}
            setIgnoredColumns={setIgnoredColumns}
            caseSensitive={caseSensitive}
            setCaseSensitive={setCaseSensitive}
          />

          <ResultsTable
            discrepancies={result.discrepancies}
            filter={filter}
            setFilter={setFilter}
            search={search}
            setSearch={setSearch}
            onExportCsv={(rows) => downloadDiscrepancyReport(rows)}
            onExportExcel={handleExportExcel}
            excelExporting={excelExporting}
          />

          <div className="panel__footer panel__footer--left">
            <button type="button" className="btn-text" onClick={handleStartOver}>
              ← Start a new comparison
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
