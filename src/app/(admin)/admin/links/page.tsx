import type { FC } from 'react';

// Quick-launch links to the team's external Google tools. Each card opens the
// target in a new tab. Update the URLs here if a sheet/folder is ever recreated.
const DRIVE_URL = 'https://drive.google.com/drive/folders/1sHHmP7woZELac0c-WDKhUqo6Niw4QC3o';
const BOOKING_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1YYcBE6RF6qpUNF7Hr-KJx6IYMS3dEci9qaJu6jEAkuU/edit';
const TRACKING_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1gbY642V26yIgxv3iFjm1nSRsD5CeJ3UX0keb8lxPG8g/edit';

// Official Google Drive mark (tri-color triangle).
const DriveLogo: FC = () => (
  <svg viewBox="0 0 87.3 78" width="28" height="28" aria-hidden="true">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47" />
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.798l5.852 11.5z" fill="#ea4335" />
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
    <path d="m59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
  </svg>
);

// Google Sheets-style mark (green sheet with a table).
const SheetLogo: FC = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <rect x="3.5" y="2" width="17" height="20" rx="2.5" fill="#0F9D58" />
    <rect x="7" y="6.5" width="10" height="11" rx="1" fill="#fff" />
    <g stroke="#0F9D58" strokeWidth="1.3">
      <path d="M7 10.3h10M7 14h10M12 6.5v11" />
    </g>
  </svg>
);

const ArrowIcon: FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 17 17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

interface LinkCard {
  logo: 'drive' | 'sheet';
  category: string;
  title: string;
  desc: string;
  href: string;
  chip: string; // logo-chip background
  tag?: { label: string; cls: string };
}

const CARDS: LinkCard[] = [
  {
    logo: 'drive',
    category: 'Google Drive',
    title: 'Documents & Billing',
    desc: 'Client billing invoices and document folders, organised by client code.',
    href: DRIVE_URL,
    chip: 'bg-blue-50',
  },
  {
    logo: 'sheet',
    category: 'Google Sheets',
    title: 'Booking Sheet',
    desc: 'FETCHER B2B BOOKING — website bookings pulled in for the ops team.',
    href: BOOKING_SHEET_URL,
    chip: 'bg-green-50',
    tag: { label: 'FETCHER B2B BOOKING', cls: 'bg-orange-50 text-brand-orange' },
  },
  {
    logo: 'sheet',
    category: 'Google Sheets',
    title: 'Tracking Sheet',
    desc: 'FETCHER B2B TRACKING — ops enter status updates that sync to the website.',
    href: TRACKING_SHEET_URL,
    chip: 'bg-green-50',
    tag: { label: 'FETCHER B2B TRACKING', cls: 'bg-purple-100 text-brand-purple' },
  },
];

export default function AdminLinksPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Links</h1>
        <p className="text-gray-500 mt-1">Quick access to the team&rsquo;s Google tools — each opens in a new tab.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <a
            key={c.title}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${c.title} in a new tab`}
            className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand-orange hover:shadow-[0_14px_30px_-14px_rgba(240,140,42,0.45)]"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.chip} transition-transform duration-200 group-hover:scale-105`}>
                {c.logo === 'drive' ? <DriveLogo /> : <SheetLogo />}
              </div>
              <span className="text-gray-300 transition-all duration-200 group-hover:text-brand-orange group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowIcon />
              </span>
            </div>

            <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{c.category}</p>
            <h2 className="mt-0.5 text-lg font-bold text-brand-dark">{c.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500 flex-1">{c.desc}</p>

            <div className="mt-4 flex items-center justify-between">
              {c.tag ? (
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${c.tag.cls}`}>{c.tag.label}</span>
              ) : (
                <span />
              )}
              <span className="text-sm font-semibold text-brand-gray transition-colors group-hover:text-brand-orange">Open</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
