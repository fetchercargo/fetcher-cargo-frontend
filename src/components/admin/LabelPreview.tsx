'use client';

import { useEffect, useRef, useState } from 'react';
import type { RenderedLabel } from '@/lib/labels';

// LabelPreview shows a rendered PDF and offers the SAME bytes as the PDF
// download.
//
// The preview is the artifact: the server renders the PDF, this displays those
// exact bytes, and Save as PDF writes those exact bytes. Nothing here re-draws
// the label, so there is no second renderer that could disagree with the
// printer. Save as PNG is a raster conversion of the previewed bytes, done in
// the browser at 200 DPI — it never re-renders the form, so it always matches
// what is on screen, stale preview included.

export interface LabelPreviewHandle {
  render: () => Promise<void>;
}

interface Props {
  // render produces the PDF. Errors are surfaced to the operator as-is.
  render: () => Promise<RenderedLabel>;
  filename: string;
  // stale marks the preview as out of date because the form changed after it
  // was generated. The old preview is kept on screen — it is still what would
  // print if nothing more were done — but is dimmed and labelled.
  stale: boolean;
  // disabled blocks generation, with why shown on the button's title.
  disabled?: boolean;
  disabledReason?: string;
  // aspect is the preview frame's shape, so a 4x6 label and an A4 sheet each
  // get a frame the right way round.
  aspect: '4/6' | 'a4';
  emptyHint: string;
}

// saveBlob hands a freshly made blob to the browser as a download. The object
// URL is revoked a beat later, not immediately — revoking at once can race the
// download starting in some browsers.
function saveBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export default function LabelPreview({ render, filename, stale, disabled, disabledReason, aspect, emptyHint }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState(filename);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unprintable, setUnprintable] = useState('');
  // The PNG action converts the PDF the iframe is displaying, so the blob is
  // kept next to its object URL. A ref, not state — nothing renders from it.
  const blobRef = useRef<Blob | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageStatus, setImageStatus] = useState('');
  const [imageError, setImageError] = useState('');
  // Held in a ref as well as state so the cleanup below revokes the CURRENT
  // url without having to list it as a dependency — which would revoke the
  // object while the iframe was still displaying it.
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  async function generate() {
    if (busy || imageBusy || disabled) return;
    const nextFilename = filename;
    setBusy(true);
    setError('');
    try {
      const { blob, unprintable: bad } = await render();
      blobRef.current = blob;
      setUnprintable(bad);
      const next = URL.createObjectURL(blob);
      // Revoke the one being replaced, not the new one.
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = next;
      setUrl(next);
      setPreviewFilename(nextFilename);
      // A new preview invalidates anything said about the last export.
      setImageStatus('');
      setImageError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate the preview.');
    } finally {
      setBusy(false);
    }
  }

  // saveImage rasterises the PREVIEWED PDF — not the current form — to PNG.
  // One page downloads a single .png at 200 DPI; several pages download one
  // .zip of numbered PNGs, one per sheet. Nothing is re-rendered on the server.
  async function saveImage() {
    const blob = blobRef.current;
    if (imageBusy || busy || !blob) return;
    setImageBusy(true);
    setImageError('');
    setImageStatus('Loading the converter…');
    try {
      // Imported on click only, so pdfjs-dist and fflate never load with the
      // label pages themselves.
      const { pdfToImageBundle } = await import('@/lib/label-image');
      const bundle = await pdfToImageBundle(blob, ({ phase, page, pages }) => {
        setImageStatus(
          phase === 'bundle' ? `Bundling ${pages} PNGs into a zip…` : `Converting page ${page} of ${pages}…`,
        );
      });
      saveBlob(bundle.blob, `${previewFilename.replace(/\.pdf$/i, '')}.${bundle.kind}`);
      setImageStatus(bundle.kind === 'png' ? 'Saved one PNG.' : `Saved ${bundle.pages} PNGs in one zip.`);
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Could not convert the preview to PNG.');
      setImageStatus('');
    } finally {
      setImageBusy(false);
    }
  }

  const frameClass = aspect === 'a4' ? 'aspect-[210/297]' : 'aspect-[2/3]';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          disabled={busy || imageBusy || disabled}
          title={disabled ? disabledReason : undefined}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Generating…' : url ? 'Update preview' : 'Generate preview'}
        </button>

        {url && (
          <>
            <a
              href={url}
              download={previewFilename}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-brand-dark text-sm font-semibold rounded-lg hover:border-brand-orange hover:text-brand-orange transition-colors"
            >
              Save as PDF
            </a>
            <button
              type="button"
              onClick={saveImage}
              disabled={imageBusy || busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-brand-dark text-sm font-semibold rounded-lg hover:border-brand-orange hover:text-brand-orange transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {imageBusy ? 'Converting…' : 'Save as PNG'}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-gray-500 hover:text-brand-orange transition-colors"
            >
              Open in a new tab
            </a>
          </>
        )}
      </div>

      {imageStatus && (
        <p className="text-sm text-gray-500" role="status">
          {imageStatus}
        </p>
      )}

      {imageError && (
        <p className="text-sm text-red-600" role="alert">
          {imageError}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {unprintable && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" role="alert">
          Some characters in <strong>{unprintable}</strong> cannot be drawn by the label font and print as empty boxes.
          This affects scripts the font does not carry — Devanagari, Tamil, Chinese, Arabic and the like. Retype those
          fields in English before printing.
        </p>
      )}

      {url && stale && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          You have changed the form since this preview was made. Generate it again to see — and save — the new version.
        </p>
      )}

      <div className={`${frameClass} w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 overflow-hidden`}>
        {url ? (
          <iframe
            src={url}
            title="Label preview"
            className={`w-full h-full ${stale ? 'opacity-50' : ''} transition-opacity`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6 text-center text-sm text-gray-400">
            {emptyHint}
          </div>
        )}
      </div>

      {url && (
        <p className="text-xs text-gray-400">
          Save as PDF keeps the exact preview and its print size. Save as PNG makes a high-resolution image of this
          preview; multiple sheets download as one zip of numbered PNGs. If the preview does not display in your
          browser, open it in a new tab.
        </p>
      )}
    </div>
  );
}
