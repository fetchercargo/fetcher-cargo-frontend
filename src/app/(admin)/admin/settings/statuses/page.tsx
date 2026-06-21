'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLoader from '@/components/BrandLoader';
import {
  STATUS_COLORS,
  STATUS_KINDS,
  badgeClasses,
  createStatus,
  deleteStatus,
  fetchStatuses,
  reorderStatuses,
  updateStatus,
  type StatusColor,
  type StatusConfig,
  type StatusInput,
  type StatusKind,
} from '@/lib/status';

const KIND_LABEL: Record<StatusKind, string> = {
  normal: 'Normal step',
  terminal: 'Terminal (success)',
  exception: 'Exception',
};

function emptyDraft(nextOrder: number): StatusInput {
  return { label: '', color: 'blue', kind: 'normal', sortOrder: nextOrder, isActive: true };
}

function toInput(s: StatusConfig): StatusInput {
  return { label: s.label, color: s.color, kind: s.kind, sortOrder: s.sortOrder, isActive: s.isActive };
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const d = await res.json();
    return (d && d.error) || fallback;
  } catch {
    return fallback;
  }
}

export default function StatusConfigPage() {
  const [items, setItems] = useState<StatusConfig[] | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<{ id: number | null; draft: StatusInput; code?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setItems(null);
    fetchStatuses().then((list) => {
      if (alive) setItems([...list].sort((a, b) => a.sortOrder - b.sortOrder));
    });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  function openNew() {
    const nextOrder = items && items.length ? Math.max(...items.map((s) => s.sortOrder)) + 10 : 10;
    setEditing({ id: null, draft: emptyDraft(nextOrder) });
  }

  function openEdit(s: StatusConfig) {
    setEditing({ id: s.id, draft: toInput(s), code: s.code });
  }

  async function save() {
    if (!editing) return;
    if (!editing.draft.label.trim()) {
      setBanner('Status name is required.');
      return;
    }
    setSaving(true);
    setBanner(null);
    try {
      const res = editing.id === null ? await createStatus(editing.draft) : await updateStatus(editing.id, editing.draft);
      if (!res.ok) {
        setBanner(await errorMessage(res, 'Could not save the status.'));
        return;
      }
      setEditing(null);
      reload();
    } catch {
      setBanner('Could not save the status.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: StatusConfig) {
    setBusyId(s.id);
    try {
      const res = await updateStatus(s.id, { ...toInput(s), isActive: !s.isActive });
      if (!res.ok) setBanner(await errorMessage(res, 'Could not update the status.'));
      else reload();
    } finally {
      setBusyId(null);
    }
  }

  async function move(s: StatusConfig, dir: -1 | 1) {
    if (!items) return;
    const idx = items.findIndex((x) => x.id === s.id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= items.length) return;
    const other = items[swapWith];
    setBusyId(s.id);
    try {
      const res = await reorderStatuses([
        { id: s.id, sortOrder: other.sortOrder },
        { id: other.id, sortOrder: s.sortOrder },
      ]);
      if (!res.ok) setBanner(await errorMessage(res, 'Could not reorder.'));
      else reload();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(s: StatusConfig) {
    if (!window.confirm(`Delete the "${s.label}" status?`)) return;
    setBusyId(s.id);
    try {
      const res = await deleteStatus(s.id);
      if (!res.ok) setBanner(await errorMessage(res, 'Could not delete the status.'));
      else reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="text-sm text-gray-400 mb-1">
            <Link href="/admin/settings" className="hover:text-brand-orange">Settings</Link>
            <span className="mx-1.5">/</span>
            <span className="text-brand-gray">Status Config</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Status Config</h1>
          <p className="text-gray-500 mt-1">Shipment statuses used in bookings, the admin panel, and customer tracking.</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors"
        >
          + Add status
        </button>
      </div>

      {banner && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm flex items-start justify-between gap-3">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="text-amber-500 hover:text-amber-700" aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
        {items === null ? (
          <div className="py-16 flex justify-center"><BrandLoader /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No statuses yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s, i) => (
                <tr key={s.id} className="border-b border-gray-50 last:border-b-0">
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(s, -1)}
                        disabled={i === 0 || busyId === s.id}
                        className="w-6 h-6 rounded text-gray-400 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="Move up"
                      >↑</button>
                      <button
                        onClick={() => move(s, 1)}
                        disabled={i === items.length - 1 || busyId === s.id}
                        className="w-6 h-6 rounded text-gray-400 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="Move down"
                      >↓</button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClasses(s.color)}`}>{s.label}</span>
                      {s.isBuiltin && <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Built-in</span>}
                    </div>
                    <span className="block text-[11px] text-gray-400 mt-1 font-mono">{s.code}</span>
                  </td>
                  <td className="px-4 py-3 align-middle hidden sm:table-cell text-gray-600">{KIND_LABEL[s.kind]}</td>
                  <td className="px-4 py-3 align-middle">
                    <button
                      onClick={() => toggleActive(s)}
                      disabled={busyId === s.id}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${s.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                      aria-label={s.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${s.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <button onClick={() => openEdit(s)} className="text-sm font-semibold text-brand-orange hover:text-brand-coral">Edit</button>
                    <button
                      onClick={() => remove(s)}
                      disabled={s.isBuiltin || busyId === s.id}
                      title={s.isBuiltin ? "Built-in statuses can't be deleted — deactivate instead" : 'Delete'}
                      className="ml-4 text-sm font-semibold text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setEditing(null)} aria-hidden />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl p-6">
            <h2 className="text-lg font-bold text-brand-dark">{editing.id === null ? 'Add status' : 'Edit status'}</h2>
            {editing.code && (
              <p className="text-[11px] text-gray-400 mt-1 font-mono">Code: {editing.code} (fixed)</p>
            )}

            <label className="block mt-4 text-sm font-medium text-brand-dark">
              Name
              <input
                type="text"
                value={editing.draft.label}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, label: e.target.value } })}
                placeholder="e.g. Out for Delivery"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </label>
            {editing.id === null && (
              <p className="text-[11px] text-gray-400 mt-1">Stored code becomes “{editing.draft.label.trim().toUpperCase() || '…'}”.</p>
            )}

            <div className="mt-4">
              <span className="block text-sm font-medium text-brand-dark mb-1.5">Color</span>
              <div className="flex flex-wrap gap-2">
                {STATUS_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditing({ ...editing, draft: { ...editing.draft, color: c as StatusColor } })}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${badgeClasses(c)} ${editing.draft.color === c ? 'ring-2 ring-offset-1 ring-brand-dark' : ''}`}
                  >{c}</button>
                ))}
              </div>
            </div>

            <label className="block mt-4 text-sm font-medium text-brand-dark">
              Type
              <select
                value={editing.draft.kind}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, kind: e.target.value as StatusKind } })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              >
                {STATUS_KINDS.map((k) => (
                  <option key={k} value={k}>{KIND_LABEL[k]}</option>
                ))}
              </select>
            </label>
            <p className="text-[11px] text-gray-400 mt-1">Normal &amp; terminal statuses appear in the customer progress bar; exceptions show as a badge.</p>

            <label className="block mt-4 text-sm font-medium text-brand-dark">
              Position
              <input
                type="number"
                value={editing.draft.sortOrder}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, sortOrder: Number(e.target.value) } })}
                className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-2 mt-4 text-sm font-medium text-brand-dark">
              <input
                type="checkbox"
                checked={editing.draft.isActive}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, isActive: e.target.checked } })}
                className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              Active (selectable on shipments)
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} disabled={saving} className="px-4 py-2 text-sm font-semibold text-brand-gray hover:text-brand-dark disabled:opacity-50">Cancel</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
