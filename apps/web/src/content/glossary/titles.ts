import { titleCaseName, whatIs } from './index';
import type { GlossaryTerm } from './types';

/**
 * Title tags for glossary terms where the default would hide the form people search, usually the abbreviation or its
 * expansion (keyword research, US, October 2026: seo/KEYWORDS.md). Each still reads as a plain question or explainer.
 * Kept to 48 characters, since the template adds " · OpenReach". Terms not listed use "What Is <Term>? Definition & Examples".
 */
export const glossaryTitles: Record<string, string> = {
  cpm: 'What Is CPM (Cost per Mille) in Marketing?',
  'cost-per-engagement': 'What Is CPE (Cost per Engagement)?',
  ugc: 'What Is UGC (User-Generated Content)?',
  kol: 'What Is a KOL (Key Opinion Leader)?',
  'earned-media-value': 'What Is EMV (Earned Media Value)?',
  'ftc-disclosure': 'FTC Disclosure Rules for Influencers',
  'marketing-qualified-lead': 'What Is an MQL (Marketing Qualified Lead)?',
  'sales-qualified-lead': 'What Is an SQL (Sales Qualified Lead)?',
  'ideal-customer-profile': 'What Is an Ideal Customer Profile (ICP)?',
  'account-based-marketing': 'What Is ABM (Account-Based Marketing)?',
  crm: 'What Is a CRM? Customer Relationship Management',
  'sales-development-representative': 'What Is an SDR (Sales Development Rep)?',
  'nap-citation': 'What Is NAP? Name, Address and Phone Citations',
  'spf-record': 'What Is an SPF Record? SPF Explained',
  dkim: 'What Is DKIM? Email Authentication Explained',
  dmarc: 'What Is DMARC? Email Authentication Explained',
  gdpr: 'What Is GDPR? The Rules for Email Marketing',
  'can-spam-act': 'What Is the CAN-SPAM Act? Rules for Email',
  'share-of-voice': 'What Is Share of Voice (SOV) in Marketing?',
  'voice-of-customer': 'What Is Voice of Customer (VoC)?',
  'net-promoter-score': 'What Is NPS (Net Promoter Score)?',
  ama: 'What Is an AMA (Ask Me Anything)?',
  'go-to-market-strategy': 'What Is a Go-to-Market (GTM) Strategy?',
  'customer-acquisition-cost': 'What Is CAC (Customer Acquisition Cost)?',
  'customer-lifetime-value': 'What Is LTV (Customer Lifetime Value)?',
  'jobs-to-be-done': 'What Is Jobs to Be Done (JTBD)?',
  'minimum-viable-product': 'What Is an MVP (Minimum Viable Product)?',
  'total-addressable-market': 'What Is TAM? TAM, SAM and SOM Explained',
  'product-led-growth': 'What Is PLG (Product-Led Growth)?',
  'unique-selling-proposition': 'What Is a USP (Unique Selling Proposition)?',
};

/** "What Is a Lead Magnet? Definition & Examples", kept to 48 characters before the " · OpenReach" suffix. */
export function glossaryTitle(term: GlossaryTerm) {
  const override = glossaryTitles[term.slug];
  if (override) return override;
  const question = whatIs(term, titleCaseName(term)).replace(/^What (is|are)/, (_, verb: string) => `What ${verb === 'is' ? 'Is' : 'Are'}`);
  const suffix = term.hat === 'black' ? ' Risks & How to Spot It' : ' Definition & Examples';
  return question.length + suffix.length <= 48 ? `${question}${suffix}` : question;
}
