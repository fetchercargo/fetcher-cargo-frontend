'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">My Shipments</h1>
          <p className="text-gray-500 mt-1">Shipments you&apos;ve created.</p>
        </div>
        <CreateButton />
      </div>

      <div className="mt-6">
        {shipments === null ? (
          <div className="flex justify-center py-16">
            <svg className="animate-spin h-7 w-7 text-brand-orange" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : shipments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 sm:p-14 text-center">
            <p className="text-brand-dark font-medium">No shipments yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first shipment to see it here.</p>
            {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
            <div className="mt-6 flex justify-center">
              <CreateButton />
            </div>
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
