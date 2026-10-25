import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { BrandRow, brandName } from '@/components/brand-icon';
import { ButtonLink } from '@/components/button';
import { CodeBlock } from '@/components/code-block';
import { CopyPromptButton } from '@/components/copy-prompt-button';
import { CtaBand } from '@/components/cta-band';
import { FaqList } from '@/components/faq';
import { JsonLd } from '@/components/json-ld';
import { PriceTable } from '@/components/price-table';
import { RichText } from '@/components/rich-text';
import { StatusNote } from '@/components/section';
import { YepapiOffer } from '@/components/yepapi-offer';
import { features, getFeature } from '@/content/features';
import { setupPrompt } from '@/content/snippets';
import { pageMeta } from '@/lib/metadata';
import { breadcrumbList, faqPage } from '@/lib/schema';
import { MCP_URL, SIGN_UP_URL, SITE_NAME, SITE_URL } from '@/lib/site';

interface FeaturePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return features.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({ params }: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature) return {};

  return pageMeta({
    title: feature.seoTitle,
    description: feature.description,
    path: `/features/${feature.slug}`,
    absoluteTitle: feature.absoluteTitle,
  });
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;
  const feature = getFeature(slug);
  if (!feature) notFound();

  // Previous and next stay within the feature's group: core features, or the platform MCP pages.
  const siblings = features.filter((other) => other.group === feature.group);
  const index = siblings.indexOf(feature);
  const previous = siblings[index - 1];
  const next = siblings[index + 1];
  const Icon = feature.icon;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SoftwareApplication',
              name: `${SITE_NAME} ${feature.name}`,
              url: `${SITE_URL}/features/${feature.slug}`,
              description: feature.description,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, Linux, Windows, macOS (Docker)',
              license: 'https://opensource.org/license/mit',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            breadcrumbList([
              { name: 'Features', path: '/features' },
              { name: feature.name, path: `/features/${feature.slug}` },
            ]),
            ...(feature.faqs?.length ? [faqPage(feature.faqs)] : []),
          ],
        }}
      />
      <article>
        {/* Header */}
        <header className="band-cream relative overflow-hidden">
          <div className="bg-glow pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="container-page relative py-20 md:py-28">
            <nav aria-label="Breadcrumb" className="text-center text-sm text-muted">
              <Link href="/features" className="underline-offset-4 hover:text-ink hover:underline">
                Features
              </Link>
              <span className="mx-2 text-faint" aria-hidden="true">
                /
              </span>
              <span aria-current="page" className="font-medium text-ink">
                {feature.name}
              </span>
            </nav>

            <div className="mx-auto mt-10 max-w-3xl text-center">
              <span className="tile size-14 rounded-lg shadow-hard-sm">
                <Icon className="size-7" aria-hidden="true" strokeWidth={1.75} />
              </span>
              <h1 className="text-display mt-7 text-balance">{feature.h1}</h1>
              <p className="mt-6 font-display text-2xl font-semibold text-balance text-ink md:text-[1.75rem]">{feature.headline}</p>
              <p className="mt-5 text-xl leading-relaxed text-pretty text-muted md:text-[1.375rem]">{feature.summary}</p>
              {feature.worksWith ? (
                <BrandRow className="mt-8" items={feature.worksWith.map((brand) => ({ brand, name: brandName(brand) }))} />
              ) : null}
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink href={SIGN_UP_URL} size="lg">
                  Get started
                  <ArrowRight className="size-4" aria-hidden="true" />
                </ButtonLink>
                <ButtonLink href="#costs" variant="secondary" size="lg">
                  What it costs
                </ButtonLink>
              </div>
            </div>

          </div>
        </header>

        {/* What it does */}
        <section aria-labelledby="what-title" className="band-peach">
          <div className="container-page py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">What it does</p>
            <h2 id="what-title" className="text-title mt-4">
              {feature.whatTitle}
            </h2>
            <div className="mt-8 space-y-6 text-xl leading-relaxed text-pretty text-muted">
              {feature.what.map((paragraph) => (
                <p key={paragraph}>
                  <RichText text={paragraph} />
                </p>
              ))}
            </div>
          </div>
          </div>
        </section>

        {feature.prompts ? (
          <section aria-labelledby="prompts-title" className="band-white border-b border-line">
            <div className="container-page py-20 md:py-28">
              <div className="mx-auto max-w-3xl text-center">
                <p className="eyebrow">Ask your agent</p>
                <h2 id="prompts-title" className="text-title mt-4">
                  {feature.prompts.title}
                </h2>
              </div>
              <ul className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
                {feature.prompts.items.map((prompt) => (
                  <li key={prompt} className="card p-6 text-lg leading-relaxed text-pretty">
                    “{prompt}”
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {feature.tools ? (
          <section aria-labelledby="tools-title" className="band-cream">
            <div className="container-page py-20 md:py-28">
              <div className="mx-auto max-w-3xl text-center">
                <p className="eyebrow">MCP tools</p>
                <h2 id="tools-title" className="text-title mt-4">
                  {feature.tools.title}
                </h2>
              </div>
              <dl className="mx-auto mt-12 max-w-3xl divide-y divide-line border-y border-line">
                {feature.tools.items.map((tool) => (
                  <div key={tool.name} className="grid gap-2 py-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
                    <dt className="font-mono text-[0.9375rem] font-medium text-ink">{tool.name}</dt>
                    <dd className="leading-relaxed text-muted">
                      <RichText text={tool.body} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        ) : null}

        {/* What you can do */}
        <section aria-labelledby="can-title" className="band-night">
          <div className="container-page py-20 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow">What you can do</p>
              <h2 id="can-title" className="text-title mt-4">
                {feature.name} features
              </h2>
            </div>
            <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2">
              {feature.capabilities.map((capability) => (
                <li key={capability.title} className="card flex gap-5 p-7">
                  <span className="tile size-10 shrink-0">
                    <Check className="size-4" aria-hidden="true" strokeWidth={2.5} />
                  </span>
                  <div>
                  <h3 className="card-title">{capability.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted [overflow-wrap:anywhere]">
                    <RichText text={capability.body} />
                  </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {feature.connectTitle ? (
          <section aria-labelledby="connect-title" className="band-white border-b border-line">
            <div className="container-page py-20 md:py-28">
              <div className="mx-auto max-w-3xl">
                <div className="text-center">
                  <p className="eyebrow">Connect</p>
                  <h2 id="connect-title" className="text-title mt-4">
                    {feature.connectTitle}
                  </h2>
                  <p className="mt-6 text-xl leading-relaxed text-pretty text-muted">
                    Create an API key in Settings, then add the server. The fastest way: copy the setup prompt into your agent and it connects itself.
                  </p>
                  <div className="mt-8 flex justify-center">
                    <CopyPromptButton text={setupPrompt} />
                  </div>
                </div>
                <CodeBlock
                  className="mt-10"
                  label="Claude Code"
                  code={`claude mcp add --transport http openreach ${MCP_URL} \\
  --header "Authorization: Bearer $OPENREACH_API_KEY"`}
                />
                <p className="mt-6 text-center text-[0.9375rem] text-muted">
                  ChatGPT and Claude can sign in with OAuth instead of a key. Config for Claude Desktop, Cursor, VS Code, Codex, Gemini CLI and others is in
                  the{' '}
                  <Link href="/docs/mcp" className="font-medium text-accent-text underline decoration-accent-line underline-offset-4 hover:decoration-accent">
                    MCP setup guide
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {/* What each action costs */}
        <section id="costs" aria-labelledby="costs-title" className="band-cream container-page scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">What it costs</p>
            <h2 id="costs-title" className="text-title mt-4">
              {feature.name} pricing
            </h2>
            <p className="mt-6 text-xl leading-relaxed text-pretty text-muted">
              Prices at the time of writing, billed by the data provider to your own key. Settings and usage lists every call with its cost.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl">
            <PriceTable caption={`What ${feature.name} actions cost`} rows={feature.costs} />
            <div className="mt-6 space-y-3 text-center text-[0.9375rem] text-muted">
              {feature.costNote ? <p>{feature.costNote}</p> : null}
              <p>
                <Link href="/pricing" className="font-medium text-accent-text underline decoration-accent-line underline-offset-4 hover:decoration-accent">
                  See all pricing
                </Link>
              </p>
            </div>
            <div className="mt-10">
              <StatusNote>OpenReach is in active development. Prices are the data provider’s at the time of writing.</StatusNote>
            </div>
          </div>
        </section>

        <YepapiOffer />

        {feature.faqs?.length ? (
          <section aria-labelledby="faq-title" className="band-white border-t border-line">
            <div className="container-page py-20 md:py-28">
              <div className="mx-auto max-w-3xl">
                <h2 id="faq-title" className="text-title text-center">
                  {feature.h1} FAQ
                </h2>
                <div className="mt-12">
                  <FaqList faqs={feature.faqs} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Previous / next */}
        <nav aria-label="More features" className="container-page pb-20 md:pb-28">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {previous ? (
              <Link href={`/features/${previous.slug}`} className="card card-link group flex flex-col gap-2 p-6">
                <span className="inline-flex items-center gap-2 text-sm text-muted">
                  <ArrowLeft className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden="true" />
                  Previous
                </span>
                <span className="font-display text-xl font-semibold transition-colors group-hover:text-accent-text">
                  {previous.name}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next ? (
              <Link
                href={`/features/${next.slug}`}
                className="card card-link group flex flex-col gap-2 p-6 sm:items-end sm:text-right"
              >
                <span className="inline-flex items-center gap-2 text-sm text-muted">
                  Next
                  <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
                <span className="font-display text-xl font-semibold transition-colors group-hover:text-accent-text">
                  {next.name}
                </span>
              </Link>
            ) : null}
          </div>
        </nav>
      </article>
      <CtaBand />
    </>
  );
}
