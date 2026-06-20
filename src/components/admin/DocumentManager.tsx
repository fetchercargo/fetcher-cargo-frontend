'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BrandLoader, { BrandDots } from '@/components/BrandLoader';
import { formatBytes, formatDate, type DriveFile } from '@/lib/admin';

/**
 * Lists a client's Billing/Documents files from Google Drive. In admin mode
 * (clientCode set) it also allows upload + delete; in client mode it is
 * download-only. Files stream through the backend, so the browser's session
 * cookie authorizes the download link.
 *
 * When `nested` is set (the Documents area), it becomes a folder browser:
 * breadcrumb navigation, sub-folders listed first, and — in admin mode — create
 * / rename / delete folders and upload into the current folder. Billing stays
 * flat (nested off).
 */
export default function DocumentManager({
  category,
  title,
  clientCode,
  nested = false,
}: {
  category: 'billing' | 'documents';
  title: string;
  clientCode?: string;
  nested?: boolean;
}) {
  const isAdmin = !!clientCode;
  const base = isAdmin
    ? `/api/admin/clients/${encodeURIComponent(clientCode)}/documents/${category}`
    : `/api/documents/${category}`;

  // Breadcrumb stack. The root crumb has id '' (the category root folder).
  const [path, setPath] = useState<{ id: string; name: string }[]>([{ id: '', name: title }]);
  const folderId = path[path.length - 1].id;

  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // List the current folder. For nested (Documents) we pass ?folderId; Billing
  // ignores it server-side.
  const listUrl = nested ? `${base}?folderId=${encodeURIComponent(folderId)}` : base;

  const load = useCallback(() => {
    setError(null);
    setFiles(null);
    fetch(listUrl)
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
  }, [listUrl]);

  useEffect(() => {
    load();
  }, [load]);

  function openFolder(f: DriveFile) {
    setPath((p) => [...p, { id: f.id, name: f.name }]);
  }
  function goTo(index: number) {
    setPath((p) => p.slice(0, index + 1));
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(nested ? `${base}?folderId=${encodeURIComponent(folderId)}` : base, { method: 'POST', body: fd });
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

  async function createFolder() {
    const name = window.prompt('New folder name')?.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${base}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: folderId, name }),
      });
      if (res.ok) load();
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Could not create the folder.');
      }
    } catch {
      setError('Could not create the folder.');
    } finally {
      setCreating(false);
    }
  }

  async function rename(f: DriveFile) {
    const name = window.prompt('Rename folder', f.name)?.trim();
    if (!name || name === f.name) return;
    setBusyId(f.id);
    setError(null);
    try {
      const res = await fetch(`${base}/folders/${encodeURIComponent(f.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) load();
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Rename failed.');
      }
    } catch {
      setError('Rename failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(f: DriveFile) {
    const msg = f.isFolder
      ? 'Move this folder and everything inside it to the Drive trash?'
      : 'Move this file to the Drive trash?';
    if (!window.confirm(msg)) return;
    setBusyId(f.id);
    try {
      const res = await fetch(`${base}/${encodeURIComponent(f.id)}`, { method: 'DELETE' });
      if (res.ok) load();
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Delete failed.');
      }
    } catch {
      setError('Delete failed.');
    } finally {
      setBusyId(null);
    }
  }

  const folders = (files ?? []).filter((f) => f.isFolder);
  const docs = (files ?? []).filter((f) => !f.isFolder);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-brand-dark">{title}</h3>
        {isAdmin && (
          <div className="flex items-center gap-4">
            {nested && (
              <button
                type="button"
                onClick={createFolder}
                disabled={creating}
                className="text-sm font-semibold text-brand-orange hover:text-brand-coral disabled:opacity-50"
              >
                {creating ? '…' : '+ New folder'}
              </button>
            )}
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
          </div>
        )}
      </div>

      {/* Breadcrumb (nested only) */}
      {nested && (
        <nav className="flex flex-wrap items-center gap-1 text-xs text-gray-500 mb-3">
          {path.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-gray-300">/</span>}
              {i === path.length - 1 ? (
                <span className="font-semibold text-brand-dark">{crumb.name}</span>
              ) : (
                <button type="button" onClick={() => goTo(i)} className="hover:text-brand-orange">
                  {crumb.name}
                </button>
              )}
            </span>
          ))}
        </nav>
      )}

      {error && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">{error}</p>
      )}

      {files === null ? (
        <BrandLoader variant="section" />
      ) : folders.length === 0 && docs.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{nested ? 'This folder is empty.' : 'No files yet.'}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {/* Folders first */}
          {folders.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-2 gap-3">
              <button
                type="button"
                onClick={() => openFolder(f)}
                className="flex items-center gap-2 min-w-0 text-left group"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-orange flex-shrink-0">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
                </svg>
                <span className="text-sm font-medium text-brand-dark truncate group-hover:text-brand-orange">{f.name}</span>
              </button>
              {isAdmin && (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => rename(f)}
                    disabled={busyId === f.id}
                    className="text-sm font-semibold text-gray-400 hover:text-brand-dark disabled:opacity-50"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(f)}
                    disabled={busyId === f.id}
                    className="text-sm font-semibold text-gray-400 hover:text-red-500 disabled:opacity-50"
                  >
                    {busyId === f.id ? '…' : 'Delete'}
                  </button>
                </div>
              )}
            </li>
          ))}
          {/* Files */}
          {docs.map((f) => (
            <li key={f.id} className="flex items-center justify-between py-2 gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-brand-dark truncate">{f.name}</p>
                <p className="text-xs text-gray-400">
                  {formatBytes(f.size)} · {formatDate(f.modifiedTime)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`${base}/${encodeURIComponent(f.id)}/download`}
                  className="text-sm font-semibold text-brand-orange hover:text-brand-coral"
                >
                  Download
                </a>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => remove(f)}
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
