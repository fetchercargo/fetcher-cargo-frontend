'use client';

import { useMemo, useState } from 'react';
import LabelPreview from '@/components/labels/LabelPreview';
import { MAX_BOXES, downloadName, renderMyBoxLabels, renderMyShipmentLabel } from '@/lib/labels';

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

interface ShipmentLabelsProps {
  shipmentId: number;
  awb: string | null;
  piecesOnRecord: number;
}

export default function ShipmentLabels({ shipmentId, awb, piecesOnRecord }: ShipmentLabelsProps) {
  const [tab, setTab] = useState<'shipping' | 'boxes'>('shipping');
  const [eWayBillNo, setEWayBillNo] = useState('');
  const [volumetricWeight, setVolumetricWeight] = useState('');
  const [renderedExtras, setRenderedExtras] = useState<string | null>(null);
  // One print makes at most MAX_BOXES labels, so a bigger shipment starts at
  // the cap rather than on a count the form would refuse.
  const [boxes, setBoxes] = useState(() => String(piecesOnRecord > 0 ? Math.min(piecesOnRecord, MAX_BOXES) : 1));
  const [renderedCount, setRenderedCount] = useState<string | null>(null);

  const awbTrim = awb?.trim() ?? '';
  const count = Number(boxes);
  const countValid = Number.isInteger(count) && count >= 1 && count <= MAX_BOXES;

  // The stale check compares trimmed values, because that is what the server
  // receives — a trailing space alone does not make a preview out of date.
  const extrasSnapshot = useMemo(
    () => JSON.stringify({ eWayBillNo: eWayBillNo.trim(), volumetricWeight: volumetricWeight.trim() }),
    [eWayBillNo, volumetricWeight],
  );
  const extrasStale = renderedExtras !== null && renderedExtras !== extrasSnapshot;
  const countStale = renderedCount !== null && renderedCount !== JSON.stringify(count);

  const sheets = countValid ? Math.ceil(count / 8) : 0;

  async function renderShipping() {
    const blob = await renderMyShipmentLabel(shipmentId, { eWayBillNo, volumetricWeight });
    setRenderedExtras(extrasSnapshot);
    return blob;
  }

  async function renderBoxes() {
    const blob = await renderMyBoxLabels(shipmentId, count);
    setRenderedCount(JSON.stringify(count));
    return blob;
  }

  return (
    <section id="labels" className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 scroll-mt-24">
      <h2 className="text-base font-semibold text-brand-dark">Labels</h2>
      {awbTrim ? (
        <>
          <div role="tablist" className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'shipping'}
              onClick={() => setTab('shipping')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg border transition-colors ${
                tab === 'shipping'
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-gray-300 text-gray-500 hover:border-brand-orange hover:text-brand-orange'
              }`}
            >
              Shipping label (4x6)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'boxes'}
              onClick={() => setTab('boxes')}
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg border transition-colors ${
                tab === 'boxes'
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-gray-300 text-gray-500 hover:border-brand-orange hover:text-brand-orange'
              }`}
            >
              Box labels (A4)
            </button>
          </div>

          {/* Both panels stay mounted so a preview already made on one tab is
              still there when the client comes back to it. */}
          <div role="tabpanel" hidden={tab !== 'shipping'} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-brand-dark">E-Way Bill No.</span>
                <input
                  className={inputCls}
                  value={eWayBillNo}
                  maxLength={200}
                  onChange={(e) => setEWayBillNo(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-brand-dark">Volumetric weight</span>
                <input
                  className={inputCls}
                  value={volumetricWeight}
                  maxLength={200}
                  placeholder="e.g. 8.4 kg"
                  onChange={(e) => setVolumetricWeight(e.target.value)}
                />
              </label>
            </div>
            <p className="text-xs text-gray-400">
              Everything else on the label comes from this booking. If a detail is wrong, contact us to correct the
              shipment before printing.
            </p>
            <LabelPreview
              render={renderShipping}
              filename={downloadName('shipment-label', awbTrim)}
              stale={extrasStale}
              aspect="4/6"
              emptyHint="Generate the preview to see your label. What you see here is the file you save."
              unprintableAdvice="Those details come from your booking — contact us to have them corrected in English before printing."
            />
          </div>

          <div role="tabpanel" hidden={tab !== 'boxes'} className="mt-4 space-y-4">
            <label className="flex flex-col gap-1.5 max-w-[220px]">
              <span className="text-sm font-medium text-brand-dark">Number of boxes</span>
              <input
                type="number"
                min={1}
                max={MAX_BOXES}
                step={1}
                className={inputCls}
                value={boxes}
                onChange={(e) => setBoxes(e.target.value)}
              />
              {countValid ? (
                <span className="text-xs text-gray-400">
                  {count} label{count === 1 ? '' : 's'} across {sheets} A4 sheet{sheets === 1 ? '' : 's'}.
                </span>
              ) : (
                <span className="text-xs text-red-600">Enter a whole number between 1 and {MAX_BOXES}.</span>
              )}
            </label>

            {piecesOnRecord > MAX_BOXES && (
              <p className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-brand-dark">
                This shipment has <strong>{piecesOnRecord}</strong> pieces on record. One print makes at most{' '}
                {MAX_BOXES} labels, so print the rest in a second run.
              </p>
            )}

            {piecesOnRecord > 0 && piecesOnRecord <= MAX_BOXES && countValid && count !== piecesOnRecord && (
              <div className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
                <span className="text-brand-dark">
                  This shipment has <strong>{piecesOnRecord}</strong> piece{piecesOnRecord === 1 ? '' : 's'} on record.
                </span>
                <button
                  type="button"
                  onClick={() => setBoxes(String(piecesOnRecord))}
                  className="font-semibold text-brand-orange hover:text-brand-coral transition-colors"
                >
                  Use {piecesOnRecord}
                </button>
              </div>
            )}

            <p className="text-xs text-gray-400 leading-relaxed">
              The numbering is positional — &ldquo;Box 3 of 20&rdquo; means the third of twenty in this print, not a
              number kept against the box.
            </p>
            <LabelPreview
              render={renderBoxes}
              filename={downloadName('box-labels', awbTrim)}
              stale={countStale}
              disabled={!countValid}
              disabledReason="Enter a valid number of boxes."
              aspect="a4"
              emptyHint="Choose the number of boxes, then generate the preview."
              unprintableAdvice="Those details come from your booking — contact us to have them corrected in English before printing."
            />
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-gray-500">Labels can be printed once an AWB is assigned to this shipment.</p>
      )}
    </section>
  );
}
