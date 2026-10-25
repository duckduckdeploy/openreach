import { AtSign, Bot, MapPinned, MessagesSquare, UsersRound, type LucideIcon } from 'lucide-react';
import type { Brand } from '@/components/brand-icon';
import type { Faq } from './pricing';

export interface FeatureCapability {
  title: string;
  body: string;
}

export interface FeatureCost {
  action: string;
  /** What one call returns or covers. */
  unit: string;
  /** The data provider's price at the time of writing. `null` means it is not listed on this site. */
  price: string | null;
}

export interface Feature {
  slug: string;
  /** Short name used in navigation, cards and tables. */
  name: string;
  /** Title tag, keyword first. The " · OpenReach" suffix is added by the template. */
  seoTitle: string;
  /** Use seoTitle as the whole title tag, without the suffix (when the suffix would pass 60 characters). */
  absoluteTitle?: boolean;
  /** Page H1: the head keyword, 2 to 5 words. */
  h1: string;
  /** Short line under the H1. */
  headline: string;
  /** One sentence, used on cards and under the headline. */
  summary: string;
  /** Meta description, 120 to 155 characters. */
  description: string;
  /** H2 of the "what it does" section, keyword-led. */
  whatTitle: string;
  icon: LucideIcon;
  /** "What it does": one or two short paragraphs. */
  what: string[];
  /** "What you can do". */
  capabilities: FeatureCapability[];
  /** "What each action costs". */
  costs: FeatureCost[];
  costNote?: string;
  /** Logos of the services or assistants it works with, shown under the headline. */
  worksWith?: Brand[];
  /** Questions answered on the page, also published as FAQPage structured data. */
  faqs?: Faq[];
}

export const UNLISTED_PRICE_LABEL = 'Listed in Settings and usage';

export const features: Feature[] = [
  {
    slug: 'influencer-crm',
    name: 'Influencer CRM',
    seoTitle: 'Influencer CRM: Track Creators From Found to Won',
    h1: 'Influencer CRM',
    headline: 'Every creator you found, and where each one stands.',
    summary: 'Save creators to a project with a status, notes and tags, and refresh their numbers before you reach out.',
    description: 'Influencer CRM for YouTube, TikTok and Instagram creators: track each one from to contact to won, with notes, tags, contacts and fresh stats.',
    whatTitle: 'How influencer management works in OpenReach',
    icon: UsersRound,
    worksWith: ['youtube', 'tiktok', 'instagram'],
    what: [
      'Creators you find with the influencer search tools can be saved to a project in one click. Each keeps the numbers from its last analysis: followers, average views, engagement, posting frequency and contacts.',
      'Move each creator from new to contacted, replied, won or not a fit, and keep notes on what you sent and what they said. Saving the same creator again refreshes the numbers and keeps your notes.',
    ],
    capabilities: [
      { title: 'Pipeline statuses', body: 'New, to contact, contacted, replied, won and not a fit, set one at a time or in bulk.' },
      { title: 'Notes and tags', body: 'What you sent, what they asked for, and tags for campaigns or tiers.' },
      { title: 'Fresh numbers', body: 'Re-analyse saved creators before you reach out, up to 25 at a time.' },
      { title: 'CSV export', body: 'The whole list with statuses, notes, emails and links, for a spreadsheet or your CRM.' },
    ],
    costs: [
      { action: 'Saving, statuses, notes, export', unit: 'Everything in the list', price: 'Free' },
      { action: 'Re-analyse a creator', unit: 'Profile and recent posts', price: '$0.02 – $0.03' },
    ],
    faqs: [
      {
        question: 'Does OpenReach contact creators for me?',
        answer: ['No. It finds them, keeps your list and shows their contacts. You write and send your messages yourself.'],
      },
    ],
  },
  {
    slug: 'local-lead-generation',
    name: 'Lead searches',
    seoTitle: 'Local Lead Generation Across Whole Cities',
    h1: 'Local lead generation',
    headline: 'Every business of a type, across a whole city.',
    summary: 'Lead searches run many Google Maps searches in the background, across towns or a grid over a city, and save the matches.',
    description: 'Local lead generation at scale: search Google Maps across many towns or a whole city grid, filter for your pitch, find emails and keep a lead pipeline.',
    whatTitle: 'How lead searches cover a city',
    icon: MapPinned,
    worksWith: ['googlemaps'],
    what: [
      'One Google Maps search stops at 60 places. A lead search runs every query you give it in every place you list, or from every point of a grid over a city, so it finds the businesses one search misses.',
      'Each place is kept once, checked against your filter rules, and the matches are added to the project’s lead list as the search runs. The search shows its size before it starts, and you can cancel it at any time.',
    ],
    capabilities: [
      { title: 'Towns or a city grid', body: 'A list of places, or a grid of 2 × 2 up to 15 × 15 points with the spacing you choose.' },
      { title: 'Filter rules', body: 'Website, rating, reviews, phone, category, name and more, combined with all or any.' },
      { title: 'Emails', body: 'Find contact emails for the saved leads that have a website.' },
      { title: 'A pipeline', body: 'Statuses, notes, tags and CSV export for every lead.' },
    ],
    costs: [
      { action: 'Google Maps search', unit: 'One page of up to 20 businesses', price: '$0.07' },
      { action: 'Lead email (homepage)', unit: 'One business with a website', price: '$0.01' },
      { action: 'Lead email (directory)', unit: 'Up to 10 people at one domain', price: '$0.03' },
    ],
    costNote: 'A 4 × 4 grid with one query and one page is 16 searches, about $1.12.',
  },
  {
    slug: 'brand-mention-alerts',
    name: 'Brand monitors',
    seoTitle: 'Brand Mention Alerts Across 60+ Communities',
    h1: 'Brand mention alerts',
    headline: 'New mentions of your product, every day or week.',
    summary: 'A brand monitor checks your communities on a schedule and adds only the new pages that name you to a feed.',
    description: 'Brand mention alerts for Reddit, Hacker News, GitHub, Stack Overflow, review sites and 60+ communities: daily or weekly checks and a feed of new mentions.',
    whatTitle: 'How brand monitors find new mentions',
    icon: AtSign,
    worksWith: ['reddit', 'ycombinator', 'github', 'stackoverflow', 'quora', 'producthunt'],
    what: [
      'A brand monitor holds your brand terms, the words to leave out, the communities to search and a schedule. Each run looks only at pages newer than the last run, keeps the ones that name you, and adds them to a feed.',
      'Pages seen again keep their status, so the feed is a to-do list: reply, mark as replied, or ignore. An optional AI check drops namesakes and notes why each mention matters.',
    ],
    capabilities: [
      { title: '60+ communities', body: 'Reddit, Hacker News, GitHub, Stack Overflow, Quora, X, LinkedIn, Product Hunt, review sites, app stores and forums.' },
      { title: 'Only new pages', body: 'After the first run, each run reads only what appeared since the last one.' },
      { title: 'A feed to work through', body: 'New, read, replied and ignored, with filters by source and sentiment.' },
      { title: 'Where you are discussed', body: 'Communities ranked by how often they mention you.' },
    ],
    costs: [
      { action: 'Community search', unit: 'One community through Google, per term', price: '$0.01' },
      { action: 'Hacker News, GitHub, Stack Overflow', unit: 'Free official APIs', price: 'Free' },
      { action: 'AI check', unit: 'Up to 25 new results', price: 'from $0.01' },
    ],
    costNote: 'Every monitor shows its price per run and per month before you save it.',
  },
  {
    slug: 'social-listening',
    name: 'Conversation monitors',
    seoTitle: 'Social Listening for Buying Intent',
    h1: 'Social listening',
    headline: 'Hear when people ask for what you sell.',
    summary: 'Conversation monitors find threads where people ask for recommendations or alternatives in your space, ranked by intent.',
    description: 'Open-source social listening for buying intent: monitor Reddit, Quora, Hacker News and more for people asking for recommendations in your space.',
    whatTitle: 'How social listening finds buyers',
    icon: MessagesSquare,
    worksWith: ['reddit', 'quora', 'ycombinator', 'stackoverflow'],
    what: [
      'A conversation monitor searches your communities for the problems your product solves, phrased the way people ask for help: “best …”, “looking for …”, “alternative to …”. Each result gets an intent score from 0 to 100.',
      'Add competitors to catch people unhappy with them. The feed shows the highest intent first, and the communities where these questions cluster.',
    ],
    capabilities: [
      { title: 'Intent scores', body: 'Questions, requests, frustration with a current tool, a named competitor and recency.' },
      { title: 'AI check', body: 'Optional: drops posts that are not real requests and explains the rest in a line.' },
      { title: 'Communities to join', body: 'The subreddits and forums where your buyers ask, ranked.' },
      { title: 'No automated posting', body: 'You reply yourself, as yourself. OpenReach keeps track of what you replied to.' },
    ],
    costs: [
      { action: 'Community search', unit: 'One community through Google, per phrasing', price: '$0.01' },
      { action: 'AI check', unit: 'Up to 25 new results', price: 'from $0.01' },
    ],
  },
  {
    slug: 'marketing-mcp-server',
    name: 'MCP server and API',
    seoTitle: 'Marketing MCP Server for Claude, ChatGPT, Cursor',
    h1: 'Marketing MCP server',
    headline: 'Hand lead generation to your AI agent, with a spending limit.',
    summary: 'Every OpenReach feature as MCP tools and a REST API, with prices first and a ceiling on every paid call.',
    description: 'Marketing MCP server for Claude, ChatGPT and Cursor: find influencers, leads and brand mentions from your AI agent, with a ceiling on every paid call.',
    whatTitle: 'How the MCP server works',
    icon: Bot,
    worksWith: ['claude', 'chatgpt', 'claudecode', 'cursor', 'codex', 'geminicli'],
    what: [
      'OpenReach runs an MCP server next to its API. Connect Claude, ChatGPT, Cursor, Codex or any MCP client, and the agent can search creators, businesses and communities, save lists and manage monitors.',
      'Every paid tool takes a dry run that returns the price and a ceiling that refuses a call that could cost more. Ready-made skills for Claude Code cover finding influencers, leads and customers, brand monitoring and a community plan.',
    ],
    capabilities: [
      { title: '38 tools', body: 'Search, analyse, save, track and monitor: the whole workspace.' },
      { title: 'Spending controls', body: 'dry_run and max_cost_usd on every paid tool, plus your monthly limit.' },
      { title: 'OAuth or API keys', body: 'Sign in from ChatGPT or Claude, or use an API key from Settings.' },
      { title: 'Skills', body: 'A Claude Code plugin with five marketing workflows.' },
    ],
    costs: [{ action: 'Every tool', unit: 'The same price as in the app', price: null }],
  },
];

export const getFeature = (slug: string) => features.find((feature) => feature.slug === slug);
