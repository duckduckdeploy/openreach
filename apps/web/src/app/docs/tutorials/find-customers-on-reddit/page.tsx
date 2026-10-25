import Link from 'next/link';
import { Callout, Step, Steps, Ui } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'tutorials/find-customers-on-reddit';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function FindCustomersPage() {
  return (
    <DocArticle slug={slug} brands={['reddit', 'quora', 'ycombinator']}>
      <p>
        You will find people asking for what your product does, pick the subreddits where those questions keep coming up, and set up a monitor so new
        ones reach you. No spam: you answer as yourself.
      </p>

      <h2 id="steps">Find customers step by step</h2>
      <Steps>
        <Step title="Describe the problem, not the product">
          <p>
            Buyers do not search for your product’s name. Write one to three problems the way they would: <em>crm for small business</em>,{' '}
            <em>track freelance invoices</em>. Add your main competitors: people unhappy with them are warm leads.
          </p>
        </Step>
        <Step title="Search">
          <p>
            Open the <Link href="/tools/reddit-lead-generation">customer finder</Link>. OpenReach searches Reddit, Quora, Hacker News, Stack
            Overflow, Indie Hackers and more with request phrasings (“best …”, “looking for …”, “alternative to …”) and ranks the results by intent.
          </p>
          <p>
            Turn on <Ui>AI check</Ui> when your problem is broad: it drops posts that are not real requests and explains the rest in a line.
          </p>
        </Step>
        <Step title="Pick your subreddits">
          <p>
            The <Link href="/tools/subreddit-finder">subreddit finder</Link> ranks subreddits by how often your topic comes up, the replies those
            threads get and how recent they are. Choose two or three to become a regular in.
          </p>
        </Step>
        <Step title="Reply the right way">
          <ul>
            <li>
              Read the rules and the pinned posts first: most subreddits limit <Link href="/glossary/self-promotion">self-promotion</Link>.
            </li>
            <li>Answer the question, mention alternatives honestly, and name your product once, saying it is yours.</li>
            <li>Answer questions for a couple of weeks before you ever mention what you sell.</li>
          </ul>
        </Step>
        <Step title="Keep listening">
          <p>
            In your project, open <Ui>Customer conversations</Ui> and create a conversation monitor with the same problems and competitors. New
            threads arrive in the feed, highest intent first.
          </p>
        </Step>
      </Steps>

      <Callout tone="cost" title="What it costs">
        <p>
          $0.01 per community searched through Google, per phrasing; a search over the default communities is about $0.15 to $0.40. The subreddit
          finder is about $0.06 a topic. A self-hosted install with Reddit API credentials searches Reddit for free.
        </p>
      </Callout>
    </DocArticle>
  );
}
