'use client';

import { useState } from 'react';
import type { TrackingUpdate } from '@/lib/types';

export default function Timeline({ updates, awb }: { updates: TrackingUpdate[]; awb: string }) {
  const [expanded, setExpanded] = useState(false);
  const filteredUpdates = updates.filter((u) => u.text && u.text.trim());

  if (filteredUpdates.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-brand-link hover:underline font-medium text-sm flex items-center gap-1"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        >
          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {expanded ? 'Hide updates' : 'See all updates here'}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-100">
          <p className="text-brand-dark font-semibold text-lg">Delivery by Fetcher</p>
          <p className="text-gray-500 text-sm mt-1">Tracking ID : {awb}</p>

          <div className="relative mt-6 pl-6 sm:pl-8 border-l-2 border-gray-200 space-y-4 sm:space-y-6">
            {filteredUpdates.map((update, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[19px] sm:-left-[25px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                <div className="text-sm text-gray-500">
                  {update.date}{update.time ? ` ${update.time}` : ''}
                </div>
                <div className="text-base text-gray-900 font-medium mt-0.5">
                  {update.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
