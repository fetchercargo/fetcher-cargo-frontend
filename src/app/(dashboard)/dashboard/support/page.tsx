'use client';

import { useEffect, useState } from 'react';

// The web ticket form the team uses.
const TICKET_FORM_URL = 'https://forms.gle/8VSwHerS5ceyL6XZA';

const PHONE_DISPLAY = '+91 72047 53 639';
const PHONE_TEL = '+917204753639';
const WHATSAPP = 'https://wa.me/917204753639';
const EMAIL = 'mc@fetchercargo.com';
const EMAIL_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent('Escalation - AWB: ')}`;

const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
function TicketIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" {...ic}><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" /><path d="M13 7v2M13 15v2M13 11v2" /></svg>;
}
function PhoneIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>;
}
function WhatsappIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...ic}><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.1-5.3A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.5 9c0 4 2.5 6.5 6.5 6.5" /></svg>;
}
function MailIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>;
}
function ClockIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}
function UserIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...ic}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function ArrowIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...ic}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

const HOURS = [
  { label: 'Monday – Friday', value: '9:30 AM – 6:30 PM' },
  { label: 'Saturday', value: '10:00 AM – 5:00 PM' },
  { label: 'Sunday', value: 'Holiday', closed: true },
];

// computeOpen returns whether the support desk is open right now, in IST.
function computeOpen(): boolean {
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = ist.getDay(); // 0 Sun … 6 Sat
  const mins = ist.getHours() * 60 + ist.getMinutes();
  if (day >= 1 && day <= 5) return mins >= 9 * 60 + 30 && mins < 18 * 60 + 30;
  if (day === 6) return mins >= 10 * 60 && mins < 17 * 60;
  return false;
}

export default function SupportPage() {
  // Computed after mount (deferred a frame) to avoid a server/client time mismatch.
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(computeOpen()));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Support</h1>
      <p className="text-gray-500 mt-1">
        Have an account, technical, payment or delivery issue? Reach us through any of the options below.
      </p>

      {/* Primary path — raise a ticket */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand-orange">
            <TicketIcon />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-brand-dark">Raise a support ticket</h2>
              <span className="text-[11px] font-semibold uppercase tracking-wide bg-orange-50 text-brand-orange px-2 py-0.5 rounded-full">Recommended</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Fill out our quick web form for a faster, time-bound resolution. Every ticket is reviewed and answered within{' '}
              <span className="font-medium text-brand-dark">1 business day</span>.
            </p>
            <a
              href={TICKET_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
            >
              Open the ticket form <ArrowIcon />
            </a>
          </div>
        </div>
      </div>

      {/* Direct contact */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone / WhatsApp */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-light-gray text-brand-purple">
              <PhoneIcon />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-dark">Call or WhatsApp</p>
              <p className="text-xs text-gray-400">During working days</p>
            </div>
          </div>
          <p className="mt-3 text-lg font-semibold tracking-tight text-brand-dark tabular-nums">{PHONE_DISPLAY}</p>
          <div className="mt-3 flex gap-2">
            <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/40">
              <PhoneIcon /> Call
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-brand-gray border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/40">
              <WhatsappIcon /> WhatsApp
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-light-gray text-brand-purple">
              <MailIcon />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-dark">Email an escalation</p>
              <p className="text-xs text-gray-400">For urgent issues</p>
            </div>
          </div>
          <a href={EMAIL_HREF} className="mt-3 block text-base font-semibold text-brand-orange hover:text-brand-coral transition-colors break-all">
            {EMAIL}
          </a>
          <p className="mt-2 text-xs text-gray-500">
            Put <span className="font-medium text-brand-dark">&ldquo;Escalation&rdquo;</span> in the subject line along with your <span className="font-medium text-brand-dark">AWB number</span>.
          </p>
        </div>
      </div>

      {/* Business hours + contact person */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-light-gray text-brand-purple">
              <ClockIcon />
            </span>
            <h2 className="text-base font-semibold text-brand-dark">Business hours</h2>
          </div>
          {open !== null && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-green-600' : 'bg-gray-400'}`} />
              {open ? 'Open now' : 'Closed'}
            </span>
          )}
        </div>

        <dl className="mt-4 divide-y divide-gray-100">
          {HOURS.map((h) => (
            <div key={h.label} className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-gray-600">{h.label}</dt>
              <dd className={`text-sm font-medium tabular-nums ${h.closed ? 'text-gray-400' : 'text-brand-dark'}`}>{h.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand-light-gray px-3.5 py-2.5">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-brand-purple">
            <UserIcon />
          </span>
          <p className="text-sm text-gray-600">
            Your support contact: <span className="font-semibold text-brand-dark">Ms. Sashikala</span>
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">All times are India Standard Time (IST).</p>
    </div>
  );
}
