'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BrandLoader, { BrandDots } from '@/components/BrandLoader';
import { formatBytes, formatDate, type DriveFile } from '@/lib/admin';

/**
 * Lists a client's Billing/Documents files from Google Drive. In admin mode
 * (clientCode set) it also allows upload + delete; in client mode it is
 * download-only. Files stream through the backend, so the browser's session
 * cookie authorizes the download link.
 */
export default function DocumentManager({
  category,
  title,
  clientCode,
}: {
  category: 'billing' | 'documents';
  title: string;
  clientCode?: string;
}) {
  const isAdmin = !!clientCode;
  const base = isAdmin
    ? `/api/admin/clients/${encodeURIComponent(clientCode)}/documents/${category}`
    : `/api/documents/${category}`;

  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setError(null);
    fetch(base)
      .then(async (r) => {
        if (r.status === 503) {
          setError('Document storage is not configured yet.');
          return [];
        }
        if (!r.ok) {
          setError('Could not load files.');
          return [];
        }
        return r.json();
      })
      .then((d) => setFiles(Array.isArray(d) ? (d as DriveFile[]) : []))
      .catch(() => {
        setError('Unable to connect.');
        setFiles([]);
      });
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(base, { method: 'POST', body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Upload failed.');
      } else {
        load();
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Move this file to the Drive trash?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`${base}/${id}`, { method: 'DELETE' });
      if (res.ok) load();
      else setError('Delete failed.');
    } catch {
      setError('Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-brand-dark">{title}</h3>
        {isAdmin && (
          <label className="cursor-pointer text-sm font-semibold text-brand-orange hover:text-brand-coral">
            {uploading ? (
              <span className="inline-flex items-center gap-2">
                <BrandDots /> Uploading…
              </span>
            ) : (
              '+ Upload'
            )}
            <input ref={fileInput} type="file" className="hidden" onChange={upload} disabled={uploading} />
          </label>
        )}
      </div>

      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">{error}</p>
      )}

      {files === null ? (
        <BrandLoader variant="section" />
      ) : files.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No files yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-2 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-dark truncate">{f.name}</p>
                <p className="text-xs text-gray-400">
                  {formatBytes(f.size)} · {formatDate(f.modifiedTime)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`${base}/${f.id}/download`}
                  className="text-sm font-semibold text-brand-orange hover:text-brand-coral"
                >
                  Download
                </a>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => remove(f.id)}
                    disabled={busyId === f.id}
                    className="text-sm font-semibold text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    {busyId === f.id ? '…' : 'Delete'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
