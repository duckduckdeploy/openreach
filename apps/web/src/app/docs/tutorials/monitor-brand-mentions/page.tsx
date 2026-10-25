import { Callout, Step, Steps, Ui } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'tutorials/monitor-brand-mentions';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function MonitorMentionsPage() {
  return (
    <DocArticle slug={slug} brands={['reddit', 'ycombinator', 'github', 'stackoverflow', 'quora']}>
      <p>
        You will set up a brand monitor that checks your communities every day, then work through the feed: reply where it helps, mark what you have
        done, ignore the rest.
      </p>

      <h2 id="steps">Monitor brand mentions step by step</h2>
      <Steps>
        <Step title="List your brand terms">
          <p>
            Your product’s name, your domain and common spellings, up to five. If your name is also a common word, add words to leave out: a product
            called <em>Notion</em> would leave out <em>idea</em>, a tool called <em>Bolt</em> might leave out <em>screw</em>.
          </p>
        </Step>
        <Step title="Create the monitor">
          <p>
            Open <Ui>Brand mentions</Ui> and press <Ui>Create a brand monitor</Ui>. The default communities cover Reddit, Hacker News, GitHub, Stack
            Overflow, Quora, X, LinkedIn, Product Hunt, review sites and more; add or remove any. Pick daily or weekly.
          </p>
          <p>The first run starts at once and looks back a few weeks. After that, each run reads only what is new.</p>
        </Step>
        <Step title="Work through the feed">
          <p>
            New mentions appear with their community, age, reply count and sentiment. Reply to questions and comparisons while they are fresh, then
            press <Ui>Replied</Ui>. Press <Ui>Ignore</Ui> for noise.
          </p>
        </Step>
        <Step title="See where you are discussed">
          <p>The monitor ranks the communities that mention you most. Those are the places worth a regular presence.</p>
        </Step>
      </Steps>

      <Callout tone="cost" title="What it costs">
        <p>
          $0.01 per community searched through Google, per brand term. Hacker News, GitHub and Stack Overflow are free. The monitor shows its price
          per run and per month before you save it; the optional AI check adds from $0.01 per 25 new results.
        </p>
      </Callout>

      <h2 id="replying">How to reply well</h2>
      <ul>
        <li>Say who you are. Communities forgive a founder answering a question; they do not forgive a disguised ad.</li>
        <li>Answer the question first. Link only when it helps.</li>
        <li>Read each community’s rules. Many ban self-promotion outside a weekly thread.</li>
      </ul>
    </DocArticle>
  );
}
