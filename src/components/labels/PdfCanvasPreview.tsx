'use client';

import { useEffect, useRef, useState } from 'react';
import { openLabelPdf } from '@/lib/label-image';

type PdfDocument = Awaited<ReturnType<typeof openLabelPdf>>;
type PdfPage = Awaited<ReturnType<PdfDocument['getPage']>>;
const PREVIEW_SCALE = 200 / 72;

interface Props {
  blob: Blob;
  aspect: '4/6' | 'a4';
  stale: boolean;
}

interface RenderedPage {
  page: number;
  url: string;
}

// Native PDF viewers do not work inside every browser's iframe. Render only
// the selected PDF page to an image, keeping the original PDF blob untouched
// for both downloads. Box-label PDFs can have many pages, so do not rasterize
// the whole document just to show page one.
export default function PdfCanvasPreview({ blob, aspect, stale }: Props) {
  const [pdf, setPdf] = useState<PdfDocument | null>(null);
  const [page, setPage] = useState(1);
  const [rendered, setRendered] = useState<RenderedPage | null>(null);
  const [error, setError] = useState<{ page: number; message: string } | null>(null);
  const imageUrl = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let loaded: PdfDocument | null = null;
    void openLabelPdf(blob).then(
      (document) => {
        if (!active) {
          void document.destroy();
          return;
        }
        loaded = document;
        setPdf(document);
      },
      (cause) => {
        if (active) {
          setError({ page: 1, message: cause instanceof Error ? cause.message : 'Could not open the PDF preview.' });
        }
      },
    );
    return () => {
      active = false;
      if (loaded) void loaded.destroy();
    };
  }, [blob]);

  useEffect(() => {
    return () => {
      if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
    };
  }, []);

  useEffect(() => {
    if (!pdf) return;
    let active = true;
    let pdfPage: PdfPage | null = null;
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null;
    const canvas = document.createElement('canvas');

    void (async () => {
      try {
        pdfPage = await pdf.getPage(page);
        if (!active) return;
        const viewport = pdfPage.getViewport({ scale: PREVIEW_SCALE });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        if (!context || typeof canvas.toBlob !== 'function') {
          throw new Error('This browser cannot draw the PDF preview.');
        }
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        renderTask = pdfPage.render({ canvas, canvasContext: context, viewport });
        await renderTask.promise;
        if (!active) return;
        const png = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => result ? resolve(result) : reject(new Error('Could not encode the PDF preview.')),
            'image/png',
          );
        });
        if (!active) return;
        const nextUrl = URL.createObjectURL(png);
        if (imageUrl.current) URL.revokeObjectURL(imageUrl.current);
        imageUrl.current = nextUrl;
        setRendered({ page, url: nextUrl });
      } catch (cause) {
        if (active) {
          setError({ page, message: cause instanceof Error ? cause.message : 'Could not draw the PDF preview.' });
        }
      } finally {
        pdfPage?.cleanup();
        canvas.width = 0;
        canvas.height = 0;
      }
    })();

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [pdf, page]);

  const current = rendered?.page === page ? rendered : null;
  const currentError = error?.page === page ? error.message : null;
  const frameClass = aspect === 'a4' ? 'aspect-[210/297]' : 'aspect-[2/3]';

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`${frameClass} w-full max-w-md rounded-xl border border-gray-200 bg-white overflow-hidden flex items-center justify-center ${stale ? 'opacity-50' : ''}`}
      >
        {current && !currentError ? (
          // The URL is a local PDF.js rendering, so Next image optimization is inapplicable.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={`Label preview, page ${page} of ${pdf?.numPages ?? 1}`}
            className="block w-full h-full object-contain"
          />
        ) : (
          <p
            className={`p-6 text-center text-sm ${currentError ? 'text-red-600' : 'text-gray-500'}`}
            role={currentError ? 'alert' : 'status'}
          >
            {currentError ? `Preview unavailable: ${currentError}. You can still save the PDF.` : `Rendering page ${page}…`}
          </p>
        )}
      </div>
      {pdf && pdf.numPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm text-brand-dark" aria-label="Preview pages">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {pdf.numPages}</span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(pdf.numPages, value + 1))}
            disabled={page === pdf.numPages}
            className="rounded-lg border border-gray-300 px-3 py-2 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
