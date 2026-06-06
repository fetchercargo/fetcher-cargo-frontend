'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { statusClasses, titleCase, formatDate, STATUSES, type AdminShipmentListItem } from '@/lib/admin';

export default function AdminShipmentsListPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminShipmentListItem[] | null>(null);
  const [status, setStatus] = useState('');
  const [client, setClient] = useState('');
  const [q, setQ] = useState('');

  function load(over?: { status?: string; client?: string; q?: string }) {
    const st = over?.status ?? status;
    const cl = over?.client ?? client;
    const query = over?.q ?? q;
    const p = new URLSearchParams();
    if (st) p.set('status', st);
    if (cl.trim()) p.set('client', cl.trim());
    if (query.trim()) p.set('q', query.trim());
    setItems(null);
    fetch('/api/admin/shipments?' + p.toString())
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setItems(d as AdminShipmentListItem[]))
      .catch(() => setItems([]));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilter(e: React.FormEvent) {
    e.preventDefault();
    load();
  }
  function clearFilters() {
    setStatus('');
    setClient('');
    setQ('');
    load({ status: '', client: '', q: '' });
  }

  const inputCls = 'h-10 w-full px-3 border border-gray-300 rounded-lg text-sm bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">All shipments</h1>
          <p className="text-gray-500 mt-1">Every client&apos;s shipments, including sheet-synced ones.</p>
        </div>
        <Link href="/admin/shipments/new" className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors whitespace-nowrap">
          + Create shipment
        </Link>
      </div>

      <form onSubmit={onFilter} className="flex flex-wrap items-end gap-3 mt-6 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col gap-1 w-full sm:w-40">
          <label className="text-xs font-medium text-gray-500">Status</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-44">
          <label className="text-xs font-medium text-gray-500">Client code</label>
          <input className={inputCls} value={client} onChange={(e) => setClient(e.target.value)} placeholder="FCC0001" />
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-500">Search (AWB / reference)</label>
          <input className={inputCls} value={q} onChange={(e) => setQ(e.target.value)} placeholder="AWB or reference" />
        </div>
        <button type="submit" className="h-10 px-5 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity">
          Apply
        </button>
        <button type="button" onClick={clearFilters} className="h-10 px-4 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
          Clear
        </button>
      </form>

      <div className="mt-4">
        {items === null ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin h-7 w-7 text-brand-orange" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-brand-dark font-medium">No shipments match</p>
            <p className="text-gray-400 text-sm mt-1">Try clearing the filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">AWB</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Client</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Owner</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Reference</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Route</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Mode</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} onClick={() => router.push(`/admin/shipments/${s.id}`)} className="border-t border-gray-100 hover:bg-gray-50/60 cursor-pointer">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-brand-dark">
                        {s.awb || `#${s.id}`}
                        {s.isDg && <span className="ml-2 text-[10px] font-semibold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">DG</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{s.clientCode || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{s.ownerEmail || <span className="text-gray-400">sheet</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{s.customerRef || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses(s.status)}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{(s.pickupPincode || '—')} → {(s.deliveryPincode || '—')}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{titleCase(s.mode)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(s.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
