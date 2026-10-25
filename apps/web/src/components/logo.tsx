import Link from 'next/link';
import { useId } from 'react';

/** The mark: one node reaching out to two others, on the sunset gradient. */
export function LogoMark({ className = 'size-7' }: { className?: string }) {
  const id = `logo-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#f9b530" />
          <stop offset="0.3" stopColor="#f5713a" />
          <stop offset="0.62" stopColor="#d6246e" />
          <stop offset="1" stopColor="#8a2fb8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <path d="M11 21 22.5 10.5M11 21l12.5 2" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="11" cy="21" r="5" fill="#ffffff" />
      <circle cx="22.5" cy="10.5" r="3.4" fill="#ffffff" />
      <circle cx="24" cy="23" r="2.6" fill="#ffffff" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 rounded-sm" aria-label="OpenReach home">
      <LogoMark />
      <span className="font-display text-lg font-bold tracking-tight text-ink">OpenReach</span>
    </Link>
  );
}
