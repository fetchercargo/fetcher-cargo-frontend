// Types + helpers for pickup requests (mirrors the Go pickup models in
// internal/model/pickup.go). The public form, the admin grid/detail, and the
// Pickup Statuses settings screen all draw from here.

import type { StatusConfig, StatusInput } from '@/lib/status';

// The pickup status table mirrors the shipment one column for column, so the
// status helpers (badgeClasses, statusMap) apply to it unchanged.
export type PickupStatus = StatusConfig;
export type PickupStatusInput = StatusInput;

// Attachment caps enforced by the backend on submit; mirrored so the form can
// reject bad files before the round trip.
export const MAX_PICKUP_FILES = 10;
export const MAX_PICKUP_FILE_BYTES = 5 * 1024 * 1024;
export const PICKUP_FILE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// ---- Public form -----------------------------------------------------------

// A saved pickup location as the anonymous form is allowed to see it: label and
// city ONLY. The street address is resolved on our side, never sent to the
// browser (see the backend plan — the shape is the endpoint's whole safety).
export interface PickupLocationOption {
  id: number;
  label: string;
  city: string;
}

export interface PickupLocationsResult {
  matched: boolean;
  locations: PickupLocationOption[];
}

export interface PickupRequestAWB {
  sortOrder: number;
  awb: string;
}

export interface PickupRequestFile {
  id: number;
  sortOrder: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  driveFileId: string;
  hasContent: boolean;
}

// A saved pickup location expanded for ops (admin detail only — never public).
export interface PickupResolvedLocation {
  id: number;
  label: string;
  address: string;
  city: string;
  pincode: string;
  contactPerson: string;
  contactNo: string;
}

// The full request, as returned by submit/verify (public) and the admin detail
// read. AWBs/files are populated on those reads only; pickupLocation on admin
// reads only.
export interface PickupRequest {
  id: number;
  ref: string;
  customerId: string;
  customerMatched: boolean;
  email: string;
  locationId: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  awbCount: number;
  readyAt: string;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  awbs: PickupRequestAWB[];
  files: PickupRequestFile[];
  pickupLocation?: PickupResolvedLocation;
}

// One row of the admin grid. locationLabel is set when a saved location was
// chosen; otherwise the typed address fields carry the pickup point.
export interface PickupRequestListItem {
  id: number;
  ref: string;
  customerId: string;
  customerMatched: boolean;
  email: string;
  locationLabel: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  awbCount: number;
  readyAt: string;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
}

// PickupError carries the HTTP status alongside the server's message so callers
// can distinguish a wrong code (401) from the rate limiter (429) etc. when the
// body is missing or unparsable.
export class PickupError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function pickupJson<T>(res: Response, fallback: string): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new PickupError(data.error || fallback, res.status);
  return data as T;
}

export async function fetchPickupLocations(
  customerId: string,
  captchaToken: string,
  captchaAnswer: string,
): Promise<PickupLocationsResult> {
  const params = new URLSearchParams({
    customerId,
    captcha_answer: captchaAnswer,
    captcha_token: captchaToken,
  });
  const res = await fetch(`/api/pickup/locations?${params.toString()}`);
  return pickupJson(res, 'Could not check your Customer ID.');
}

export interface PickupSubmitForm {
  captchaToken: string;
  captchaAnswer: string;
  customerId: string;
  email: string;
  locationId: number | null; // saved location chosen; null means typed address
  address: string;
  city: string;
  state: string;
  pincode: string;
  awbs: string[];
  readyAt: string; // RFC 3339
  files: File[];
}

// submitPickupRequest builds the multipart body itself so the field names live
// in exactly one place (they must match the Go handler, which reads them by
// string).
export async function submitPickupRequest(form: PickupSubmitForm): Promise<PickupRequest> {
  const fd = new FormData();
  fd.append('captcha_token', form.captchaToken);
  fd.append('captcha_answer', form.captchaAnswer);
  fd.append('customerId', form.customerId);
  fd.append('email', form.email);
  // Exactly one of a saved location and a typed address carries the pickup
  // point; the backend rejects both-or-neither.
  if (form.locationId !== null) {
    fd.append('locationId', String(form.locationId));
  } else {
    fd.append('address', form.address);
    fd.append('city', form.city);
    if (form.state) fd.append('state', form.state);
    fd.append('pincode', form.pincode);
  }
  fd.append('awbCount', String(form.awbs.length));
  form.awbs.forEach((a) => fd.append('awb', a));
  fd.append('readyAt', form.readyAt);
  form.files.forEach((f) => fd.append('files', f, f.name));
  const res = await fetch('/api/pickup/requests', { method: 'POST', body: fd });
  return pickupJson(res, 'Could not submit your pickup request.');
}

export async function verifyPickupRequest(ref: string, code: string): Promise<PickupRequest> {
  const res = await fetch('/api/pickup/requests/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref, code }),
  });
  return pickupJson(res, 'Could not verify your code.');
}

export async function resendPickupOTP(ref: string): Promise<void> {
  const res = await fetch('/api/pickup/requests/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref }),
  });
  await pickupJson(res, 'Could not resend the code.');
}

// ---- Admin -----------------------------------------------------------------

// FALLBACK_PICKUP_STATUSES mirrors the seeded built-ins (migration 0022). Used
// when /api/admin/pickup-statuses can't be reached so badges never render
// blank — same role FALLBACK_STATUSES plays for shipments.
export const FALLBACK_PICKUP_STATUSES: PickupStatus[] = [
  { id: -1, code: 'NEW', label: 'New', color: 'blue', kind: 'normal', sortOrder: 10, isActive: true, isBuiltin: true },
  { id: -2, code: 'SCHEDULED', label: 'Scheduled', color: 'purple', kind: 'normal', sortOrder: 20, isActive: true, isBuiltin: true },
  { id: -3, code: 'PICKED-UP', label: 'Picked-Up', color: 'green', kind: 'normal', sortOrder: 30, isActive: true, isBuiltin: true },
  { id: -4, code: 'CANCELLED', label: 'Cancelled', color: 'red', kind: 'exception', sortOrder: 40, isActive: true, isBuiltin: true },
];

// fetchPickupStatuses loads all pickup statuses (active + inactive). Returns
// the fallback set on any failure so callers always have something to render.
export async function fetchPickupStatuses(): Promise<PickupStatus[]> {
  try {
    // no-store: status config is editable; a stale copy must never be cached.
    const res = await fetch('/api/admin/pickup-statuses', { cache: 'no-store' });
    if (!res.ok) return FALLBACK_PICKUP_STATUSES;
    const data = (await res.json()) as PickupStatus[];
    return Array.isArray(data) && data.length ? data : FALLBACK_PICKUP_STATUSES;
  } catch {
    return FALLBACK_PICKUP_STATUSES;
  }
}

export async function createPickupStatus(in_: PickupStatusInput): Promise<Response> {
  return fetch('/api/admin/pickup-statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(in_),
  });
}

export async function updatePickupStatus(id: number, in_: PickupStatusInput): Promise<Response> {
  return fetch(`/api/admin/pickup-statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(in_),
  });
}

export async function deletePickupStatus(id: number): Promise<Response> {
  return fetch(`/api/admin/pickup-statuses/${id}`, { method: 'DELETE' });
}

export async function setPickupRequestStatus(id: number, status: string): Promise<Response> {
  return fetch(`/api/admin/pickup-requests/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
}

// Attachments stream through the API (held Postgres bytes or Drive), so the
// session cookie authorizes the URL and it can be used directly in <img src>.
export function pickupFileUrl(requestId: number, fileId: number): string {
  return `/api/admin/pickup-requests/${requestId}/files/${fileId}`;
}
