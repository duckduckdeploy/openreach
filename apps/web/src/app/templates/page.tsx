import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CtaBand } from '@/components/cta-band';
import { JsonLd } from '@/components/json-ld';
import { templatePages } from '@/content/templates';
import { pageMeta } from '@/lib/metadata';
import { breadcrumbList } from '@/lib/schema';
import { SITE_URL } from '@/lib/site';

export const metadata = pageMeta({
  title: 'Outreach Email Templates for Sales and Creators',
  description: 'Outreach email templates to copy: cold emails for B2B and local businesses, polite follow-ups, and influencer pitches for paid, gifted and affiliate deals.',
  path: '/templates',
});

export default function TemplatesPage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: 'Outreach email templates',
              url: `${SITE_URL}/templates`,
              hasPart: templatePages.map((page) => ({ '@type': 'WebPage', name: page.h1, url: `${SITE_URL}/templates/${page.slug}` })),
            },
            breadcrumbList([{ name: 'Email templates', path: '/templates' }]),
          ],
        }}
      />
      <section aria-labelledby="templates-title" className="container-page py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{templatePages.reduce((sum, page) => sum + page.templates.length, 0)} templates</p>
          <h1 id="templates-title" className="text-display mt-5 text-balance">
            Outreach email templates
          </h1>
          <p className="mt-7 text-xl leading-relaxed text-pretty text-muted">
            Short, honest emails for a first contact, a follow-up and a creator pitch. Each one has a gap for something true about the reader, and a note on
            why it works.
          </p>
        </div>
        <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
          {templatePages.map((page) => (
            <li key={page.slug} className="card card-link group relative flex flex-col p-6">
              <h2 className="text-heading">
                <Link href={`/templates/${page.slug}`} className="after:absolute after:inset-0 group-hover:text-accent-text focus-visible:outline-none">
                  {page.h1}
                </Link>
              </h2>
              <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-muted">{page.description}</p>
              <ul className="mt-5 space-y-1.5 text-sm text-muted">
                {page.templates.map((template) => (
                  <li key={template.id}>· {template.title}</li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-text">
                {page.templates.length} templates
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-12 max-w-2xl text-center text-[0.9375rem] text-muted">
          OpenReach finds the people these emails are for and keeps track of who you wrote to. It never sends email or messages for you.
        </p>
      </section>
      <CtaBand />
    </>
  );
}
