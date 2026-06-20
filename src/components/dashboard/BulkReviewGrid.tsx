'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BrandDots } from '@/components/BrandLoader';
import { isOda, type PincodeLookup } from '@/lib/pincode';
import { INDIAN_STATES } from '@/lib/states';
import {
  COLUMNS,
  MAX_PARCELS,
  computeRowErrors,
  dgFromRow,
  emptyParcel,
  parcelFieldKey,
  parcelTotals,
  titleCase,
  type AllowedValues,
  type BulkValidateResponse,
  type ColumnDef,
  type DgValue,
  type ParcelInput,
  type ShipmentInput,
  type ShipmentSummary,
} from '@/lib/bulk';
import type { ClientOption } from '@/lib/admin';

const PAGE_SIZE = 50;

const EMPTY_ALLOWED: AllowedValues = { scopes: [], types: [], modes: [], categories: [], dg: [] };

interface GridRow {
  rowNumber: number;
  input: ShipmentInput;
  dg: DgValue;
  errors: { field: string; message: string }[];
}

// A render slot is either one of the flat COLUMNS or the dedicated parcels cell.
// The parcels slot is inserted right after the pickup block.
type Slot = { kind: 'col'; col: ColumnDef } | { kind: 'parcels' };

const SLOTS: Slot[] = (() => {
  const out: Slot[] = [];
  for (const col of COLUMNS) {
    out.push({ kind: 'col', col });
    if (col.key === 'pickupAltContactNo') out.push({ kind: 'parcels' });
  }
  return out;
})();

function colWidth(col: ColumnDef): string {
  if (col.wide) return 'min-w-[240px]';
  if (col.kind === 'number') return 'min-w-[100px]';
  return 'min-w-[150px]';
}

// seedParcels returns the row's parcels, falling back to a single parcel derived
// from the legacy flat totals if the server somehow sent none.
function seedParcels(input: ShipmentInput): ParcelInput[] {
  if (Array.isArray(input.parcels) && input.parcels.length > 0) {
    return input.parcels.map((p) => ({ noOfPieces: Number(p.noOfPieces) || 0, weightKg: Number(p.weightKg) || 0, dimensions: p.dimensions ?? '' }));
  }
  return [{ noOfPieces: Number(input.noOfPieces) || 1, weightKg: Number(input.weightKg) || 0, dimensions: input.dimensions ?? '' }];
}

// withParcels sets the parcels and keeps the derived totals in sync.
function withParcels(input: ShipmentInput, parcels: ParcelInput[]): ShipmentInput {
  return { ...input, parcels, ...parcelTotals(parcels) };
}

export default function BulkReviewGrid({
  response,
  onCreated,
  onCancel,
  createUrl = '/api/shipments/bulk',
  clients,
}: {
  response: BulkValidateResponse;
  onCreated: (created: ShipmentSummary[], batchNo: string) => void;
  onCancel: () => void;
  // Admin mode: when set, a required "book on behalf of" client picker is shown
  // and the chosen clientCode is sent with the create to createUrl.
  createUrl?: string;
  clients?: ClientOption[];
}) {
  const allowed = response.allowedValues ?? EMPTY_ALLOWED;

  const [rows, setRows] = useState<GridRow[]>(() =>
    response.rows.map((rv) => {
      const dg = dgFromRow(rv);
      const input = withParcels({ ...rv.input }, seedParcels(rv.input));
      return {
        rowNumber: rv.rowNumber,
        input,
        dg,
        errors: computeRowErrors(input, dg, allowed),
      };
    }),
  );
  const [page, setPage] = useState(0);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [clientCode, setClientCode] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  // In admin mode, require the typed code to match a real client before create.
  const clientValid = !clients || clients.some((c) => c.clientCode === clientCode);

  const totalErrors = useMemo(() => rows.reduce((n, r) => n + r.errors.length, 0), [rows]);
  const rowsWithErrors = useMemo(() => rows.filter((r) => r.errors.length > 0).length, [rows]);

  // Soft, non-blocking serviceability hints: batch-check every distinct domestic
  // pincode in the grid and flag cells that aren't covered (or are ODA).
  const [serviceability, setServiceability] = useState<Record<string, PincodeLookup>>({});
  const domesticPincodes = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if ((r.input.scope || '').trim().toUpperCase() !== 'DOMESTIC') continue;
      for (const v of [r.input.pickupPincode, r.input.deliveryPincode]) {
        const p = String(v ?? '').trim();
        if (p.length >= 6) set.add(p);
      }
    }
    return Array.from(set).sort();
  }, [rows]);

  useEffect(() => {
    if (domesticPincodes.length === 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      fetch('/api/serviceability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincodes: domesticPincodes }),
      })
        .then((r) => (r.ok ? r.json() : {}))
        .then((d) => {
          if (!cancelled) setServiceability((d ?? {}) as Record<string, PincodeLookup>);
        })
        .catch(() => {});
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [domesticPincodes]);

  function pincodeWarning(row: GridRow, key: 'pickupPincode' | 'deliveryPincode'): string | null {
    if ((row.input.scope || '').trim().toUpperCase() !== 'DOMESTIC') return null;
    const p = String(row.input[key] ?? '').trim();
    if (p.length < 6) return null;
    const lk = serviceability[p];
    if (!lk) return null;
    const leg = key === 'pickupPincode' ? 'pickup' : 'delivery';
    const covered = leg === 'pickup' ? lk.anyPickup : lk.anyDeliver;
    const oda = (lk.results ?? []).some((r) => isOda(r.odaCategory));
    if (covered && !oda) return null;
    return covered ? 'Serviceable but ODA — may add time/charges' : `Not serviceable for ${leg}`;
  }

  const visible = errorsOnly ? rows.filter((r) => r.errors.length > 0) : rows;
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRows = visible.slice(clampedPage * PAGE_SIZE, clampedPage * PAGE_SIZE + PAGE_SIZE);

  function setField(rowNumber: number, key: keyof ShipmentInput, value: string | number | boolean) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const input = { ...r.input, [key]: value } as ShipmentInput;
        return { ...r, input, errors: computeRowErrors(input, r.dg, allowed) };
      }),
    );
  }

  function setDg(rowNumber: number, dg: DgValue) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const input = { ...r.input, isDg: dg === 'Yes' };
        return { ...r, dg, input, errors: computeRowErrors(input, dg, allowed) };
      }),
    );
  }

  function setParcels(rowNumber: number, parcels: ParcelInput[]) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        const input = withParcels(r.input, parcels);
        return { ...r, input, errors: computeRowErrors(input, r.dg, allowed) };
      }),
    );
  }

  function toggleExpanded(rowNumber: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  async function handleCreate() {
    if (totalErrors > 0 || rows.length === 0 || !clientValid) return;
    setSubmitting(true);
    setBanner(null);
    try {
      const payloadRows = rows.map((r) => r.input);
      const res = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clients ? { clientCode, rows: payloadRows } : { rows: payloadRows }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        onCreated((data.created ?? []) as ShipmentSummary[], (data.batchNo ?? '') as string);
        return;
      }
      if (res.status === 422 && Array.isArray(data.rows)) {
        // Drift guard: re-run the client checks (same rules) and surface them.
        setRows((prev) => prev.map((r) => ({ ...r, errors: computeRowErrors(r.input, r.dg, allowed) })));
        setErrorsOnly(true);
        setPage(0);
        setBanner(data.error || 'Some rows still need fixing.');
        return;
      }
      setBanner(data.error || 'Could not create the shipments. Please try again.');
    } catch {
      setBanner('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderCell(row: GridRow, col: ColumnDef) {
    const errMsg = row.errors.find((e) => e.field === col.key)?.message;
    const invalid = !!errMsg;
    const cls = `w-full px-2 py-1.5 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-brand-orange/40 ${
      invalid ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-200'
    }`;

    if (col.kind === 'enum' && col.allowedKey) {
      const opts = allowed[col.allowedKey];
      const current = String(row.input[col.key] ?? '').trim().toUpperCase();
      const valid = opts.includes(current);
      return (
        <select title={errMsg} value={valid ? current : ''} onChange={(e) => setField(row.rowNumber, col.key, e.target.value)} className={cls}>
          <option value="" disabled>
            Select…
          </option>
          {opts.map((v) => (
            <option key={v} value={v}>
              {titleCase(v)}
            </option>
          ))}
        </select>
      );
    }

    if (col.kind === 'dgbool') {
      return (
        <select title={errMsg} value={row.dg} onChange={(e) => setDg(row.rowNumber, e.target.value as DgValue)} className={cls}>
          <option value="" disabled>
            Select…
          </option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      );
    }

    if (col.kind === 'state') {
      const current = String(row.input[col.key] ?? '');
      const known = INDIAN_STATES.includes(current);
      return (
        <select title={errMsg} value={known ? current : ''} onChange={(e) => setField(row.rowNumber, col.key, e.target.value)} className={cls}>
          <option value="">Select…</option>
          {/* Preserve an unrecognized uploaded value so it isn't silently dropped. */}
          {!known && current !== '' && <option value={current}>{current} (unrecognized)</option>}
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      );
    }

    const warn = col.key === 'pickupPincode' || col.key === 'deliveryPincode' ? pincodeWarning(row, col.key) : null;
    return (
      <div>
        <input
          type="text"
          title={errMsg}
          value={String(row.input[col.key] ?? '')}
          onChange={(e) => setField(row.rowNumber, col.key, e.target.value)}
          className={cls}
        />
        {warn && (
          <p className="flex items-center gap-1 text-[11px] text-amber-700 mt-1" title={warn}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
            <span className="truncate">{warn}</span>
          </p>
        )}
      </div>
    );
  }

  // The parcels summary cell: count + totals + an expand toggle. Turns red when
  // any parcel sub-field (or the count) is invalid.
  function renderParcelsCell(row: GridRow) {
    const parcels = row.input.parcels ?? [];
    const totals = parcelTotals(parcels);
    const hasError = row.errors.some((e) => e.field === 'parcels' || e.field.startsWith('parcel:'));
    const open = expanded.has(row.rowNumber);
    return (
      <button
        type="button"
        onClick={() => toggleExpanded(row.rowNumber)}
        title={hasError ? 'Some parcels need fixing' : 'Edit parcels'}
        className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded border transition-colors ${
          hasError ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
        }`}
      >
        <span className="truncate">
          {parcels.length} parcel{parcels.length === 1 ? '' : 's'} · {totals.noOfPieces} pcs
          {totals.weightKg ? ` · ${+totals.weightKg.toFixed(3)} kg` : ''}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    );
  }

  const colCount = SLOTS.length + 2; // # + REF + slots

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          {totalErrors > 0 ? (
            <p className="text-sm font-medium text-red-600">
              {totalErrors} error{totalErrors === 1 ? '' : 's'} in {rowsWithErrors} row{rowsWithErrors === 1 ? '' : 's'} — fix all to continue.
            </p>
          ) : (
            <p className="text-sm font-medium text-green-700">
              {rows.length} row{rows.length === 1 ? '' : 's'} ready to create.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {clients && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Book on behalf of <span className="text-red-500">*</span></label>
              <input
                list="bulk-client-codes"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                placeholder="Search client code…"
                className="h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
              <datalist id="bulk-client-codes">
                {clients.map((c) => (
                  <option key={c.clientCode} value={c.clientCode}>{c.name} ({c.email})</option>
                ))}
              </datalist>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={errorsOnly}
              onChange={(e) => {
                setErrorsOnly(e.target.checked);
                setPage(0);
              }}
              className="accent-brand-orange"
            />
            Show errors only
          </label>
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={totalErrors > 0 || submitting || rows.length === 0 || !clientValid}
            onClick={handleCreate}
            className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <span className="inline-flex items-center gap-2"><BrandDots /> Creating…</span> : `Create ${rows.length} shipment${rows.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>

      {banner && <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">{banner}</div>}

      {/* Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="sticky left-0 z-20 bg-gray-50 w-14 px-3 py-2 font-medium border-b border-gray-200">#</th>
                <th className="sticky left-14 z-20 bg-gray-50 px-2 py-2 font-medium border-b border-r border-gray-200">REF</th>
                {SLOTS.map((slot, i) =>
                  slot.kind === 'parcels' ? (
                    <th key={`parcels-${i}`} className="px-2 py-2 font-medium border-b border-gray-200 min-w-[200px]">
                      Parcels<span className="text-red-500"> *</span>
                    </th>
                  ) : (
                    <th key={slot.col.key} className={`px-2 py-2 font-medium border-b border-gray-200 ${colWidth(slot.col)}`}>
                      {slot.col.label}
                      {slot.col.required && <span className="text-red-500"> *</span>}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-10 text-center text-gray-400 border-b border-gray-100">
                    No rows with errors — everything looks good.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <ReviewRow
                    key={row.rowNumber}
                    row={row}
                    open={expanded.has(row.rowNumber)}
                    colCount={colCount}
                    onRefChange={(v) => setField(row.rowNumber, 'customerRef', v)}
                    onParcelsChange={(p) => setParcels(row.rowNumber, p)}
                    renderCell={renderCell}
                    renderParcelsCell={renderParcelsCell}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Showing {pageRows.length} of {visible.length} {errorsOnly ? 'rows with errors' : 'rows'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={clampedPage === 0}
              onClick={() => setPage(clampedPage - 1)}
              className="px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="text-gray-600">
              Page {clampedPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={clampedPage >= totalPages - 1}
              onClick={() => setPage(clampedPage + 1)}
              className="px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ReviewRow renders one shipment row plus, when expanded, the per-parcel editor
// in a full-width sub-row beneath it.
function ReviewRow({
  row,
  open,
  colCount,
  onRefChange,
  onParcelsChange,
  renderCell,
  renderParcelsCell,
}: {
  row: GridRow;
  open: boolean;
  colCount: number;
  onRefChange: (v: string) => void;
  onParcelsChange: (parcels: ParcelInput[]) => void;
  renderCell: (row: GridRow, col: ColumnDef) => ReactNode;
  renderParcelsCell: (row: GridRow) => ReactNode;
}) {
  const rowBg = row.errors.length > 0 ? 'bg-red-50/30' : '';
  return (
    <>
      <tr className={rowBg}>
        <td className="sticky left-0 z-10 bg-white w-14 px-3 py-1.5 border-b border-gray-100 text-gray-400">{row.rowNumber}</td>
        <td className="sticky left-14 z-10 bg-white px-2 py-1.5 border-b border-r border-gray-100">
          <input
            value={String(row.input.customerRef ?? '')}
            onChange={(e) => onRefChange(e.target.value)}
            className="w-[110px] px-2 py-1.5 text-sm rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
          />
        </td>
        {SLOTS.map((slot, i) =>
          slot.kind === 'parcels' ? (
            <td key={`parcels-${i}`} className="px-2 py-1.5 border-b border-gray-100 align-top min-w-[200px]">
              {renderParcelsCell(row)}
            </td>
          ) : (
            <td key={slot.col.key} className={`px-2 py-1.5 border-b border-gray-100 align-top ${colWidth(slot.col)}`}>
              {renderCell(row, slot.col)}
            </td>
          ),
        )}
      </tr>
      {open && (
        <tr>
          <td colSpan={colCount} className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <ParcelEditor parcels={row.input.parcels ?? []} errors={row.errors} rowNumber={row.rowNumber} onChange={onParcelsChange} />
          </td>
        </tr>
      )}
    </>
  );
}

// ParcelEditor is the inline per-parcel editor: a compact list of 1..MAX_PARCELS
// parcels, each with pieces/weight/dimensions, plus add/remove. Invalid pieces/
// weight cells are highlighted using the row's per-parcel error keys.
function ParcelEditor({
  parcels,
  errors,
  rowNumber,
  onChange,
}: {
  parcels: ParcelInput[];
  errors: { field: string; message: string }[];
  rowNumber: number;
  onChange: (parcels: ParcelInput[]) => void;
}) {
  const errOf = (i: number, sub: 'noOfPieces' | 'weightKg') => errors.find((e) => e.field === parcelFieldKey(i, sub))?.message;

  function update(i: number, key: keyof ParcelInput, value: string) {
    const next = parcels.map((p, idx) => {
      if (idx !== i) return p;
      if (key === 'dimensions') return { ...p, dimensions: value };
      const n = Number(value);
      return { ...p, [key]: value === '' || Number.isNaN(n) ? 0 : n };
    });
    onChange(next);
  }
  function add() {
    if (parcels.length < MAX_PARCELS) onChange([...parcels, emptyParcel()]);
  }
  function remove(i: number) {
    if (parcels.length > 1) onChange(parcels.filter((_, idx) => idx !== i));
  }

  const totals = parcelTotals(parcels);
  const cell = (invalid: boolean) =>
    `w-full px-2 py-1.5 text-sm rounded border focus:outline-none focus:ring-2 focus:ring-brand-orange/40 ${
      invalid ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-200'
    }`;

  return (
    <div className="max-w-3xl">
      <div className="text-xs font-semibold text-brand-gray mb-2">
        Parcels for row {rowNumber} — pieces &amp; weight are required per parcel.
      </div>
      <div className="space-y-2">
        {parcels.map((p, i) => {
          const piecesErr = errOf(i, 'noOfPieces');
          const weightErr = errOf(i, 'weightKg');
          return (
            <div key={i} className="flex items-end gap-2">
              <span className="text-xs font-semibold text-gray-400 w-14 pb-2 flex-shrink-0">P{i + 1}</span>
              <label className="flex flex-col gap-1 w-24">
                <span className="text-[11px] text-gray-500">Pieces *</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  title={piecesErr}
                  value={Number(p.noOfPieces)}
                  onChange={(e) => update(i, 'noOfPieces', e.target.value)}
                  className={cell(!!piecesErr)}
                />
              </label>
              <label className="flex flex-col gap-1 w-28">
                <span className="text-[11px] text-gray-500">Weight (kg) *</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  title={weightErr}
                  value={Number(p.weightKg)}
                  onChange={(e) => update(i, 'weightKg', e.target.value)}
                  className={cell(!!weightErr)}
                />
              </label>
              <label className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <span className="text-[11px] text-gray-500">Dimensions (cm)</span>
                <input
                  type="text"
                  placeholder="30x20x15"
                  value={p.dimensions ?? ''}
                  onChange={(e) => update(i, 'dimensions', e.target.value)}
                  className={cell(false)}
                />
              </label>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={parcels.length <= 1}
                title={parcels.length <= 1 ? 'A shipment needs at least one parcel' : 'Remove parcel'}
                className="mb-1.5 p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Remove parcel"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-3">
        <button
          type="button"
          onClick={add}
          disabled={parcels.length >= MAX_PARCELS}
          className="text-sm font-semibold text-brand-orange hover:text-brand-coral disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add parcel{parcels.length >= MAX_PARCELS ? ` (max ${MAX_PARCELS})` : ''}
        </button>
        <span className="text-xs text-gray-500">
          Total: {totals.noOfPieces} pcs{totals.weightKg ? ` · ${+totals.weightKg.toFixed(3)} kg` : ''}
        </span>
      </div>
    </div>
  );
}
