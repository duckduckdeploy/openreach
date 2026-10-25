import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CtaBand } from '@/components/cta-band';
import { GlossarySearch } from '@/components/glossary-search';
import { HatBadge } from '@/components/hat-badge';
import { JsonLd } from '@/components/json-ld';
import { plainText } from '@/components/rich-text';
import { categoryName, getTerm, glossary, glossaryCategories, hatLabels, letterOf, shortName, termsIn, type GlossaryHat } from '@/content/glossary';
import { pageMeta } from '@/lib/metadata';
import { breadcrumbList } from '@/lib/schema';
import { SITE_URL } from '@/lib/site';

/** The count in the title, rounded down to the ten: "160+". */
const COUNT = `${Math.floor(glossary.length / 10) * 10}+`;

// "marketing terms" and "marketing terminology" (1,000/mo, KD 9) are the hub's head keywords; "marketing glossary" is far smaller.
export const metadata = pageMeta({
  title: `Marketing Terms Glossary: ${COUNT} Definitions`,
  description: `${COUNT} marketing terms in plain English: influencer marketing, lead generation, cold email, social listening, Reddit and startup growth.`,
  path: '/glossary',
});

const START_HERE = ['influencer-marketing', 'engagement-rate', 'lead-generation', 'ideal-customer-profile', 'cold-email', 'social-listening', 'reddit-marketing', 'product-market-fit', 'astroturfing'];
const HATS: GlossaryHat[] = ['white', 'grey', 'black'];

export default function GlossaryPage() {
  const startHere = START_HERE.map(getTerm).filter((term) => term !== undefined);
  const entries = glossary.map((term) => ({
    slug: term.slug,
    term: term.term,
    aka: term.aka ?? [],
    short: plainText(term.short),
    category: term.category,
    hat: term.hat,
    letter: letterOf(term),
  }));

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'DefinedTermSet',
              name: 'OpenReach marketing glossary',
              url: `${SITE_URL}/glossary`,
              hasDefinedTerm: glossary.map((term) => ({
                '@type': 'DefinedTerm',
                name: term.term,
                description: plainText(term.short),
                url: `${SITE_URL}/glossary/${term.slug}`,
              })),
            },
            breadcrumbList([{ name: 'Marketing glossary', path: '/glossary' }]),
          ],
        }}
      />

      <section aria-labelledby="glossary-title" className="band-cream relative overflow-hidden">
        <div className="bg-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="container-page relative py-20 text-center md:py-28">
          <p className="eyebrow">{glossary.length} terms</p>
          <h1 id="glossary-title" className="text-display mx-auto mt-5 max-w-3xl text-balance">
            Marketing terms
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-pretty text-muted">
            The marketing terminology you meet when you look for customers, leads and creators, explained in plain English:
            what each term means, why it matters and what to do about it. Every technique is labelled white, grey or black hat.
          </p>
          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-x-6 gap-y-3 text-[0.9375rem] text-muted">
            {HATS.map((hat) => (
              <li key={hat} className="inline-flex items-center gap-2">
                <HatBadge hat={hat} />
                {hatLabels[hat].summary}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Start here */}
      <section aria-labelledby="start-title" className="container-page py-20 md:py-24">
        <h2 id="start-title" className="text-title text-center">
          Start here
        </h2>
        <ul className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {startHere.map((term) => (
            <li key={term.slug} className="card card-link group relative flex flex-col p-6">
              <p className="text-xs font-semibold tracking-wide text-orange-text uppercase">{categoryName(term.category)}</p>
              <h3 className="card-title mt-2">
                <Link href={`/glossary/${term.slug}`} className="after:absolute after:inset-0 group-hover:text-accent-text focus-visible:outline-none">
                  {shortName(term)}
                </Link>
              </h3>
              <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-muted">{plainText(term.short)}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-text" aria-hidden="true">
                Read
                <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* By topic */}
      <section aria-labelledby="topics-title" className="band-peach">
        <div className="container-page py-20 md:py-24">
          <h2 id="topics-title" className="text-title text-center">
            Marketing terms by topic
          </h2>
          <ul className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {glossaryCategories.map((category) => (
              <li key={category.id} className="card card-link group relative block p-6">
                <h3 className="card-title">
                  <Link href={`/glossary/topics/${category.id}`} className="after:absolute after:inset-0 group-hover:text-accent-text focus-visible:outline-none">
                    {category.heading}
                  </Link>
                </h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted">{category.summary}</p>
                <p className="mt-5 inline-flex rounded-full bg-peach px-3 py-1 text-sm font-semibold text-peach-text">{termsIn(category.id).length} terms</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* A to Z, with search and a topic filter */}
      <section aria-labelledby="az-title" className="container-page py-20 md:py-24">
        <h2 id="az-title" className="text-title text-center">
          Marketing terms A to Z
        </h2>
        <GlossarySearch entries={entries} categories={glossaryCategories.map(({ id, name }) => ({ id, name }))} />
      </section>
      <CtaBand title="Put the terms to work" body="OpenReach finds the creators, leads and conversations these terms describe. It is open source: start online in a minute, or run it on your own server." />
    </>
  );
}
