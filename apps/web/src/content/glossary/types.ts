import type { Faq } from '../pricing';

export type GlossaryCategory = 'influencer' | 'leads' | 'outreach' | 'listening' | 'community' | 'growth' | 'spam';

/** Where a technique sits against platform rules and the law. Only techniques carry one; plain concepts do not. */
export type GlossaryHat = 'white' | 'grey' | 'black';

export const hatLabels: Record<GlossaryHat, { name: string; summary: string }> = {
  white: { name: 'White hat', summary: 'Within platform rules and the law. Safe to use.' },
  grey: { name: 'Grey hat', summary: 'Allowed in some places and easy to abuse. Check the rules first.' },
  black: { name: 'Black hat', summary: 'Against platform rules or the law. Risks bans, fines and your reputation.' },
};

/** `heading` is the H1 of the category page and its H2 on the hub. */
export const glossaryCategories: { id: GlossaryCategory; name: string; heading: string; summary: string }[] = [
  { id: 'influencer', name: 'Influencer marketing', heading: 'Influencer marketing terms', summary: 'Creator tiers, engagement rate, UGC, sponsored posts, rates, contracts and disclosure.' },
  { id: 'leads', name: 'Lead generation', heading: 'Lead generation terms', summary: 'Leads, MQLs and SQLs, ideal customer profiles, enrichment, CRMs and local business data.' },
  { id: 'outreach', name: 'Cold outreach and email', heading: 'Cold outreach and email terms', summary: 'Cold email, follow-ups, deliverability, SPF, DKIM and DMARC, and the laws that apply.' },
  { id: 'listening', name: 'Social listening', heading: 'Social listening and brand monitoring terms', summary: 'Brand mentions, share of voice, sentiment, reputation and review management.' },
  { id: 'community', name: 'Community marketing', heading: 'Community marketing terms', summary: 'Reddit, Hacker News, Product Hunt, Indie Hackers, building in public and word of mouth.' },
  { id: 'growth', name: 'Startup growth', heading: 'Startup growth and go-to-market terms', summary: 'Product-market fit, go-to-market, CAC and LTV, positioning and finding early adopters.' },
  { id: 'spam', name: 'Spam and manipulation', heading: 'Marketing spam and manipulation terms', summary: 'Astroturfing, fake followers, fake reviews and vote manipulation, and how to spot them.' },
];

/** Where the term is put to work in OpenReach. `href` is a path on this site. */
export interface GlossaryInOpenReach {
  body: string;
  href: string;
  /** Link text, e.g. "Open the influencer search tool". */
  label: string;
}

export interface GlossaryTerm {
  /** URL slug under /glossary, e.g. "engagement-rate". The head keyword people search. */
  slug: string;
  /** The term as people search for it, e.g. "Engagement rate". The H1 and the "What is …?" heading. */
  term: string;
  /** Other names and abbreviations. */
  aka?: string[];
  category: GlossaryCategory;
  /** Set on techniques only: shown as a label on the page and on the A-Z card. */
  hat?: GlossaryHat;
  /** Black and grey hat techniques: what can happen to an account, a domain or a brand that uses it. */
  risks?: string[];
  /** One-sentence definition, 120 to 155 characters. The meta description and the A-Z card. */
  short: string;
  /** "What is X?": the first paragraph is a 40-60 word definition that starts with the term. */
  definition: string[];
  /** "Why X matters". */
  why: string[];
  /** A practical section with its own keyword-led heading, e.g. "How to calculate engagement rate". */
  how?: { heading: string; steps?: string[]; body?: string[] };
  /** A short worked example. */
  example?: { body: string };
  openreach?: GlossaryInOpenReach;
  /** Slugs of related terms. Every one must exist in the glossary. */
  related: string[];
  faqs?: Faq[];
}
