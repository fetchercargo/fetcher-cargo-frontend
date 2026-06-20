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

export interface Parcel {
  noOfPieces: number | null;
  weightKg: number | null;
  dimensions: string | null;
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
  pickupAltContactPerson: string | null;
  pickupAltContactNo: string | null;
  noOfPieces: number | null; // total pieces across parcels
  weightKg: number | null; // total weight across parcels
  dimensions: string | null;
  chargeableWeight: number | null;
  parcels: Parcel[];
  deliveryAddress: string | null;
  deliveryPincode: string | null;
  deliveryContactPerson: string | null;
  deliveryContactNo: string | null;
  deliveryContactEmail: string | null;
  deliveryAltContactPerson: string | null;
  deliveryAltContactNo: string | null;
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
  businessName: string;
  businessAddress: string;
  businessEmail: string;
  primaryTel: string;
  primaryContactPerson: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientLocation {
  id: number;
  kind: 'pickup' | 'delivery';
  label: string;
  address: string;
  pincode: string;
  contactNo: string;
  email: string;
  contactPerson: string;
  altContactPerson: string;
  altContactNo: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientLocationInput {
  label: string;
  address: string;
  pincode: string;
  contactNo: string;
  email: string;
  contactPerson: string;
  altContactPerson: string;
  altContactNo: string;
}

export interface ClientDetail {
  user: AdminUser;
  pickups: ClientLocation[];
  deliveries: ClientLocation[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  modifiedTime: string;
  isFolder?: boolean;
}

export function emptyLocation(): ClientLocationInput {
  return {
    label: '',
    address: '',
    pincode: '',
    contactNo: '',
    email: '',
    contactPerson: '',
    altContactPerson: '',
    altContactNo: '',
  };
}

export function formatBytes(n: number): string {
  if (!n) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
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
