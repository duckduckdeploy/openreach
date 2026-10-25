import Link from 'next/link';
import { Callout, DocTable, Step, Steps, Ui } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'tutorials/sell-websites-to-local-businesses';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function SellWebsitesPage() {
  return (
    <DocArticle slug={slug} brands={['googlemaps']}>
      <p>
        Plenty of local businesses still have no website, or one that does them more harm than good. They are the easiest web design clients to
        find, because the need is visible from outside. This guide covers finding them, deciding which are worth contacting, pitching honestly in
        person, by phone or by email, pricing, and following up.
      </p>

      <h2 id="why">Why local businesses still need websites</h2>
      <p>
        Many small businesses run on word of mouth, a Facebook page and their Google listing. That works until someone searches for the service,
        compares two businesses and picks the one with a site that shows prices, photos, opening hours and a way to book. A good pitch is not “you
        need a website”: it is “people searching for you can’t find what they need, and here is what that costs you”.
      </p>

      <h2 id="find">Find businesses without websites</h2>
      <p>
        Google Maps shows whether a business has listed a website. Search one trade in one place (<em>roofer</em> in <em>Columbus, OH</em>) and
        keep the businesses with no website. Social pages, link-in-bio pages and directory listings do not count as a website: a business with
        only a Facebook page is still a lead.
      </p>
      <p>
        The <Link href="/tools/businesses-without-websites">businesses without websites</Link> tool does this search for any trade and city. To
        cover a whole city or many towns, use a lead search in the app with the <Ui>No website</Ui> preset; one Maps search stops at 60 places,
        so a grid over the city finds the ones a single search misses.
      </p>

      <h3>Trades worth trying first</h3>
      <p>
        Trades where customers compare before calling, and where a single job is worth a lot, tend to see the value of a site fastest:
      </p>
      <ul>
        <li>Home services: roofers, plumbers, electricians, landscapers, cleaners, pest control.</li>
        <li>Health and beauty: salons, barbers, physiotherapists, dentists, personal trainers.</li>
        <li>Food: restaurants, cafés, bakeries and caterers, where menus and opening hours drive visits.</li>
        <li>Venues and events: wedding venues, photographers, party hire.</li>
      </ul>

      <h2 id="weak-sites">Find businesses with weak websites</h2>
      <p>
        A business with a bad site is often a better client than one with none: it already believes in having a website and has paid for one
        before. Signs to look for:
      </p>
      <ul>
        <li>The site is not secure (no HTTPS), or the browser warns about it.</li>
        <li>It is hard to use on a phone: tiny text, pinch to zoom, buttons too close together.</li>
        <li>Opening hours, prices or the phone number differ from the Google listing.</li>
        <li>The copyright year in the footer is many years old, or there is no way to book or get a quote.</li>
      </ul>
      <p>
        In the <Link href="/tools/lead-finder">lead finder</Link>, search with the <Ui>Established, with a website</Ui> preset to get businesses
        with good reviews and a site, then open the sites to judge them yourself.
      </p>

      <h2 id="qualify">Qualify leads before you pitch</h2>
      <p>Not every business without a website is a good lead. Before you contact one, check:</p>
      <DocTable
        caption="How to qualify a web design lead"
        head={['Check', 'Good sign', 'Bad sign']}
        rows={[
          ['Business status', 'Open, with hours filled in', 'Temporarily or permanently closed'],
          ['Reviews', 'Steady recent reviews: real customers, real money', 'No reviews, or the last one years ago'],
          ['Rating', 'Good rating: a site helps them win more of the same', 'Very low rating: fix the service before the site'],
          ['Phone', 'A phone number you can call', 'No way to reach them'],
          ['Competition', 'Rivals nearby have websites', 'Nobody in the trade locally has one yet (harder to sell)'],
        ]}
      />
      <p>
        Rules in OpenReach can do most of this for you: <em>business status is operational</em>, <em>no website</em>, <em>at least 10
        reviews</em>, <em>rating 4.0 or more</em>, combined with all or any.
      </p>

      <h2 id="pitch">How to pitch a website honestly</h2>
      <p>
        The pitch that works is specific, short and about the business, not about you. Before you contact anyone, look at what their customers see
        today: search for their trade in their town and see who comes up, and with what.
      </p>

      <h3>In person</h3>
      <p>
        For shops, salons and restaurants, walking in at a quiet time works better than any email. Ask for the owner, say who you are in one
        line, and show them one thing on your phone: their listing next to a competitor’s site. Leave a card and offer to send a short mock-up of
        their homepage.
      </p>

      <h3>By phone</h3>
      <p>
        Trades are often on a job and answer the phone between visits. Keep it to a minute: who you are, the one thing you noticed, and a
        question. “I saw you have great reviews on Google but no website, so people searching for a roofer in Columbus see your competitors’ sites
        first. Would it be useful if I sent you an example of what yours could look like?” Respect a no.
      </p>

      <h3>By email</h3>
      <p>
        Use the email on their listing or site, or a contact form. Write one email per business: mention their name, their trade, what you saw, and
        one concrete idea. Offer something small and free (a mock-up, a short review of their listing) rather than asking for a meeting. The{' '}
        <Link href="/templates/cold-email-templates">cold email templates</Link> include one for web designers. Follow the{' '}
        <Link href="/glossary/can-spam-act">CAN-SPAM Act</Link> and, in Europe, <Link href="/glossary/gdpr">GDPR</Link>: say who you are, give
        a way to opt out, and stop when asked.
      </p>

      <Callout tone="important" title="OpenReach never contacts anyone for you">
        <p>
          It finds the businesses and shows their public contact details. You write and send each message yourself, so every pitch is personal and
          you stay in control of what is sent in your name.
        </p>
      </Callout>

      <h2 id="pricing">How to price websites for local businesses</h2>
      <p>
        Prices vary too much by country, city and trade for a single number to be useful. Work it out from three things instead:
      </p>
      <ul>
        <li>
          <strong>Your costs and time:</strong> the hours a site takes you, what you need to earn per hour, plus hosting, domain and tools.
        </li>
        <li>
          <strong>What a customer is worth to them:</strong> if one extra job a month pays for the site in a few months, the price is easy to
          accept. Ask what an average job is worth.
        </li>
        <li>
          <strong>What happens after launch:</strong> many small businesses prefer a lower setup price and a monthly fee that covers hosting,
          updates and small changes. It gives you recurring income and gives them someone to call.
        </li>
      </ul>
      <p>Offer two or three packages with clear contents, so the conversation is about which one, not whether.</p>

      <h2 id="follow-up">Follow up without being pushy</h2>
      <p>
        Owners of small businesses are busy, and no reply usually means “not now”, not “no”. Send one{' '}
        <Link href="/templates/follow-up-email-template">follow-up</Link> after about a week with something new (the mock-up, a competitor’s
        site), and a last short one later. Then stop and mark the lead as not now; come back in a few months if something changes.
      </p>

      <h2 id="workflow">Find web design clients with OpenReach</h2>
      <Steps>
        <Step title="Search a trade in your area">
          <p>
            Open <Ui>Leads</Ui> and run a <Ui>Quick search</Ui>, such as <em>landscaper</em> in your city, with the <Ui>No website</Ui> preset.
            Adjust the rules (reviews, rating, business status) until the list looks like businesses you would want as clients.
          </p>
        </Step>
        <Step title="Cover the whole area">
          <p>
            Start a <Ui>Lead search</Ui> with several trades, one per line, across the towns you serve or a grid over your city. Each place is kept
            once, and the matches are added to the project’s lead list as the search runs.
          </p>
        </Step>
        <Step title="Contact, note and follow up">
          <p>
            Work through the list: call, visit or email, set each lead’s status, and note what you said and what they asked for. Export as CSV
            whenever you want.
          </p>
        </Step>
        <Step title="Upsell the businesses with weak sites">
          <p>
            Run a second search for the same trades with a website, open the sites, and add the weak ones to the list with a note on what to fix.
            Use <Ui>Find emails</Ui> to read a contact address from each homepage.
          </p>
        </Step>
      </Steps>

      <Callout tone="cost" title="What it costs">
        <p>
          $0.07 per Google Maps page of up to 20 businesses and $0.01 per homepage read for an email, on your own YepAPI key. Saving, statuses,
          notes and export are free.
        </p>
      </Callout>

      <p>
        For more channels beyond Google Maps, read <Link href="/docs/tutorials/find-clients">how to find clients</Link>.
      </p>
    </DocArticle>
  );
}
