'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ShipmentFilters, {
  EMPTY_FILTERS,
  parseShipmentFilters,
  buildShipmentQuery,
  type ShipmentFilterValues,
} from '@/components/admin/ShipmentFilters';
import ColumnPicker, { SHIPMENT_COLUMNS, DEFAULT_COLUMN_KEYS, type ShipmentColumn } from '@/components/admin/ColumnPicker';
import { titleCase, formatDateTime, type AdminShipmentListItem, type ClientOption } from '@/lib/admin';
import { fetchStatuses, badgeClasses, statusMap, FALLBACK_STATUSES, type StatusConfig } from '@/lib/status';
import BrandLoader from '@/components/BrandLoader';

export default function AdminShipmentsListPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminShipmentListItem[] | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [statuses, setStatuses] = useState<StatusConfig[]>(FALLBACK_STATUSES);
  const [filters, setFilters] = useState<ShipmentFilterValues>(() =>
    typeof window !== 'undefined' ? parseShipmentFilters(window.location.search) : EMPTY_FILTERS,
  );
  const statusColors = statusMap(statuses);
  // Visible table columns. Initial state is the constant so the server render
  // and the first client render match (hydration-safe); the persisted value is
  // restored from localStorage right after mount.
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMN_KEYS);
  const columnsLoaded = useRef(false);

  useEffect(() => {
    // Deferred to a microtask only to satisfy the repo's
    // react-hooks/set-state-in-effect lint rule, which flags a synchronous
    // setState in an effect body. Behaviour is identical either way: effects
    // run after commit, so the first paint is the defaults regardless.
    queueMicrotask(() => {
      try {
        const raw = window.localStorage.getItem('fc.admin.shipments.columns');
        const parsed: unknown = raw === null ? undefined : JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const known = new Set(SHIPMENT_COLUMNS.map((c) => c.key));
          // Deduplicate as well as validate. A repeated key would render two
          // columns sharing one React key in a list the arrows reorder, and
          // unticking it removes every copy at once — which slips past the
          // never-zero-columns guard and empties the table.
          const valid = Array.from(
            new Set(parsed.filter((k): k is string => typeof k === 'string' && known.has(k))),
          );
          if (valid.length > 0) setColumns(valid);
        }
      } catch {
        // Ignore corrupt/unavailable storage and fall back to defaults.
      } finally {
        columnsLoaded.current = true;
      }
    });
  }, []);

  useEffect(() => {
    if (!columnsLoaded.current) return;
    try {
      window.localStorage.setItem('fc.admin.shipments.columns', JSON.stringify(columns));
    } catch {
      // Ignore storage failures (e.g. private mode).
    }
  }, [columns]);

  useEffect(() => {
    // ?all=1: this feeds a FILTER over historic shipments, so deactivated
    // clients must stay selectable or their history becomes unfindable.
    fetch('/api/admin/clients?all=1')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setClients(d as ClientOption[]))
      .catch(() => {});
    fetchStatuses().then(setStatuses);
  }, []);

  // Debounced fetch + URL sync whenever filters change.
  useEffect(() => {
    const qs = buildShipmentQuery(filters);
    const t = setTimeout(() => {
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
      setItems(null);
      fetch('/api/admin/shipments' + (qs ? `?${qs}` : ''))
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setItems(d as AdminShipmentListItem[]))
        .catch(() => setItems([]));
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  function handleExport() {
    const qs = buildShipmentQuery(filters);
    window.location.href = '/api/admin/shipments/export' + (qs ? `?${qs}` : '');
  }

  // Order comes from the user's `columns` state, not the canonical list.
  const columnByKey = new Map(SHIPMENT_COLUMNS.map((c) => [c.key, c]));
  const visibleColumns = columns
    .map((k) => columnByKey.get(k))
    .filter((c): c is ShipmentColumn => c !== undefined);

  function renderCell(s: AdminShipmentListItem, key: string) {
    switch (key) {
      case 'awb':
        return (
          <td key={key} className="px-4 py-3 whitespace-nowrap font-medium text-brand-dark">
            {s.awb || `#${s.id}`}
            {s.isDg && <span className="ml-2 text-[10px] font-semibold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">DG</span>}
          </td>
        );
      case 'clientCode':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.clientCode || '—'}</td>;
      case 'ownerEmail':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.ownerEmail || <span className="text-gray-400">sheet</span>}</td>;
      case 'businessName':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.businessName || '—'}</td>;
      case 'businessEmail':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.businessEmail || '—'}</td>;
      case 'primaryContactPerson':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.primaryContactPerson || '—'}</td>;
      case 'customerRef':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.customerRef || '—'}</td>;
      case 'status':
        return (
          <td key={key} className="px-4 py-3 whitespace-nowrap">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClasses(statusColors[s.status]?.color ?? 'purple')}`}>{statusColors[s.status]?.label ?? s.status}</span>
          </td>
        );
      case 'route':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.pickupCity || '—'} → {s.deliveryCity || '—'}</td>;
      case 'mode':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{titleCase(s.mode)}</td>;
      case 'createdAt':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDateTime(s.createdAt)}</td>;
      case 'id':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.id}</td>;
      case 'scope':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{titleCase(s.scope)}</td>;
      case 'shipmentType':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{titleCase(s.shipmentType)}</td>;
      case 'shipmentCategory':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{titleCase(s.shipmentCategory)}</td>;
      case 'noOfPieces':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.noOfPieces ?? '—'}</td>;
      case 'weightKg':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.weightKg ?? '—'}</td>;
      case 'batchNo':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.batchNo || '—'}</td>;
      case 'billingAmount':
        return <td key={key} className="px-4 py-3 whitespace-nowrap text-gray-600">{s.billingAmount != null ? `₹${s.billingAmount}` : '—'}</td>;
      default:
        return null;
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">All shipments</h1>
          <p className="text-gray-500 mt-1">Every client&apos;s shipments, including sheet-synced ones.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <ColumnPicker value={columns} onChange={setColumns} />
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
          <Link href="/admin/shipments/bulk" className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5-5 5 5" />
              <path d="M12 5v12" />
            </svg>
            Bulk upload
          </Link>
          <Link href="/admin/shipments/new" className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors whitespace-nowrap">
            + Create shipment
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <ShipmentFilters
          value={filters}
          onChange={setFilters}
          clients={clients}
          resultCount={items?.length ?? null}
          capped={(items?.length ?? 0) >= 500}
          statusOptions={statuses.filter((s) => s.isActive).map((s) => ({ code: s.code, label: s.label }))}
        />
      </div>

      <div className="mt-4">
        {items === null ? (
          <BrandLoader variant="section" />
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-brand-dark font-medium">No shipments match</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting or clearing the filters.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    {visibleColumns.map((c) => (
                      <th key={c.key} className="px-4 py-3 font-medium whitespace-nowrap">{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} onClick={() => router.push(`/admin/shipments/${s.id}`)} className="border-t border-gray-100 hover:bg-gray-50/60 cursor-pointer">
                      {visibleColumns.map((c) => renderCell(s, c.key))}
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
