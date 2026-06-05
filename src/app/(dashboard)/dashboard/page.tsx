'use client';

import { useDashboardUser } from '@/components/dashboard/DashboardContext';

const STATS = [
  { label: 'Total Shipments', value: '—' },
  { label: 'In Transit', value: '—' },
  { label: 'Delivered', value: '—' },
  { label: 'Pending Pickup', value: '—' },
];

function PackageIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

export default function DashboardOverview() {
  const user = useDashboardUser();
  const firstName = (user.name || user.email).split(' ')[0];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">
          Welcome back, {firstName}
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s an overview of your account. More features are on the way.
        </p>
      </div>

      {/* Stat cards (placeholder data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="text-3xl font-bold text-brand-dark mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent shipments + account */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 sm:mt-6">
        {/* Recent shipments — empty state */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-dark">Recent shipments</h2>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
              Coming soon
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center py-10 sm:py-14">
            <PackageIcon />
            <p className="text-brand-dark font-medium mt-4">No shipments yet</p>
            <p className="text-gray-400 text-sm mt-1 max-w-xs">
              Once you start creating shipments, they&apos;ll appear here for quick access.
            </p>
          </div>
        </div>

        {/* Account card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-brand-dark">Account</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Name</dt>
              <dd className="text-brand-dark font-medium">{user.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Email</dt>
              <dd className="text-brand-dark font-medium break-all">{user.email}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Role</dt>
              <dd className="text-brand-dark font-medium capitalize">{user.role}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
