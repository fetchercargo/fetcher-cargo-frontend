'use client';

import { useEffect, useState } from 'react';

// The web ticket form the team uses.
const TICKET_FORM_URL = 'https://forms.gle/8VSwHerS5ceyL6XZA';

const PHONE_DISPLAY = '+91 72047 53 639';
const PHONE_TEL = '+917204753639';
const WHATSAPP = 'https://wa.me/917204753639';
const EMAIL = 'mc@fetchercargo.com';
const EMAIL_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent('Escalation - AWB: ')}`;

const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
function TicketIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" {...ic}><path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2Z" /><path d="M15 5v2M15 11v2M15 17v2" /></svg>;
}
function PhoneIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>;
}
function WhatsappIcon() {
  // Official WhatsApp glyph, monochrome via currentColor to match our flat icons.
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.207-.242-.58-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
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

const cardCls = 'bg-white rounded-xl border border-gray-200';
const chipCls = 'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-light-gray text-brand-purple';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mt-8 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{children}</p>;
}

export default function SupportPage() {
  // Computed after mount (deferred a frame) to avoid a server/client time mismatch.
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(computeOpen()));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="max-w-3xl mx-auto pb-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Support</h1>
      <p className="text-gray-500 mt-2 leading-relaxed">
        Have an account, technical, payment or delivery issue? Reach us through any of the options below.
      </p>

      {/* Primary path — raise a ticket */}
      <div className={`mt-6 ${cardCls} p-6 sm:p-7`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-brand-orange">
            <TicketIcon />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-semibold text-brand-dark">Raise a support ticket</h2>
              <span className="text-[11px] font-semibold uppercase tracking-wide bg-orange-50 text-brand-orange px-2 py-0.5 rounded-full">Recommended</span>
            </div>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              Fill out our quick web form for a faster, time-bound resolution. Every ticket is reviewed and answered within one business day.
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-purple bg-brand-light-gray rounded-full px-2.5 py-1">
              <ClockIcon /> Answered within 1 business day
            </span>
            <div className="mt-5">
              <a
                href={TICKET_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2"
              >
                Open the ticket form <ArrowIcon />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Direct contact */}
      <SectionLabel>Reach us directly</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Phone / WhatsApp */}
        <div className={`flex flex-col ${cardCls} p-5`}>
          <div className="flex items-center gap-3">
            <span className={chipCls}><PhoneIcon /></span>
            <div>
              <p className="text-sm font-semibold text-brand-dark">Call or WhatsApp</p>
              <p className="text-xs text-gray-400">During working days</p>
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold tracking-tight text-brand-dark tabular-nums">{PHONE_DISPLAY}</p>
          <div className="mt-auto pt-4 flex gap-2">
            <a href={`tel:${PHONE_TEL}`} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/40">
              <PhoneIcon /> Call
            </a>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-brand-gray border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/40">
              <WhatsappIcon /> WhatsApp
            </a>
          </div>
        </div>

        {/* Email */}
        <div className={`flex flex-col ${cardCls} p-5`}>
          <div className="flex items-center gap-3">
            <span className={chipCls}><MailIcon /></span>
            <div>
              <p className="text-sm font-semibold text-brand-dark">Email an escalation</p>
              <p className="text-xs text-gray-400">For urgent issues</p>
            </div>
          </div>
          <p className="mt-4 text-base font-semibold text-brand-dark break-all">{EMAIL}</p>
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
            Put <span className="font-medium text-brand-dark">&ldquo;Escalation&rdquo;</span> in the subject line along with your <span className="font-medium text-brand-dark">AWB number</span>.
          </p>
          <div className="mt-auto pt-4">
            <a href={EMAIL_HREF} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/40">
              <MailIcon /> Email us
            </a>
          </div>
        </div>
      </div>

      {/* Hours & contact */}
      <SectionLabel>Hours &amp; contact</SectionLabel>
      <div className={`${cardCls} p-6`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={chipCls}><ClockIcon /></span>
            <h2 className="text-base font-semibold text-brand-dark">Business hours</h2>
          </div>
          {open !== null && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-green-600' : 'bg-gray-400'}`} />
              {open ? 'Open now' : 'Closed'}
            </span>
          )}
        </div>

        <dl className="mt-5 divide-y divide-gray-100">
          {HOURS.map((h) => (
            <div key={h.label} className="flex items-center justify-between py-3">
              <dt className="text-sm text-gray-600">{h.label}</dt>
              <dd className={`text-sm font-medium tabular-nums ${h.closed ? 'text-gray-400' : 'text-brand-dark'}`}>{h.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-brand-light-gray px-4 py-3">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-brand-purple">
            <UserIcon />
          </span>
          <p className="text-sm text-gray-600">
            Your support contact: <span className="font-semibold text-brand-dark">Ms. Sashikala</span>
          </p>
        </div>

        <p className="mt-4 text-xs text-gray-400">All times are India Standard Time (IST).</p>
      </div>
    </div>
  );
}
