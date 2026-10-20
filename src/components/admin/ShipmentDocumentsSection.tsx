'use client';

import { useCallback, useEffect, useState } from 'react';
import BrandLoader, { BrandDots } from '@/components/BrandLoader';
import { formatBytes, formatDateTime } from '@/lib/admin';
import {
  SHIPMENT_DOC_ACCEPT,
  SHIPMENT_DOC_KINDS,
  shipmentDocProblem,
  shipmentDocUrl,
  type ShipmentDocKind,
  type ShipmentDocument,
} from '@/lib/shipmentDocuments';

const linkCls = 'text-sm font-semibold text-brand-orange hover:text-brand-coral';

/**
 * The shipment's POD and LR, uploaded, replaced and removed here. The files go
 * in the client's Google Drive folder, Documents/<client>/Shipments/<AWB>, so
 * nothing can be uploaded until the shipment has a client and an AWB; the
 * server says which is missing.
 */
export default function ShipmentDocumentsSection({ shipmentId }: { shipmentId: number }) {
  const [docs, setDocs] = useState<ShipmentDocument[] | null>(null);
  const [uploadBlocked, setUploadBlocked] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ kind: ShipmentDocKind; label: string } | null>(null);
  const base = `/api/admin/shipments/${shipmentId}/documents`;

  const load = useCallback(() => {
    fetch(base)
      .then(async (res) => {
        if (res.status === 503) {
          setLoadError('Document storage is not configured yet.');
          return;
        }
        if (!res.ok) {
          setLoadError('Could not load documents.');
          return;
        }
        const d = await res.json();
        setDocs(Array.isArray(d.items) ? (d.items as ShipmentDocument[]) : []);
        setUploadBlocked(typeof d.uploadBlocked === 'string' ? d.uploadBlocked : '');
        setLoadError(null);
      })
      .catch(() => setLoadError('Unable to connect.'));
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(kind: ShipmentDocKind, file: File) {
    const problem = shipmentDocProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy({ kind, label: 'Uploading…' });
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${base}/${kind}`, { method: 'POST', body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Upload failed.');
        return;
      }
      load();
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setBusy(null);
    }
  }

  async function remove(kind: ShipmentDocKind, label: string) {
    if (!window.confirm(`Remove the ${label}? The file moves to the Google Drive trash.`)) return;
    setBusy({ kind, label: 'Removing…' });
    setError(null);
    try {
      const res = await fetch(`${base}/${kind}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Could not remove the document.');
        return;
      }
      load();
    } catch {
      setError('Could not remove the document.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-brand-dark">Documents</h2>

      {loadError ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-3">{loadError}</p>
      ) : docs === null ? (
        <BrandLoader variant="section" />
      ) : (
        <>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
          <ul className="divide-y divide-gray-100 mt-2">
            {SHIPMENT_DOC_KINDS.map(({ kind, label }) => {
              const doc = docs.find((d) => d.kind === kind);
              const present = doc && !doc.missing ? doc : null;
              const canUpload = !uploadBlocked && busy === null;
              return (
                <li key={kind} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-dark">{label}</p>
                    {present ? (
                      <p className="text-xs text-gray-400 break-all">
                        {present.fileName} · {formatBytes(present.sizeBytes)} · Uploaded {formatDateTime(present.uploadedAt)}
                      </p>
                    ) : doc ? (
                      <p className="text-xs text-amber-700">File missing: it was deleted from Google Drive. Upload it again.</p>
                    ) : (
                      <p className="text-xs text-gray-400">Not uploaded</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {busy?.kind === kind ? (
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-gray">
                        <BrandDots /> {busy.label}
                      </span>
                    ) : (
                      <>
                        {present && (
                          <>
                            <a href={shipmentDocUrl('admin', shipmentId, kind)} target="_blank" rel="noopener noreferrer" className={linkCls}>
                              View
                            </a>
                            <a href={shipmentDocUrl('admin', shipmentId, kind, true)} download className={linkCls}>
                              Download
                            </a>
                          </>
                        )}
                        <label
                          title={uploadBlocked || undefined}
                          className={canUpload ? `cursor-pointer ${linkCls}` : 'text-sm font-semibold text-gray-300 cursor-not-allowed'}
                        >
                          {present ? 'Replace' : 'Upload'}
                          <input
                            type="file"
                            accept={SHIPMENT_DOC_ACCEPT}
                            className="hidden"
                            disabled={!canUpload}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              // Cleared so choosing the same file again still uploads it.
                              e.target.value = '';
                              if (file) upload(kind, file);
                            }}
                          />
                        </label>
                        {present && (
                          <button
                            type="button"
                            onClick={() => remove(kind, label)}
                            disabled={busy !== null}
                            className="text-sm font-semibold text-gray-400 hover:text-red-500 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className={`text-xs mt-2 ${uploadBlocked ? 'text-amber-700' : 'text-gray-400'}`}>
            {uploadBlocked || 'PDF, JPG or PNG, up to 10 MB. The client can view and download these.'}
          </p>
        </>
      )}
    </div>
  );
}
