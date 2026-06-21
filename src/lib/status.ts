// Admin-managed shipment statuses (mirrors the Go shipment_statuses model).
// Statuses are DB-driven config: the frontend loads them from /api/statuses to
// render badges (color) and the customer progress bar (kind + order). A
// hardcoded fallback keeps the public tracker working if the fetch fails.

export type StatusColor = 'gray' | 'blue' | 'purple' | 'amber' | 'green' | 'red';
export type StatusKind = 'normal' | 'terminal' | 'exception';

export interface StatusConfig {
  id: number;
  code: string;
  label: string;
  color: StatusColor;
  kind: StatusKind;
  sortOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StatusInput {
  label: string;
  color: StatusColor;
  kind: StatusKind;
  sortOrder: number;
  isActive: boolean;
}

export const STATUS_COLORS: StatusColor[] = ['gray', 'blue', 'purple', 'amber', 'green', 'red'];
export const STATUS_KINDS: StatusKind[] = ['normal', 'terminal', 'exception'];

// Badge classes per palette token (matches the prior hardcoded status colors).
const BADGE: Record<StatusColor, string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-brand-purple',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
};

// Solid dot/fill classes per token (for the tracking progress marker).
const DOT: Record<StatusColor, string> = {
  gray: 'bg-gray-400',
  blue: 'bg-blue-500',
  purple: 'bg-brand-purple',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
};

export function badgeClasses(color: StatusColor | string): string {
  return BADGE[(color as StatusColor)] ?? BADGE.gray;
}

export function dotClasses(color: StatusColor | string): string {
  return DOT[(color as StatusColor)] ?? DOT.gray;
}

// FALLBACK_STATUSES mirrors the original built-in set. Used when /api/statuses
// can't be reached so the public tracker + badges never render blank.
export const FALLBACK_STATUSES: StatusConfig[] = [
  { id: -1, code: 'SHIPMENT CREATED', label: 'Shipment Created', color: 'blue', kind: 'normal', sortOrder: 10, isActive: true, isBuiltin: true },
  { id: -2, code: 'PICKED-UP', label: 'Picked-Up', color: 'blue', kind: 'normal', sortOrder: 20, isActive: true, isBuiltin: true },
  { id: -3, code: 'IN-TRANSIT', label: 'In-Transit', color: 'purple', kind: 'normal', sortOrder: 30, isActive: true, isBuiltin: true },
  { id: -4, code: 'DELIVERED', label: 'Delivered', color: 'green', kind: 'terminal', sortOrder: 40, isActive: true, isBuiltin: true },
  { id: -5, code: 'ISSUE/DELAYED', label: 'Issue/Delayed', color: 'amber', kind: 'exception', sortOrder: 50, isActive: true, isBuiltin: true },
  { id: -6, code: 'CANCELLED', label: 'Cancelled', color: 'red', kind: 'exception', sortOrder: 60, isActive: true, isBuiltin: true },
  { id: -7, code: 'RTO', label: 'RTO', color: 'red', kind: 'exception', sortOrder: 70, isActive: true, isBuiltin: true },
];

// statusMap indexes statuses by code for O(1) display lookups.
export function statusMap(list: StatusConfig[]): Record<string, StatusConfig> {
  const m: Record<string, StatusConfig> = {};
  for (const s of list) m[s.code] = s;
  return m;
}

// progressSteps returns the ordered forward steps for the customer progress bar:
// active normal + terminal statuses, by sortOrder. Exceptions are excluded (they
// render as a colored badge, not a step).
export function progressSteps(list: StatusConfig[]): StatusConfig[] {
  return list
    .filter((s) => s.isActive && (s.kind === 'normal' || s.kind === 'terminal'))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ---- API ------------------------------------------------------------------

// fetchStatuses loads all statuses (active + inactive). Returns the fallback set
// on any failure so callers always have something to render.
export async function fetchStatuses(): Promise<StatusConfig[]> {
  try {
    const res = await fetch('/api/statuses');
    if (!res.ok) return FALLBACK_STATUSES;
    const data = (await res.json()) as StatusConfig[];
    return Array.isArray(data) && data.length ? data : FALLBACK_STATUSES;
  } catch {
    return FALLBACK_STATUSES;
  }
}

export async function createStatus(in_: StatusInput): Promise<Response> {
  return fetch('/api/admin/statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(in_),
  });
}

export async function updateStatus(id: number, in_: StatusInput): Promise<Response> {
  return fetch(`/api/admin/statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(in_),
  });
}

export async function deleteStatus(id: number): Promise<Response> {
  return fetch(`/api/admin/statuses/${id}`, { method: 'DELETE' });
}

export async function reorderStatuses(items: { id: number; sortOrder: number }[]): Promise<Response> {
  return fetch('/api/admin/statuses/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
}
