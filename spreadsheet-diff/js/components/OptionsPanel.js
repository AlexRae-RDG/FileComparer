/**
 * OptionsPanel
 * Lightweight, non-blocking options: case sensitivity and columns to
 * ignore. These live-update the comparison as soon as they change -
 * there's no separate "apply" step.
 */
function OptionsPanel({ ignorableHeaders, ignoredColumns, setIgnoredColumns, caseSensitive, setCaseSensitive }) {
  const toggleIgnored = (col) => {
    setIgnoredColumns((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  return (
    <div className="options-bar">
      <label className="switch-row switch-row--inline">
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
        <span className="switch-row__label">Case-sensitive</span>
      </label>

      {ignorableHeaders.length > 0 && (
        <div className="ignore-columns">
          <span className="ignore-columns__label">Ignore:</span>
          <div className="chip-grid">
            {ignorableHeaders.map((col) => (
              <label key={col} className={`chip chip--muted ${ignoredColumns.includes(col) ? 'chip--selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={ignoredColumns.includes(col)}
                  onChange={() => toggleIgnored(col)}
                />
                {col}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
