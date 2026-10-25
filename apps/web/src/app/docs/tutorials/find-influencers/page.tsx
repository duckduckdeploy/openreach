import Link from 'next/link';
import { Callout, Step, Steps, Ui } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'tutorials/find-influencers';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function FindInfluencersPage() {
  return (
    <DocArticle slug={slug} brands={['youtube', 'tiktok', 'instagram']}>
      <p>
        You will search a niche, shortlist creators who really cover it, check their reach, and save the ones worth contacting to a project. It takes
        about ten minutes and well under a dollar of data.
      </p>

      <h2 id="steps">Find influencers step by step</h2>
      <Steps>
        <Step title="Pick the words your audience uses">
          <p>
            Creators describe their videos the way viewers search for them. Use two or three phrasings of your niche: <em>home espresso</em>,{' '}
            <em>espresso machine review</em>, <em>latte art</em>. Your project’s niche words are a good start.
          </p>
        </Step>
        <Step title="Search one platform">
          <p>
            Open <Ui>Influencers</Ui> in your project, then <Ui>Find creators</Ui>. Pick YouTube, TikTok or Instagram and a country, type a phrasing
            and press <Ui>Find creators</Ui>. Creators who made several matching videos, and got views on them, rank first.
          </p>
        </Step>
        <Step title="Filter for the size you want">
          <p>
            Open <Ui>Filters</Ui>. <Link href="/glossary/micro-influencer">Micro creators</Link>, with 10,000 to 100,000 followers, often charge less and get more engagement than big accounts.
            Filters are free: they work on the results already on screen.
          </p>
        </Step>
        <Step title="Analyse the shortlist">
          <p>
            Select up to 25 creators and press <Ui>Analyse</Ui>. OpenReach reads each profile and recent posts: average views, likes and comments,
            <Link href="/glossary/engagement-rate">engagement rate</Link>, posts per week, the last post, and emails or links in the bio.
          </p>
          <p>Look at average views, not followers, and skip accounts that have not posted for a month.</p>
        </Step>
        <Step title="Save and track outreach">
          <p>
            Press <Ui>Save</Ui>. Saved creators keep their numbers, and you can set a status (to contact, contacted, replied, won or not a fit),
            add notes on what you sent and tag them by campaign.
          </p>
        </Step>
      </Steps>

      <Callout tone="cost" title="What it costs">
        <p>A search is $0.02 a page on YouTube and TikTok, $0.03 on Instagram. Analysing a creator is $0.02 to $0.03. Repeats are free for a day.</p>
      </Callout>

      <h2 id="lookalikes">Grow the list with lookalikes</h2>
      <p>
        On Instagram, open a creator you like in the <Link href="/tools/engagement-rate-calculator">creator analyser</Link> and ask for similar
        accounts: Instagram’s own suggestions, $0.01.
      </p>

      <h2 id="reach-out">Reach out yourself</h2>
      <p>
        OpenReach does not send messages. Write to each creator yourself, mention a recent post of theirs, and say clearly what you offer. Then update
        their status so you know who to follow up with.
      </p>
    </DocArticle>
  );
}
