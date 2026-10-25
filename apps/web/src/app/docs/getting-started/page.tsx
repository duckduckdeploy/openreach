import Link from 'next/link';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';
import { SIGN_UP_URL, YEPAPI_URL } from '@/lib/site';

const slug = 'getting-started';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function GettingStartedPage() {
  return (
    <DocArticle slug={slug}>
      <p>
        This guide covers the hosted version of OpenReach. To run it on your own machine instead, see <Link href="/docs/self-hosting">Self-hosting</Link>.
      </p>
      <p>
        OpenReach is open-source software. Data such as creator profiles, Google Maps results and search results comes from our data provider,
        YepAPI: you add your own key, and YepAPI bills each lookup to it. A monthly limit in Settings caps what you spend.
      </p>

      <h2 id="yepapi-account">1. Create a YepAPI account</h2>
      <p>
        Sign up at{' '}
        <a href={YEPAPI_URL} rel="noopener">
          yepapi.com
        </a>
        . For a limited time, new accounts get <strong>$5 in free credit</strong>, so you can try every OpenReach tool before adding any money. Then
        create an API key in your YepAPI account.
      </p>

      <h2 id="openreach-account">2. Create an OpenReach account</h2>
      <p>
        <a href={SIGN_UP_URL}>Sign up for OpenReach</a>. The account is free.
      </p>

      <h2 id="paste-key">3. Paste your YepAPI key</h2>
      <p>
        Add your YepAPI key in Settings. OpenReach checks it for free and stores it encrypted. From then on, every lookup is sent to YepAPI with your
        key and billed to your YepAPI account.
      </p>

      <h2 id="project">4. Create a project for your product</h2>
      <p>
        A project is one product you are finding customers for. Give it a name, the website, a sentence on what it does and for whom, and a few niche
        and problem words, such as <em>home espresso</em> or <em>crm for small business</em>. Searches start from those words, and saved creators,
        leads and monitors live in the project.
      </p>

      <h2 id="first-search">5. Run your first search</h2>
      <ul>
        <li>
          <Link href="/docs/tutorials/find-influencers">Find influencers</Link> on YouTube, TikTok or Instagram for your niche.
        </li>
        <li>
          <Link href="/docs/tutorials/build-a-lead-list">Build a lead list</Link> of local businesses from Google Maps.
        </li>
        <li>
          <Link href="/docs/tutorials/monitor-brand-mentions">Monitor brand mentions</Link> across Reddit, Hacker News, GitHub and more.
        </li>
        <li>
          <Link href="/docs/tutorials/find-customers-on-reddit">Find customers on Reddit</Link> who ask for what you sell.
        </li>
      </ul>
      <p>As a guide, $5 of credit covers roughly one of these:</p>
      <ul>
        <li>about 1,400 businesses from Google Maps, or</li>
        <li>about 200 creators analysed, or</li>
        <li>about 30 brand mention checks over 15 communities.</li>
      </ul>

      <h2 id="limit">Set a monthly limit</h2>
      <p>
        Under Settings and usage you can set a monthly spending limit. OpenReach checks it before every paid call, including lead searches, scheduled
        monitors and agents, and stops there. See <Link href="/docs/costs-and-limits">Costs, caching and limits</Link>.
      </p>

      <h2 id="credits">When credits run out</h2>
      <p>Lookups stop until you add credit in your YepAPI account. Everything you have saved keeps working. OpenReach cannot top up for you and never charges you.</p>
    </DocArticle>
  );
}
