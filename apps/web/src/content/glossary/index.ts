import { terms as community } from './community';
import { terms as growth } from './growth';
import { terms as influencer } from './influencer';
import { terms as leads } from './leads';
import { terms as listening } from './listening';
import { terms as outreach } from './outreach';
import { terms as spam } from './spam';
import { glossaryCategories, type GlossaryCategory, type GlossaryTerm } from './types';

export * from './types';

/** Every glossary entry, A to Z. */
export const glossary: GlossaryTerm[] = [...influencer, ...leads, ...outreach, ...listening, ...community, ...growth, ...spam].sort((a, b) =>
  a.term.toLowerCase().localeCompare(b.term.toLowerCase(), 'en'),
);

const bySlug = new Map(glossary.map((term) => [term.slug, term]));

export const getTerm = (slug: string) => bySlug.get(slug);

export const termsIn = (category: GlossaryCategory) => glossary.filter((term) => term.category === category);

export const categoryName = (category: GlossaryCategory) => glossaryCategories.find((c) => c.id === category)?.name ?? category;

/** The A-Z letter a term is filed under: "#" for terms starting with a digit. */
export function letterOf(term: GlossaryTerm) {
  const first = term.term.charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

/** The term without its expansion: "Cost per engagement (CPE)" becomes "Cost per engagement". Acronym-led names keep the acronym: "CPM (cost per mille)" becomes "CPM". */
export function shortName(term: GlossaryTerm) {
  return term.term.replace(/\s*\([^)]*\)\s*$/, '');
}

/** Names that end in "s" but take "is": "What is Hacker News?". */
const SINGULAR = new Set(['hacker-news', 'indie-hackers', 'google-alerts', 'founder-led-sales', 'buying-followers', 'buying-email-lists', 'social-media-analytics']);

/** Plural names take "are" and "matter": "What are brand mentions?". */
export function isPlural(term: GlossaryTerm) {
  if (SINGULAR.has(term.slug)) return false;
  const last = shortName(term).split(/\s+/).pop() ?? '';
  return /[^su]s$/i.test(last) && !/(is|ss)$/i.test(last);
}

/** Section heading on why the term matters: "Why engagement rate matters", "Why a lead magnet matters". */
export function whyHeading(term: GlossaryTerm) {
  const name = nameInSentence(term);
  if (isPlural(term)) return `Why ${name} matter`;
  return `Why ${determiner(term, name)}${name} matters`;
}

const SMALL_WORDS = /^(a|an|and|or|of|to|in|on|for|by|vs|the|with|be)$/;

/** Title Case for title tags: "Product-market fit" becomes "Product-Market Fit". Acronyms stay as they are. */
export function titleCaseName(term: GlossaryTerm) {
  return shortName(term)
    .split(' ')
    .map((word, index) =>
      word
        .split('-')
        .map((part, i) => ((index > 0 || i > 0) && SMALL_WORDS.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join('-'),
    )
    .join(' ');
}

/** The name inside a sentence: lower-cases the first letter unless the word is an acronym or a proper name. */
export function nameInSentence(term: GlossaryTerm) {
  const name = shortName(term);
  return /^[A-Z][a-z]/.test(name) && !PROPER.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}

const PROPER = /^(Google|Reddit|Quora|Hacker News|Show HN|Product Hunt|Indie Hackers|Spark Ads|Net Promoter|Boolean|Instagram|TikTok|YouTube|GitHub)/;

/** Countable singular terms take "a" or "an": "What is a lead magnet?". Uncountable and plural terms are left out. */
const COUNTABLE = new Set<string>([
  'micro-influencer', 'nano-influencer', 'macro-influencer', 'mega-influencer', 'ugc-creator', 'brand-ambassador', 'affiliate-link', 'media-kit',
  'sponsored-post', 'paid-partnership', 'influencer-rate-card', 'influencer-brief', 'influencer-contract', 'kol', 'content-creator', 'promo-code',
  'influencer-marketing-platform', 'creator-marketplace', 'follower-audit',
  'lead', 'lead-list', 'lead-magnet', 'marketing-qualified-lead', 'sales-qualified-lead', 'ideal-customer-profile', 'buyer-persona', 'sales-pipeline',
  'sales-funnel', 'crm', 'sales-development-representative', 'google-business-profile', 'email-finder',
  'follow-up-email', 'sales-cadence', 'spf-record', 'email-list',
  'subreddit', 'shadowban', 'product-hunt-launch', 'brand-community', 'ama', 'lurker', 'online-community',
  'go-to-market-strategy', 'viral-loop', 'minimum-viable-product', 'beachhead-market', 'unique-selling-proposition', 'value-proposition', 'waitlist',
  'case-study', 'testimonial', 'sockpuppet',
]);

/** Terms that take "the": "What is the creator economy?". */
const DEFINITE = new Set<string>(['creator-economy', 'can-spam-act', 'cold-start-problem', 'viral-coefficient']);

/** "a" or "an" by sound: "an SPF record", "an AMA", "a UGC creator", "a unique selling proposition". */
function article(name: string) {
  if (/^U[A-Z]/.test(name) || /^u(ni|s[aeu])/i.test(name)) return 'a ';
  if (/^[FHLMNRSX][A-Z0-9]/.test(name)) return 'an ';
  return /^[aeiou]/i.test(name) ? 'an ' : 'a ';
}

/** "a ", "an ", "the " or nothing before a singular name. */
function determiner(term: GlossaryTerm, name: string) {
  if (DEFINITE.has(term.slug)) return 'the ';
  return COUNTABLE.has(term.slug) ? article(name) : '';
}

/** "What is a lead magnet?" / "What are brand mentions?" / "What is the creator economy?". */
export function whatIs(term: GlossaryTerm, name = nameInSentence(term)) {
  if (isPlural(term)) return `What are ${name}?`;
  return `What is ${determiner(term, name)}${name}?`;
}
