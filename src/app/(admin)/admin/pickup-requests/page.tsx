'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDateTime } from '@/lib/admin';
import { badgeClasses, statusMap } from '@/lib/status';
import {
  FALLBACK_PICKUP_STATUSES,
  fetchPickupStatuses,
  type PickupRequestListItem,
  type PickupStatus,
} from '@/lib/pickup';
import BrandLoader from '@/components/BrandLoader';

interface PickupFilterValues {
  status: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: PickupFilterValues = { status: '', from: '', to: '' };

function parsePickupFilters(search: string): PickupFilterValues {
  const p = new URLSearchParams(search);
  return { status: p.get('status') ?? '', from: p.get('from') ?? '', to: p.get('to') ?? '' };
}

function buildPickupQuery(v: PickupFilterValues): string {
  const p = new URLSearchParams();
  if (v.status) p.set('status', v.status);
  if (v.from) p.set('from', v.from);
  if (v.to) p.set('to', v.to);
  return p.toString();
}

const ctl =
  'h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

export default function AdminPickupRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<PickupRequestListItem[] | null>(null);
  const [statuses, setStatuses] = useState<PickupStatus[]>(FALLBACK_PICKUP_STATUSES);
  const [filters, setFilters] = useState<PickupFilterValues>(() =>
    typeof window !== 'undefined' ? parsePickupFilters(window.location.search) : EMPTY_FILTERS,
  );
  const statusColors = statusMap(statuses);

  useEffect(() => {
    fetchPickupStatuses().then(setStatuses);
  }, []);

  // Debounced fetch + URL sync whenever filters change (same rhythm as the
  // shipments grid).
  useEffect(() => {
    const qs = buildPickupQuery(filters);
    const t = setTimeout(() => {
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
      setItems(null);
      fetch('/api/admin/pickup-requests' + (qs ? `?${qs}` : ''))
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setItems(d as PickupRequestListItem[]))
        .catch(() => setItems([]));
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  const hasFilters = filters.status || filters.from || filters.to;

  // A plain navigation like the shipments export: the session cookie rides the
  // request, so no fetch/axios dance is needed for a file download.
  function handleExport() {
    const qs = buildPickupQuery(filters);
    window.location.href = '/api/admin/pickup-requests/export.xlsx' + (qs ? `?${qs}` : '');
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Pickup requests</h1>
          <p className="text-gray-500 mt-1">Raised from the public form once their email is verified — work them as ops.</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={!items || items.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Export
        </button>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-2">
        <select
          className={ctl}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          title="Status"
        >
          <option value="">Any status</option>
          {statuses.filter((s) => s.isActive).map((s) => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
        <input
          type="date"
          className={ctl}
          value={filters.from}
          onChange={(e) => setFilters({ ...filters, from: e.target.value })}
          title="Submitted from"
        />
        <input
          type="date"
          className={ctl}
          value={filters.to}
          onChange={(e) => setFilters({ ...filters, to: e.target.value })}
          title="Submitted to"
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="h-10 px-3 text-sm font-semibold text-brand-gray hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
        {items !== null && (
          <span className="ml-auto text-sm text-gray-500">
            {items.length} request{items.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="mt-4">
        {items === null ? (
          <BrandLoader variant="section" />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-brand-dark font-medium">No pickup requests match</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting or clearing the filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Ref</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Customer ID</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Location</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">AWBs</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Ready at</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/admin/pickup-requests/${r.id}`)}
                      className="border-t border-gray-100 hover:bg-gray-50/60 cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-brand-dark">{r.ref}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {r.customerId}
                        {/* The Customer ID is CLAIMED, not proven — the OTP only
                            shows the sender controls the mailbox they typed. */}
                        {!r.customerMatched && (
                          <span className="ml-2 text-[10px] font-semibold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            unverified ID
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{r.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {r.locationLabel || r.city || r.pincode || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{r.awbCount}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDateTime(r.readyAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClasses(statusColors[r.status]?.color ?? 'purple')}`}>
                          {statusColors[r.status]?.label ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDateTime(r.createdAt)}</td>
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
