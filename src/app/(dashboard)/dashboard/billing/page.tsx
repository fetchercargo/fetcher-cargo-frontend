'use client';

import DocumentManager from '@/components/admin/DocumentManager';

export default function BillingPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Billing</h1>
      <p className="text-gray-500 mt-1">Invoices and billing documents shared with your account. Click to download.</p>
      <div className="mt-6">
        <DocumentManager category="billing" title="Billing" />
      </div>
    </div>
  );
}
