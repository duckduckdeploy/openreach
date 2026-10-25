import Link from 'next/link';
import { Callout, DocTable } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'how-it-works';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function HowItWorksPage() {
  return (
    <DocArticle slug={slug}>
      <h2 id="parts">The parts</h2>
      <DocTable
        caption="The parts of OpenReach"
        head={['Part', 'What it does']}
        rows={[
          ['Dashboard', 'The web app where you search, save and work through lists and feeds.'],
          ['API', 'Every feature as REST routes. The dashboard, the MCP server and your own scripts all use it.'],
          ['MCP server', 'The same features as tools for AI agents, at /mcp on the API.'],
          ['Background worker', 'Runs lead searches and monitor runs, and starts scheduled monitors.'],
          ['Databases', 'Accounts, keys and usage in one Postgres database; projects and everything in them in another.'],
        ]}
      />

      <h2 id="tools-and-projects">Tools and projects</h2>
      <p>
        Every tool works on its own: search, read the results, export them. A <strong>project</strong> is a product you are finding customers for.
        It keeps what is worth keeping:
      </p>
      <ul>
        <li>saved creators and leads, each with an outreach status, notes and tags,</li>
        <li>lead searches that cover whole cities in the background,</li>
        <li>brand monitors and conversation monitors that check on a schedule and fill a feed.</li>
      </ul>

      <h2 id="data">Where the data comes from</h2>
      <DocTable
        caption="Data sources"
        head={['Data', 'Source', 'Cost']}
        rows={[
          ['YouTube, TikTok and Instagram creators', 'YepAPI', 'Paid per call, from your key'],
          ['Businesses on Google Maps', 'Google’s official Places data, through YepAPI', 'Paid per page of 20'],
          ['Reddit, Quora, X, LinkedIn and most communities', 'Google search results restricted to each site, through YepAPI', 'Paid per search'],
          ['Hacker News', 'The official Algolia API', 'Free'],
          ['GitHub issues and discussions', 'The official GitHub search API', 'Free'],
          ['Stack Overflow', 'The official Stack Exchange API', 'Free'],
          ['Reddit (self-hosted, optional)', 'Reddit’s official API, with the install’s own app credentials', 'Free'],
          ['Lead emails', 'A business’s own homepage, or a business-email directory, through YepAPI', 'Paid per lead'],
        ]}
      />
      <Callout title="What OpenReach never does">
        <ul className="list-[square] space-y-1 pl-5">
          <li>It never works around a site that blocks automated visits: no disguised browsers, no proxies to get past a refusal.</li>
          <li>It never posts, comments, likes or sends messages for you. You reach out yourself.</li>
          <li>It only shows what people and businesses publish: a bio, a website, the phone number on a Maps listing.</li>
        </ul>
      </Callout>

      <h2 id="scoring">How mentions and conversations are scored</h2>
      <p>
        A brand mention is kept only when the page contains one of your brand terms. A conversation gets an intent score from 0 to 100: a question,
        a request for a recommendation or alternative, frustration with a current tool, a named competitor and recency raise it; age lowers it.
        Turn on the AI check to have a model drop results that are off topic and explain the rest in a line.
      </p>

      <h2 id="background">What runs in the background</h2>
      <ul>
        <li>
          <strong>Lead searches</strong> run their searches a few at a time and save matches as they go. You can cancel them; what they found stays.
        </li>
        <li>
          <strong>Monitors</strong> run daily, weekly or monthly. After the first run, each run reads only pages newer than the last (with a few
          days of overlap for search indexing). Pages seen before keep their status.
        </li>
      </ul>

      <h2 id="security">Security</h2>
      <ul>
        <li>YepAPI keys are encrypted at rest and never returned by the API.</li>
        <li>OpenReach API keys are stored as hashes and shown once.</li>
        <li>Paid calls are never retried after a server error or a lost connection, since they may already have been billed.</li>
        <li>
          Spending is capped by your monthly limit and by the ceiling you give each call. See <Link href="/docs/costs-and-limits">Costs, caching and limits</Link>.
        </li>
      </ul>
    </DocArticle>
  );
}
