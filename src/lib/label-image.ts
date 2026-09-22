// Browser-side PNG export for the label generators.
//
// The previewed PDF is the artifact; a PNG is a raster CONVERSION of those
// same bytes at print resolution, done entirely on this page. No new endpoint,
// no upload, and no re-render of the form — the blob handed in is the one the
// iframe is showing, so a stale preview converts to a stale image, exactly as
// it would print.
//
// pdfjs-dist and fflate are imported inside these functions so neither the
// libraries nor the worker reach the initial label-page bundle.

export interface ImageBundle {
  // 'png' — a one-page PDF rendered to a single PNG.
  // 'zip' — a multi-page PDF, one PNG per A4 sheet, bundled with fflate.
  kind: 'png' | 'zip';
  blob: Blob;
  pages: number;
}

export interface ImageProgress {
  phase: 'render' | 'bundle';
  page: number;
  pages: number;
}

// 200 DPI is the target print resolution; PDF user-space units are 1/72 inch.
const TARGET_DPI = 200;
const PDF_POINTS_PER_INCH = 72;

function pageName(page: number): string {
  return `page-${String(page).padStart(3, '0')}.png`;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('This browser could not encode the PNG image.'));
      },
      'image/png',
    );
  });
}

// pdfToImageBundle converts a PDF blob to a downloadable PNG (single page) or
// a zip of numbered PNGs (one per page). Pages are rasterised one at a time on
// a single reused canvas — only the compressed PNG bytes are kept — and the
// PDF document is destroyed on the way out.
export async function pdfToImageBundle(
  pdfBlob: Blob,
  onProgress?: (progress: ImageProgress) => void,
): Promise<ImageBundle> {
  const pdfjs = await import('pdfjs-dist');
  // The worker is resolved from the pdfjs-dist copy bundled with the app —
  // nothing is fetched from a third-party CDN.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const data = new Uint8Array(await pdfBlob.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;
  try {
    const canvas = document.createElement('canvas');
    if (typeof canvas.getContext !== 'function' || typeof canvas.toBlob !== 'function') {
      throw new Error('This browser cannot convert PDFs to images — canvas support is missing.');
    }
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('This browser cannot convert PDFs to images — no 2D canvas could be created.');
    }

    const scale = TARGET_DPI / PDF_POINTS_PER_INCH;
    const pages = pdf.numPages;
    const single: Blob[] = [];
    const zipped: Record<string, Uint8Array> = {};

    try {
      for (let page = 1; page <= pages; page++) {
        onProgress?.({ phase: 'render', page, pages });
        const pdfPage = await pdf.getPage(page);
        try {
          const viewport = pdfPage.getViewport({ scale });
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          // Paper is white: paint it before the PDF so transparent areas do
          // not come out black in the PNG.
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          await pdfPage.render({ canvas, canvasContext: context, viewport }).promise;
          const png = await canvasToPng(canvas);
          if (pages === 1) single.push(png);
          else zipped[pageName(page)] = new Uint8Array(await png.arrayBuffer());
        } finally {
          pdfPage.cleanup();
        }
      }
    } finally {
      // Drop the canvas backing store before anything else happens.
      canvas.width = 0;
      canvas.height = 0;
    }

    if (pages === 1) {
      const blob = single[0];
      if (!blob) throw new Error('The conversion produced no image — please try again.');
      return { kind: 'png', blob, pages };
    }

    onProgress?.({ phase: 'bundle', page: pages, pages });
    const { zipSync } = await import('fflate');
    // The PNGs are already compressed; storing them again would only cost
    // time and memory, so the zip keeps them verbatim.
    const zip = zipSync(zipped, { level: 0 });
    return { kind: 'zip', blob: new Blob([zip], { type: 'application/zip' }), pages };
  } finally {
    await pdf.destroy();
  }
}
