'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLoader from '@/components/BrandLoader';
import ShipmentFilters, {
  EMPTY_FILTERS,
  parseShipmentFilters,
  buildShipmentQuery,
  type ShipmentFilterValues,
} from '@/components/admin/ShipmentFilters';

interface ShipmentSummary {
  id: number;
  awb: string | null;
  status: string;
  scope: string | null;
  shipmentType: string | null;
  mode: string | null;
  shipmentCategory: string | null;
  noOfPieces: number | null;
  weightKg: number | null;
  pickupPincode: string | null;
  deliveryPincode: string | null;
  isDg: boolean;
  customerRef: string | null;
  createdAt: string;
}

function statusClasses(status: string): string {
  if (status === 'DELIVERED') return 'bg-green-100 text-green-700';
  if (status === 'CANCELLED' || status === 'RTO') return 'bg-red-100 text-red-700';
  if (status === 'ISSUE/DELAYED') return 'bg-amber-100 text-amber-700';
  return 'bg-purple-100 text-brand-purple';
}

function titleCase(s: string | null): string {
  if (!s) return '—';
  return s
    .toLowerCase()
    .split(/[-\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function hasActiveFilters(v: ShipmentFilterValues): boolean {
  return Boolean(v.q || v.statuses.length || v.mode || v.scope || v.category || v.type || v.dg || v.from || v.to);
}

function CreateButton() {
  return (
    <Link
      href="/dashboard/create-shipment"
      className="px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors whitespace-nowrap"
    >
      + Create shipment
    </Link>
  );
}

export default function MyShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<ShipmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ShipmentFilterValues>(() =>
    typeof window !== 'undefined' ? parseShipmentFilters(window.location.search) : EMPTY_FILTERS,
  );

  // Debounced fetch + URL sync whenever filters change (mirrors the admin list).
  useEffect(() => {
    const qs = buildShipmentQuery(filters);
    const t = setTimeout(() => {
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
      setShipments(null);
      setError(null);
      fetch('/api/shipments' + (qs ? `?${qs}` : ''))
        .then(async (res) => {
          if (!res.ok) {
            setError('Could not load your shipments.');
            setShipments([]);
            return;
          }
          setShipments((await res.json()) as ShipmentSummary[]);
        })
        .catch(() => {
          setError('Unable to connect. Please try again.');
          setShipments([]);
        });
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  function handleExport() {
    const qs = buildShipmentQuery(filters);
    window.location.href = '/api/shipments/export.xlsx' + (qs ? `?${qs}` : '');
  }

  const active = hasActiveFilters(filters);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">My Shipments</h1>
          <p className="text-gray-500 mt-1">Shipments you&apos;ve created.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Export
          </button>
          <CreateButton />
        </div>
      </div>

      <div className="mt-6">
        <ShipmentFilters
          scope="client"
          value={filters}
          onChange={setFilters}
          resultCount={shipments?.length ?? null}
          capped={(shipments?.length ?? 0) >= 500}
        />
      </div>

      <div className="mt-4">
        {shipments === null ? (
          <BrandLoader variant="section" />
        ) : shipments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 sm:p-14 text-center">
            {active ? (
              <>
                <p className="text-brand-dark font-medium">No shipments match</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting or clearing the filters.</p>
              </>
            ) : (
              <>
                <p className="text-brand-dark font-medium">No shipments yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first shipment to see it here.</p>
              </>
            )}
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            {!active && (
              <div className="mt-6 flex justify-center">
                <CreateButton />
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">AWB</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Reference</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Scope</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Mode</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Category</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Route (pincode)</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Pcs</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Weight</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/dashboard/shipments/${s.id}`)}
                      className="border-t border-gray-100 hover:bg-gray-50/60 cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-brand-dark">
                        {s.awb || `#${s.id}`}
                        {s.isDg && (
                          <span className="ml-2 text-[10px] font-semibold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">DG</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{s.customerRef || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusClasses(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{titleCase(s.scope)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{titleCase(s.mode)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{titleCase(s.shipmentCategory)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {(s.pickupPincode || '—')} → {(s.deliveryPincode || '—')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{s.noOfPieces ?? '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {s.weightKg != null ? `${s.weightKg} kg` : '—'}
                      </td>
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
