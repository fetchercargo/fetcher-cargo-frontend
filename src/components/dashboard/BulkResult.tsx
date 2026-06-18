'use client';

import Link from 'next/link';
import type { ShipmentSummary } from '@/lib/bulk';

export default function BulkResult({
  created,
  batchNo,
  onUploadAnother,
  viewAllHref = '/dashboard/shipments',
  viewAllLabel = 'View My Shipments',
}: {
  created: ShipmentSummary[];
  batchNo: string;
  onUploadAnother: () => void;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-brand-dark mt-4">
          {created.length} shipment{created.length === 1 ? '' : 's'} created
        </h1>
        {batchNo && (
          <div className="mt-3 inline-block bg-purple-100 text-brand-purple text-xs font-semibold px-3 py-1 rounded-full">
            Batch {batchNo}
          </div>
        )}
        <p className="text-gray-500 mt-1">Track them with these AWBs:</p>

        <div className="mt-5 max-h-72 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100 text-left">
          {created.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-brand-orange">{s.awb ?? `#${s.id}`}</span>
                {s.isDg && (
                  <span className="text-[10px] font-semibold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">DG</span>
                )}
                {s.customerRef && <span className="text-xs text-gray-400 truncate">· {s.customerRef}</span>}
              </span>
              <span className="text-xs text-gray-400 whitespace-nowrap">{s.status}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href={viewAllHref}
            className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors"
          >
            {viewAllLabel}
          </Link>
          <button
            type="button"
            onClick={onUploadAnother}
            className="px-6 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors"
          >
            Upload another file
          </button>
        </div>
      </div>
    </div>
  );
}
