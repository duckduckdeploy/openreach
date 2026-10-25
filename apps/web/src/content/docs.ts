export type DocSection = 'Start here' | 'Tutorials' | 'Run it yourself' | 'Reference';

export interface DocPage {
  /** Path under /docs, e.g. "tutorials/find-influencers". */
  slug: string;
  /** Short label for navigation, cards and previous/next links. */
  title: string;
  /** Page H1: keyword-led, "How to …" on tutorials. */
  h1: string;
  /** Title tag, keyword first. The " · OpenReach" suffix is added by the template. */
  seoTitle: string;
  /** Meta description and the intro under the H1. */
  description: string;
  section: DocSection;
}

export const docSections: DocSection[] = ['Start here', 'Tutorials', 'Run it yourself', 'Reference'];

/** Every docs page, in reading order. Navigation, previous/next links and the sitemap come from this list. */
export const docPages: DocPage[] = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    h1: 'Getting started with OpenReach',
    seoTitle: 'Getting Started with OpenReach',
    description: 'Get started with OpenReach: create a YepAPI account, paste your key, create a project for your product and run your first search, under a monthly limit.',
    section: 'Start here',
  },
  {
    slug: 'how-it-works',
    title: 'How OpenReach works',
    h1: 'How OpenReach works',
    seoTitle: 'How OpenReach Works: Data Sources and Projects',
    description: 'How OpenReach works: projects, where creator, business and community data comes from, what runs in the background, and what OpenReach will never do.',
    section: 'Start here',
  },
  {
    slug: 'costs-and-limits',
    title: 'Costs, caching and limits',
    h1: 'Costs, caching and spending limits',
    seoTitle: 'Costs, Caching and Spending Limits',
    description: 'What each lookup costs, when results are free, where to see what you spent, and the monthly limit and ceilings that stop spending.',
    section: 'Start here',
  },
  {
    slug: 'tutorials/find-influencers',
    title: 'Find influencers',
    h1: 'How to find influencers for your brand',
    seoTitle: 'How to Find Influencers for Your Brand',
    description: 'How to find influencers: search your niche on YouTube, TikTok or Instagram, analyse engagement and contacts, and keep a shortlist with outreach statuses.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorials/build-a-lead-list',
    title: 'Build a lead list',
    h1: 'How to build a local lead list from Google Maps',
    seoTitle: 'How to Build a Lead List from Google Maps',
    description: 'How to build a lead list from Google Maps: search businesses by type and place, filter for your pitch, cover whole cities, find emails and export.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorials/find-clients',
    title: 'Find clients',
    h1: 'How to find clients',
    seoTitle: 'How to Find Clients: 7 Ways That Work',
    description: 'How to find clients for a freelance, agency or B2B service: local businesses on Google Maps, communities, referrals, partners and content, step by step.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorials/sell-websites-to-local-businesses',
    title: 'Sell websites to local businesses',
    h1: 'How to sell websites to local businesses',
    seoTitle: 'How to Sell Websites to Local Businesses',
    description: 'How to sell websites to local businesses: find ones without a website or with a weak one, qualify them, pitch honestly, price it and follow up.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorials/monitor-brand-mentions',
    title: 'Monitor brand mentions',
    h1: 'How to monitor brand mentions',
    seoTitle: 'How to Monitor Brand Mentions Online',
    description: 'How to monitor brand mentions on Reddit, Hacker News, GitHub, review sites and more: set up a brand monitor, read the feed and reply where it matters.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorials/find-customers-on-reddit',
    title: 'Find customers on Reddit',
    h1: 'How to find customers on Reddit',
    seoTitle: 'How to Find Customers on Reddit, Without Spam',
    description: 'How to find customers on Reddit and Quora: search for people asking about your problem, rank them by intent, pick subreddits and reply the right way.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorials/reddit-advanced-search',
    title: 'Reddit advanced search',
    h1: 'Reddit advanced search',
    seoTitle: 'Reddit Advanced Search: Operators and Filters',
    description: 'Reddit advanced search: every search operator, how to search a subreddit, sort and time filters, searching Reddit with Google and alerts for new posts.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorials/get-reddit-karma',
    title: 'Get Reddit karma',
    h1: 'How to get karma on Reddit',
    seoTitle: 'How to Get Karma on Reddit, the Honest Way',
    description: 'How to get karma on Reddit: what post and comment karma are, how to earn them by helping in the right subreddits, and the shortcuts that get you banned.',
    section: 'Tutorials',
  },
  {
    slug: 'self-hosting',
    title: 'Self-hosting',
    h1: 'Self-host OpenReach with Docker',
    seoTitle: 'How to Self-Host OpenReach with Docker',
    description: 'How to self-host OpenReach with Docker: run the open-source lead generation tool on your own computer or a server, with HTTPS for your own domain.',
    section: 'Run it yourself',
  },
  {
    slug: 'mcp',
    title: 'Connect your agent',
    h1: 'Connect your AI agent to OpenReach',
    seoTitle: 'Connect Claude, ChatGPT or Cursor over MCP',
    description: 'Connect Claude, ChatGPT, Cursor, Codex or Gemini to the OpenReach MCP server: OAuth or an API key, a setup prompt, skills and the Claude Code plugin.',
    section: 'Reference',
  },
  {
    slug: 'mcp-tools',
    title: 'MCP tools',
    h1: 'MCP tools reference',
    seoTitle: 'OpenReach MCP Tools: All 38 Tools Explained',
    description: 'All 38 tools of the OpenReach MCP server: creators, Google Maps leads, lead searches, brand and conversation monitors, and which ones spend.',
    section: 'Reference',
  },
  {
    slug: 'rest-api',
    title: 'REST API',
    h1: 'REST API reference',
    seoTitle: 'OpenReach REST API Reference',
    description: 'The OpenReach REST API: authentication, the response envelope, and every route for lookups, creators, leads, lead searches, monitors and mentions.',
    section: 'Reference',
  },
  {
    slug: 'errors',
    title: 'Errors and troubleshooting',
    h1: 'Errors and troubleshooting',
    seoTitle: 'Errors and Troubleshooting',
    description: 'OpenReach errors and troubleshooting: what each error code means, from a missing key and spending limits to providers that are down or rate limiting.',
    section: 'Reference',
  },
];

export const docsIn = (section: DocSection) => docPages.filter((doc) => doc.section === section);

export function getDoc(slug: string): DocPage {
  const doc = docPages.find((page) => page.slug === slug);
  if (!doc) throw new Error(`Unknown doc page: ${slug}`);
  return doc;
}
