'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDate, type AdminUser } from '@/lib/admin';
import BrandLoader from '@/components/BrandLoader';

function initials(name: string, email: string): string {
  const base = (name || email || '?').trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

type Tab = 'all' | 'clients' | 'admins';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setUsers(d as AdminUser[]))
      .catch(() => setUsers([]));
  }, []);

  const counts = useMemo(() => {
    const c = { all: users?.length ?? 0, clients: 0, admins: 0 };
    (users ?? []).forEach((u) => (u.role === 'admin' ? c.admins++ : c.clients++));
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (tab === 'clients' && u.role !== 'user') return false;
      if (tab === 'admins' && u.role !== 'admin') return false;
      if (!needle) return true;
      return [u.name, u.email, u.clientCode, u.businessName].some((v) => (v || '').toLowerCase().includes(needle));
    });
  }, [users, tab, q]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Users &amp; clients</h1>
          <p className="text-gray-500 mt-1">Onboard and manage client accounts, profiles, locations, and documents.</p>
        </div>
        <Link href="/admin/users/new" className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors whitespace-nowrap">
          + Onboard client
        </Link>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 text-sm">
          {(['all', 'clients', 'admins'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-md font-semibold capitalize transition-colors ${tab === t ? 'bg-brand-purple text-white' : 'text-brand-gray hover:text-brand-dark'}`}
            >
              {t} <span className={tab === t ? 'text-white/70' : 'text-gray-400'}>({counts[t]})</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, code…"
            className="w-full pl-9 pr-3 h-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          />
        </div>
      </div>

      <div className="mt-4">
        {users === null ? (
          <BrandLoader variant="section" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-14 text-sm">No matching accounts.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-4 py-3 font-medium">Account</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Client code</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">Created</th>
                      <th className="px-4 py-3 font-medium text-right" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-brand-light-gray text-brand-purple font-semibold text-xs flex items-center justify-center shrink-0">
                              {initials(u.name, u.email)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-brand-dark truncate">{u.name || '—'}</p>
                              <p className="text-gray-400 text-xs truncate">{u.businessName || u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-brand-purple text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {u.role === 'admin' ? 'Admin' : 'Client'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.clientCode || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Link href={`/admin/users/${u.id}`} className="text-sm font-semibold text-brand-orange hover:text-brand-coral transition-colors">
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
