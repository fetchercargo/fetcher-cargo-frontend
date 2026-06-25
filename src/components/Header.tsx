'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Home', href: 'https://fetchercargo.com/' },
  {
    label: 'Company',
    href: 'https://fetchercargo.com/about/',
    children: [
      { label: 'About Us', href: 'https://fetchercargo.com/about/' },
      { label: 'History', href: 'https://fetchercargo.com/history/' },
      { label: 'Values', href: 'https://fetchercargo.com/values/' },
      { label: 'Social Responsibility', href: 'https://fetchercargo.com/social-responsibility/' },
      { label: 'Ethics and Compliance', href: 'https://fetchercargo.com/ethics-and-compliance/' },
    ],
  },
  {
    label: 'Services',
    href: 'https://fetchercargo.com/services/',
    children: [
      { label: 'Supply chain', href: 'https://fetchercargo.com/supply-chain/' },
      { label: 'Warehousing & Fulfilment', href: 'https://fetchercargo.com/warehousing-fulfilment/' },
      { label: 'Express Cargo', href: 'https://fetchercargo.com/express-cargo/' },
      { label: 'Surface Transport', href: 'https://fetchercargo.com/surface-transport/' },
      { label: 'Global Freight Forwarding', href: 'https://fetchercargo.com/global-freight-forwarding/' },
      { label: 'Ocean Freight', href: 'https://fetchercargo.com/ocean-freight/' },
      { label: 'Air Freight', href: 'https://fetchercargo.com/air-freight/' },
      { label: 'Projects', href: 'https://fetchercargo.com/projects/' },
      { label: 'Multimodal transport', href: 'https://fetchercargo.com/multimodal-transport/' },
    ],
  },
  {
    label: 'Industries',
    href: 'https://fetchercargo.com/industries/',
    children: [
      { label: 'Perishables', href: 'https://fetchercargo.com/perishables/' },
      { label: 'Whitegoods', href: 'https://fetchercargo.com/whitegoods/' },
      { label: 'Health & Personal care', href: 'https://fetchercargo.com/health-personal-care/' },
      { label: 'Ecommerce', href: 'https://fetchercargo.com/ecommerce/' },
    ],
  },
  { label: 'Tracking', href: '/' },
  { label: 'Contact', href: 'https://fetchercargo.com/contact/' },
  { label: 'Login', href: '/login' },
];

function ChevronDown() {
  return (
    <span className="inline-flex items-center justify-center w-[19px] ml-0.5">
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round"/>
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);

  // An internal nav item is active only on its own route (external links never).
  const isActive = (href: string) => href.startsWith('/') && pathname === href;

  return (
    <header className="w-full bg-white relative z-50">
      {/* Matches: height 105px, padding 0 20px, container max-width 1240px, inner padding 0 20px */}
      <div className="max-w-[1240px] mx-auto px-5 flex items-center justify-between h-[105px]">
        {/* Logo: displayed at 200x73, high-res source 1024x375 */}
        <Link href="https://fetchercargo.com/" className="flex-shrink-0">
          <Image
            src="/logo.jpg"
            alt="fetcher cargo logo"
            width={1024}
            height={375}
            className="h-auto"
            style={{ width: '200px', maxWidth: '200px' }}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.children && setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              {item.children ? (
                <button
                  className={`flex items-center px-[15px] py-[15px] text-[15px] font-semibold capitalize transition-colors ${
                    isActive(item.href) ? 'text-brand-orange' : 'text-brand-gray hover:text-brand-orange'
                  }`}
                >
                  {item.label}
                  <ChevronDown />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center px-[15px] py-[15px] text-[15px] font-semibold capitalize transition-colors ${
                    isActive(item.href) ? 'text-brand-orange' : 'text-brand-gray hover:text-brand-orange'
                  }`}
                >
                  {item.label}
                </Link>
              )}

              {item.children && openDropdown === item.label && (
                <div className="dropdown-menu absolute top-full left-0 bg-white shadow-lg border border-gray-100 rounded min-w-[230px] py-1 z-50">
                  {item.children.map((child) => (
                    <a
                      key={child.label}
                      href={child.href}
                      className="block px-5 py-2.5 text-sm text-brand-gray hover:text-brand-orange hover:bg-gray-50 transition-colors"
                    >
                      {child.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-brand-dark"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Main menu toggle"
        >
          {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="border-b border-gray-50">
              {item.children ? (
                <>
                  <button
                    className={`w-full flex items-center justify-between px-5 py-3 text-[15px] font-semibold capitalize ${
                      isActive(item.href) ? 'text-brand-orange' : 'text-brand-gray'
                    }`}
                    onClick={() => setMobileDropdown(mobileDropdown === item.label ? null : item.label)}
                  >
                    {item.label}
                    <svg
                      width="10" height="6" viewBox="0 0 10 6" fill="none"
                      className={`transition-transform ${mobileDropdown === item.label ? 'rotate-180' : ''}`}
                    >
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {mobileDropdown === item.label && (
                    <div className="bg-gray-50 py-1">
                      {item.children.map((child) => (
                        <a
                          key={child.label}
                          href={child.href}
                          className="block px-8 py-2 text-sm text-brand-gray hover:text-brand-orange"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`block px-5 py-3 text-[15px] font-semibold capitalize ${
                    isActive(item.href) ? 'text-brand-orange' : 'text-brand-gray'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
