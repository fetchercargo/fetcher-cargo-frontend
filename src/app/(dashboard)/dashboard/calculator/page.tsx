'use client';

import { useState } from 'react';

const DIVISOR = 5000;

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';
const labelCls = 'text-sm font-medium text-brand-dark';

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const fmt = (n: number) => (n > 0 ? n.toFixed(2) : '0.00');

export default function CalculatorPage() {
  const [l, setL] = useState('');
  const [b, setB] = useState('');
  const [h, setH] = useState('');
  const [pieces, setPieces] = useState('1');
  const [actual, setActual] = useState('');

  const L = num(l);
  const B = num(b);
  const H = num(h);
  const qty = Math.max(1, Math.floor(num(pieces) || 1));
  const hasDims = L > 0 && B > 0 && H > 0;

  const perPiece = (L * B * H) / DIVISOR; // kg
  const volumetric = perPiece * qty;
  const actualW = num(actual);
  const chargeable = Math.max(volumetric, actualW);
  const heavier = actualW > volumetric ? 'actual' : 'volumetric';

  function reset() {
    setL('');
    setB('');
    setH('');
    setPieces('1');
    setActual('');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Volumetric Calculator</h1>
          <p className="text-gray-500 mt-1">
            Volumetric weight = (L × B × H) ÷ {DIVISOR}, with length, breadth, and height in centimetres.
          </p>
        </div>
        <button onClick={reset} className="hidden sm:inline text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors whitespace-nowrap">
          Reset
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Inputs */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-brand-dark mb-4">Dimensions</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="len">Length (cm)</label>
              <input id="len" type="number" min="0" step="any" inputMode="decimal" className={inputCls} value={l} onChange={(e) => setL(e.target.value)} placeholder="0" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="bre">Breadth (cm)</label>
              <input id="bre" type="number" min="0" step="any" inputMode="decimal" className={inputCls} value={b} onChange={(e) => setB(e.target.value)} placeholder="0" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="hei">Height (cm)</label>
              <input id="hei" type="number" min="0" step="any" inputMode="decimal" className={inputCls} value={h} onChange={(e) => setH(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="pcs">No. of pieces</label>
              <input id="pcs" type="number" min="1" step="1" inputMode="numeric" className={inputCls} value={pieces} onChange={(e) => setPieces(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls} htmlFor="act">Actual weight (kg) <span className="text-gray-400 font-normal">— optional</span></label>
              <input id="act" type="number" min="0" step="any" inputMode="decimal" className={inputCls} value={actual} onChange={(e) => setActual(e.target.value)} placeholder="0" />
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-2 bg-brand-purple text-white rounded-xl p-5 sm:p-6 flex flex-col justify-center">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">Volumetric weight</p>
          <p className="text-4xl font-bold mt-1">
            {fmt(volumetric)} <span className="text-xl font-semibold text-white/80">kg</span>
          </p>
          {hasDims ? (
            <p className="text-white/70 text-sm mt-3 leading-relaxed">
              {L} × {B} × {H} ÷ {DIVISOR} = <span className="font-semibold text-white">{fmt(perPiece)} kg</span>
              {qty > 1 && (
                <>
                  {' '}per piece
                  <br />× {qty} pieces = <span className="font-semibold text-white">{fmt(volumetric)} kg</span>
                </>
              )}
            </p>
          ) : (
            <p className="text-white/60 text-sm mt-3">Enter all three dimensions to calculate.</p>
          )}
        </div>
      </div>

      {/* Chargeable weight */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brand-dark">Chargeable weight</h2>
            <p className="text-gray-500 text-sm mt-0.5">Carriers bill the greater of actual and volumetric weight.</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-orange">{fmt(chargeable)} kg</p>
            {chargeable > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {actualW > 0 ? `${heavier === 'actual' ? 'Actual' : 'Volumetric'} weight is higher` : 'Add an actual weight to compare'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
