import Link from 'next/link';
import { Callout, DocTable, Step, Steps, Ui } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'tutorials/find-clients';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function FindClientsPage() {
  return (
    <DocArticle slug={slug} brands={['googlemaps', 'reddit', 'quora']}>
      <p>
        This guide is for freelancers, agencies and small B2B services: web design, bookkeeping, marketing, IT support, photography, consulting. It
        covers seven ways to find clients that work without a big budget, how to choose the two or three that fit your service, and how to run
        them each week with OpenReach so the work does not depend on luck or on remembering.
      </p>

      <h2 id="start">Start with who you help and what changes for them</h2>
      <p>
        Every channel below works better when you can say in one sentence who your client is and what you change for them. “I build websites for
        plumbers who only have a Facebook page” finds clients. “I do web design” does not, because it gives you nowhere to look and gives the
        client no reason to answer.
      </p>
      <p>
        Write down your <Link href="/glossary/ideal-customer-profile">ideal customer profile</Link>: the type of business, its size, where it is,
        and the sign that it needs you. That last part matters most, because a sign you can see from outside is what turns a vague market into a{' '}
        <Link href="/glossary/lead-list">lead list</Link>:
      </p>
      <ul>
        <li>A business with no website, or one that has not been updated in years.</li>
        <li>A business with few reviews, or a low rating, in a trade where reviews decide who gets the call.</li>
        <li>A founder asking in a community how to do the thing you do for a living.</li>
        <li>A company hiring for a role you could cover part-time or as a project.</li>
      </ul>

      <h2 id="channels">Seven ways to find clients</h2>
      <DocTable
        caption="Ways to find clients compared"
        head={['Channel', 'Best for', 'How fast', 'What it takes']}
        rows={[
          ['Local businesses on Google Maps', 'Services for local trades and shops', 'Days', 'A clear pitch and a filter for the sign that they need you'],
          ['Communities where people ask for help', 'Freelancers, B2B services, software', 'Days to weeks', 'Useful answers, as yourself, without pitching first'],
          ['Referrals from past clients', 'Anyone with a few happy clients', 'Weeks', 'Asking, at the right moment'],
          ['Partners who serve the same clients', 'Agencies and specialists', 'Weeks to months', 'A partner whose clients need you, and a reason to refer'],
          ['Content that answers buyer questions', 'Expertise that is searched for', 'Months', 'Regular writing or video'],
          ['Your existing network', 'New freelancers', 'Days', 'Telling people clearly what you do now'],
          ['Job boards and project marketplaces', 'Filling gaps between clients', 'Days', 'Fast proposals; competition on price'],
        ]}
      />

      <h3>1. Local businesses on Google Maps</h3>
      <p>
        Google Maps lists almost every local business with its category, address, phone, website, rating and number of reviews. That makes it the
        best source for anyone who sells to local trades, because the sign that a business needs you is often right there in the listing: no
        website, few reviews, a low rating, or hours that were never filled in.
      </p>
      <p>
        Search one type of business in one place, such as <em>dentist</em> in <em>Leeds</em>, and filter for your sign. The{' '}
        <Link href="/tools/lead-finder">lead finder</Link> does this with rules you can combine (rating under 4.0, fewer than 20 reviews, no
        website) and keeps the matches as a list. For web designers the{' '}
        <Link href="/tools/businesses-without-websites">businesses without websites</Link> tool has the filter ready.
      </p>

      <h3>2. Communities where people ask for help</h3>
      <p>
        Every day, people post in Reddit, Quora, Indie Hackers and industry forums asking for exactly what freelancers and agencies sell: “can
        anyone recommend a bookkeeper who knows Shopify”, “how do I get my site to show up on Google”, “looking for someone to fix our WordPress
        site”. A helpful, specific answer from someone who clearly knows the work is the best introduction there is.
      </p>
      <p>
        The rule is to answer the question first. Explain what to do, and mention that you do this for a living only when it is relevant and the
        community allows it. The <Link href="/tools/reddit-lead-generation">customer finder</Link> finds these posts and ranks them by buying
        intent; the <Link href="/docs/tutorials/find-customers-on-reddit">Reddit customer tutorial</Link> covers how to reply.
      </p>

      <h3>3. Referrals from past clients</h3>
      <p>
        A happy client is the warmest lead source you have, but most people only refer when asked. Ask at the moment the client is happiest: when
        the project launches, when they thank you, when a result comes in. Make it specific: “Do you know another salon owner who has the same
        problem with bookings?” is easier to answer than “let me know if you know anyone”. A short{' '}
        <Link href="/glossary/case-study">case study</Link> or <Link href="/glossary/testimonial">testimonial</Link> from the same project gives
        the next client a reason to trust you.
      </p>

      <h3>4. Partners who serve the same clients</h3>
      <p>
        Someone already works with your future clients and does not do what you do. A web designer and a copywriter, a bookkeeper and a business
        lawyer, a photographer and a wedding planner. Find two or three such partners and refer work to each other. It is slow to set up and then
        keeps bringing clients for years.
      </p>

      <h3>5. Content that answers buyer questions</h3>
      <p>
        Write or record the answers to the questions your clients ask before they hire someone: what it costs, how long it takes, what to look out
        for. It takes months to work, but it brings clients who already trust you. The questions people post in communities are the best list of
        topics: they are real, and they are phrased the way buyers search.
      </p>

      <h3>6. Your existing network</h3>
      <p>
        Former colleagues, past employers and friends who run businesses. When you start out, tell them clearly what you do now and who for. One
        message per person, personal, with no pressure, is enough; many first clients come from here.
      </p>

      <h3>7. Job boards and project marketplaces</h3>
      <p>
        They bring work quickly, but you compete with many others on price, and the platform owns the relationship. Use them to fill gaps between
        clients, not as the plan.
      </p>

      <h2 id="choose">How to choose your channels</h2>
      <p>
        Pick two or three channels and run them every week, rather than trying all seven once. A useful split is one fast channel (Google Maps or
        communities), one slow one that compounds (referrals, partners or content), and your network while you start. Track each lead in a list
        with where it came from, so after a month you know which channel is worth your time.
      </p>

      <h2 id="workflow">Find clients with OpenReach, step by step</h2>
      <Steps>
        <Step title="Create a project for your service">
          <p>
            In the app, create a project with your service, the clients you want and the place you work. The project keeps your leads, the
            conversations you found and your notes together.
          </p>
        </Step>
        <Step title="Build a local lead list">
          <p>
            Open <Ui>Leads</Ui>, run a <Ui>Quick search</Ui> for your type of client in your city and apply your filter. When the filter looks
            right, start a <Ui>Lead search</Ui> across several towns or a whole city. The{' '}
            <Link href="/docs/tutorials/build-a-lead-list">lead list tutorial</Link> covers this in detail.
          </p>
        </Step>
        <Step title="Find people asking for your service">
          <p>
            Open the customer finder, describe the problems you solve the way a client would write them (<em>need a new website for my bakery</em>
            , <em>bookkeeper for small business</em>), and keep the posts with the highest intent. Set up a conversation monitor so new ones reach
            you.
          </p>
        </Step>
        <Step title="Reach out yourself">
          <p>
            OpenReach finds the businesses and the conversations and shows their public contacts; it never sends messages for you. Write each first
            message yourself and keep it short and specific. The{' '}
            <Link href="/templates/cold-email-templates">cold email templates</Link> are a starting point, and{' '}
            <Link href="/glossary/cold-email">cold email</Link> explains the rules that apply.
          </p>
        </Step>
        <Step title="Follow up and keep score">
          <p>
            Set each lead’s status as you go (to contact, contacted, replied, won), keep notes, and send one or two polite follow-ups. Export the list
            as CSV whenever you want it in a spreadsheet or a <Link href="/glossary/crm">CRM</Link>.
          </p>
        </Step>
      </Steps>

      <Callout tone="cost" title="What it costs">
        <p>
          OpenReach is free and open source; searches use your own YepAPI key. A Google Maps page of up to 20 businesses is $0.07, a homepage read
          for an email is $0.01, and a community search is $0.01 per source and phrasing. Saving, statuses, notes and export are free.
        </p>
      </Callout>

      <h2 id="mistakes">Mistakes that cost clients</h2>
      <ul>
        <li>
          <strong>Sending the same message to everyone.</strong> A message that could go to any business gets ignored by all of them. Mention
          something you saw: their listing, their site, their post.
        </li>
        <li>
          <strong>Pitching in communities.</strong> Posting your offer where people asked for help gets removed and can get you banned. Answer the
          question; let them ask about you.
        </li>
        <li>
          <strong>Giving up after one message.</strong> Many replies come after the second or third. Follow up politely, then stop.
        </li>
        <li>
          <strong>Buying lists.</strong> Bought lists are out of date, often break the law where you send them, and hurt your email
          deliverability. Build your own from public listings and real requests.
        </li>
      </ul>

      <Callout title="Selling websites?">
        <p>
          The <Link href="/docs/tutorials/sell-websites-to-local-businesses">how to sell websites to local businesses</Link> guide goes further for
          web designers: qualifying leads, the pitch and pricing.
        </p>
      </Callout>
    </DocArticle>
  );
}
