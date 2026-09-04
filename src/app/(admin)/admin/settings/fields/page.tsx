'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLoader from '@/components/BrandLoader';
import {
  createCustomField,
  deleteCustomField,
  fetchCustomFields,
  updateCustomField,
  type CustomField,
  type CustomFieldInput,
} from '@/lib/customFields';

function toInput(f: CustomField): CustomFieldInput {
  return { label: f.label, visibleToClient: f.visibleToClient, isActive: f.isActive, sortOrder: f.sortOrder };
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const d = await res.json();
    return (d && d.error) || fallback;
  } catch {
    return fallback;
  }
}

export default function CustomFieldsPage() {
  const [items, setItems] = useState<CustomField[] | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<{ id: number; draft: CustomFieldInput } | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newVisible, setNewVisible] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let alive = true;
    setItems(null);
    fetchCustomFields()
      .then((list) => {
        if (alive) setItems([...list].sort((a, b) => a.sortOrder - b.sortOrder));
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  async function add() {
    const label = newLabel.trim();
    if (!label) {
      setBanner('Field name is required.');
      return;
    }
    const nextOrder = items && items.length ? Math.max(...items.map((f) => f.sortOrder)) + 10 : 10;
    setAdding(true);
    setBanner(null);
    try {
      const res = await createCustomField({ label, visibleToClient: newVisible, isActive: true, sortOrder: nextOrder });
      if (!res.ok) {
        setBanner(await errorMessage(res, 'Could not add the field.'));
        return;
      }
      setNewLabel('');
      setNewVisible(false);
      reload();
    } catch {
      setBanner('Could not add the field.');
    } finally {
      setAdding(false);
    }
  }

  function openEdit(f: CustomField) {
    setEditing({ id: f.id, draft: toInput(f) });
  }

  async function save() {
    if (!editing) return;
    if (!editing.draft.label.trim()) {
      setBanner('Field name is required.');
      return;
    }
    setSaving(true);
    setBanner(null);
    try {
      const res = await updateCustomField(editing.id, editing.draft);
      if (!res.ok) {
        setBanner(await errorMessage(res, 'Could not save the field.'));
        return;
      }
      setEditing(null);
      reload();
    } catch {
      setBanner('Could not save the field.');
    } finally {
      setSaving(false);
    }
  }

  // Swap sortOrder with the neighbour and PUT both fields. No-op at the ends.
  async function move(f: CustomField, dir: -1 | 1) {
    if (!items) return;
    const idx = items.findIndex((x) => x.id === f.id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= items.length) return;
    const other = items[swapWith];
    setBusyId(f.id);
    try {
      const resA = await updateCustomField(f.id, { ...toInput(f), sortOrder: other.sortOrder });
      if (!resA.ok) {
        setBanner(await errorMessage(resA, 'Could not reorder.'));
        return;
      }
      const resB = await updateCustomField(other.id, { ...toInput(other), sortOrder: f.sortOrder });
      if (!resB.ok) {
        setBanner(await errorMessage(resB, 'Could not reorder.'));
        return;
      }
      reload();
    } catch {
      setBanner('Could not reorder.');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(f: CustomField) {
    if (!window.confirm(`Delete the "${f.label}" field?`)) return;
    setBusyId(f.id);
    setBanner(null);
    try {
      const res = await deleteCustomField(f.id);
      if (!res.ok) setBanner(await errorMessage(res, 'Could not delete the field.'));
      else reload();
    } catch {
      setBanner('Could not delete the field.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div>
        <nav className="text-sm text-gray-400 mb-1">
          <Link href="/admin/settings" className="hover:text-brand-orange">Settings</Link>
          <span className="mx-1.5">/</span>
          <span className="text-brand-gray">Custom Fields</span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Custom Fields</h1>
        <p className="text-gray-500 mt-1">Your own fields on every shipment — fill them in per shipment, choose which ones clients can see.</p>
      </div>

      {banner && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm flex items-start justify-between gap-3">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="text-amber-500 hover:text-amber-700" aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
              placeholder="New field name, e.g. Invoice No."
              className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm font-medium text-brand-dark whitespace-nowrap">
              <input
                type="checkbox"
                checked={newVisible}
                onChange={(e) => setNewVisible(e.target.checked)}
                className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              Visible to client
            </label>
            <button
              type="button"
              onClick={add}
              disabled={adding}
              className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {adding ? 'Adding…' : '+ Add field'}
            </button>
          </div>
        </div>

        {items === null ? (
          <div className="py-16 flex justify-center"><BrandLoader /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No custom fields yet — add the first one above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Field</th>
                <th className="px-4 py-3 font-semibold">Client can see</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => {
                const ed = editing && editing.id === f.id ? editing : null;
                return (
                  <tr key={f.id} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => move(f, -1)}
                          disabled={i === 0 || busyId === f.id}
                          className="w-6 h-6 rounded text-gray-400 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label="Move up"
                        >↑</button>
                        <button
                          onClick={() => move(f, 1)}
                          disabled={i === items.length - 1 || busyId === f.id}
                          className="w-6 h-6 rounded text-gray-400 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label="Move down"
                        >↓</button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ed ? (
                        <input
                          type="text"
                          value={ed.draft.label}
                          onChange={(e) => setEditing({ ...ed, draft: { ...ed.draft, label: e.target.value } })}
                          className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none"
                        />
                      ) : (
                        <>
                          <span className="text-brand-dark font-medium">{f.label}</span>
                          <span className="block text-[11px] text-gray-400 mt-1 font-mono">{f.key}</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {ed ? (
                        <input
                          type="checkbox"
                          checked={ed.draft.visibleToClient}
                          onChange={(e) => setEditing({ ...ed, draft: { ...ed.draft, visibleToClient: e.target.checked } })}
                          aria-label="Visible to client"
                          className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                        />
                      ) : f.visibleToClient ? (
                        <span className="text-[10px] uppercase tracking-wide text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">Client can see</span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Admin only</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {ed ? (
                        <input
                          type="checkbox"
                          checked={ed.draft.isActive}
                          onChange={(e) => setEditing({ ...ed, draft: { ...ed.draft, isActive: e.target.checked } })}
                          aria-label="Active"
                          className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                        />
                      ) : f.isActive ? (
                        <span className="text-[10px] uppercase tracking-wide text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">Active</span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                      {ed ? (
                        <>
                          <button onClick={save} disabled={saving} className="text-sm font-semibold text-brand-orange hover:text-brand-coral disabled:opacity-50">
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditing(null)} disabled={saving} className="ml-4 text-sm font-semibold text-gray-400 hover:text-brand-dark disabled:opacity-50">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openEdit(f)} disabled={busyId === f.id} className="text-sm font-semibold text-brand-orange hover:text-brand-coral disabled:opacity-50">Edit</button>
                          <button
                            onClick={() => remove(f)}
                            disabled={busyId === f.id}
                            title="Delete"
                            className="ml-4 text-sm font-semibold text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-400 disabled:cursor-not-allowed"
                          >Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
