'use client';

import { useEffect, useState } from 'react';
import { formatDate, type AdminUser } from '@/lib/admin';
import BrandLoader, { BrandDots } from '@/components/BrandLoader';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';
const labelCls = 'text-sm font-medium text-brand-dark';

type Panel =
  | { type: 'create' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'reset'; user: AdminUser };

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function UserPanel({ panel, onClose, onSaved }: { panel: Panel; onClose: () => void; onSaved: () => void }) {
  const u = panel.type === 'create' ? undefined : panel.user;
  const isCreate = panel.type === 'create';
  const isReset = panel.type === 'reset';

  const [email, setEmail] = useState(u?.email ?? '');
  const [name, setName] = useState(u?.name ?? '');
  const [role, setRole] = useState(u?.role ?? 'user');
  const [clientCode, setClientCode] = useState(u?.clientCode ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let res: Response;
      if (isCreate) {
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, role, clientCode, password }),
        });
      } else if (isReset) {
        res = await fetch(`/api/admin/users/${u!.id}/password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
      } else {
        res = await fetch(`/api/admin/users/${u!.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, role, clientCode }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save.');
        return;
      }
      onSaved();
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const title = isCreate ? 'Add user' : isReset ? `Reset password — ${u!.email}` : `Edit ${u!.email}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 mb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-red-500 p-1" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {isReset ? (
          <Field label="New password" required full>
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
          </Field>
        ) : (
          <>
            {isCreate && (
              <Field label="Email" required>
                <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
              </Field>
            )}
            <Field label="Name" required>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Role" required>
              <select className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">User (client)</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Client code">
              <input className={inputCls} value={clientCode} onChange={(e) => setClientCode(e.target.value)} placeholder="FCC0002 (clients only)" />
            </Field>
            {isCreate && (
              <Field label="Temporary password" required>
                <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              </Field>
            )}
          </>
        )}

        {error && <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        <div className="sm:col-span-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50">
            {submitting ? <span className="inline-flex items-center gap-2"><BrandDots /> Saving…</span> : isCreate ? 'Create user' : isReset ? 'Reset password' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);

  function load() {
    fetch('/api/admin/users')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setUsers(d as AdminUser[]))
      .catch(() => setUsers([]));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Users &amp; clients</h1>
          <p className="text-gray-500 mt-1">Manage accounts, roles, client codes, and passwords.</p>
        </div>
        {!panel && (
          <button onClick={() => setPanel({ type: 'create' })} className="px-4 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors whitespace-nowrap">
            + Add user
          </button>
        )}
      </div>

      <div className="mt-6">
        {panel && (
          <UserPanel
            key={panel.type + ('user' in panel ? panel.user.id : 'new')}
            panel={panel}
            onClose={() => setPanel(null)}
            onSaved={() => {
              setPanel(null);
              load();
            }}
          />
        )}

        {users === null ? (
          <BrandLoader variant="section" />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Email</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Role</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Client code</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">Created</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-brand-dark">{u.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{u.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-brand-purple text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{u.clientCode || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button onClick={() => setPanel({ type: 'edit', user: u })} className="text-sm font-semibold text-brand-orange hover:text-brand-coral transition-colors">
                          Edit
                        </button>
                        <button onClick={() => setPanel({ type: 'reset', user: u })} className="ml-4 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
                          Reset password
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
