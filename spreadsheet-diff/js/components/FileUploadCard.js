/**
 * FileUploadCard
 * A drag-and-drop / click-to-browse card for one source file.
 */
function getFileKind(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'xlsx' || ext === 'xls') return { label: 'XLS', kindClass: 'file-icon--xlsx' };
  return { label: 'CSV', kindClass: 'file-icon--csv' };
}

function FileUploadCard({ label, sourceTag, file, error, onFileSelected, onClear }) {
  const inputRef = React.useRef(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFiles = (fileList) => {
    const picked = fileList && fileList[0];
    if (picked) onFileSelected(picked);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={`upload-card ${file ? 'upload-card--filled' : ''} ${error ? 'upload-card--error' : ''}`}>
      <div className="upload-card__tag">{sourceTag}</div>
      <h3 className="upload-card__label">{label}</h3>

      <div
        className={`dropzone ${isDragOver ? 'dropzone--active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current && inputRef.current.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />

        {!file && (
          <div className="dropzone__empty">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 3v12m0-12 4 4m-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p><strong>Drop file</strong> or click to browse</p>
            <div className="dropzone__formats">
              <span className="file-icon file-icon--csv">CSV</span>
              <span className="file-icon file-icon--xlsx">XLS</span>
            </div>
          </div>
        )}

        {file && (
          <div className="dropzone__filled" onClick={(e) => e.stopPropagation()}>
            <span className={`file-icon ${getFileKind(file.fileName).kindClass}`}>
              {getFileKind(file.fileName).label}
            </span>
            <div className="file-chip">
              <span className="file-chip__name">{file.fileName}</span>
              <span className="file-chip__meta">
                {file.rows.length} rows · {file.headers.length} columns
              </span>
            </div>
            <button type="button" className="btn-text" onClick={onClear}>
              Replace file
            </button>
          </div>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
