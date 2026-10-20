'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { shipmentDocUrl, type ShipmentDocKind } from '@/lib/shipmentDocuments';

// Height of the open menu plus a margin: when less room than this is left
// below the button, the menu opens upwards instead.
const MENU_ROOM = 128;

const itemCls = 'flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap';
const onCls = `${itemCls} text-brand-dark hover:bg-orange-50 hover:text-brand-orange`;
const offCls = `${itemCls} text-gray-300 cursor-not-allowed`;

/**
 * One row's Actions menu in the client Shipments table: Print Label, Download
 * POD and Download LR, each greyed out with the reason when unavailable.
 *
 * The panel is position: fixed, so the table's horizontal scroll area cannot
 * clip it; any scroll or resize closes it before it drifts from its button.
 * It is a plain list of links (a disclosure, not an ARIA menu), and it stays
 * next to the button in the DOM, so Tab moves straight into it.
 * Clicks stop at the wrapper, so using the menu never opens the row.
 * Tabbing out closes it. A click elsewhere is left to the backdrop: closing
 * on that blur would remove the backdrop mid-click, and the click would then
 * land on the row.
 */
export default function ShipmentActionsMenu({ shipmentId, hasAwb, hasPod, hasLr }: {
  shipmentId: number;
  hasAwb: boolean;
  hasPod: boolean;
  hasLr: boolean;
}) {
  const [panel, setPanel] = useState<CSSProperties | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const open = panel !== null;
  const close = () => setPanel(null);

  useEffect(() => {
    if (!open) return;
    const dismiss = () => setPanel(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setPanel(null);
      button.current?.focus();
    };
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function toggle() {
    const r = button.current?.getBoundingClientRect();
    if (open || !r) {
      close();
      return;
    }
    // At least 8px inside the screen, even when the button is partly scrolled out of view.
    const right = Math.max(8, window.innerWidth - r.right);
    const upwards = window.innerHeight - r.bottom < MENU_ROOM && r.top > MENU_ROOM;
    setPanel(upwards ? { right, bottom: window.innerHeight - r.top + 4 } : { right, top: r.bottom + 4 });
  }

  const docs: { kind: ShipmentDocKind; available: boolean }[] = [
    { kind: 'POD', available: hasPod },
    { kind: 'LR', available: hasLr },
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) close();
      }}
    >
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors ${
          open ? 'border-brand-orange text-brand-orange' : 'border-gray-300 text-brand-dark hover:border-brand-orange hover:text-brand-orange'
        }`}
      >
        Actions
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {panel && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} aria-hidden="true" />
          <div id={menuId} style={panel} className="fixed z-20 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-1 text-left">
            {hasAwb ? (
              <Link href={`/dashboard/shipments/${shipmentId}#labels`} onClick={close} className={onCls}>
                <PrinterIcon />
                Print Label
              </Link>
            ) : (
              <span className={offCls}>
                <PrinterIcon />
                Print Label
                <span className="ml-auto text-xs">Needs an AWB</span>
              </span>
            )}
            {docs.map(({ kind, available }) =>
              available ? (
                <a key={kind} href={shipmentDocUrl('client', shipmentId, kind, true)} download onClick={close} className={onCls}>
                  <DownloadIcon />
                  Download {kind}
                </a>
              ) : (
                <span key={kind} className={offCls}>
                  <DownloadIcon />
                  Download {kind}
                  <span className="ml-auto text-xs">Not available yet</span>
                </span>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PrinterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
