// Shared types + helpers for the admin panel (mirrors the Go admin DTOs).

export interface AdminShipmentListItem {
  id: number;
  awb: string | null;
  clientCode: string | null;
  ownerEmail: string | null;
  status: string;
  scope: string | null;
  shipmentType: string | null;
  mode: string | null;
  shipmentCategory: string | null;
  noOfPieces: number | null;
  weightKg: number | null;
  pickupPincode: string | null;
  deliveryPincode: string | null;
  isDg: boolean;
  customerRef: string | null;
  createdAt: string;
}

export interface AdminStats {
  totalShipments: number;
  byStatus: Record<string, number>;
  totalClients: number;
  totalUsers: number;
}

export interface ClientOption {
  clientCode: string;
  name: string;
  email: string;
}

export interface TrackingUpdate {
  date: string;
  time: string;
  text: string;
  sortOrder: number;
}

export interface ShipmentDetail {
  id: number;
  awb: string | null;
  clientCode: string | null;
  customerRef: string | null;
  status: string;
  scope: string | null;
  shipmentType: string | null;
  mode: string | null;
  shipmentCategory: string | null;
  isDg: boolean;
  batchNo: string | null;
  pickupAddress: string | null;
  pickupPincode: string | null;
  pickupContactPerson: string | null;
  pickupContactNo: string | null;
  pickupContactEmail: string | null;
  noOfPieces: number | null;
  weightKg: number | null;
  dimensions: string | null;
  chargeableWeight: number | null;
  deliveryAddress: string | null;
  deliveryPincode: string | null;
  deliveryContactPerson: string | null;
  deliveryContactNo: string | null;
  deliveryContactEmail: string | null;
  estimatedDeliveryDate: string | null;
  billingAmount: number | null;
  additionalInfo: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  updates: TrackingUpdate[];
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  clientCode: string;
  createdAt: string;
  updatedAt: string;
}

export const SCOPES = ['DOMESTIC', 'INTERNATIONAL'];
export const TYPES = ['COMMERCIAL', 'NON-COMMERCIAL'];
export const MODES = ['EXPRESS', 'AIR', 'SURFACE', 'ECO-GROUND'];
export const CATEGORIES = ['DOC', 'NON-DOC'];
export const STATUSES = [
  'SHIPMENT CREATED',
  'PICKED-UP',
  'IN-TRANSIT',
  'DELIVERED',
  'ISSUE/DELAYED',
  'CANCELLED',
  'RTO',
];

export function titleCase(s: string | null): string {
  if (!s) return '—';
  return s
    .toLowerCase()
    .split(/[-\s]/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join('-');
}

export function statusClasses(status: string): string {
  if (status === 'DELIVERED') return 'bg-green-100 text-green-700';
  if (status === 'CANCELLED' || status === 'RTO') return 'bg-red-100 text-red-700';
  if (status === 'ISSUE/DELAYED') return 'bg-amber-100 text-amber-700';
  return 'bg-purple-100 text-brand-purple';
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
