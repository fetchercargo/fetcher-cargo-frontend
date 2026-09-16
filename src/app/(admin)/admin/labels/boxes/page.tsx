'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import LabelPreview from '@/components/admin/LabelPreview';
import { MAX_BOXES, downloadName, fetchPrefill, renderBoxLabels, suggestAWBs } from '@/lib/labels';

// The box label generator: an AWB and a box count in, a sheet of stickers out.
//
// It needs no shipment data at all, so it works for a consignment that is not
// in the system. Looking the AWB up is a convenience only: it offers the piece
// count on record as a suggestion, and never overrides what was typed.

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

export default function BoxLabelPage() {
  const [awb, setAwb] = useState('');
  const [boxes, setBoxes] = useState('1');
  const [options, setOptions] = useState<string[]>([]);
  const [recorded, setRecorded] = useState<{ awb: string; pieces: number } | null>(null);
  const [notice, setNotice] = useState('');
  const [renderedSnapshot, setRenderedSnapshot] = useState<string | null>(null);

  const count = Number(boxes);
  const countValid = Number.isInteger(count) && count >= 1 && count <= MAX_BOXES;
  const awbValid = awb.trim().length > 0;
  const canRender = countValid && awbValid;

  const snapshot = useMemo(() => JSON.stringify({ awb: awb.trim(), count }), [awb, count]);
  const stale = renderedSnapshot !== null && renderedSnapshot !== snapshot;

  // Type-to-search, debounced. AWB strings only.
  useEffect(() => {
    const term = awb.trim();
    let cancelled = false;
    // Every state change happens inside the timer, never synchronously in the
    // effect body — including clearing the list for a too-short term.
    const t = setTimeout(() => {
      if (cancelled) return;
      if (term.length < 2) {
        setOptions([]);
        return;
      }
      suggestAWBs(term)
        .then((a) => {
          if (!cancelled) setOptions(a);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [awb]);

  // Look the AWB up in the background purely to offer the recorded piece count.
  // A miss is silent: this card does not need the shipment to exist.
  useEffect(() => {
    const term = awb.trim();
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      if (term.length < 3) {
        setRecorded(null);
        setNotice('');
        return;
      }
      fetchPrefill(term)
        .then((p) => {
          if (cancelled) return;
          if (p.found && p.pieces > 0) {
            setRecorded({ awb: p.awb, pieces: p.pieces });
            setNotice('');
          } else {
            setRecorded(null);
            setNotice(p.found ? '' : 'No shipment found for this AWB. The labels will still print.');
          }
        })
        .catch(() => {
          if (!cancelled) setRecorded(null);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [awb]);

  async function doRender() {
    const blob = await renderBoxLabels(awb, count);
    setRenderedSnapshot(JSON.stringify({ awb: awb.trim(), count }));
    return blob;
  }

  const sheets = countValid ? Math.ceil(count / 8) : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <Link href="/admin/labels" className="text-sm font-medium text-gray-500 hover:text-brand-orange transition-colors">
        ← Labels
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mt-2">Box Label Generator</h1>
      <p className="text-gray-500 mt-1">
        One sticker per box, eight to an A4 sheet. Each carries the AWB and which box it is.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-dark">AWB number</span>
            <input
              className={inputCls}
              list="box-awbs"
              placeholder="Start typing an AWB…"
              value={awb}
              maxLength={200}
              onChange={(e) => setAwb(e.target.value)}
            />
            <datalist id="box-awbs">
              {options.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            {notice && <span className="text-xs text-amber-700">{notice}</span>}
          </label>

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

          {recorded && recorded.pieces !== count && (
            <div className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
              <span className="text-brand-dark">
                {recorded.awb} has <strong>{recorded.pieces}</strong> piece{recorded.pieces === 1 ? '' : 's'} on record.
              </span>
              <button
                type="button"
                onClick={() => setBoxes(String(recorded.pieces))}
                className="font-semibold text-brand-orange hover:text-brand-coral transition-colors"
              >
                Use {recorded.pieces}
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 leading-relaxed">
            The numbering is positional — &ldquo;Box 3 of 20&rdquo; means the third of twenty in this run, not a serial
            number kept against the box. If the shipment&rsquo;s parcel list is edited and you print again, the new run
            can disagree with a sticker already on a box.
          </p>
        </div>

        <div className="lg:sticky lg:top-6">
          <LabelPreview
            render={doRender}
            filename={downloadName('box-labels', awb)}
            stale={stale}
            disabled={!canRender}
            disabledReason={!awbValid ? 'Enter an AWB number.' : 'Enter a valid number of boxes.'}
            aspect="a4"
            emptyHint="Enter an AWB and a box count, then generate the preview."
          />
        </div>
      </div>
    </div>
  );
}
