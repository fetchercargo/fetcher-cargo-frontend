'use client';

import { useState } from 'react';
import { MAX_PARCELS } from '@/lib/bulk';

// The template used to be a static file with five fixed parcel slots, which
// capped a shipment at five DIFFERENT box sizes. It is now generated per
// download so a client shipping twenty differently sized boxes under one AWB can
// record them. Asking "are they all the same size?" is what keeps the common
// case narrow: same size means one shared dimensions column instead of twenty.

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export default function TemplateDownload() {
  const [open, setOpen] = useState(false);
  const [parcels, setParcels] = useState('5');
  const [sameSize, setSameSize] = useState(false);
  const [dimensions, setDimensions] = useState('');

  const count = Number(parcels);
  const countValid = Number.isInteger(count) && count >= 1 && count <= MAX_PARCELS;

  // Downloading is a plain navigation, so anything the endpoint rejects lands
  // the user on raw JSON instead of this page. Mirror its limits here so that
  // cannot happen: MAX_DIMENSIONS matches the backend's cap on the prefill.
  const MAX_DIMENSIONS = 100;
  const dimsValid = dimensions.trim().length <= MAX_DIMENSIONS;
  const canDownload = countValid && (!sameSize || dimsValid);

  function download() {
    if (!canDownload) return;
    const qs = new URLSearchParams({ parcels: String(count) });
    if (sameSize) {
      qs.set('sameSize', '1');
      const d = dimensions.trim();
      if (d) qs.set('dimensions', d);
    }
    // A plain navigation, matching the shipments export: auth rides on the
    // cookie, so the browser handles the download without a blob round-trip.
    window.location.href = `/api/shipments/bulk/template?${qs.toString()}`;
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-orange hover:text-brand-coral transition-colors"
      >
        <DownloadIcon /> Download template
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <p className="text-sm font-semibold text-brand-dark">Build your template</p>
      <p className="text-xs text-gray-500 mt-1">
        One parcel line per box size. Twenty identical boxes is one line with the count set to 20.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-dark">Parcel lines per shipment</span>
          <input
            type="number"
            min={1}
            max={MAX_PARCELS}
            step={1}
            className={inputCls}
            value={parcels}
            onChange={(e) => setParcels(e.target.value)}
          />
          {!countValid && (
            <span className="text-xs text-red-600">Enter a whole number between 1 and {MAX_PARCELS}.</span>
          )}
        </label>

        {sameSize && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-dark">Dimensions (cm)</span>
            <input
              className={inputCls}
              placeholder="30x20x15"
              maxLength={MAX_DIMENSIONS}
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
            />
            {dimsValid ? (
              <span className="text-xs text-gray-400">Optional — filled into the first row so you can copy it down.</span>
            ) : (
              <span className="text-xs text-red-600">Keep this under {MAX_DIMENSIONS} characters.</span>
            )}
          </label>
        )}
      </div>

      <label className="flex items-center gap-2 mt-4 text-sm text-gray-600 select-none cursor-pointer">
        <input
          type="checkbox"
          className="accent-brand-orange"
          checked={sameSize}
          onChange={(e) => setSameSize(e.target.checked)}
        />
        All parcels are the same size
      </label>

      <div className="flex items-center justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={download}
          disabled={!canDownload}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DownloadIcon /> Download
        </button>
      </div>
    </div>
  );
}
