import Link from 'next/link';
import { Callout, DocTable } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'costs-and-limits';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function CostsPage() {
  return (
    <DocArticle slug={slug}>
      <p>
        OpenReach itself charges nothing. Lookups that fetch data are billed by YepAPI to your own key at its prices. These are the prices at the time
        of writing; YepAPI sets them and can change them.
      </p>

      <h2 id="prices">What each call costs</h2>
      <DocTable
        caption="YepAPI prices"
        head={['Call', 'Price', 'Used by']}
        mono={[1]}
        rows={[
          ['YouTube, TikTok or Instagram call', '$0.01', 'Influencer search (two calls a page), creator analysis (two calls)'],
          ['Google Maps search', '$0.07 per page of 20', 'Lead finder, lead searches'],
          ['Google search', '$0.01 per 10 results', 'Communities searched through Google, Instagram profiles'],
          ['Homepage read', '$0.01', 'Lead emails from a business’s website'],
          ['Business-email directory', '$0.03 per 10 emails', 'Lead emails from the directory'],
          ['AI check', 'from $0.01 per request', 'Scoring up to 25 mentions or conversations'],
          ['Hacker News, GitHub, Stack Exchange', 'Free', 'Mentions and conversations, through their official APIs'],
        ]}
      />

      <h2 id="examples">Examples</h2>
      <DocTable
        caption="Example costs"
        head={['Action', 'Cost']}
        mono={[1]}
        rows={[
          ['Search a niche on TikTok, one page', '$0.02'],
          ['Analyse 10 creators', '$0.20 – $0.30'],
          ['60 businesses from Google Maps (3 pages)', '$0.21'],
          ['A lead search: 2 queries × 5 towns, 1 page each', 'up to $0.70'],
          ['A brand check over 15 communities, 9 of them through Google', '$0.09'],
          ['Subreddit finder, one topic', '$0.06'],
        ]}
      />

      <h2 id="cache">When results are free</h2>
      <ul>
        <li>Repeating a search with the same input is served from a cache: a day for creators, a week for Google Maps, hours for mentions.</li>
        <li>Filters, saved lists, statuses, notes and exports never call the provider.</li>
        <li>Hacker News, GitHub and Stack Exchange searches are free.</li>
        <li>Price checks (dry runs) are free.</li>
      </ul>

      <h2 id="limits">Spending limits</h2>
      <Callout title="Two controls">
        <ul className="list-[square] space-y-1 pl-5">
          <li>
            <strong>A monthly limit</strong> in Settings and usage. Every paid call checks it first, including lead searches, scheduled monitors and
            agents. A background run that reaches it stops.
          </li>
          <li>
            <strong>A ceiling per call</strong>: the API and MCP tools take <code>maxCostUsd</code> / <code>max_cost_usd</code> and refuse a call
            whose worst-case price is higher.
          </li>
        </ul>
      </Callout>
      <p>
        Settings and usage lists every paid call with its cost, by feature and by day. See <Link href="/pricing">Pricing</Link> for the overview.
      </p>
    </DocArticle>
  );
}
