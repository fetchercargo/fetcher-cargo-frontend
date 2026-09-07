// Types + API calls for the label generators. Wire shapes mirror the Go model
// (internal/model/label.go).
//
// Both render calls return a PDF, not JSON. Those bytes are the preview AND the
// saved file — the browser displays exactly what Save writes, so there is no
// second renderer that could drift out of step with the one on the server.

export interface LabelAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  mobile: string;
}

export interface ShipmentLabelInput {
  serviceType: string;
  shippedBy: LabelAddress;
  shipTo: LabelAddress;
  destination: string;
  bookingDate: string;
  actualWeight: string;
  volumetricWeight: string;
  pieces: string;
  eWayBillNo: string;
  trackingId: string;
  deliveryInstructions: string;
}

export interface LabelPrefill {
  found: boolean;
  awb: string;
  pieces: number;
  label: ShipmentLabelInput;
  message?: string;
}

// DEFAULT_COUNTRY matches the backend's default. There is no country column —
// we hold city, state and pincode only — so this is a prefill on an editable
// field, never a claim about the shipment.
export const DEFAULT_COUNTRY = 'India';

export function emptyAddress(): LabelAddress {
  return { name: '', address: '', city: '', state: '', pincode: '', country: DEFAULT_COUNTRY, mobile: '' };
}

export function emptyLabel(): ShipmentLabelInput {
  return {
    serviceType: '',
    shippedBy: emptyAddress(),
    shipTo: emptyAddress(),
    destination: '',
    bookingDate: '',
    actualWeight: '',
    volumetricWeight: '',
    pieces: '',
    eWayBillNo: '',
    trackingId: '',
    deliveryInstructions: '',
  };
}

// errorFrom pulls the API's {"error": "..."} envelope out of a failed response,
// falling back to something readable when the body is not JSON at all.
async function errorFrom(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === 'string' && body.error) return body.error;
  } catch {
    // Not JSON — a proxy error page, or an empty body.
  }
  return fallback;
}

// suggestAWBs backs the type-to-search box. Only AWB strings cross the wire; a
// shipment's addresses are fetched separately, once one has been chosen.
export async function suggestAWBs(q: string): Promise<string[]> {
  const term = q.trim();
  if (!term) return [];
  const res = await fetch(`/api/admin/labels/awbs?q=${encodeURIComponent(term)}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const body = await res.json();
  return Array.isArray(body?.awbs) ? body.awbs : [];
}

// fetchPrefill resolves an AWB to the fields a label starts from.
//
// An unknown AWB is a normal answer with found=false, not an error: the form is
// hand-fillable by design, so a label for a consignment that is not in the
// system yet is a supported case.
export async function fetchPrefill(awb: string): Promise<LabelPrefill> {
  const res = await fetch(`/api/admin/labels/prefill?awb=${encodeURIComponent(awb.trim())}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(await errorFrom(res, 'Could not look that AWB up. Please try again.'));
  return res.json();
}

// RenderedLabel is the PDF plus anything the server could not print properly.
//
// unprintable names the fields containing characters the label font has no
// glyph for. Those print as hollow rectangles, and nothing else in the pipeline
// notices — the text still measures, still wraps, still "fits" — so this is the
// only signal an operator gets before the sticker is on a box.
export interface RenderedLabel {
  blob: Blob;
  unprintable: string;
}

// UNPRINTABLE_HEADER matches labelWarningHeader in the Go handler.
const UNPRINTABLE_HEADER = 'X-Label-Unprintable';

// renderShipmentLabel returns the 4x6in PDF for the submitted fields.
export async function renderShipmentLabel(input: ShipmentLabelInput): Promise<RenderedLabel> {
  const res = await fetch('/api/admin/labels/shipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorFrom(res, 'Could not generate the label. Please try again.'));
  return { blob: await res.blob(), unprintable: res.headers.get(UNPRINTABLE_HEADER) ?? '' };
}

// renderBoxLabels returns an A4 PDF of one label per box, eight to a page.
export async function renderBoxLabels(awb: string, boxes: number): Promise<RenderedLabel> {
  const res = await fetch('/api/admin/labels/boxes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ awb: awb.trim(), boxes }),
  });
  if (!res.ok) throw new Error(await errorFrom(res, 'Could not generate the box labels. Please try again.'));
  return { blob: await res.blob(), unprintable: res.headers.get(UNPRINTABLE_HEADER) ?? '' };
}

// MAX_BOXES mirrors labelpdf.MaxBoxes on the server.
export const MAX_BOXES = 500;

// downloadName builds the filename Save offers, from an operator-typed AWB.
// Anything outside [A-Za-z0-9._-] is dropped rather than escaped — an AWB has
// no charset rule, and a filename is not the place to discover that.
export function downloadName(prefix: string, awb: string): string {
  const safe = awb.replace(/[^A-Za-z0-9._-]/g, '').slice(0, 40);
  return safe ? `${prefix}-${safe}.pdf` : `${prefix}.pdf`;
}
