'use client';

import { ArrowRight, LoaderCircle } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { buttonClasses } from './button';

/**
 * A tool anyone can try on the website, without an account: a few small checks a day, run by the
 * API's free tools (apps/api/src/services/public-tools.ts) with the site's own YepAPI key.
 */
export type FreeToolKind = 'youtube-channels' | 'tiktok-creators' | 'instagram-creators' | 'lead-finder' | 'subreddit-finder' | 'brand-mentions';

const COUNTRIES: [string, string][] = [
  ['us', 'United States'],
  ['gb', 'United Kingdom'],
  ['ca', 'Canada'],
  ['au', 'Australia'],
  ['in', 'India'],
  ['de', 'Germany'],
  ['fr', 'France'],
  ['es', 'Spain'],
  ['it', 'Italy'],
  ['nl', 'Netherlands'],
  ['br', 'Brazil'],
];

type Row = Record<string, unknown>;
type Spec = {
  label: string;
  placeholder: string;
  country: boolean;
  /** A second field for where (the lead finder's place). */
  location?: { label: string; placeholder: string };
  body: (text: string, country: string, location: string) => object;
  render: (data: Row) => ReactNode;
};

const compact = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value) : '—';
const list = (value: unknown) => (Array.isArray(value) ? (value as Row[]) : []);
const text = (value: unknown) => (typeof value === 'string' && value ? value : '—');

function ago(iso: unknown): string {
  if (typeof iso !== 'string' || !iso) return '—';
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (Number.isNaN(days)) return '—';
  if (days < 1) return 'today';
  if (days < 31) return `${days}d ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

/** Links out of the page: only http(s), opened in a new tab without passing our address on. */
function Out({ href, children }: { href: unknown; children: ReactNode }) {
  const url = typeof href === 'string' && /^https?:\/\//i.test(href) ? href : null;
  if (!url) return <>{children}</>;
  return (
    <a href={url} target="_blank" rel="noreferrer noopener nofollow" className="underline-offset-4 hover:underline">
      {children}
    </a>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[0.9375rem]">
        <thead>
          <tr className="border-b border-line font-mono text-xs uppercase tracking-wide text-muted">
            {head.map((cell, index) => (
              <th key={cell} scope="col" className={`py-2.5 pr-4 font-medium ${index ? 'text-right' : ''}`}>
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="py-4 text-muted">
                Nothing found for this search. Try other words or another place.
              </td>
            </tr>
          )}
          {rows.map((cells, index) => (
            <tr key={index} className="border-b border-line last:border-0">
              {cells.map((cell, column) => (
                <td key={column} className={`py-2.5 pr-4 align-top ${column ? 'text-right font-mono tabular-nums whitespace-nowrap' : 'max-w-[22rem] font-medium'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const creators = (data: Row) => (
  <Table
    head={['Creator', 'Followers', 'Matched']}
    rows={list(data.creators)
      .slice(0, 25)
      .map((row) => [
        <Out key="c" href={row.url}>
          {text(row.name ?? row.handle)}
          <span className="block truncate font-mono text-xs font-normal text-muted">{text(row.handle)}</span>
        </Out>,
        compact(row.followers),
        typeof row.matchedPosts === 'number' && row.matchedPosts > 0 ? `${row.matchedPosts} · ${compact(row.matchedViews)} views` : 'account',
      ])}
  />
);

const creatorSpec = (placeholder: string): Spec => ({
  label: 'Niche or topic',
  placeholder,
  country: true,
  body: (query, country) => ({ query, country }),
  render: creators,
});

const OWN_SITE_EXCLUDED = /(^|\.)(facebook\.com|instagram\.com|linktr\.ee|tiktok\.com|x\.com|twitter\.com|yelp\.com)$/;

const SPECS: Record<FreeToolKind, Spec> = {
  'youtube-channels': creatorSpec('home espresso'),
  'tiktok-creators': creatorSpec('budget travel'),
  'instagram-creators': creatorSpec('plant-based recipes'),
  'lead-finder': {
    label: 'Type of business',
    placeholder: 'plumber',
    country: true,
    location: { label: 'Where', placeholder: 'Austin, TX' },
    body: (query, country, location) => ({ query, location, country }),
    render: (data) => (
      <Table
        head={['Business', 'Rating', 'Website', 'Phone']}
        rows={list(data.leads).map((row) => {
          const domain = typeof row.domain === 'string' ? row.domain : null;
          const own = domain && !OWN_SITE_EXCLUDED.test(domain);
          return [
            <Out key="b" href={row.mapsUrl}>
              {text(row.name)}
              <span className="block truncate text-xs font-normal text-muted">{text(row.category)}</span>
            </Out>,
            typeof row.rating === 'number' ? `${row.rating.toFixed(1)} (${compact(row.reviews ?? 0)})` : '—',
            own ? <Out key="w" href={row.website}>{domain}</Out> : domain ? `only ${domain}` : 'none',
            text(row.phone),
          ];
        })}
      />
    ),
  },
  'subreddit-finder': {
    label: 'Topic',
    placeholder: 'freelance invoicing',
    country: false,
    body: (topic) => ({ topic }),
    render: (data) => (
      <Table
        head={['Subreddit', 'Threads', 'Replies', 'Newest']}
        rows={list(data.subreddits).map((row) => [
          <Out key="s" href={typeof row.community === 'string' ? `https://www.reddit.com/${row.community}/` : null}>
            {text(row.community)}
          </Out>,
          compact(row.threads),
          row.comments ? compact(row.comments) : '—',
          ago(row.newest),
        ])}
      />
    ),
  },
  'brand-mentions': {
    label: 'Your brand',
    placeholder: 'Your product name',
    country: false,
    body: (brand) => ({ brand }),
    render: (data) => {
      const rows = list(data.mentions);
      if (!rows.length) return <p className="text-muted">No mentions found in the last 90 days on these communities.</p>;
      return (
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li key={String(row.url)} className="py-3">
              <p className="text-xs text-muted">
                {text(row.community ?? row.sourceId)} · {ago(row.publishedAt)}
                {typeof row.comments === 'number' ? ` · ${row.comments} replies` : ''}
              </p>
              <p className="mt-0.5 font-medium">
                <Out href={row.url}>{text(row.title)}</Out>
              </p>
            </li>
          ))}
        </ul>
      );
    },
  },
};

export function FreeTool({ kind, apiUrl, appHref, signUpHref }: { kind: FreeToolKind; apiUrl: string; appHref: string; signUpHref: string }) {
  const spec = SPECS[kind];
  const [value, setValue] = useState('');
  const [location, setLocation] = useState('');
  const [country, setCountry] = useState('us');
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; data?: Row; message?: string; remaining?: number }>({ status: 'idle' });
  const ready = value.trim().length >= 2 && (!spec.location || location.trim().length >= 2);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!ready || state.status === 'loading') return;
    setState({ status: 'loading' });
    const fallback = 'Something went wrong. Try again in a moment.';
    try {
      const response = await fetch(`${apiUrl}/public/tools/${kind}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(spec.body(value.trim(), country, location.trim())),
      }).catch(() => {
        // fetch only rejects on network or CORS failures; its own message ("Failed to fetch") means nothing to a reader.
        throw new Error('Could not reach the OpenReach server. Check your connection and try again.');
      });
      const json = (await response.json().catch(() => null)) as { ok?: boolean; data?: Row; remaining?: number; error?: { message?: string } } | null;
      // 404: this install has the free tools switched off (no PUBLIC_TOOLS_YEPAPI_KEY).
      if (response.status === 404) throw new Error('The free tools are switched off on this server. Sign up to run this search in the app.');
      if (!response.ok || !json?.ok) throw new Error(json?.error?.message ?? fallback);
      if (!json.data) throw new Error(fallback);
      setState({ status: 'done', data: json.data, remaining: json.remaining });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error && error.message ? error.message : fallback });
    }
  }

  const field = 'w-full rounded-md border border-edge bg-surface px-3.5 text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';

  return (
    <section aria-label="Try it free" className="card mx-auto max-w-3xl p-5 text-left sm:p-7">
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="text-sm font-medium text-ink">{spec.label}</span>
            <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={spec.placeholder} maxLength={120} className={`${field} mt-1.5 h-12`} />
          </label>
          {spec.location && (
            <label className="block flex-1">
              <span className="text-sm font-medium text-ink">{spec.location.label}</span>
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder={spec.location.placeholder} maxLength={120} className={`${field} mt-1.5 h-12`} />
            </label>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {spec.country && (
            <label className="block sm:w-52">
              <span className="text-sm font-medium text-ink">Country</span>
              <select value={country} onChange={(event) => setCountry(event.target.value)} className={`${field} mt-1.5 h-11`}>
                {COUNTRIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" disabled={!ready || state.status === 'loading'} className={buttonClasses('primary', 'md', 'disabled:pointer-events-none disabled:opacity-60 sm:ml-auto')}>
            {state.status === 'loading' ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
            Search free
          </button>
        </div>
        <p className="text-xs text-muted">Free, no account: one search at a time, a few a day.</p>
      </form>

      <div aria-live="polite">
        {state.status === 'error' && (
          <p className="mt-5 rounded-md border border-line bg-peach/60 px-4 py-3 text-[0.9375rem] text-ink">
            {state.message}{' '}
            <a href={signUpHref} className="font-medium text-accent-text underline-offset-4 hover:underline">
              Sign up free
            </a>
          </p>
        )}
        {state.status === 'done' && state.data && (
          <div className="mt-6 border-t border-line pt-5">
            {spec.render(state.data)}
            <div className="mt-5 flex flex-col gap-3 rounded-md bg-sunken px-4 py-3 text-[0.9375rem] sm:flex-row sm:items-center">
              <p className="text-muted">
                {typeof state.remaining === 'number' ? `${state.remaining} free ${state.remaining === 1 ? 'search' : 'searches'} left today. ` : ''}
                The app has more of everything: filters, analysis, contacts and saved lists, and you only pay for the lookups you run.
              </p>
              <a href={appHref} className={buttonClasses('secondary', 'sm', 'shrink-0 sm:ml-auto')}>
                Open the full tool
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
