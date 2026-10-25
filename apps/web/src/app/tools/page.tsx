import { ArrowRight } from 'lucide-react';
import { ButtonLink } from '@/components/button';
import { CtaBand } from '@/components/cta-band';
import { JsonLd } from '@/components/json-ld';
import { YepapiOffer } from '@/components/yepapi-offer';
import { ToolCards } from '@/components/tool-cards';
import { TOOL_GROUPS, tools } from '@/content/tools';
import { pageMeta } from '@/lib/metadata';
import { breadcrumbList } from '@/lib/schema';
import { SIGN_UP_URL } from '@/lib/site';

export const metadata = pageMeta({
  title: 'Lead Generation Tools, Free and Open Source',
  description: 'Free, open-source lead generation tools: influencer search, YouTube channel finder, TikTok user search, Google Maps leads and brand monitoring.',
  path: '/tools',
});

export default function ToolsPage() {
  return (
    <>
      <JsonLd data={{ '@context': 'https://schema.org', ...breadcrumbList([{ name: 'Tools', path: '/tools' }]) }} />
      <section aria-labelledby="tools-title" className="relative overflow-hidden">
        <div className="bg-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="container-page relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">{tools.length} tools</p>
            <h1 id="tools-title" className="text-display mt-5 text-balance">
              Lead generation tools
            </h1>
            <p className="mt-7 text-xl leading-relaxed text-pretty text-muted md:text-[1.375rem]">
              Find creators, local businesses and the people already talking about your problem. Every tool runs on its own; save what is worth keeping to a
              project.
            </p>
            <div className="mt-10 flex justify-center">
              <ButtonLink href={SIGN_UP_URL} size="lg">
                Get started
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
          <div className="mt-16 space-y-20 md:mt-20 md:space-y-24">
            {TOOL_GROUPS.map((group) => (
              <section key={group.id} aria-labelledby={group.id}>
                <div className="mx-auto mb-10 max-w-2xl text-center">
                  <h2 id={group.id} className="text-title text-balance">
                    {group.title}
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-pretty text-muted">{group.lede}</p>
                </div>
                <ToolCards tools={tools.filter((tool) => tool.group === group.group)} />
              </section>
            ))}
          </div>
        </div>
      </section>
      <div className="mb-20 md:mb-28">
        <YepapiOffer />
      </div>
      <CtaBand />
    </>
  );
}
