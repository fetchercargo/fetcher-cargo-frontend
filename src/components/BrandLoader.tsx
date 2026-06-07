'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const MESSAGES = [
  'Warming up the engine…',
  'Loading your cargo…',
  'Routing your shipment…',
  'Almost there…',
];

/** Three bouncing brand dots — for buttons and tiny inline loaders. Inherits the
 *  current text colour (so it's white inside coloured buttons). */
export function BrandDots({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-hidden="true">
      <span className="w-1.5 h-1.5 rounded-full bg-current fc-bob" />
      <span className="w-1.5 h-1.5 rounded-full bg-current fc-bob" style={{ animationDelay: '0.15s' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-current fc-bob" style={{ animationDelay: '0.3s' }} />
    </span>
  );
}

/** A turning end-pulley of the conveyor. */
function Roller({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className={`absolute z-30 bottom-[12px] w-8 h-8 rounded-full bg-white border-2 border-brand-purple shadow-sm grid place-items-center ${
        side === 'left' ? 'left-[2px]' : 'right-[2px]'
      }`}
    >
      <div className="relative w-[18px] h-[18px] fc-roll">
        <span className="absolute left-1/2 top-0 -translate-x-1/2 w-[3px] h-full rounded-full bg-brand-purple/55" />
        <span className="absolute top-1/2 left-0 -translate-y-1/2 h-[3px] w-full rounded-full bg-brand-purple/55" />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full bg-brand-purple" />
      </div>
    </div>
  );
}

/** A taped parcel gliding along the belt. `base` is the resting left position used
 *  when motion is reduced; the running animation overrides it otherwise. */
function Parcel({
  color,
  base,
  rideDelay,
  bobDelay,
}: {
  color: string;
  base: string;
  rideDelay: string;
  bobDelay: string;
}) {
  return (
    <div className="absolute bottom-0 w-[34px] h-[34px] fc-ride" style={{ left: base, animationDelay: rideDelay }}>
      <div
        className={`relative w-full h-full rounded-[7px] overflow-hidden shadow-md origin-bottom fc-jiggle ${color}`}
        style={{ animationDelay: bobDelay }}
      >
        {/* packing-tape cross */}
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[5px] bg-white/55" />
        <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[5px] bg-white/55" />
        {/* soft top sheen */}
        <span className="absolute inset-x-0 top-0 h-1/3 bg-white/15" />
      </div>
    </div>
  );
}

/** The hero animation: parcels riding a turning conveyor belt. */
function Conveyor() {
  return (
    <div className="relative w-[300px] max-w-full h-[92px] mx-auto" aria-hidden="true">
      {/* ground shadow */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[8px] w-[72%] h-[10px] rounded-[50%] bg-brand-dark/10 blur-[2px] z-0" />

      {/* belt */}
      <div className="absolute left-[18px] right-[18px] bottom-[21px] h-[14px] rounded-full bg-brand-purple overflow-hidden z-10">
        <div
          className="absolute inset-0 fc-belt"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 2px, transparent 2px 22px)' }}
        />
        <span className="absolute inset-x-0 top-0 h-[3px] bg-white/15" />
      </div>

      {/* end pulleys */}
      <Roller side="left" />
      <Roller side="right" />

      {/* parcels (clipped to the belt span) */}
      <div className="absolute left-[18px] right-[18px] bottom-[35px] h-[36px] overflow-hidden z-20">
        <Parcel color="bg-brand-gold" base="6%" rideDelay="0s" bobDelay="0s" />
        <Parcel color="bg-brand-coral" base="42%" rideDelay="-1s" bobDelay="-0.2s" />
        <Parcel color="bg-brand-orange" base="78%" rideDelay="-2s" bobDelay="-0.4s" />
      </div>
    </div>
  );
}

/**
 * On-brand loader. `variant="screen"` (default) is the full-page cold-start
 * loader (Render free tier naps when idle); `variant="section"` is a compact,
 * in-content version for normal page/data loads.
 */
export default function BrandLoader({
  title,
  variant = 'screen',
}: {
  title?: string;
  variant?: 'screen' | 'section';
}) {
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const m = setInterval(() => setIdx((i) => (i + 1) % MESSAGES.length), 2400);
    const e = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => {
      clearInterval(m);
      clearInterval(e);
    };
  }, []);

  const screen = variant === 'screen';

  return (
    <div
      className={
        screen
          ? 'min-h-screen w-full flex flex-col items-center justify-center bg-brand-light-gray px-6'
          : 'flex flex-col items-center justify-center py-14 px-6'
      }
    >
      <div className="w-full max-w-sm text-center">
        {screen && (
          <Image
            src="/logo.jpg"
            alt="Fetcher Cargo"
            width={1024}
            height={375}
            priority
            style={{ width: 168, maxWidth: '64%' }}
            className="h-auto mx-auto mb-8"
          />
        )}

        <Conveyor />

        <h2 className={screen ? 'text-base font-semibold text-brand-dark mt-7' : 'text-sm font-medium text-brand-gray mt-4'}>
          {title ?? MESSAGES[idx]}
        </h2>

        {screen && (
          <div className="mt-4 mx-auto w-[200px] h-1.5 rounded-full bg-gray-200/80 overflow-hidden">
            <div
              className="h-full w-1/3 rounded-full fc-shimmer"
              style={{ background: 'linear-gradient(90deg, #f3b82e, #f08c2a, #e97840)' }}
            />
          </div>
        )}

        {screen && elapsed >= 4 && (
          <p className="text-xs text-gray-400 mt-5 leading-relaxed">
            Our server takes a quick nap when it&apos;s idle and is waking up now — this can take up to a
            minute. Hang tight, your cargo is on the way!
          </p>
        )}
      </div>
    </div>
  );
}
