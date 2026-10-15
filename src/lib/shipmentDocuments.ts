// A shipment's Proof of Delivery and LR. The files stream through the backend,
// so the session cookie authorizes the View and Download links.

export type ShipmentDocKind = 'POD' | 'LR';

export const SHIPMENT_DOC_KINDS: { kind: ShipmentDocKind; label: string }[] = [
  { kind: 'POD', label: 'Proof of Delivery (POD)' },
  { kind: 'LR', label: 'LR' },
];

export interface ShipmentDocument {
  kind: ShipmentDocKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  // The file was deleted in Google Drive itself. Only the admin view sees these.
  missing: boolean;
}

export const MAX_SHIPMENT_DOC_BYTES = 10 * 1024 * 1024;
export const SHIPMENT_DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

/**
 * Why a file cannot be uploaded, or null. Only a quick check before sending
 * it: the server judges the type by the file's content and has the final say.
 */
export function shipmentDocProblem(file: File): string | null {
  if (file.size > MAX_SHIPMENT_DOC_BYTES) return 'File is too large (max 10 MB)';
  const typeOk = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || /\.(pdf|jpe?g|png)$/i.test(file.name);
  return typeOk ? null : 'Only PDF, JPG or PNG files can be uploaded';
}

/** The file itself: shown in the browser, or saved when `download` is set. */
export function shipmentDocUrl(scope: 'admin' | 'client', shipmentId: number, kind: ShipmentDocKind, download = false): string {
  const base = scope === 'admin' ? `/api/admin/shipments/${shipmentId}/documents` : `/api/shipments/${shipmentId}/documents`;
  return `${base}/${kind}${download ? '?download=1' : ''}`;
}
