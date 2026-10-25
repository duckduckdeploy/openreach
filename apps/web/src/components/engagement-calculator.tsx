'use client';

import { type ChangeEvent, useId, useState } from 'react';

/**
 * The engagement rate calculator on its tool page: works in the browser from numbers the reader
 * types in, with no account and no API call. The app works the same rate out from a creator's real posts.
 */
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'other';

const PLATFORMS: [Platform, string, string][] = [
  ['instagram', 'Instagram', 'Followers'],
  ['tiktok', 'TikTok', 'Followers'],
  ['youtube', 'YouTube', 'Subscribers'],
  ['other', 'Other', 'Followers'],
];

const parse = (value: string) => {
  const number = Number(value.replace(/[,\s]/g, ''));
  return Number.isFinite(number) && number >= 0 ? number : 0;
};

const percent = (value: number) => `${value >= 10 ? value.toFixed(1) : value.toFixed(2)}%`;

const compact = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);

export function EngagementCalculator() {
  const id = useId();
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [values, setValues] = useState({ followers: '', likes: '', comments: '', shares: '', saves: '', views: '', posts: '1' });
  const set = (key: keyof typeof values) => (event: ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const posts = Math.max(1, Math.round(parse(values.posts)) || 1);
  const followers = parse(values.followers);
  const views = parse(values.views) / posts;
  const interactions = (parse(values.likes) + parse(values.comments) + parse(values.shares) + parse(values.saves)) / posts;
  const byFollowers = followers > 0 && interactions > 0 ? (interactions / followers) * 100 : null;
  const byViews = views > 0 && interactions > 0 ? (interactions / views) * 100 : null;
  const viewRate = followers > 0 && views > 0 ? (views / followers) * 100 : null;
  const audience = PLATFORMS.find(([key]) => key === platform)?.[2] ?? 'Followers';

  const field = 'w-full rounded-md border border-edge bg-surface px-3.5 text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25';
  const input = (key: keyof typeof values, label: string, hint?: string) => (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input inputMode="numeric" value={values[key]} onChange={set(key)} placeholder={hint ?? '0'} maxLength={15} className={`${field} mt-1.5 h-11 font-mono tabular-nums`} />
    </label>
  );

  return (
    <section aria-label="Engagement rate calculator" className="card mx-auto max-w-3xl p-5 text-left sm:p-7">
      <fieldset>
        <legend className="text-sm font-medium text-ink">Platform</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLATFORMS.map(([key, name]) => (
            <label key={key} className={`cursor-pointer rounded-md border px-3.5 py-2 text-[0.9375rem] ${platform === key ? 'border-accent bg-accent/10 font-medium text-ink' : 'border-edge text-muted hover:text-ink'}`}>
              <input type="radio" name={`${id}-platform`} value={key} checked={platform === key} onChange={() => setPlatform(key)} className="sr-only" />
              {name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {input('followers', audience, '25,000')}
        {input('likes', 'Likes', '1,200')}
        {input('comments', 'Comments', '80')}
        {input('views', 'Views', 'optional')}
        {platform !== 'youtube' && input('shares', 'Shares', 'optional')}
        {platform === 'instagram' || platform === 'tiktok' ? input('saves', 'Saves', 'optional') : null}
        {input('posts', 'Posts counted')}
      </div>
      <p className="mt-3 text-xs text-muted">
        Enter one post’s numbers, or totals across several posts with the number of posts. Nothing you type leaves this page.
      </p>

      <div aria-live="polite" className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-5 sm:grid-cols-3">
        <Result label={`Engagement rate by ${audience.toLowerCase()}`} value={byFollowers} note={`Interactions per post ÷ ${audience.toLowerCase()}`} />
        <Result label="Engagement rate by views" value={byViews} note="Interactions per post ÷ views per post" />
        <Result label={`Views as a share of ${audience.toLowerCase()}`} value={viewRate} note="Views per post ÷ followers" />
      </div>
      {interactions > 0 && (
        <p className="mt-4 text-[0.9375rem] text-muted">
          {compact(interactions)} interactions per post{views > 0 ? ` on ${compact(views)} views` : ''}
          {posts > 1 ? `, averaged over ${posts} posts` : ''}.
        </p>
      )}
    </section>
  );
}

function Result({ label, value, note }: { label: string; value: number | null; note: string }) {
  return (
    <div className="rounded-md bg-sunken px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">{value === null ? '—' : percent(value)}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}
