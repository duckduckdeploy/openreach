function env(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return (trimmed ? trimmed : fallback).replace(/\/+$/, '');
}

export const SITE_URL = env(process.env.NEXT_PUBLIC_SITE_URL, 'https://openreach.gg');
export const APP_URL = env(process.env.NEXT_PUBLIC_APP_URL, 'http://localhost:3300');

/** The public repository. A fork can point its site at its own with NEXT_PUBLIC_GITHUB_URL. */
export const GITHUB_URL: string =
  process.env.NEXT_PUBLIC_GITHUB_URL?.trim().replace(/\/+$/, '') || 'https://github.com/duckduckdeploy/openreach';

/** The public API address. Agents connect to `${PUBLIC_API_URL}/mcp`. */
export const PUBLIC_API_URL = env(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:4300');
export const MCP_URL = `${PUBLIC_API_URL}/mcp`;

export const SIGN_UP_URL = `${APP_URL}/sign-up`;
export const SIGN_IN_URL = `${APP_URL}/sign-in`;
export const YEPAPI_URL = 'https://yepapi.com?ref=openreach';

export const SITE_NAME = 'OpenReach';
/** Homepage title tag: keyword first. */
export const SITE_TITLE = 'Open-Source Lead Generation Tool & Influencer Finder';
export const SITE_DESCRIPTION =
  'Open-source lead generation tool: find influencers on YouTube, TikTok and Instagram, local leads on Google Maps, brand mentions and customers on Reddit.';

export const NAV_LINKS = [
  { href: '/tools', label: 'Tools' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/glossary', label: 'Glossary' },
] as const;

/** A name inside a sentence: "Lead finder" becomes "lead finder"; "YouTube" and "TikTok" keep their capitals. */
export const inSentence = (name: string) => name.replace(/^([A-Z])([a-z]+)\b/, (_, first: string, rest: string) => first.toLowerCase() + rest);
