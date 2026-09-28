'use client';

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

// HorizontalScrollArea wraps a wide table in a horizontally scrolling area and,
// when the table is wider than the area, adds a sticky scroll control above it.
// The table's own scrollbar sits below every row, out of reach while someone
// scans a long list; the control keeps the columns reachable from the top.
//
// Three decisions, each fixing a real problem:
//
// - The control owns the scroll position. When that state lived in the page,
//   every scroll event re-rendered the whole table — about 80 ms a step with
//   316 shipments — so even plain trackpad scrolling stuttered. The table
//   arrives as `children`, an element the page created, so a re-render here
//   leaves it alone.
//
// - It measures in a LAYOUT effect, once before observing, so the control is
//   there on the first frame. Waiting for the ResizeObserver painted the table
//   first and then pushed it down 49px, on every load and filter change. The
//   scroll area is this component's own child, so its ref is attached by the
//   time the effect runs; a sibling component's ref would not be.
//
// - The control sits at z-[1]: above the table rows (which are not positioned)
//   and below the page's dropdown panels (z-20) and their click-outside
//   backdrops (z-10). At z-20 it painted over the Status and Columns menus
//   wherever they reached the table, and clicks landed on the control.
export default function HorizontalScrollArea({
  id,
  label,
  children,
}: {
  // id of the scrolling element, for the control's aria-controls.
  id: string;
  label: string;
  children: ReactNode;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      setContentWidth(viewport.scrollWidth);
      setViewportWidth(viewport.clientWidth);
      setScrollLeft(viewport.scrollLeft);
    };
    const onScroll = () => setScrollLeft(viewport.scrollLeft);

    measure();
    // The area's size changes with the window; the table's size changes when
    // columns are shown, hidden or reordered.
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    viewport.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      viewport.removeEventListener('scroll', onScroll);
    };
  }, []);

  const maxScroll = Math.max(0, contentWidth - viewportWidth);

  function scrollByStep(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollLeft += direction * Math.min(320, viewportWidth * 0.7);
  }

  return (
    <>
      {maxScroll > 1 ? (
        <div className="table-scroll-control sticky top-16 z-[1] flex items-center gap-3 rounded-t-xl border-b border-gray-200 bg-white px-4 py-2">
          <span className="hidden shrink-0 text-xs font-medium text-gray-500 sm:inline">Scroll table</span>
          <button
            type="button"
            aria-label="Scroll columns left"
            onClick={() => scrollByStep(-1)}
            disabled={scrollLeft <= 1}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-brand-gray transition-colors hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-brand-gray"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="m12 5-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={maxScroll}
            step="any"
            value={Math.min(scrollLeft, maxScroll)}
            onChange={(event) => {
              const viewport = viewportRef.current;
              if (viewport) viewport.scrollLeft = Number(event.currentTarget.value);
            }}
            aria-label={label}
            aria-controls={id}
            className="shipment-scroll-range min-w-0 flex-1"
          />
          <button
            type="button"
            aria-label="Scroll columns right"
            onClick={() => scrollByStep(1)}
            disabled={scrollLeft >= maxScroll - 1}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-brand-gray transition-colors hover:border-brand-orange hover:text-brand-orange disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-gray-300 disabled:hover:text-brand-gray"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
              <path d="m8 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : null}
      <div id={id} ref={viewportRef} className="shipments-horizontal-scroll overflow-x-auto rounded-xl">
        {children}
      </div>
    </>
  );
}
