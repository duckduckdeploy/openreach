import { AtSign, Bot, BotMessageSquare, Camera, Clapperboard, MapPinned, MessagesSquare, Music2, UsersRound, type LucideIcon } from 'lucide-react';
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

export interface FeatureTool {
  /** The MCP tool name, e.g. "find_subreddits". */
  name: string;
  body: string;
}

export interface Feature {
  slug: string;
  /** "platform-mcp": a page for one platform's MCP tools. Kept off the home page grid and the footer, which list the core features. */
  group?: 'platform-mcp';
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
  /** "What it does": one or two short paragraphs. Markdown-style links and `code` work. */
  what: string[];
  /** Example requests to an AI agent, with the H2 above them. */
  prompts?: { title: string; items: string[] };
  /** The MCP tools the page is about, with the H2 above them. */
  tools?: { title: string; items: FeatureTool[] };
  /** H2 of a "connect" section with the Claude Code command and the setup prompt. */
  connectTitle?: string;
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
      'Each platform has its own page with example prompts and the tools it uses: the [Reddit MCP server](/features/reddit-mcp), [YouTube MCP server](/features/youtube-mcp), [Instagram MCP server](/features/instagram-mcp) and [TikTok MCP server](/features/tiktok-mcp).',
    ],
    capabilities: [
      { title: '38 tools', body: 'Search, analyse, save, track and monitor: the whole workspace.' },
      { title: 'Spending controls', body: 'dry_run and max_cost_usd on every paid tool, plus your monthly limit.' },
      { title: 'OAuth or API keys', body: 'Sign in from ChatGPT or Claude, or use an API key from Settings.' },
      { title: 'Skills', body: 'A Claude Code plugin with five marketing workflows.' },
    ],
    costs: [{ action: 'Every tool', unit: 'The same price as in the app', price: null }],
  },
  {
    slug: 'reddit-mcp',
    group: 'platform-mcp',
    name: 'Reddit MCP',
    seoTitle: 'Reddit MCP Server: Reddit Search for AI Agents',
    h1: 'Reddit MCP server',
    headline: 'Let your AI agent read Reddit for you. It never posts.',
    summary: 'Search Reddit from Claude, ChatGPT or Cursor for brand mentions, buyers asking for help and the subreddits worth joining, with a ceiling on every paid call.',
    description: 'Reddit MCP server for Claude, ChatGPT and Cursor: search Reddit for brand mentions, people asking for what you sell and the best subreddits. Read-only.',
    whatTitle: 'What the Reddit MCP server does',
    icon: BotMessageSquare,
    worksWith: ['reddit', 'claude', 'chatgpt', 'claudecode', 'cursor', 'codex'],
    what: [
      'The OpenReach MCP server gives your agent read-only Reddit search built for marketing: where your [brand is mentioned](/glossary/brand-mentions), who is asking for a product like yours, and which [subreddits](/glossary/subreddit) your buyers spend time in. Results come back as structured data the agent can sort, summarise and save: title, subreddit, date, replies, link and, for questions, an intent score from 0 to 100.',
      'It is a research tool, not a posting bot. There is no tool that posts, comments, votes or sends messages, so an agent cannot do any of that through OpenReach, by mistake or on purpose. You read the threads it finds and reply yourself, as a real member of the community, which is what Reddit’s rules on [self-promotion](/glossary/self-promotion) ask for anyway.',
      'By default Reddit is searched through Google, one paid search per term or phrasing. A self-hosted install can add the client ID and secret of a Reddit app, and Reddit is then searched through Reddit’s official API at no data cost.',
    ],
    prompts: {
      title: 'Reddit prompts for your agent',
      items: [
        'Find Reddit threads from the last month that mention our product, and tell me which ones still need a reply.',
        'Who on Reddit is asking for a simple CRM for a small business? Rank them by how ready they are to buy.',
        'Which subreddits discuss home espresso the most? Give me five to join, with an example thread from each.',
        'Set up a daily monitor for our brand and our two main competitors on Reddit and Hacker News. Show me the price per month first.',
      ],
    },
    tools: {
      title: 'Reddit MCP tools',
      items: [
        { name: 'brand_mentions', body: 'Threads and comments that name your brand, its domain or other spellings, on Reddit and up to 60 other communities. Results must contain one of the terms, and words you exclude drop the noise.' },
        { name: 'find_conversations', body: 'People asking about the problem your product solves, phrased the way people ask for help: “best …”, “looking for …”, “alternative to …”. Each result gets an intent score; name competitors to catch people unhappy with them.' },
        { name: 'find_subreddits', body: 'The subreddits where a topic is discussed most, ranked by matching threads, the replies on them and how recent they are, with example threads. The same engine as the [subreddit finder](/tools/subreddit-finder).' },
        { name: 'create_monitor', body: 'Run either search on a schedule (daily, weekly or monthly). Each run reads only pages newer than the last one. `run_monitor` starts a run now.' },
        { name: 'list_mentions', body: 'What your monitors found, newest or highest intent first. `set_mention_status` marks threads as read, replied or ignored.' },
        { name: 'get_communities', body: 'Where your mentions and conversations come from, ranked: the subreddits and forums worth being active in. Free.' },
      ],
    },
    capabilities: [
      { title: 'Read-only by design', body: 'No tool posts, comments, votes or sends messages. Your agent researches; you reply.' },
      { title: 'Prices before anything runs', body: 'Every paid tool takes `dry_run` for the price and `max_cost_usd` as a ceiling, on top of your monthly limit.' },
      { title: 'Beyond Reddit', body: 'The same calls cover Hacker News, GitHub, Stack Overflow, Quora, Product Hunt and more. See [brand monitoring](/tools/brand-monitoring).' },
      { title: 'Saved to a project', body: 'Monitors keep what they find in a project, so the agent and the app share one list of threads and their statuses.' },
    ],
    connectTitle: 'Add the Reddit MCP server to your agent',
    costs: [
      { action: 'Reddit searched through Google', unit: 'Per term or phrasing, 10 results', price: '$0.01' },
      { action: 'Subreddit finder', unit: 'Three phrasings, 20 results each', price: '$0.06' },
      { action: 'Reddit through its official API (self-hosted)', unit: 'With your own Reddit app', price: 'Free' },
      { action: 'Hacker News, GitHub and Stack Overflow', unit: 'Official APIs', price: 'Free' },
      { action: 'Optional AI check', unit: 'Up to 25 new results', price: 'from $0.01' },
    ],
    costNote: 'A monitor costs the same per run as the search it repeats; its dry run shows the price of a run and of a month.',
    faqs: [
      { question: 'Can the Reddit MCP server post or comment on Reddit?', answer: ['No. It only searches and reads. There is no posting, commenting, voting or messaging tool, so an agent connected to OpenReach cannot do any of those things.'] },
      { question: 'Does it need a Reddit API key?', answer: ['No. By default Reddit is searched through Google, paid per search from your own YepAPI key. If you self-host, you can add a Reddit app’s client ID and secret and OpenReach uses Reddit’s official API instead, at no data cost.'] },
      { question: 'Which AI agents does it work with?', answer: ['Any MCP client: Claude Code, Claude Desktop, ChatGPT, Cursor, VS Code, Codex, Gemini CLI and others. ChatGPT and Claude can sign in with OAuth; the rest use an API key. The [MCP setup guide](/docs/mcp) has the config for each.'] },
      { question: 'How do I find customers on Reddit with it?', answer: ['Ask your agent to run find_conversations for the problems your product solves, then read the highest-intent threads and reply where you can genuinely help. The [Reddit lead generation](/tools/reddit-lead-generation) page explains the approach.'] },
    ],
  },
  {
    slug: 'youtube-mcp',
    group: 'platform-mcp',
    name: 'YouTube MCP',
    seoTitle: 'YouTube MCP Server: Find YouTubers With AI',
    h1: 'YouTube MCP server',
    headline: 'Ask your agent for the YouTubers in your niche, with real numbers.',
    summary: 'Find YouTube channels for any topic from Claude, ChatGPT or Cursor, check their recent views and save a shortlist, with a ceiling on every paid call.',
    description: 'YouTube MCP server for AI agents: find YouTube channels by niche, check subscribers, average views and posting frequency, and keep a shortlist of creators.',
    whatTitle: 'What the YouTube MCP server does',
    icon: Clapperboard,
    worksWith: ['youtube', 'claude', 'chatgpt', 'claudecode', 'cursor', 'codex'],
    what: [
      'The OpenReach MCP server lets your agent search YouTube the way a marketer would: by niche, not by channel name. It searches channels and videos for your topic and ranks the channels that come up most often and most widely, so a channel that keeps making videos about home espresso ranks above one that made a single viral clip.',
      'Then it checks the numbers that matter before you sponsor anyone. For each channel it reads the profile and recent uploads: subscribers, average views of recent videos, how often they upload, the date of the last video, country, links, and any emails in the description. YouTube shows views rather than likes in listings, so the [engagement rate](/glossary/engagement-rate) here is average views divided by subscribers, which shows how much of the audience still watches.',
      'Channels that list a business email are flagged. YouTube only reveals the address behind a CAPTCHA, so OpenReach never returns it: open the channel’s About page and get it yourself.',
    ],
    prompts: {
      title: 'YouTube prompts for your agent',
      items: [
        'Find 20 YouTube channels about budget home espresso with between 10,000 and 200,000 subscribers that uploaded this month.',
        'For these five channels, compare average views against subscribers and tell me which ones are worth a sponsorship.',
        'Which of the channels in my project list a business email? Mark the rest as not a fit.',
        'Re-check the creators I saved last month and tell me whose views have dropped.',
      ],
    },
    tools: {
      title: 'YouTube MCP tools',
      items: [
        { name: 'find_creators', body: 'Channels for a niche keyword (`platform: youtube`), from channel search and video search, ranked by how often and how widely they appear.' },
        { name: 'analyse_creator', body: 'One channel’s profile and recent videos: subscribers, average views, engagement, uploads per week, last upload, country, links and contacts.' },
        { name: 'analyse_creators', body: 'The same for up to 25 channels at once. Channels that fail are listed separately.' },
        { name: 'save_creators', body: 'Keep channels in a project with a status and tags. Saving one again refreshes its numbers and keeps your notes. Free.' },
        { name: 'list_creators', body: 'Your shortlist, filtered by status or tag. `update_creators` changes statuses, notes and tags in bulk. Free.' },
        { name: 'reanalyse_creators', body: 'Fresh numbers for up to 25 saved channels before you reach out.' },
      ],
    },
    capabilities: [
      { title: 'Niche search, not name search', body: 'Topic in, ranked channels out. The same engine as the [YouTube channel finder](/tools/youtube-channel-finder).' },
      { title: 'Views over subscribers', body: 'Recent average views show a channel’s real reach today, whatever its subscriber count says.' },
      { title: 'An outreach list', body: 'Saved channels move from new to contacted, replied and won in the [influencer CRM](/features/influencer-crm).' },
      { title: 'Spending controls', body: '`dry_run` returns the price and `max_cost_usd` refuses anything dearer, on top of your monthly limit.' },
    ],
    connectTitle: 'Add the YouTube MCP server to your agent',
    costs: [
      { action: 'Channel search and video search', unit: 'One page each', price: '$0.02' },
      { action: 'Analyse one channel', unit: 'Profile and recent videos', price: '$0.02 – $0.03' },
      { action: 'Saving, statuses, notes, export', unit: 'Everything in the list', price: 'Free' },
    ],
    costNote: 'Results are cached for a day, so asking again about the same niche or channel is free.',
    faqs: [
      { question: 'Does it use the YouTube Data API?', answer: ['No. YouTube data comes from YepAPI, billed to your own key per call, so there is no Google Cloud project or YouTube quota to set up.'] },
      { question: 'Can it get a YouTuber’s email address?', answer: ['It returns emails written in a channel’s description and flags channels that list a business email. YouTube shows that address only after a CAPTCHA, so OpenReach never returns it; you open the channel’s About page yourself.'] },
      { question: 'Can it contact YouTubers for me?', answer: ['No. OpenReach finds channels, keeps your list and shows their contacts. You write and send each message yourself. The glossary entry on [influencer outreach](/glossary/influencer-outreach) has tips.'] },
      { question: 'Does it work with ChatGPT?', answer: ['Yes, and with Claude, Cursor, VS Code, Codex, Gemini CLI and any other MCP client. See the [MCP setup guide](/docs/mcp).'] },
    ],
  },
  {
    slug: 'instagram-mcp',
    group: 'platform-mcp',
    name: 'Instagram MCP',
    seoTitle: 'Instagram MCP Server: Find Influencers With AI',
    h1: 'Instagram MCP server',
    headline: 'Find Instagram creators from your agent, then check they are real.',
    summary: 'Search Instagram accounts for any niche from Claude, ChatGPT or Cursor, find lookalikes of creators you like and check engagement before you reach out.',
    description: 'Instagram MCP server for AI agents: find Instagram influencers by niche, find similar accounts, and check followers, engagement rate and contacts.',
    whatTitle: 'What the Instagram MCP server does',
    icon: Camera,
    worksWith: ['instagram', 'claude', 'chatgpt', 'claudecode', 'cursor', 'codex'],
    what: [
      'Instagram is hard to search by topic: its own search mostly matches names. The OpenReach MCP server combines Instagram search with Google’s index of Instagram profiles, so your agent gets accounts that are actually about your niche, not just ones with the word in their handle.',
      'Search results often come without follower counts, so the agent analyses the accounts worth a look: followers, average likes and comments on up to 12 recent posts, the [engagement rate](/glossary/engagement-rate), how often they post, and the emails and phones in the bio. A big following with almost no likes is a common sign of [fake followers](/glossary/fake-followers), and the numbers make it easy to spot.',
      'When you find one creator that fits, the agent can ask Instagram for its own suggestions of similar accounts. It is the cheapest way to grow a shortlist of [micro-influencers](/glossary/micro-influencer) who make the same kind of content.',
    ],
    prompts: {
      title: 'Instagram prompts for your agent',
      items: [
        'Find Instagram accounts about sustainable fashion in the UK and analyse the ten most relevant.',
        'Show me accounts similar to the creator we worked with last month, and keep the ones with an engagement rate above 2%.',
        'Which of these creators have an email in their bio? Save them to the project with the tag “spring launch”.',
        'Check whether this account’s likes match its follower count, and tell me if anything looks off.',
      ],
    },
    tools: {
      title: 'Instagram MCP tools',
      items: [
        { name: 'find_creators', body: 'Accounts for a niche keyword (`platform: instagram`), from Instagram search and Google’s profile index.' },
        { name: 'similar_creators', body: 'Instagram’s own suggestions of accounts like one you already know.' },
        { name: 'analyse_creator', body: 'One account’s profile and up to 12 recent posts: followers, average likes and comments, engagement rate, posts per week, last post, links and contacts.' },
        { name: 'analyse_creators', body: 'The same for up to 25 accounts at once.' },
        { name: 'save_creators', body: 'Keep accounts in a project with a status and tags. Free.' },
        { name: 'reanalyse_creators', body: 'Fresh numbers for saved accounts before a campaign.' },
      ],
    },
    capabilities: [
      { title: 'Topic search that works', body: 'Instagram search plus Google’s profile index, the same as the [Instagram influencer finder](/tools/instagram-influencer-finder).' },
      { title: 'Lookalike creators', body: 'One good creator becomes a shortlist with Instagram’s own similar-account suggestions.' },
      { title: 'A quick follower audit', body: 'Engagement against followers shows bought audiences. More in [follower audit](/glossary/follower-audit).' },
      { title: 'Spending controls', body: '`dry_run` and `max_cost_usd` on every paid tool, plus your monthly limit.' },
    ],
    connectTitle: 'Add the Instagram MCP server to your agent',
    costs: [
      { action: 'Instagram search and Google’s profile index', unit: 'One search', price: '$0.03' },
      { action: 'Analyse one account', unit: 'Profile and recent posts', price: '$0.02' },
      { action: 'Similar accounts', unit: 'One account’s suggestions', price: '$0.01' },
      { action: 'Saving, statuses, notes, export', unit: 'Everything in the list', price: 'Free' },
    ],
    faqs: [
      { question: 'Does it need an Instagram or Meta developer account?', answer: ['No. Instagram data comes from YepAPI, billed per call to your own key. You do not connect an Instagram account or create a Meta app.'] },
      { question: 'Can it follow, like or DM accounts?', answer: ['No. It only reads public profiles and posts. There is no tool that follows, likes, comments or sends messages.'] },
      { question: 'Why do search results have no follower counts?', answer: ['Instagram’s search often leaves them out. Run analyse_creator or analyse_creators on the accounts you care about to get followers, engagement and contacts.'] },
      { question: 'Which agents does it work with?', answer: ['Claude Code, Claude Desktop, ChatGPT, Cursor, VS Code, Codex, Gemini CLI and any other MCP client. See the [MCP setup guide](/docs/mcp).'] },
    ],
  },
  {
    slug: 'tiktok-mcp',
    group: 'platform-mcp',
    name: 'TikTok MCP',
    seoTitle: 'TikTok MCP Server: Find TikTok Creators With AI',
    h1: 'TikTok MCP server',
    headline: 'Your agent finds the TikTok creators your buyers watch.',
    summary: 'Search TikTok creators for any niche from Claude, ChatGPT or Cursor, check views and engagement on their last 30 videos and keep a shortlist.',
    description: 'TikTok MCP server for AI agents: search TikTok creators by niche, analyse views and engagement on recent videos, find their other profiles and keep a list.',
    whatTitle: 'What the TikTok MCP server does',
    icon: Music2,
    worksWith: ['tiktok', 'claude', 'chatgpt', 'claudecode', 'cursor', 'codex'],
    what: [
      'On TikTok, follower counts say little: videos are shown to people who do not follow the creator, and a small account can get far more views than a big one. The OpenReach MCP server searches TikTok users and videos for your niche and ranks the creators who keep showing up for it, so your agent starts from who makes this kind of content, not who is famous.',
      'For each creator the agent can read the profile and up to 30 recent videos: followers, average views, likes and comments, the [engagement rate](/glossary/engagement-rate), how often they post and when they last did. The profile links to the same creator’s Instagram, YouTube or X when they have set them, which helps when a campaign runs on more than one platform.',
      'Save the creators that fit to a project and track each one from first contact to a signed deal. Agreements about reusing their videos in ads, such as [Spark Ads](/glossary/spark-ads), are yours to negotiate; OpenReach keeps the notes.',
    ],
    prompts: {
      title: 'TikTok prompts for your agent',
      items: [
        'Find TikTok creators who post about meal prep for students, and rank them by average views on their recent videos.',
        'Analyse these 15 creators and drop anyone who has not posted in the last two weeks.',
        'Which of the creators in my project also have a YouTube channel? Add the tag “cross-platform”.',
        'How much will it cost to analyse 25 creators? Do a dry run first.',
      ],
    },
    tools: {
      title: 'TikTok MCP tools',
      items: [
        { name: 'find_creators', body: 'Creators for a niche keyword (`platform: tiktok`), from user search and video search, ranked by how often and how widely they appear.' },
        { name: 'analyse_creator', body: 'One creator’s profile and up to 30 recent videos: followers, average views, likes, comments, engagement rate, posts per week, last post and linked profiles.' },
        { name: 'analyse_creators', body: 'The same for up to 25 creators at once.' },
        { name: 'save_creators', body: 'Keep creators in a project with a status and tags. Free.' },
        { name: 'update_creators', body: 'Statuses, notes and tags in bulk, as your outreach moves on. Free.' },
        { name: 'reanalyse_creators', body: 'Fresh numbers for up to 25 saved creators.' },
      ],
    },
    capabilities: [
      { title: 'Views, not just followers', body: 'Average views of recent videos show who actually reaches people today. Same engine as [TikTok user search](/tools/tiktok-user-search).' },
      { title: 'Cross-platform profiles', body: 'Linked Instagram, YouTube and X accounts from the creator’s own profile.' },
      { title: 'Outreach tracking', body: 'From new to won in the [influencer CRM](/features/influencer-crm), shared between the agent and the app.' },
      { title: 'Spending controls', body: 'Prices first with `dry_run`, a ceiling with `max_cost_usd`, and your monthly limit.' },
    ],
    connectTitle: 'Add the TikTok MCP server to your agent',
    costs: [
      { action: 'User search and video search', unit: 'One page each', price: '$0.02' },
      { action: 'Analyse one creator', unit: 'Profile and recent videos', price: '$0.02' },
      { action: 'Saving, statuses, notes, export', unit: 'Everything in the list', price: 'Free' },
    ],
    costNote: 'Results are cached for a day, so the same search or creator again is free.',
    faqs: [
      { question: 'Does it need TikTok’s Research API?', answer: ['No. TikTok data comes from YepAPI, paid per call from your own key, with no application to TikTok.'] },
      { question: 'Can it message creators on TikTok?', answer: ['No. It reads public profiles and videos only. You contact creators yourself, through the email or links on their profile.'] },
      { question: 'How is the engagement rate worked out?', answer: ['Average likes plus comments per recent video, divided by followers, over up to 30 videos. The [engagement rate calculator](/tools/engagement-rate-calculator) page explains it.'] },
      { question: 'Which agents does it work with?', answer: ['Any MCP client: Claude Code, Claude Desktop, ChatGPT, Cursor, VS Code, Codex, Gemini CLI and more. See the [MCP setup guide](/docs/mcp).'] },
    ],
  },
];

export const getFeature = (slug: string) => features.find((feature) => feature.slug === slug);
