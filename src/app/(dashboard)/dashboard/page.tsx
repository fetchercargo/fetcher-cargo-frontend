'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useDashboardUser } from '@/components/dashboard/DashboardContext';
import BrandLoader from '@/components/BrandLoader';
import { fetchStatuses, badgeClasses, statusMap, FALLBACK_STATUSES, type StatusConfig } from '@/lib/status';

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

// Statuses that count as "in transit" (actively moving).
const IN_TRANSIT = new Set(['PICKED-UP', 'IN-TRANSIT']);

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

function PackageIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

export default function DashboardOverview() {
  const user = useDashboardUser();
  const firstName = (user.name || user.email).split(' ')[0];

  const [shipments, setShipments] = useState<ShipmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<StatusConfig[]>(FALLBACK_STATUSES);
  const statusColors = statusMap(statuses);

  useEffect(() => {
    fetchStatuses().then(setStatuses);
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/shipments')
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          setError('Could not load your shipments.');
          setShipments([]);
          return;
        }
        setShipments((await res.json()) as ShipmentSummary[]);
      })
      .catch(() => {
        if (active) {
          setError('Unable to connect. Please try again.');
          setShipments([]);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const list = shipments ?? [];
    return [
      { label: 'Total Shipments', value: list.length },
      { label: 'In Transit', value: list.filter((s) => IN_TRANSIT.has(s.status)).length },
      { label: 'Delivered', value: list.filter((s) => s.status === 'DELIVERED').length },
      { label: 'Pending Pickup', value: list.filter((s) => s.status === 'SHIPMENT CREATED').length },
    ];
  }, [shipments]);

  const recent = (shipments ?? []).slice(0, 5);
  const loading = shipments === null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Welcome back, {firstName}</h1>
          <p className="text-gray-500 mt-1">Here&apos;s an overview of your account.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/create-shipment"
            className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors whitespace-nowrap"
          >
            + Create shipment
          </Link>
          <Link
            href="/dashboard/create-shipment/bulk"
            className="px-4 py-2.5 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap"
          >
            Bulk create
          </Link>
          <Link
            href="/"
            className="px-4 py-2.5 text-sm font-semibold text-brand-gray border border-gray-300 rounded-lg hover:border-brand-orange hover:text-brand-orange transition-colors whitespace-nowrap"
          >
            Track a shipment
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="text-3xl font-bold text-brand-dark mt-2">
              {loading ? <span className="inline-block h-8 w-12 bg-gray-100 rounded animate-pulse align-middle" /> : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent shipments + account */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 sm:mt-6">
        {/* Recent shipments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-dark">Recent shipments</h2>
            {recent.length > 0 && (
              <Link href="/dashboard/shipments" className="text-sm font-semibold text-brand-orange hover:text-brand-coral transition-colors">
                View all →
              </Link>
            )}
          </div>

          {loading ? (
            <BrandLoader variant="section" />
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 sm:py-14">
              <PackageIcon />
              <p className="text-brand-dark font-medium mt-4">No shipments yet</p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">
                {error || 'Create your first shipment and it will show up here.'}
              </p>
              <Link
                href="/dashboard/create-shipment"
                className="mt-5 px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors"
              >
                + Create shipment
              </Link>
            </div>
          ) : (
            <div className="mt-2">
              {recent.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/shipments/${s.id}`}
                  className="flex items-center justify-between gap-3 py-3 border-t border-gray-100 first:border-t-0 -mx-2 px-2 rounded-lg hover:bg-gray-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-brand-dark">{s.awb || `#${s.id}`}</span>
                      {s.isDg && (
                        <span className="text-[10px] font-semibold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">DG</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                      {(s.pickupPincode || '—')} → {(s.deliveryPincode || '—')} · {titleCase(s.mode)}
                      {s.customerRef ? ` · ${s.customerRef}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClasses(statusColors[s.status]?.color ?? 'purple')}`}>
                      {statusColors[s.status]?.label ?? s.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(s.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Account card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-brand-dark">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Name</dt>
              <dd className="text-brand-dark font-medium">{user.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Email</dt>
              <dd className="text-brand-dark font-medium break-all">{user.email}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Client code</dt>
              <dd className="text-brand-dark font-medium">{user.clientCode || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Role</dt>
              <dd className="text-brand-dark font-medium capitalize">{user.role}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
