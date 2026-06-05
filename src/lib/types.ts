// Shared types for the tracking UI. These describe the shape of the data
// returned by the Go backend's /api/track endpoint; all backend logic and
// write-side types live in the Go service (../fetcher-cargo-backend).

export type ShipmentStatus =
  | 'SHIPMENT CREATED'
  | 'PICKED-UP'
  | 'IN-TRANSIT'
  | 'DELIVERED'
  | 'ISSUE/DELAYED'
  | 'CANCELLED'
  | 'RTO';

export const STATUS_STEPS: ShipmentStatus[] = [
  'SHIPMENT CREATED',
  'PICKED-UP',
  'IN-TRANSIT',
  'DELIVERED',
];

export interface TrackingUpdate {
  date: string;
  time: string;
  text: string;
  sortOrder: number;
}

export interface ShipmentTracking {
  awb: string;
  status: ShipmentStatus;
  estimatedDeliveryDate: string | null;
  mode: string | null;
  additionalInfo: string | null;
  createdDate: string | null;
  createdTime: string | null;
  updates: TrackingUpdate[];
}
