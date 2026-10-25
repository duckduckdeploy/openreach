import type { NextConfig } from 'next';

/**
 * Pages that moved, old path to new, each a permanent (301) redirect. Destinations are always the
 * current address, so no redirect chains: when a page moves again, update its old entries too.
 */
const MOVED: Record<string, string> = {
  '/features/influencer-outreach': '/features/influencer-crm',
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@openreach/shared'],
  async redirects() {
    return Object.entries(MOVED).map(([source, destination]) => ({ source, destination, permanent: true }));
  },
};

export default nextConfig;
