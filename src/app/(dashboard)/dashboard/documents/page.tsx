'use client';

import DocumentManager from '@/components/admin/DocumentManager';

export default function DocumentsPage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Documents</h1>
      <p className="text-gray-500 mt-1">Documents shared with your account by the Fetcher Cargo team. Click to download.</p>
      <div className="mt-6">
        <DocumentManager category="documents" title="Documents" />
      </div>
    </div>
  );
}
