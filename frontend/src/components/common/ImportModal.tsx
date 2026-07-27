import { useState, useRef, useMemo } from 'react';
import { FiUpload, FiDownload, FiCheckCircle } from 'react-icons/fi';
import Modal from './Modal';
import { downloadTemplate, importStudents } from '../../api/importApi';
import type { BulkImportResponse } from '../../types';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkImportResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && (dropped.name.endsWith('.xlsx') || dropped.name.endsWith('.xls'))) {
      setFile(dropped);
      setResult(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await importStudents(file);
      setResult(res);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: BulkImportResponse } };
      if (axiosError.response?.data) {
        setResult(axiosError.response.data);
      } else {
        setResult({
          success: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          errors: [{ row: 0, message: 'Failed to import file. Please try again.' }],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const hasErrors = result?.errors != null && result.errors.length > 0;

  const groupedErrors = useMemo(() => {
    if (!hasErrors) return [];
    const map: Record<number, string[]> = {};
    for (const err of result.errors!) {
      if (!map[err.row]) map[err.row] = [];
      map[err.row].push(err.message);
    }
    return Object.entries(map)
      .map(([row, messages]) => ({ row: Number(row), messages }))
      .sort((a, b) => a.row - b.row);
  }, [result?.errors, hasErrors]);

  const footer = result?.success ? (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
      <button type="button" className="btn btnGreen" onClick={handleClose}>
        Done
      </button>
    </div>
  ) : undefined;

  const importButton = file && !result ? (
    <button
      type="button"
      className="btn btnGreen"
      style={{ width: '100%', marginTop: 16 }}
      onClick={handleUpload}
      disabled={loading}
    >
      {loading ? 'Importing...' : 'Upload & Import'}
    </button>
  ) : null;

  return (
    <Modal open={open} onClose={handleClose} title="Import Students" width={600}>
      <div className="import-modal-body">
        <button
          type="button"
          className="btn btnGreen"
          style={{ width: '100%', marginBottom: 16 }}
          onClick={downloadTemplate}
        >
          <FiDownload size={16} />
          &nbsp;Download Template
        </button>

        <div
          className={`import-drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            hidden
          />
          {file ? (
            <div className="import-file-info">
              <FiUpload size={24} />
              <p className="import-file-name">{file.name}</p>
              <p className="import-file-size">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="import-drop-text">
              <FiUpload size={32} />
              <p>Drag & drop an Excel file here, or click to browse</p>
              <p className="import-drop-hint">Supports .xlsx files</p>
            </div>
          )}
        </div>

        {importButton}

        {loading && (
          <div className="import-progress">
            <div className="spinner" />
            <p>Processing file...</p>
          </div>
        )}

        {result && (
          <div className="import-result success">
            <FiCheckCircle size={24} />
            <div className="import-result-text">
              <h3>Import Summary</h3>
              <p>Total Rows: {result.totalRows}</p>
              <p>Valid Rows: {result.validRows}</p>
              <p>Invalid Rows: {result.invalidRows}</p>
              <p>Students Imported: {result.studentsImported ?? 0}</p>
              <p>Guardians Created: {result.guardiansCreated ?? 0}</p>
            </div>
          </div>
        )}

        {hasErrors && (
          <div className="import-errors">
            <h4>Failed Rows</h4>
            <div className="import-errors-list">
              {groupedErrors.map(({ row, messages }) => (
                <div key={row} className="import-error-item">
                  <div className="import-error-row">Row {row}</div>
                  {messages.map((msg, i) => (
                    <div key={i} className="import-error-msg">&bull; {msg}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
