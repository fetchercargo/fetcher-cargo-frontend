// Shared types + client-side validation for the bulk shipment upload.
//
// The wire shapes mirror the Go DTOs (internal/model + bulk handler). The
// validation here mirrors the backend's collectFieldErrors so the review grid
// can give instant feedback; the server re-validates on create, so any drift
// can only ever over-report on the client — never let an invalid row through.

// MAX_PARCELS mirrors the backend model.MaxParcels — the hard cap per shipment.
export const MAX_PARCELS = 5;

// ParcelInput is one parcel in a booking payload (mirrors Go model.ParcelInput).
export interface ParcelInput {
  noOfPieces: number;
  weightKg: number;
  dimensions: string;
}

export interface ShipmentInput {
  scope: string;
  pickupAddress: string;
  pickupPincode: string;
  pickupContactPerson: string;
  pickupContactNo: string;
  pickupContactEmail: string;
  pickupAltContactPerson: string;
  pickupAltContactNo: string;
  // noOfPieces/weightKg/dimensions are shipment-level TOTALS, derived from parcels
  // by the server (and kept in sync client-side for display). Parcels is the
  // per-parcel breakdown (1..MAX_PARCELS) and is the source of truth on create.
  noOfPieces: number;
  weightKg: number;
  dimensions: string;
  parcels: ParcelInput[];
  deliveryAddress: string;
  deliveryPincode: string;
  deliveryContactPerson: string;
  deliveryContactNo: string;
  deliveryContactEmail: string;
  deliveryAltContactPerson: string;
  deliveryAltContactNo: string;
  shipmentType: string;
  mode: string;
  shipmentCategory: string;
  isDg: boolean;
  additionalInfo: string;
  customerRef: string;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface RowValidation {
  rowNumber: number;
  input: ShipmentInput;
  errors: FieldError[];
}

export interface AllowedValues {
  scopes: string[];
  types: string[];
  modes: string[];
  categories: string[];
  dg: string[];
}

export interface BulkValidateResponse {
  rows: RowValidation[];
  rowCount: number;
  errorCount: number;
  allowedValues: AllowedValues;
}

export interface ShipmentSummary {
  id: number;
  awb: string | null;
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

export interface BulkCreateResponse {
  created: ShipmentSummary[];
  count: number;
  batchNo: string;
}

export interface BulkCreateErrorResponse {
  error: string;
  rows: RowValidation[];
}

// DgValue is the DG cell's edit state. '' means "not chosen" (only happens when
// the uploaded value wasn't Yes/No), which is an error until the user picks one.
export type DgValue = '' | 'Yes' | 'No';

export type ColKind = 'text' | 'number' | 'enum' | 'dgbool';

export interface ColumnDef {
  key: keyof ShipmentInput;
  label: string; // template header
  kind: ColKind;
  required: boolean;
  allowedKey?: keyof AllowedValues; // for enum dropdowns
  wide?: boolean; // address/notes -> wider input
}

// COLUMNS are the editable input fields in template order (REF + row number
// are rendered separately by the grid). Labels match the template headers.
export const COLUMNS: ColumnDef[] = [
  { key: 'scope', label: 'Scope', kind: 'enum', required: true, allowedKey: 'scopes' },
  { key: 'pickupAddress', label: 'Pickup Address', kind: 'text', required: true, wide: true },
  { key: 'pickupPincode', label: 'Pickup Pincode/ZIP', kind: 'text', required: true },
  { key: 'pickupContactPerson', label: 'Pickup Contact Person', kind: 'text', required: false },
  { key: 'pickupContactNo', label: 'Pickup Contact No', kind: 'text', required: true },
  { key: 'pickupContactEmail', label: 'Pickup Contact Email', kind: 'text', required: false },
  { key: 'pickupAltContactPerson', label: 'Pickup Alternate Contact Person', kind: 'text', required: false },
  { key: 'pickupAltContactNo', label: 'Pickup Alternate Contact No', kind: 'text', required: false },
  // Parcels (pieces/weight/dimensions per parcel) are edited in a dedicated
  // expandable editor rendered by the grid, not as flat COLUMNS cells.
  { key: 'deliveryAddress', label: 'Delivery Address', kind: 'text', required: true, wide: true },
  { key: 'deliveryPincode', label: 'Delivery Pincode/ZIP', kind: 'text', required: true },
  { key: 'deliveryContactNo', label: 'Delivery Contact No', kind: 'text', required: true },
  { key: 'deliveryContactPerson', label: 'Delivery Contact Person', kind: 'text', required: false },
  { key: 'deliveryContactEmail', label: 'Delivery Contact Email', kind: 'text', required: false },
  { key: 'deliveryAltContactPerson', label: 'Delivery Alternate Contact Person', kind: 'text', required: false },
  { key: 'deliveryAltContactNo', label: 'Delivery Alternate Contact No', kind: 'text', required: false },
  { key: 'shipmentType', label: 'Shipment Type', kind: 'enum', required: true, allowedKey: 'types' },
  { key: 'mode', label: 'Mode', kind: 'enum', required: true, allowedKey: 'modes' },
  { key: 'shipmentCategory', label: 'Shipment Catagory', kind: 'enum', required: true, allowedKey: 'categories' },
  { key: 'isDg', label: 'DG Shipment?', kind: 'dgbool', required: false, allowedKey: 'dg' },
  { key: 'additionalInfo', label: 'Additional Information', kind: 'text', required: false, wide: true },
];

// titleCase converts a canonical enum value ("NON-DOC") to a label ("Non-Doc").
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/[-\s]/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join('-');
}

function inSet(v: string, set: string[]): boolean {
  return set.includes(String(v ?? '').trim().toUpperCase());
}

// validateRow mirrors the backend collectFieldErrors (every non-DG rule). It
// does NOT check DG — see computeRowErrors, which layers the DG rule on top.
export function validateRow(input: ShipmentInput, allowed: AllowedValues): FieldError[] {
  const errs: FieldError[] = [];

  const required: [keyof ShipmentInput, string][] = [
    ['pickupAddress', 'Pickup address is required'],
    ['pickupPincode', 'Pickup pincode is required'],
    ['pickupContactNo', 'Pickup contact number is required'],
    ['deliveryAddress', 'Delivery address is required'],
    ['deliveryPincode', 'Delivery pincode is required'],
    ['deliveryContactNo', 'Delivery contact number is required'],
  ];
  for (const [k, msg] of required) {
    if (String(input[k] ?? '').trim() === '') errs.push({ field: k, message: msg });
  }

  if (!inSet(input.scope, allowed.scopes)) errs.push({ field: 'scope', message: 'Please select a valid scope' });
  if (!inSet(input.shipmentType, allowed.types)) errs.push({ field: 'shipmentType', message: 'Please select a valid shipment type' });
  if (!inSet(input.mode, allowed.modes)) errs.push({ field: 'mode', message: 'Please select a valid mode' });
  if (!inSet(input.shipmentCategory, allowed.categories)) errs.push({ field: 'shipmentCategory', message: 'Please select a valid shipment category' });

  errs.push(...validateParcels(input.parcels ?? []));

  return errs;
}

// parcelFieldKey builds the stable error key for one parcel sub-field, so the
// grid's parcels editor can highlight the exact invalid cell.
export function parcelFieldKey(index: number, sub: 'noOfPieces' | 'weightKg'): string {
  return `parcel:${index}:${sub}`;
}

// validateParcels mirrors the backend rule set: 1..MAX_PARCELS parcels, each with
// pieces >= 1 and weight > 0. Count problems use the 'parcels' field; per-parcel
// problems use parcelFieldKey so the editor can mark the precise input.
export function validateParcels(parcels: ParcelInput[]): FieldError[] {
  const errs: FieldError[] = [];
  if (parcels.length < 1) {
    errs.push({ field: 'parcels', message: 'At least one parcel is required' });
    return errs;
  }
  if (parcels.length > MAX_PARCELS) {
    errs.push({ field: 'parcels', message: `At most ${MAX_PARCELS} parcels are allowed` });
  }
  parcels.forEach((p, i) => {
    if (!(Number(p.noOfPieces) >= 1)) errs.push({ field: parcelFieldKey(i, 'noOfPieces'), message: `Parcel ${i + 1}: number of pieces must be at least 1` });
    if (!(Number(p.weightKg) > 0)) errs.push({ field: parcelFieldKey(i, 'weightKg'), message: `Parcel ${i + 1}: weight (kg) must be greater than 0` });
  });
  return errs;
}

// parcelTotals derives the shipment-level summary the same way the server does
// (sum of pieces, sum of weight, joined non-empty dimensions). Kept in sync so
// the grid summary and the (server-recomputed) totals never disagree.
export function parcelTotals(parcels: ParcelInput[]): { noOfPieces: number; weightKg: number; dimensions: string } {
  const noOfPieces = parcels.reduce((s, p) => s + (Number(p.noOfPieces) || 0), 0);
  const weightKg = parcels.reduce((s, p) => s + (Number(p.weightKg) || 0), 0);
  const dimensions = parcels.map((p) => (p.dimensions ?? '').trim()).filter(Boolean).join('; ');
  return { noOfPieces, weightKg, dimensions };
}

// emptyParcel is a freshly-added parcel: 1 piece, weight unset (0 -> flagged
// until filled), no dimensions.
export function emptyParcel(): ParcelInput {
  return { noOfPieces: 1, weightKg: 0, dimensions: '' };
}

// computeRowErrors is the full per-row check used by the grid: all field rules
// plus DG (which must be explicitly Yes/No once flagged).
export function computeRowErrors(input: ShipmentInput, dg: DgValue, allowed: AllowedValues): FieldError[] {
  const errs = validateRow(input, allowed);
  if (dg !== 'Yes' && dg !== 'No') {
    errs.push({ field: 'isDg', message: 'DG must be Yes or No' });
  }
  return errs;
}

// dgFromRow derives the DG cell state from a server row: if the server flagged
// isDg (the uploaded value wasn't Yes/No) the cell starts blank, forcing the
// user to choose; otherwise it reflects the parsed boolean.
export function dgFromRow(rv: RowValidation): DgValue {
  if ((rv.errors ?? []).some((e) => e.field === 'isDg')) return '';
  return rv.input.isDg ? 'Yes' : 'No';
}
