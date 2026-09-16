import Link from 'next/link';

interface LabelCard {
  title: string;
  description: string;
  href: string;
}

const CARDS: LabelCard[] = [
  {
    title: 'Shipment Label Generator',
    description:
      'A 4x6 inch label for the consignment: both addresses, the service, the package details and the AWB. Search an AWB to fill it in, or type it all by hand.',
    href: '/admin/labels/shipment',
  },
  {
    title: 'Box Label Generator',
    description:
      'One sticker per box — the AWB and "Box 3 of 20" — eight to an A4 sheet. Enter the AWB and how many boxes the consignment has.',
    href: '/admin/labels/boxes',
  },
];

export default function AdminLabelsPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Labels</h1>
        <p className="text-gray-500 mt-1">Generate printable labels, preview them, and save them as PDF.</p>
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
