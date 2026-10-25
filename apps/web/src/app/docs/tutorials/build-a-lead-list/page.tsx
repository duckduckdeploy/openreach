import Link from 'next/link';
import { Callout, Step, Steps, Ui } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'tutorials/build-a-lead-list';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function BuildLeadListPage() {
  return (
    <DocArticle slug={slug} brands={['googlemaps']}>
      <p>
        You will turn your pitch into a filter, check it on one search, then run it across several towns or a whole city and keep the matches as a
        lead list with emails.
      </p>

      <h2 id="steps">Build a lead list step by step</h2>
      <Steps>
        <Step title="Turn your pitch into rules">
          <p>Decide what makes a business a lead. Common pitches have ready-made filters:</p>
          <ul>
            <li>
              <strong>No website</strong>: for web designers. A Facebook page or Linktree does not count as a website.
            </li>
            <li>
              <strong>Under 20 reviews</strong>: for review and reputation services.
            </li>
            <li>
              <strong>Rated under 4.0</strong>: for reputation management.
            </li>
            <li>
              <strong>Established, with a website</strong>: for SEO, ads and software.
            </li>
          </ul>
          <p>Combine your own rules with all or any: rating, reviews, website, phone, category, a word in the name.</p>
        </Step>
        <Step title="Try it on one search">
          <p>
            Open <Ui>Leads</Ui>, then <Ui>Quick search</Ui>. Search a type of business in a place, such as <em>plumber</em> in{' '}
            <em>Austin, TX</em>, and apply your filter. If too few or too many pass, adjust the rules before you spend more.
          </p>
        </Step>
        <Step title="Run a lead search">
          <p>
            Open <Ui>Lead searches</Ui> and press <Ui>New lead search</Ui>. Add your queries, one per line, and either a list of places or{' '}
            <Ui>Cover a city</Ui>: a grid of points over a city with the spacing you choose. One Maps search stops at 60 places; a grid finds the ones
            it misses.
          </p>
          <p>Add your rules under “What makes a place a lead”. OpenReach shows how many searches it will run before it starts.</p>
        </Step>
        <Step title="Find emails">
          <p>
            In the <Ui>Lead list</Ui>, select leads with a website and press <Ui>Find emails</Ui>. OpenReach reads each homepage for a contact address.
          </p>
        </Step>
        <Step title="Work the list">
          <p>Set each lead’s status as you call or write, keep notes, and export a CSV for your CRM whenever you like.</p>
        </Step>
      </Steps>

      <Callout tone="cost" title="What it costs">
        <p>
          $0.07 per Google Maps page of up to 20 businesses, $0.01 per homepage read for emails. A 4 × 4 grid with one query and one page is 16
          searches, about $1.12.
        </p>
      </Callout>

      <p>
        Prefer to try it first without an account? The <Link href="/tools/businesses-without-websites">businesses without websites</Link> page runs
        a free search.
      </p>
    </DocArticle>
  );
}
