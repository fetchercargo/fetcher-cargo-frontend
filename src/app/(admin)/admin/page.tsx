'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { titleCase, formatDate, type AdminStats, type AdminShipmentListItem } from '@/lib/admin';
import { fetchStatuses, badgeClasses, statusMap, FALLBACK_STATUSES, type StatusConfig } from '@/lib/status';

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-bold text-brand-dark mt-2">
        {loading ? <span className="inline-block h-8 w-12 bg-gray-100 rounded animate-pulse align-middle" /> : value}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<AdminShipmentListItem[] | null>(null);
  const [statuses, setStatuses] = useState<StatusConfig[]>(FALLBACK_STATUSES);
  const statusColors = statusMap(statuses);

  useEffect(() => {
    fetch('/api/admin/stats').then((r) => (r.ok ? r.json() : null)).then((d) => setStats(d as AdminStats)).catch(() => {});
    fetch('/api/admin/shipments').then((r) => (r.ok ? r.json() : [])).then((d) => setRecent((d as AdminShipmentListItem[]).slice(0, 8))).catch(() => setRecent([]));
    fetchStatuses().then(setStatuses);
  }, []);

  const loading = stats === null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Admin overview</h1>
          <p className="text-gray-500 mt-1">Everything across all clients.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/shipments/new" className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors">
            + Create shipment
          </Link>
          <Link href="/admin/shipments" className="px-4 py-2.5 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors">
            All shipments
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <StatCard label="Total Shipments" value={stats?.totalShipments ?? 0} loading={loading} />
        <StatCard label="Clients" value={stats?.totalClients ?? 0} loading={loading} />
        <StatCard label="Users" value={stats?.totalUsers ?? 0} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 sm:mt-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-brand-dark">By status</h2>
          <div className="mt-4 space-y-2">
            {loading ? (
              <div className="h-24 bg-gray-50 rounded animate-pulse" />
            ) : Object.keys(stats?.byStatus ?? {}).length === 0 ? (
              <p className="text-gray-400 text-sm">No shipments yet.</p>
            ) : (
              Object.entries(stats!.byStatus).map(([status, n]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClasses(statusColors[status]?.color ?? 'purple')}`}>{statusColors[status]?.label ?? status}</span>
                  <span className="text-sm font-semibold text-brand-dark">{n}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-dark">Recent shipments</h2>
            <Link href="/admin/shipments" className="text-sm font-semibold text-brand-orange hover:text-brand-coral transition-colors">
              View all →
            </Link>
          </div>
          {recent === null ? (
            <div className="h-40 bg-gray-50 rounded animate-pulse mt-4" />
          ) : recent.length === 0 ? (
            <p className="text-gray-400 text-sm mt-4">No shipments yet.</p>
          ) : (
            <div className="mt-2">
              {recent.map((s) => (
                <Link key={s.id} href={`/admin/shipments/${s.id}`} className="flex items-center justify-between gap-3 py-3 border-t border-gray-100 first:border-t-0 -mx-2 px-2 rounded-lg hover:bg-gray-50/70 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-brand-dark">{s.awb || `#${s.id}`}</span>
                      {s.isDg && <span className="text-[10px] font-semibold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">DG</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {s.clientCode || '—'} · {(s.pickupPincode || '—')} → {(s.deliveryPincode || '—')} · {titleCase(s.mode)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClasses(statusColors[s.status]?.color ?? 'purple')}`}>{statusColors[s.status]?.label ?? s.status}</span>
                    <span className="text-xs text-gray-400">{formatDate(s.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
