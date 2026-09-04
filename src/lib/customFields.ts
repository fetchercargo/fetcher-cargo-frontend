// Admin-defined custom fields on shipments (mirrors the Go custom_fields model).
// Fields are DB-driven config: an admin defines them once in Settings and each
// one then appears on every shipment for the admin to fill in. `visibleToClient`
// decides whether a field's value reaches the client-facing detail endpoint.

export type CustomFieldType = 'text' | 'number' | 'boolean';

export interface CustomField {
  id: number;
  label: string;
  key: string;
  fieldType: CustomFieldType;
  visibleToClient: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomFieldInput {
  label: string;
  fieldType: CustomFieldType;
  visibleToClient: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface CustomFieldValue {
  fieldId: number;
  label: string;
  key: string;
  fieldType: CustomFieldType;
  visibleToClient: boolean;
  isActive: boolean;
  sortOrder: number;
  value: string;
}

export const CUSTOM_FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes / No' },
];

// Formats a stored canonical value for display.
export function formatCustomFieldValue(type: CustomFieldType, value: string): string {
  if (type === 'boolean') {
    if (value === '') return '—';
    if (value === 'true') return 'Yes';
    return 'No';
  }
  return value === '' ? '—' : value;
}

// ---- API ------------------------------------------------------------------

// fetchCustomFields loads all fields (active + inactive). Throws on failure —
// unlike statuses there is no hardcoded fallback set, so the settings page
// surfaces the error instead of silently showing an empty list.
export async function fetchCustomFields(): Promise<CustomField[]> {
  // no-store: field changes (labels/visibility/order) must show on the next
  // load, never a cached copy.
  const res = await fetch('/api/admin/fields', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load custom fields.');
  return (await res.json()) as CustomField[];
}

export async function createCustomField(in_: CustomFieldInput): Promise<Response> {
  return fetch('/api/admin/fields', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(in_),
  });
}

export async function updateCustomField(id: number, in_: CustomFieldInput): Promise<Response> {
  return fetch(`/api/admin/fields/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(in_),
  });
}

export async function deleteCustomField(id: number): Promise<Response> {
  return fetch(`/api/admin/fields/${id}`, { method: 'DELETE' });
}

export async function saveShipmentCustomFields(shipmentId: number, values: Record<number, string>): Promise<Response> {
  return fetch(`/api/admin/shipments/${shipmentId}/fields`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  });
}
