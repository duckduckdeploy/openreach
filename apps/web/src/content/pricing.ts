export interface PriceRow {
  action: string;
  /** What one call returns or covers. */
  unit: string;
  /** YepAPI's price at the time of writing; null when it is not listed. */
  price: string | null;
  /** The tool or feature page this action belongs to. */
  href?: string;
}

/** Example prices for common actions, at the time of writing. */
export const priceRows: PriceRow[] = [
  { action: 'Influencer search', unit: 'One page of YouTube or TikTok results (two searches)', price: '$0.02', href: '/tools/influencer-search-tool' },
  { action: 'Instagram search', unit: 'Instagram search plus 20 profiles from Google’s index', price: '$0.03', href: '/tools/instagram-influencer-finder' },
  { action: 'Analyse a creator', unit: 'Profile and recent posts: averages, engagement, contacts', price: '$0.02 – $0.03', href: '/tools/engagement-rate-calculator' },
  { action: 'Google Maps search', unit: 'One page of up to 20 businesses', price: '$0.07', href: '/tools/google-maps-scraper' },
  { action: 'Lead email (homepage)', unit: 'A contact email from one business’s website', price: '$0.01', href: '/tools/lead-finder' },
  { action: 'Lead email (directory)', unit: 'Up to 10 people at one business domain', price: '$0.03', href: '/tools/lead-finder' },
  { action: 'Community search', unit: 'One community through Google, 10 results', price: '$0.01', href: '/tools/brand-monitoring' },
  { action: 'Hacker News, GitHub, Stack Overflow', unit: 'Searched through their free official APIs', price: 'Free', href: '/tools/brand-monitoring' },
  { action: 'Subreddit finder', unit: 'One topic in three phrasings, 20 results each', price: '$0.06', href: '/tools/subreddit-finder' },
  { action: 'AI check', unit: 'Relevance, intent and sentiment of up to 25 results', price: 'from $0.01', href: '/tools/reddit-lead-generation' },
];

export interface CreditExample {
  amount: string;
  what: string;
  detail: string;
}

/** What the $5 in free credits on a new YepAPI account covers. Each line is an alternative, not a bundle. */
export const creditExamples: CreditExample[] = [
  { amount: 'about 1,400', what: 'businesses from Google Maps', detail: '70 pages of 20, $0.07 each' },
  { amount: 'about 200', what: 'creators analysed', detail: 'profile and recent posts, $0.02 – $0.03' },
  { amount: 'about 30', what: 'brand mention checks', detail: '15 communities each, about $0.15' },
];

export interface Faq {
  question: string;
  answer: string[];
}

export const pricingFaqs: Faq[] = [
  {
    question: 'Is OpenReach free?',
    answer: [
      'The software is. The hosted app at openreach.gg costs nothing today and every feature is unlimited. The self-hosted version is open source under the MIT licence, with every feature unlocked.',
      'What costs money is data: creator profiles, Google Maps results and search results. You pay per lookup at YepAPI’s price, every call is listed with its cost in Settings and usage, and a monthly limit caps what you spend.',
    ],
  },
  {
    question: 'Will the hosted app always be unlimited?',
    answer: [
      'We can’t promise that, and we would rather say so now. Running openreach.gg for everyone costs servers and storage. Depending on how OpenReach is funded, the hosted app may get usage limits later. If it does, we will announce it well in advance and nothing you have saved is lost.',
      'The self-hosted version is not affected: it stays complete, unlimited and free to run.',
    ],
  },
  {
    question: 'Is the self-hosted version limited in any way?',
    answer: ['No. Every feature of the hosted app is in the open-source code, with no feature gates, licence keys or usage caps.'],
  },
  {
    question: 'Who do I pay for data?',
    answer: [
      'The data provider, YepAPI, directly. You add your own key during account setup, and each lookup is billed to it at their pay-per-call price. OpenReach never handles that payment.',
    ],
  },
  {
    question: 'What is free?',
    answer: [
      'Filters, saved lists, statuses, notes, exports, results already fetched (repeats are served from a cache), and searches of Hacker News, GitHub and Stack Overflow through their free official APIs. A self-hosted install with Reddit API credentials searches Reddit for free too.',
    ],
  },
  {
    question: 'What happens when my credits run out?',
    answer: [
      'Lookups that need data stop until you add credit with the data provider. Everything you have saved keeps working.',
      'For a limited time, new YepAPI accounts start with $5 in free credit.',
    ],
  },
  {
    question: 'Can I stop an AI agent from overspending?',
    answer: [
      'Yes, in two ways. Every paid tool an agent calls takes a spending ceiling: if the call could cost more, it is refused before anything is spent. And a monthly limit in Settings stops all spending, from you or any agent, once it is reached.',
    ],
  },
];
