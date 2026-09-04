'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BrandLoader from '@/components/BrandLoader';
import {
  createCustomField,
  deleteCustomField,
  fetchCustomFields,
  updateCustomField,
  CUSTOM_FIELD_TYPES,
  type CustomField,
  type CustomFieldInput,
  type CustomFieldType,
} from '@/lib/customFields';

function toInput(f: CustomField): CustomFieldInput {
  return {
    label: f.label,
    fieldType: f.fieldType,
    visibleToClient: f.visibleToClient,
    isActive: f.isActive,
    sortOrder: f.sortOrder,
  };
}

function emptyDraft(nextOrder: number): CustomFieldInput {
  return { label: '', fieldType: 'text', visibleToClient: false, isActive: true, sortOrder: nextOrder };
}

function typeLabel(t: CustomFieldType): string {
  return CUSTOM_FIELD_TYPES.find((x) => x.value === t)?.label ?? t;
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const d = await res.json();
    return (d && d.error) || fallback;
  } catch {
    return fallback;
  }
}

/** Toggle switch, matching the Active control on the Status Config screen. */
function Toggle({
  on,
  onChange,
  disabled,
  label,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={label}
      aria-pressed={on}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        on ? 'bg-green-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export default function ReferenceFieldsPage() {
  const [items, setItems] = useState<CustomField[] | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // id === null means "adding", matching the Status Config dialog.
  const [editing, setEditing] = useState<{ id: number | null; draft: CustomFieldInput; key?: string } | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

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

  function openNew() {
    const nextOrder = items && items.length ? Math.max(...items.map((f) => f.sortOrder)) + 10 : 10;
    setDialogError(null);
    setEditing({ id: null, draft: emptyDraft(nextOrder) });
  }

  function openEdit(f: CustomField) {
    setDialogError(null);
    setEditing({ id: f.id, draft: toInput(f), key: f.key });
  }

  async function save() {
    if (!editing) return;
    if (!editing.draft.label.trim()) {
      setDialogError('Field name is required.');
      return;
    }
    setSaving(true);
    setDialogError(null);
    try {
      const res =
        editing.id === null
          ? await createCustomField(editing.draft)
          : await updateCustomField(editing.id, editing.draft);
      if (!res.ok) {
        // Keep the dialog open so the change can be corrected — this is where
        // the "type cannot be changed" refusal surfaces.
        setDialogError(await errorMessage(res, 'Could not save the field.'));
        return;
      }
      setEditing(null);
      reload();
    } catch {
      setDialogError('Could not save the field.');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(f: CustomField, patch: Partial<CustomFieldInput>) {
    setBusyId(f.id);
    setBanner(null);
    try {
      const res = await updateCustomField(f.id, { ...toInput(f), ...patch });
      if (!res.ok) setBanner(await errorMessage(res, 'Could not update the field.'));
      else reload();
    } catch {
      setBanner('Could not update the field.');
    } finally {
      setBusyId(null);
    }
  }

  async function move(f: CustomField, dir: -1 | 1) {
    if (!items) return;
    const idx = items.findIndex((x) => x.id === f.id);
    const swapWith = idx + dir;
    if (swapWith < 0 || swapWith >= items.length) return;
    const other = items[swapWith];
    setBusyId(f.id);
    setBanner(null);
    try {
      // Both definitions are resent whole, so fieldType must ride along or the
      // reorder would quietly reset each field's type.
      const a = await updateCustomField(f.id, { ...toInput(f), sortOrder: other.sortOrder });
      const b = await updateCustomField(other.id, { ...toInput(other), sortOrder: f.sortOrder });
      if (!a.ok || !b.ok) setBanner(await errorMessage(a.ok ? b : a, 'Could not reorder the fields.'));
      reload();
    } catch {
      setBanner('Could not reorder the fields.');
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav className="text-sm text-gray-400 mb-1">
            <Link href="/admin/settings" className="hover:text-brand-orange">
              Settings
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-brand-gray">Reference Fields</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Reference Fields</h1>
          <p className="text-gray-500 mt-1">
            Extra fields on every shipment — reference numbers, internal notes. Choose which ones clients can see.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors"
        >
          + Add field
        </button>
      </div>

      {banner && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm flex items-start justify-between gap-3">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="text-amber-500 hover:text-amber-700" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
        {items === null ? (
          <div className="py-16 flex justify-center">
            <BrandLoader />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-6 text-center">
            <p className="text-brand-dark font-medium">No reference fields yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Add one and it will appear on every shipment for your team to fill in.
            </p>
            <button
              type="button"
              onClick={openNew}
              className="mt-5 px-4 py-2 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors"
            >
              + Add your first field
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Field</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 font-semibold">Client can see</th>
                <th className="px-4 py-3 font-semibold">Active</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => (
                <tr key={f.id} className="border-b border-gray-50 last:border-b-0">
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => move(f, -1)}
                        disabled={i === 0 || busyId === f.id}
                        className="w-6 h-6 rounded text-gray-400 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => move(f, 1)}
                        disabled={i === items.length - 1 || busyId === f.id}
                        className="w-6 h-6 rounded text-gray-400 hover:bg-gray-100 hover:text-brand-dark disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${f.isActive ? 'text-brand-dark' : 'text-gray-400'}`}>{f.label}</span>
                    <span className="block sm:hidden text-[11px] text-gray-400 mt-0.5">{typeLabel(f.fieldType)}</span>
                  </td>
                  <td className="px-4 py-3 align-middle hidden sm:table-cell text-gray-600">{typeLabel(f.fieldType)}</td>
                  <td className="px-4 py-3 align-middle">
                    <Toggle
                      on={f.visibleToClient}
                      disabled={busyId === f.id}
                      onChange={() => toggle(f, { visibleToClient: !f.visibleToClient })}
                      label={f.visibleToClient ? 'Hide from clients' : 'Show to clients'}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <Toggle
                      on={f.isActive}
                      disabled={busyId === f.id}
                      onChange={() => toggle(f, { isActive: !f.isActive })}
                      label={f.isActive ? 'Deactivate' : 'Activate'}
                    />
                  </td>
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(f)}
                      className="text-sm font-semibold text-brand-orange hover:text-brand-coral"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove(f)}
                      disabled={busyId === f.id}
                      title="Delete — refused if any shipment already uses this field"
                      className="ml-4 text-sm font-semibold text-gray-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-400"
                    >
                      Delete
                    </button>
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
            <h2 className="text-lg font-bold text-brand-dark">
              {editing.id === null ? 'Add reference field' : 'Edit reference field'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {editing.id === null
                ? 'This appears on every shipment for your team to fill in.'
                : 'Changes apply to this field on every shipment.'}
            </p>

            <label className="block mt-5 text-sm font-medium text-brand-dark">
              Field name
              <input
                type="text"
                autoFocus
                value={editing.draft.label}
                onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, label: e.target.value } })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save();
                }}
                placeholder="e.g. Invoice No."
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </label>

            <label className="block mt-4 text-sm font-medium text-brand-dark">
              Type
              <select
                value={editing.draft.fieldType}
                onChange={(e) =>
                  setEditing({ ...editing, draft: { ...editing.draft, fieldType: e.target.value as CustomFieldType } })
                }
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              >
                {CUSTOM_FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {editing.id !== null && (
                <span className="block text-[11px] text-gray-400 mt-1 font-normal">
                  Fixed once a shipment has a value for this field.
                </span>
              )}
            </label>

            <div className="mt-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-dark">Visible to clients</p>
                  <p className="text-xs text-gray-500 mt-0.5">Shows on the client&apos;s own view of the shipment.</p>
                </div>
                <Toggle
                  on={editing.draft.visibleToClient}
                  onChange={() =>
                    setEditing({
                      ...editing,
                      draft: { ...editing.draft, visibleToClient: !editing.draft.visibleToClient },
                    })
                  }
                  label="Visible to clients"
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-brand-dark">Active</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Inactive fields drop off new shipments but keep values already recorded.
                  </p>
                </div>
                <Toggle
                  on={editing.draft.isActive}
                  onChange={() =>
                    setEditing({ ...editing, draft: { ...editing.draft, isActive: !editing.draft.isActive } })
                  }
                  label="Active"
                />
              </div>
            </div>

            {dialogError && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                {dialogError}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="px-4 py-2 text-sm font-semibold text-brand-gray hover:text-brand-dark disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="px-5 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
