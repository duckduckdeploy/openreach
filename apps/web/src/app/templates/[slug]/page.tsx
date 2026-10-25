import type { Metadata } from 'next';
import { Fragment } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { CopyButton } from '@/components/copy-button';
import { CtaBand } from '@/components/cta-band';
import { FaqList } from '@/components/faq';
import { JsonLd } from '@/components/json-ld';
import { RelatedTerms } from '@/components/related-terms';
import { plainText, RichText } from '@/components/rich-text';
import { copyText, getTemplatePage, templatePages, type EmailTemplate } from '@/content/templates';
import { pageMeta } from '@/lib/metadata';
import { breadcrumbList, faqPage } from '@/lib/schema';

interface TemplatePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return templatePages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: TemplatePageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getTemplatePage(slug);
  if (!page) return {};
  return pageMeta({ title: page.seoTitle, description: page.description, path: `/templates/${page.slug}` });
}

const textLink = 'inline-flex items-center gap-1.5 font-medium text-accent-text underline-offset-4 hover:underline';

/** A dark panel with the subject line and the email, and a button that copies both. */
function EmailBox({ template }: { template: EmailTemplate }) {
  return (
    <figure className="min-w-0 overflow-hidden rounded-lg border border-code-line bg-code text-code-fg shadow-hard">
      <figcaption className="flex min-h-11 items-center justify-between gap-3 border-b border-code-line py-2 pr-1.5 pl-4">
        <span className="min-w-0 font-mono text-xs text-code-muted">
          Subject: <span className="text-code-fg">{template.subjects[0]}</span>
        </span>
        <CopyButton text={copyText(template)} />
      </figcaption>
      <pre className="overflow-x-auto p-5 font-sans text-[0.9375rem] leading-relaxed whitespace-pre-wrap" tabIndex={0}>
        {template.body}
      </pre>
    </figure>
  );
}

export default async function TemplatePage({ params }: TemplatePageProps) {
  const { slug } = await params;
  const page = getTemplatePage(slug);
  if (!page) notFound();
  const others = templatePages.filter((other) => other.slug !== page.slug);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            faqPage(page.faqs),
            breadcrumbList([
              { name: 'Email templates', path: '/templates' },
              { name: page.name, path: `/templates/${page.slug}` },
            ]),
          ],
        }}
      />

      <article className="container-page py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/templates" className="font-medium text-accent-text hover:underline">
              Email templates
            </Link>
          </nav>

          <h1 className="text-title mt-6 text-balance">{page.h1}</h1>

          <div className="prose-doc mt-8">
            {page.intro.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} />
              </p>
            ))}
            <p>
              <strong>On this page:</strong>
            </p>
            <ol>
              {page.templates.map((template) => (
                <li key={template.id}>
                  <a href={`#${template.id}`}>{template.title}</a>
                </li>
              ))}
            </ol>

            <h2 id="templates">{page.templatesTitle}</h2>
            <p>Words in braces, like {'{first_name}'}, are placeholders: replace every one before you send. The copy button copies the first subject line and the email.</p>
            {page.templates.map((template, index) => (
              <Fragment key={template.id}>
                <h3 id={template.id}>
                  {index + 1}. {template.title}
                </h3>
                <p>
                  <RichText text={template.when} />
                </p>
                <EmailBox template={template} />
                {template.subjects.length > 1 ? (
                  <p>
                    <strong>Other subject lines:</strong> {template.subjects.slice(1).join(' · ')}
                  </p>
                ) : null}
                <p>
                  <strong>Why it works</strong>
                </p>
                <ul>
                  {template.why.map((point) => (
                    <li key={point}>
                      <RichText text={point} />
                    </li>
                  ))}
                </ul>
              </Fragment>
            ))}

            {page.sections.map((section) => (
              <Fragment key={section.id}>
                <h2 id={section.id}>{section.title}</h2>
                {section.body?.map((paragraph) => (
                  <p key={paragraph}>
                    <RichText text={paragraph} />
                  </p>
                ))}
                {section.list?.length ? (
                  <ul>
                    {section.list.map((item) => (
                      <li key={item}>
                        <RichText text={item} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.after?.map((paragraph) => (
                  <p key={paragraph}>
                    <RichText text={paragraph} />
                  </p>
                ))}
              </Fragment>
            ))}
          </div>

          <aside aria-labelledby="openreach-title" className="mt-14 rounded-lg border border-accent-line bg-accent-soft p-7">
            <h2 id="openreach-title" className="text-heading">
              {page.openreach.title}
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              <RichText text={page.openreach.body} />
            </p>
            <ul className="mt-5 space-y-2">
              {page.openreach.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={textLink}>
                    {link.label}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <section aria-labelledby="faq-title" className="mt-16">
            <h2 id="faq-title" className="text-title">
              {page.faqTitle}
            </h2>
            <div className="mt-8">
              <FaqList faqs={page.faqs} />
            </div>
          </section>

          <div className="mt-16">
            <RelatedTerms slugs={page.glossary} align="left" />
          </div>

          <nav aria-labelledby="more-templates" className="mt-16 border-t border-line pt-10">
            <h2 id="more-templates" className="text-heading">
              More email templates
            </h2>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {others.map((other) => (
                <li key={other.slug} className="card card-link group relative block p-5">
                  <Link href={`/templates/${other.slug}`} className="font-semibold after:absolute after:inset-0 group-hover:text-accent-text focus-visible:outline-none">
                    {other.name}
                  </Link>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{plainText(other.description)}</p>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </article>
      <CtaBand title="Find the people to write to" body="OpenReach finds local businesses, creators and the people asking for what you sell. It is open source, and it never sends a message for you." />
    </>
  );
}
