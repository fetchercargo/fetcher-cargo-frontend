'use client';

import { useEffect, useRef, useState } from 'react';
import BrandLoader, { BrandDots } from '@/components/BrandLoader';
import { placeLabel, type ServiceablePincode, type Segment } from '@/lib/pincode';

const PAGE_SIZE = 50;

function emptyRecord(): ServiceablePincode {
  return {
    segment: 'B2B',
    pincode: '',
    status: 'Active',
    canPickup: true,
    canDeliver: true,
    mode: '',
    odaCategory: '',
    hubCode: '',
    hubCity: '',
    state: '',
    additionalInfo: '',
  };
}

function Tick({ ok }: { ok: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={ok ? 'text-green-600' : 'text-gray-300'}>
      {ok ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
    </svg>
  );
}

export default function AdminPincodesPage() {
  const [q, setQ] = useState('');
  const [segment, setSegment] = useState<'' | Segment>('');
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ServiceablePincode[] | null>(null);
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<{ record: ServiceablePincode; isNew: boolean } | null>(null);
  const [importing, setImporting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(null);
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (segment) params.set('segment', segment);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));
      fetch('/api/admin/pincodes?' + params.toString())
        .then((r) => (r.ok ? r.json() : { items: [], total: 0 }))
        .then((d) => {
          setItems((d.items ?? []) as ServiceablePincode[]);
          setTotal(d.total ?? 0);
        })
        .catch(() => {
          setItems([]);
          setTotal(0);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [q, segment, page, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function reload() {
    setReloadKey((k) => k + 1);
  }

  async function remove(p: ServiceablePincode) {
    if (!window.confirm(`Delete ${p.pincode} (${p.segment})?`)) return;
    try {
      const res = await fetch(`/api/admin/pincodes/${encodeURIComponent(p.segment)}/${encodeURIComponent(p.pincode)}`, { method: 'DELETE' });
      if (res.ok) reload();
      else setBanner('Could not delete the pincode.');
    } catch {
      setBanner('Could not delete the pincode.');
    }
  }

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setBanner(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/pincodes/import', { method: 'POST', body: fd });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setBanner(`Imported ${d.imported ?? 0} pincodes${d.skipped ? `, skipped ${d.skipped}` : ''}.`);
        setPage(0);
        reload();
      } else {
        setBanner(d.error || 'Import failed.');
      }
    } catch {
      setBanner('Import failed.');
    } finally {
      setImporting(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Pincode serviceability</h1>
          <p className="text-gray-500 mt-1">{total.toLocaleString()} pincode{total === 1 ? '' : 's'} across B2B &amp; B2C.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <input ref={fileInput} type="file" accept=".xlsx" className="hidden" onChange={importFile} />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
          >
            {importing ? <BrandDots /> : 'Import Excel'}
          </button>
          <button
            type="button"
            onClick={() => setEditing({ record: emptyRecord(), isNew: true })}
            className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors"
          >
            + Add pincode
          </button>
        </div>
      </div>

      {banner && <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">{banner}</div>}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2.5">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search pincode, city or state"
          className="flex-1 min-w-[220px] h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
        />
        <select
          value={segment}
          onChange={(e) => {
            setSegment(e.target.value as '' | Segment);
            setPage(0);
          }}
          className="h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange"
        >
          <option value="">All segments</option>
          <option value="B2B">B2B</option>
          <option value="B2C">B2C</option>
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
        {items === null ? (
          <BrandLoader variant="section" />
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-brand-dark font-medium">No pincodes match</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or import the list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Pincode</th>
                  <th className="px-4 py-3 font-medium">Segment</th>
                  <th className="px-4 py-3 font-medium">Pickup</th>
                  <th className="px-4 py-3 font-medium">Delivery</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">City / State</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={`${p.segment}-${p.pincode}`} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-mono text-brand-dark">{p.pincode}</td>
                    <td className="px-4 py-2.5 text-gray-600">{p.segment}</td>
                    <td className="px-4 py-2.5"><Tick ok={p.canPickup} /></td>
                    <td className="px-4 py-2.5"><Tick ok={p.canDeliver} /></td>
                    <td className="px-4 py-2.5">
                      {(p.odaCategory || '').toUpperCase() === 'ODA' ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700">ODA</span>
                      ) : (
                        <span className="text-gray-400">{p.odaCategory || '—'}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{placeLabel(p) || '—'}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                      <button type="button" onClick={() => setEditing({ record: { ...p }, isNew: false })} className="text-sm font-semibold text-brand-gray hover:text-brand-dark">Edit</button>
                      <button type="button" onClick={() => remove(p)} className="ml-3 text-sm font-semibold text-gray-400 hover:text-red-500">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">Page {page + 1} of {totalPages}</span>
          <div className="flex items-center gap-3">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Prev</button>
            <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {editing && (
        <EditModal
          state={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function EditModal({
  state,
  onClose,
  onSaved,
}: {
  state: { record: ServiceablePincode; isNew: boolean };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [rec, setRec] = useState<ServiceablePincode>(state.record);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ServiceablePincode>(key: K, value: ServiceablePincode[K]) {
    setRec((r) => ({ ...r, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/pincodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rec),
      });
      if (res.ok) onSaved();
      else {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Could not save.');
      }
    } catch {
      setError('Could not save.');
    } finally {
      setSaving(false);
    }
  }

  const input = 'w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';
  const label = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-brand-dark">{state.isNew ? 'Add pincode' : `Edit ${rec.pincode}`}</h2>
        {error && <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className={label}>Segment</label>
            <select className={input} value={rec.segment} disabled={!state.isNew} onChange={(e) => set('segment', e.target.value)}>
              <option value="B2B">B2B</option>
              <option value="B2C">B2C</option>
            </select>
          </div>
          <div>
            <label className={label}>Pincode</label>
            <input className={input} value={rec.pincode} disabled={!state.isNew} onChange={(e) => set('pincode', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-6 mt-4">
          <label className="flex items-center gap-2 text-sm text-brand-dark">
            <input type="checkbox" checked={rec.canPickup} onChange={(e) => set('canPickup', e.target.checked)} className="accent-brand-orange w-4 h-4" /> Can pick up
          </label>
          <label className="flex items-center gap-2 text-sm text-brand-dark">
            <input type="checkbox" checked={rec.canDeliver} onChange={(e) => set('canDeliver', e.target.checked)} className="accent-brand-orange w-4 h-4" /> Can deliver
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div><label className={label}>Status</label><input className={input} value={rec.status} onChange={(e) => set('status', e.target.value)} /></div>
          <div><label className={label}>Category (ODA/Normal)</label><input className={input} value={rec.odaCategory} onChange={(e) => set('odaCategory', e.target.value)} /></div>
          <div><label className={label}>Mode</label><input className={input} value={rec.mode} onChange={(e) => set('mode', e.target.value)} /></div>
          <div><label className={label}>Hub code</label><input className={input} value={rec.hubCode} onChange={(e) => set('hubCode', e.target.value)} /></div>
          <div><label className={label}>Hub city</label><input className={input} value={rec.hubCity} onChange={(e) => set('hubCity', e.target.value)} /></div>
          <div><label className={label}>State</label><input className={input} value={rec.state} onChange={(e) => set('state', e.target.value)} /></div>
        </div>
        <div className="mt-3"><label className={label}>Additional info</label><input className={input} value={rec.additionalInfo} onChange={(e) => set('additionalInfo', e.target.value)} /></div>
        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark">Cancel</button>
          <button type="button" onClick={save} disabled={saving || !rec.pincode.trim()} className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50">
            {saving ? <span className="inline-flex items-center gap-2"><BrandDots /> Saving…</span> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
