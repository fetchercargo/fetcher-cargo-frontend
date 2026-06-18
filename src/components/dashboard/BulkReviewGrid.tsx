'use client';

import { useMemo, useState } from 'react';
import { BrandDots } from '@/components/BrandLoader';
import {
  COLUMNS,
  computeRowErrors,
  dgFromRow,
  titleCase,
  type AllowedValues,
  type BulkValidateResponse,
  type ColumnDef,
  type DgValue,
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

function colWidth(col: ColumnDef): string {
  if (col.wide) return 'min-w-[240px]';
  if (col.kind === 'number') return 'min-w-[100px]';
  return 'min-w-[150px]';
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
      return {
        rowNumber: rv.rowNumber,
        input: { ...rv.input },
        dg,
        errors: computeRowErrors(rv.input, dg, allowed),
      };
    }),
  );
  const [page, setPage] = useState(0);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [clientCode, setClientCode] = useState('');
  // In admin mode, require the typed code to match a real client before create.
  const clientValid = !clients || clients.some((c) => c.clientCode === clientCode);

  const totalErrors = useMemo(() => rows.reduce((n, r) => n + r.errors.length, 0), [rows]);
  const rowsWithErrors = useMemo(() => rows.filter((r) => r.errors.length > 0).length, [rows]);

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

    if (col.kind === 'number') {
      return (
        <input
          type="number"
          title={errMsg}
          value={Number(row.input[col.key])}
          min={col.key === 'noOfPieces' ? 1 : 0}
          step={col.key === 'noOfPieces' ? 1 : 'any'}
          onChange={(e) => {
            const n = Number(e.target.value);
            setField(row.rowNumber, col.key, e.target.value === '' || Number.isNaN(n) ? 0 : n);
          }}
          className={cls}
        />
      );
    }

    return (
      <input
        type="text"
        title={errMsg}
        value={String(row.input[col.key] ?? '')}
        onChange={(e) => setField(row.rowNumber, col.key, e.target.value)}
        className={cls}
      />
    );
  }

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
                {COLUMNS.map((col) => (
                  <th key={col.key} className={`px-2 py-2 font-medium border-b border-gray-200 ${colWidth(col)}`}>
                    {col.label}
                    {col.required && <span className="text-red-500"> *</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNS.length + 2} className="px-4 py-10 text-center text-gray-400 border-b border-gray-100">
                    No rows with errors — everything looks good.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <tr key={row.rowNumber} className={row.errors.length > 0 ? 'bg-red-50/30' : ''}>
                    <td className="sticky left-0 z-10 bg-white w-14 px-3 py-1.5 border-b border-gray-100 text-gray-400">{row.rowNumber}</td>
                    <td className="sticky left-14 z-10 bg-white px-2 py-1.5 border-b border-r border-gray-100">
                      <input
                        value={String(row.input.customerRef ?? '')}
                        onChange={(e) => setField(row.rowNumber, 'customerRef', e.target.value)}
                        className="w-[110px] px-2 py-1.5 text-sm rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-orange/40"
                      />
                    </td>
                    {COLUMNS.map((col) => (
                      <td key={col.key} className={`px-2 py-1.5 border-b border-gray-100 align-top ${colWidth(col)}`}>
                        {renderCell(row, col)}
                      </td>
                    ))}
                  </tr>
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
