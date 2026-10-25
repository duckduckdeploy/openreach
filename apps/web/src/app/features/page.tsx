import { CtaBand } from '@/components/cta-band';
import { YepapiOffer } from '@/components/yepapi-offer';
import { FeatureGrid } from '@/components/feature-grid';
import { JsonLd } from '@/components/json-ld';
import { SectionHeader, StatusNote } from '@/components/section';
import { features } from '@/content/features';
import { pageMeta } from '@/lib/metadata';
import { breadcrumbList } from '@/lib/schema';

export const metadata = pageMeta({
  title: 'Lead Generation Software Features',
  description:
    'OpenReach features: an influencer CRM, lead generation across whole cities, brand mention alerts, social listening and a marketing MCP server.',
  path: '/features',
});

export default function FeaturesPage() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', ...breadcrumbList([{ name: 'Features', path: '/features' }]) }} />
      <section aria-labelledby="features-title" className="container-page py-20 md:py-28 xl:py-32">
        <SectionHeader
          as="h1"
          eyebrow={`${features.length} features`}
          id="features-title"
          title="Lead generation software features"
          lede="Each feature has its own page: what it does, what you can do with it, and what each action costs."
        />
        <div className="mx-auto mt-10 max-w-2xl">
          <StatusNote>
            OpenReach is an early project in active development. Issues and ideas are welcome on GitHub.
          </StatusNote>
        </div>
        <div className="mt-14 md:mt-16">
          <FeatureGrid headingLevel="h2" />
        </div>
      </section>
      <div className="mb-20 md:mb-28">
        <YepapiOffer />
      </div>
      <CtaBand />
    </>
  );
}
