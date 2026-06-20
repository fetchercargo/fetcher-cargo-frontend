import type { FC } from 'react';

// Shared icon wrapper — keeps every nav glyph the same size/stroke.
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0"
    >
      {children}
    </svg>
  );
}

const OverviewIcon: FC = () => (
  <Icon>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </Icon>
);

const CreateShipmentIcon: FC = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </Icon>
);

const ShipmentsIcon: FC = () => (
  <Icon>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </Icon>
);

const DocumentsIcon: FC = () => (
  <Icon>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8M8 17h8" />
  </Icon>
);

const TrackingIcon: FC = () => (
  <Icon>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
);

const CalculatorIcon: FC = () => (
  <Icon>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="11" x2="8" y2="11" />
    <line x1="12" y1="11" x2="12" y2="11" />
    <line x1="16" y1="11" x2="16" y2="11" />
    <line x1="8" y1="15" x2="8" y2="15" />
    <line x1="12" y1="15" x2="12" y2="15" />
    <line x1="16" y1="15" x2="16" y2="18" />
    <line x1="8" y1="18" x2="12" y2="18" />
  </Icon>
);

const BillingIcon: FC = () => (
  <Icon>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <line x1="6" y1="15" x2="10" y2="15" />
  </Icon>
);

const PincodeIcon: FC = () => (
  <Icon>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </Icon>
);

const SupportIcon: FC = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M5.6 5.6 9.5 9.5M14.5 14.5l3.9 3.9M18.4 5.6 14.5 9.5M9.5 14.5 5.6 18.4" />
  </Icon>
);

export interface NavItem {
  label: string;
  icon: FC;
  href?: string; // present => real navigation
  soon?: boolean; // present => not yet built (inert, shows a "Soon" badge)
  newTab?: boolean; // present => open in a new tab
}

// Sidebar navigation. Only Overview and Tracking navigate; the rest are
// placeholders until their features are built.
export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', icon: OverviewIcon, href: '/dashboard' },
  { label: 'Create Shipment', icon: CreateShipmentIcon, href: '/dashboard/create-shipment' },
  { label: 'My Shipments', icon: ShipmentsIcon, href: '/dashboard/shipments' },
  { label: 'Documents', icon: DocumentsIcon, href: '/dashboard/documents' },
  { label: 'Tracking', icon: TrackingIcon, href: '/', newTab: true },
  { label: 'Calculator', icon: CalculatorIcon, href: '/dashboard/calculator' },
  { label: 'Billing', icon: BillingIcon, href: '/dashboard/billing' },
  { label: 'Pincode Serviceability', icon: PincodeIcon, href: '/dashboard/pincode-serviceability' },
  { label: 'Support', icon: SupportIcon, href: '/dashboard/support' },
];
