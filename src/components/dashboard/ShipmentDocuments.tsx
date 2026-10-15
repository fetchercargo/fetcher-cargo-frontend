'use client';

import { useEffect, useState } from 'react';
import BrandLoader from '@/components/BrandLoader';
import { formatDate } from '@/lib/admin';
import { SHIPMENT_DOC_KINDS, shipmentDocUrl, type ShipmentDocument } from '@/lib/shipmentDocuments';

const linkCls = 'text-sm font-semibold text-brand-orange hover:text-brand-coral';

/** The shipment's POD and LR, to view or download. Fetcher Cargo uploads them. */
export default function ShipmentDocuments({ shipmentId }: { shipmentId: number }) {
  const [docs, setDocs] = useState<ShipmentDocument[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/shipments/${shipmentId}/documents`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const d = await res.json();
        if (active) setDocs(Array.isArray(d.items) ? (d.items as ShipmentDocument[]) : []);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [shipmentId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-brand-dark">Documents</h2>
      {failed ? (
        <p className="text-gray-400 text-sm mt-3">Could not load documents. Please try again in a moment.</p>
      ) : docs === null ? (
        <BrandLoader variant="section" />
      ) : (
        <ul className="divide-y divide-gray-100 mt-2">
          {SHIPMENT_DOC_KINDS.map(({ kind, label }) => {
            const doc = docs.find((d) => d.kind === kind);
            return (
              <li key={kind} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-dark">{label}</p>
                  <p className="text-xs text-gray-400 break-all">
                    {doc ? `${doc.fileName} · Uploaded ${formatDate(doc.uploadedAt)}` : 'Not available yet'}
                  </p>
                </div>
                {doc && (
                  <div className="flex items-center gap-4 shrink-0">
                    <a href={shipmentDocUrl('client', shipmentId, kind)} target="_blank" rel="noopener noreferrer" className={linkCls}>
                      View
                    </a>
                    <a href={shipmentDocUrl('client', shipmentId, kind, true)} download className={linkCls}>
                      Download
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
