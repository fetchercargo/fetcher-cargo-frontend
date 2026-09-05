import Link from 'next/link';

interface SettingCard {
  title: string;
  description: string;
  href: string;
}

const CARDS: SettingCard[] = [
  {
    title: 'Status Config',
    description: 'Add, rename, recolor, reorder, and activate shipment statuses used across bookings, the admin panel, and customer tracking.',
    href: '/admin/settings/statuses',
  },
  {
    title: 'Pickup Statuses',
    description: 'The statuses a pickup request moves through while ops schedule and run the collection.',
    href: '/admin/settings/pickup-statuses',
  },
  {
    title: 'Reference Fields',
    description: 'Extra fields on every shipment — reference numbers, internal notes. Choose which ones clients can see.',
    href: '/admin/settings/fields',
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Settings</h1>
        <p className="text-gray-500 mt-1">Configure how Fetcher Cargo behaves.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group block rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-orange hover:shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-brand-dark">{c.title}</h2>
              <span className="text-gray-300 group-hover:text-brand-orange transition-colors" aria-hidden>
                →
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
