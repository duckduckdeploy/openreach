import Link from 'next/link';
import { ArrowRight, Bot, Check, Code2, Server, ShieldCheck } from 'lucide-react';
import { AgentFold } from '@/components/agent-fold';
import { Band, type Tone } from '@/components/band';
import { BrandIcon, BrandRow, brandName } from '@/components/brand-icon';
import { ButtonLink } from '@/components/button';
import { CodeBlock } from '@/components/code-block';
import { CtaBand } from '@/components/cta-band';
import { FaqList } from '@/components/faq';
import { FeatureGrid } from '@/components/feature-grid';
import { JsonLd } from '@/components/json-ld';
import { SectionHeader } from '@/components/section';
import { YepapiOffer } from '@/components/yepapi-offer';
import { areas, homeFaqs } from '@/content/home';
import { selfHostDocker } from '@/content/snippets';
import { getTool } from '@/content/tools';
import { pageMeta } from '@/lib/metadata';
import { faqPage } from '@/lib/schema';
import { GITHUB_URL, SIGN_UP_URL, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site';

export const metadata = pageMeta({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: '/',
  absoluteTitle: true,
});

const ledger = [
  { value: 'MIT', label: 'Open-source licence' },
  { value: '1', label: 'Docker command to self-host' },
  { value: '38', label: 'MCP tools for your AI agent' },
  { value: '60+', label: 'Communities searched for mentions' },
];

const control = [
  {
    icon: Code2,
    title: 'Open source, all of it',
    body: 'The app, the API and the agent server are MIT licensed. Read every line, change what you need, and keep your changes.',
  },
  {
    icon: Server,
    title: 'Your server, your data',
    body: 'Run it on your own computer or server with Docker. Your creators, leads and mentions live in your own database.',
  },
  {
    icon: ShieldCheck,
    title: 'No surprise bills',
    body: 'Pay per lookup, with every call and its cost listed in the app. Set a monthly limit and nothing is spent past it, by you or by any agent.',
  },
  {
    icon: Bot,
    title: 'Honest outreach',
    body: 'No scraping around blocks, no automated posting or DMs. OpenReach finds and organises; you reach out as yourself.',
  },
];

const selfHostPoints = [
  'One image and one compose file: database, API, dashboard and site',
  'Any machine that runs Docker: your PC, a home server or a $10 cloud server',
  'Automatic HTTPS for your own domain',
];

const AREA_TONES: Tone[] = ['white', 'cream', 'peach', 'white'];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SoftwareApplication',
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, Linux, Windows, macOS (Docker)',
              license: 'https://opensource.org/license/mit',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            },
            {
              '@type': 'Organization',
              '@id': `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/apple-icon.png`,
              sameAs: [GITHUB_URL],
            },
            { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, publisher: { '@id': `${SITE_URL}/#organization` } },
            faqPage(homeFaqs),
          ],
        }}
      />

      <section aria-labelledby="hero-title" className="band-cream relative overflow-hidden">
        <div className="bg-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="hatch pointer-events-none absolute -top-24 left-1/2 h-[34rem] w-[60rem] -translate-x-1/2 opacity-60" aria-hidden="true" />
        <div className="container-page relative pt-16 pb-20 md:pt-24 md:pb-24 xl:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-peach-strong bg-surface/80 px-4 py-1.5 text-sm font-medium text-ink shadow-hard-sm backdrop-blur">
              <span className="size-2 rounded-full bg-orange" aria-hidden="true" />
              Open source · MIT licence · Self-hostable
            </p>

            <h1 id="hero-title" className="text-display animate-rise mt-8 text-balance [animation-delay:60ms]">
              <span className="mark">Open&#8209;source</span> lead generation tool
            </h1>

            <p className="text-lede animate-rise mx-auto mt-7 max-w-2xl [animation-delay:120ms]">
              Find influencers on YouTube, TikTok and Instagram, local businesses on Google Maps, mentions of your brand, and people asking for what
              you sell. In one workspace you can run yourself and hand to your AI agent.
            </p>

            <div className="animate-rise mt-10 flex flex-col justify-center gap-3 [animation-delay:180ms] sm:flex-row">
              <ButtonLink href={SIGN_UP_URL} size="lg">
                Get started
                <ArrowRight className="size-4 transition-transform duration-150 group-hover/button:translate-x-0.5" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/docs/self-hosting" variant="secondary" size="lg">
                <BrandIcon brand="docker" className="size-5" />
                Self-host with Docker
              </ButtonLink>
            </div>

            <p className="animate-rise mt-6 text-[0.9375rem] text-muted [animation-delay:240ms]">
              Or{' '}
              <Link href="/tools" className="font-semibold text-accent-text underline-offset-4 hover:underline">
                try a tool free
              </Link>
              , no account needed.
            </p>
          </div>

          <ul className="animate-rise mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-5 [animation-delay:200ms] sm:grid-cols-2 lg:grid-cols-4 md:mt-16">
            {areas.map((area, index) => {
              const Icon = area.icon;
              return (
                <li key={area.id} className={`card card-link group relative flex flex-col p-6 ${index % 2 === 1 ? 'card-peach' : ''}`}>
                  <span className="tile">
                    <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
                  </span>
                  <p className="card-title mt-5">
                    <a href={`#${area.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                      {area.eyebrow}
                    </a>
                  </p>
                  <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-muted">{area.points[0]}</p>
                  <span className="mt-4 flex gap-2" aria-hidden="true">
                    {area.brands.slice(0, 4).map((brand) => (
                      <BrandIcon key={brand} brand={brand} className="size-4" />
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <Band tone="night" space="sm" label="OpenReach in four numbers">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {ledger.map((item) => (
            <div key={item.label} className="flex flex-col-reverse items-center gap-3 text-center lg:border-l lg:border-line lg:first:border-l-0">
              <dt className="max-w-[14rem] text-sm text-balance text-muted">{item.label}</dt>
              <dd className="figure text-orange">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Band>

      {areas.map((area, index) => {
        const Icon = area.icon;
        return (
          <Band key={area.id} id={area.id} tone={AREA_TONES[index % AREA_TONES.length]} labelledBy={`${area.id}-title`} className="scroll-mt-16 border-b border-line">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className={`max-w-xl ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                <p className="eyebrow">{area.eyebrow}</p>
                <h2 id={`${area.id}-title`} className="text-title mt-4 text-balance">
                  {area.title}
                </h2>
                <p className="text-lede mt-6">{area.body}</p>
                <ul className="mt-8 space-y-3">
                  {area.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-ink">
                      <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
                        <Check className="size-3" aria-hidden="true" strokeWidth={3} />
                      </span>
                      <span className="text-[0.9375rem]">{point}</span>
                    </li>
                  ))}
                </ul>
                <BrandRow className="mt-8 justify-start" items={area.brands.map((brand) => ({ brand, name: brandName(brand) }))} />
              </div>
              <div className="card p-6 sm:p-8">
                <span className="tile size-12 rounded-lg">
                  <Icon className="size-6" aria-hidden="true" strokeWidth={1.75} />
                </span>
                <p className="mt-6 text-sm font-semibold tracking-wide text-faint uppercase">Tools</p>
                <ul className="mt-3 divide-y divide-line">
                  {area.tools.map((slug) => {
                    const tool = getTool(slug);
                    if (!tool) return null;
                    return (
                      <li key={slug}>
                        <Link href={`/tools/${slug}`} className="group flex items-start justify-between gap-4 py-4">
                          <span>
                            <span className="block font-semibold text-ink group-hover:text-accent-text">{tool.h1}</span>
                            <span className="mt-1 block text-[0.9375rem] leading-relaxed text-muted">{tool.summary}</span>
                          </span>
                          <ArrowRight className="mt-1 size-4 shrink-0 text-faint transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-accent-text" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </Band>
        );
      })}

      <AgentFold />

      <Band tone="white" labelledBy="features-title">
        <SectionHeader
          align="center"
          eyebrow="Projects"
          id="features-title"
          title="Lead generation software for outreach"
          lede="Save what you find to a project: creators and leads with a status, notes and tags, lead searches across whole cities, and monitors that check for new mentions on a schedule."
        />
        <div className="mt-14 md:mt-16">
          <FeatureGrid />
        </div>
      </Band>

      <Band tone="peach" labelledBy="control-title">
        <SectionHeader
          align="center"
          eyebrow="You are in control"
          id="control-title"
          title="Why open-source marketing software"
          lede="Closed tools decide what you see, where your data goes and what you pay. OpenReach is built the other way round."
        />
        <ul className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 md:mt-16 md:grid-cols-2 lg:gap-6">
          {control.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={item.title} className="card p-8">
                <span className={`tile ${index % 2 === 1 ? 'tile-peach' : ''}`}>
                  <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
                </span>
                <h3 className="card-title mt-6">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{item.body}</p>
              </li>
            );
          })}
        </ul>
        <p className="mt-10 text-center">
          <ButtonLink href="/why-openreach" variant="ghost">
            Why OpenReach
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </p>
      </Band>

      <Band tone="cream" labelledBy="selfhost-title">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <div className="max-w-xl">
            <p className="eyebrow">Self-host</p>
            <h2 id="selfhost-title" className="text-title mt-4">
              Self-hosted lead generation with Docker
            </h2>
            <p className="text-lede mt-6">Everything this site runs is in the repository. Start it on your own machine or server with Docker, and it is yours.</p>
            <ul className="mt-8 space-y-3">
              {selfHostPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-ink">
                  <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg">
                    <Check className="size-3" aria-hidden="true" strokeWidth={3} />
                  </span>
                  <span className="text-[0.9375rem]">{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/docs/self-hosting" variant="night">
                Self-hosting guide
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href={GITHUB_URL} variant="secondary">
                <BrandIcon brand="github" />
                Source on GitHub
              </ButtonLink>
            </div>
          </div>
          <div className="frame-glow min-w-0">
            <CodeBlock label="Terminal" code={selfHostDocker} />
          </div>
        </div>
      </Band>

      <YepapiOffer />

      <Band tone="white" labelledBy="faq-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="faq-title" className="text-title text-center">
            Lead generation tool FAQ
          </h2>
          <div className="mt-12">
            <FaqList faqs={homeFaqs} />
          </div>
        </div>
      </Band>

      <CtaBand />
    </>
  );
}
