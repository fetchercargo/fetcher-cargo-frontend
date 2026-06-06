'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import BulkReviewGrid from '@/components/dashboard/BulkReviewGrid';
import BulkResult from '@/components/dashboard/BulkResult';
import type { BulkValidateResponse, ShipmentSummary } from '@/lib/bulk';

const ACCEPTED = '.xlsx';
const MAX_BYTES = 5 * 1024 * 1024;

type Stage = 'select' | 'review' | 'result';

function UploadIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
      <path d="M16 16l-4-4-4 4" />
      <path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BulkCreatePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<Stage>('select');
  const [validation, setValidation] = useState<BulkValidateResponse | null>(null);
  const [created, setCreated] = useState<ShipmentSummary[]>([]);
  const [batchNo, setBatchNo] = useState('');

  function selectFiles(files: FileList | null) {
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    selectFiles(e.dataTransfer.files);
  }

  function clearFile() {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function reset() {
    setFile(null);
    setValidation(null);
    setCreated([]);
    setBatchNo('');
    setError(null);
    setStage('select');
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleValidate() {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError('File is too large. The maximum size is 5 MB.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/shipments/bulk/validate', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not read the file. Please upload the .xlsx template.');
        return;
      }
      setValidation(data as BulkValidateResponse);
      setStage('review');
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === 'result') {
    return <BulkResult created={created} batchNo={batchNo} onUploadAnother={reset} />;
  }

  if (stage === 'review' && validation) {
    return (
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Review shipments</h1>
            <p className="text-gray-500 mt-1">
              Fix any highlighted cells, then create. {validation.rowCount} row{validation.rowCount === 1 ? '' : 's'} found.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="hidden sm:inline text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors whitespace-nowrap"
          >
            ← Choose a different file
          </button>
        </div>
        <div className="mt-6">
          <BulkReviewGrid
            response={validation}
            onCreated={(c, b) => {
              setCreated(c);
              setBatchNo(b);
              setStage('result');
            }}
            onCancel={reset}
          />
        </div>
      </div>
    );
  }

  // stage === 'select'
  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Bulk Create Shipments</h1>
          <p className="text-gray-500 mt-1">Upload an Excel file to create multiple shipments at once.</p>
        </div>
        <Link
          href="/dashboard/create-shipment"
          className="hidden sm:inline text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors whitespace-nowrap"
        >
          ← Single shipment
        </Link>
      </div>

      {/* How it works + template */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mt-6">
        <h2 className="text-base font-semibold text-brand-dark">How it works</h2>
        <ol className="mt-3 space-y-1.5 text-sm text-gray-600 list-decimal list-inside">
          <li>Download the bulk-upload template.</li>
          <li>Fill in one row per shipment (pickup, delivery, parcel, mode, etc.).</li>
          <li>Upload it below — review and fix any flagged rows, then create them all.</li>
        </ol>
        <a
          href="/templates/fetcher-bulk-shipments-template.xlsx"
          download="fetcher-bulk-shipments-template.xlsx"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:text-brand-coral transition-colors"
        >
          <DownloadIcon /> Download template
        </a>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mt-4">
        <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => selectFiles(e.target.files)} />

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`w-full flex flex-col items-center justify-center text-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors ${
              dragActive ? 'border-brand-orange bg-orange-50' : 'border-gray-300 hover:border-brand-orange hover:bg-gray-50'
            }`}
          >
            <UploadIcon />
            <p className="mt-3 text-brand-dark font-medium">Drag &amp; drop your Excel file here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse</p>
            <p className="text-gray-400 text-xs mt-3">Accepted: .xlsx · up to 5&nbsp;MB · 500 rows max</p>
          </button>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <FileIcon />
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-dark truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
              </div>
            </div>
            <button type="button" onClick={clearFile} className="text-gray-400 hover:text-red-500 transition-colors p-1" aria-label="Remove file">
              <CloseIcon />
            </button>
          </div>
        )}

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        <div className="flex items-center justify-end gap-3 mt-5">
          <Link href="/dashboard/create-shipment" className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
            Cancel
          </Link>
          <button
            type="button"
            disabled={!file || submitting}
            onClick={handleValidate}
            className="px-8 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Validating…' : 'Upload & review'}
          </button>
        </div>
      </div>
    </div>
  );
}
