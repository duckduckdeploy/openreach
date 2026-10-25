import type { FreeToolKind } from '@/components/free-tool';
import { AtSign, BadgePercent, Camera, Hash, MapPin, MessageCircleQuestion, MonitorPlay, Radar, Search, Store, Users, Video, type LucideIcon } from 'lucide-react';
import type { Brand } from '@/components/brand-icon';
import type { Faq } from './pricing';

export interface ToolSection {
  title: string;
  body: string;
}

export interface ToolCost {
  /** What runs, e.g. "One page of 20 businesses". */
  action: string;
  price: string;
}

export type ToolGroup = 'Influencers' | 'Leads' | 'Communities';

/** A tool of the app, as its landing page on this site presents it. */
export interface ResearchTool {
  slug: string;
  group: ToolGroup;
  /** A free version on the page itself, no account needed (components/free-tool.tsx). */
  freeTool?: FreeToolKind;
  /** An in-browser calculator on the page instead (components/engagement-calculator.tsx): no account, no API call. */
  calculator?: 'engagement';
  /** The tool's name in the app. */
  name: string;
  icon: LucideIcon;
  /** Title tag, keyword first. The " · OpenReach" suffix is added by the template. */
  seoTitle: string;
  /** Use seoTitle as the whole title tag, when the suffix would take it past 60 characters. */
  absoluteTitle?: boolean;
  /** Page H1: the exact head keyword, 2 to 5 words. */
  h1: string;
  /** Short line under the H1. */
  headline: string;
  /** One sentence for cards. */
  summary: string;
  /** Meta description, 120 to 155 characters. */
  description: string;
  /** The paragraph under the headline. */
  lede: string;
  /** Three short things it gives you, shown under the lede. */
  points: string[];
  /** The tool's address in the app, with any preset in its query. */
  appPath: string;
  /** Platforms or sources it reads, shown under the headline. */
  worksWith?: Brand[];
  /** What the results show, one card each. */
  sections: ToolSection[];
  /** H2 of the results section, keyword-led. */
  sectionsTitle: string;
  uses: ToolSection[];
  steps: ToolSection[];
  /** What one search runs and costs, and the total. */
  costs: ToolCost[];
  total: string;
  costNote: string;
  faqs: Faq[];
  /** The tutorial that walks through it. */
  guide: string;
  /** Glossary terms worth reading next: a few, not every match. */
  glossary?: string[];
}

const noPosting: Faq = {
  question: 'Does OpenReach post, comment or send messages for me?',
  answer: [
    'No. OpenReach finds people, businesses and conversations and keeps them organised. You reach out yourself, in your own words. That keeps your accounts safe and your outreach honest.',
  ],
};

const projectFaq: Faq = {
  question: 'Do I need a project?',
  answer: [
    'No. Every tool works on its own. When a result is worth keeping, save it to a project in one click: creators and leads get an outreach status, notes and tags, and monitors check for new mentions on a schedule.',
  ],
};

const creatorFaqs: Faq[] = [
  {
    question: 'How is the engagement rate worked out?',
    answer: [
      'On TikTok and Instagram it is the average likes plus comments of a creator’s recent posts, divided by their followers. On YouTube, where listings show views and not likes, it is the average views of recent videos divided by subscribers. Both are shown as a percentage.',
    ],
  },
  {
    question: 'Where do the contact details come from?',
    answer: [
      'Only from what creators publish: emails and phone numbers written in their bio, their link in bio, and the links on their profile. YouTube shows whether a channel has a business email; the address itself sits behind a CAPTCHA on YouTube, so OpenReach tells you it exists and where to find it.',
    ],
  },
  projectFaq,
  noPosting,
];

const leadFaqs: Faq[] = [
  {
    question: 'Is this a Google Maps scraper?',
    answer: [
      'It does the job people use one for, without scraping. The data comes from Google’s official Places data through YepAPI: name, category, address, phone, website, rating, review count, opening hours and business status, live for every search.',
    ],
  },
  {
    question: 'How many businesses does one search return?',
    answer: [
      'Google Maps returns up to 20 places a page and 60 for one search. For a whole city, a lead search in a project runs your queries from a grid of points across it, or across a list of towns, and keeps every place it finds once.',
    ],
  },
  {
    question: 'Can I find emails for the businesses?',
    answer: [
      'Yes, for businesses with their own website. OpenReach can read the homepage for a contact address ($0.01 each), or ask a business-email directory for the people at that domain ($0.03 each). Businesses without a website are skipped, for free.',
    ],
  },
  projectFaq,
];

const communityFaqs: Faq[] = [
  {
    question: 'Which communities does it search?',
    answer: [
      'More than 60: Reddit, Quora, Hacker News, GitHub, Stack Overflow and the Stack Exchange sites, DEV, Indie Hackers, Product Hunt, X, LinkedIn, Facebook groups, review sites such as G2, Capterra and Trustpilot, app stores and forums. You pick them per search or per monitor.',
    ],
  },
  {
    question: 'How does it search Reddit and Quora?',
    answer: [
      'Through Google search results restricted to each site, and through the free official APIs of Hacker News, GitHub and Stack Exchange. A self-hosted install can also use Reddit’s official API with its own app credentials. OpenReach never works around a site that blocks automated visits.',
    ],
  },
  noPosting,
];

const influencerSteps: ToolSection[] = [
  { title: 'Search a niche', body: 'Type the words your audience uses, pick YouTube, TikTok or Instagram, and a country.' },
  { title: 'Shortlist', body: 'Creators who keep coming up for your niche rank first. Filter by followers, engagement or an email in the bio.' },
  { title: 'Analyse and save', body: 'Analyse the promising ones for real averages and contacts, then save them to a project with a status.' },
];

const leadSteps: ToolSection[] = [
  { title: 'Search a place', body: 'A type of business and a city, area or postcode: “plumber” in “Austin, TX”.' },
  { title: 'Filter for your pitch', body: 'No website, under 20 reviews, rated under 4, a word in the name: combine rules with all or any.' },
  { title: 'Save or export', body: 'Find emails for the ones with a website, save them as leads with a status, or download a CSV.' },
];

const communitySteps: ToolSection[] = [
  { title: 'Describe what to find', body: 'Your brand’s names, or the problem your product solves in a buyer’s words.' },
  { title: 'Pick the communities', body: 'Reddit, Hacker News, GitHub, Stack Overflow, Quora, review sites and more. The free ones cost nothing.' },
  { title: 'Read and reply', body: 'Results are ranked by date or intent. Reply yourself, then mark what you have replied to.' },
];

export const tools: ResearchTool[] = [
  // ── Influencers ──────────────────────────────────────────────────────────
  {
    slug: 'influencer-search-tool',
    glossary: ['influencer-marketing', 'micro-influencer', 'engagement-rate'],
    group: 'Influencers',
    name: 'Influencer finder',
    icon: Users,
    seoTitle: 'Influencer Search Tool for YouTube, TikTok, Instagram',
    absoluteTitle: true,
    h1: 'Influencer search tool',
    headline: 'Find creators who reach your audience.',
    summary: 'Creators on YouTube, TikTok and Instagram for any niche, with followers, average views, engagement and contacts.',
    description: 'Open-source influencer search tool: find creators on YouTube, TikTok and Instagram by niche, with followers, engagement rate and emails from their bio.',
    lede: 'Search a niche once and see the creators who keep coming up for it on YouTube, TikTok or Instagram. Analyse the promising ones for their real reach, then keep a shortlist with where outreach stands.',
    points: ['YouTube, TikTok and Instagram', 'Engagement and average views', 'Emails and links from the bio'],
    appPath: '/tools/influencer-finder',
    worksWith: ['youtube', 'tiktok', 'instagram'],
    sectionsTitle: 'Influencer search results, explained',
    sections: [
      { title: 'Ranked by relevance', body: 'Creators are ranked by how many matching videos they made and the views on them, then by audience, so the people who really cover your niche come first.' },
      { title: 'Real reach', body: 'Analysing a creator reads their profile and recent posts: average views, likes and comments, engagement rate, posts per week and the last post date.' },
      { title: 'Contacts', body: 'Emails and phone numbers from the bio, the link in bio, and other platforms they link to. YouTube channels with a business email are marked.' },
      { title: 'Filters that cost nothing', body: 'Followers between, engagement above, has an email, verified, country, a word in the bio. Filters run on the results already on screen.' },
    ],
    uses: [
      { title: 'Find micro-influencers', body: 'Creators with 10K to 100K followers often charge less and get more engagement. Filter to that tier and sort by engagement.' },
      { title: 'Plan a launch', body: 'Shortlist 20 creators for a launch, analyse them, and track who you contacted and who replied in a project.' },
      { title: 'Size a niche', body: 'See who leads a topic on each platform and how big their audiences are before you commit a budget.' },
      { title: 'Hand it to an agent', body: 'The same search runs over MCP, so Claude or another agent can shortlist creators for you under a spending limit.' },
    ],
    steps: influencerSteps,
    costs: [
      { action: 'YouTube or TikTok search, one page', price: '$0.02' },
      { action: 'Instagram search, one page', price: '$0.03' },
      { action: 'Analyse one creator (profile and recent posts)', price: '$0.02 – $0.03' },
    ],
    total: 'A search from $0.02',
    costNote: 'Analysing the top 10 creators of a search adds about $0.20 to $0.30.',
    faqs: creatorFaqs,
    guide: '/docs/tutorials/find-influencers',
  },
  {
    slug: 'youtube-channel-finder',
    group: 'Influencers',
    freeTool: 'youtube-channels',
    name: 'YouTube channel finder',
    icon: MonitorPlay,
    seoTitle: 'YouTube Channel Finder: Search Channels by Niche',
    h1: 'YouTube channel finder',
    headline: 'Every channel that covers your topic.',
    summary: 'YouTube channels for any topic, ranked by matching videos and their views, with subscribers and contacts.',
    description: 'Free YouTube channel finder: search channels by niche or keyword, see subscribers, matching videos and views, and find the channel’s contact links.',
    lede: 'Type a topic and get the channels that make videos about it, ranked by how many matching videos they have and how many views those got. Try it here, free, or open the full tool.',
    points: ['Channels and matching videos', 'Subscribers and views', 'Links and business email flag'],
    appPath: '/tools/influencer-finder?platform=youtube',
    worksWith: ['youtube'],
    sectionsTitle: 'What the YouTube channel search shows',
    sections: [
      { title: 'Channels, not just videos', body: 'Channel results and video results are merged, so a channel that made five videos on your topic ranks above one that matches by name only.' },
      { title: 'Subscribers and views', body: 'Subscriber counts, the number of matching videos and their total views, side by side.' },
      { title: 'Channel analysis', body: 'Average views of recent uploads, views per subscriber, upload frequency, country, keywords and the links on the About tab.' },
      { title: 'Business email', body: 'YouTube shows whether a channel lists a business email. OpenReach flags it so you know where to look.' },
    ],
    uses: [
      { title: 'Sponsor a video', body: 'Find channels that review products like yours and compare their average views before you reach out.' },
      { title: 'Research a topic', body: 'See who already owns a topic on YouTube before you start a channel of your own.' },
    ],
    steps: influencerSteps,
    costs: [
      { action: 'Channel search and video search, one page each', price: '$0.02' },
      { action: 'Analyse one channel', price: '$0.02 – $0.03' },
    ],
    total: 'A search costs $0.02',
    costNote: 'A second or third page of results costs the same again.',
    faqs: creatorFaqs,
    guide: '/docs/tutorials/find-influencers',
  },
  {
    slug: 'tiktok-user-search',
    group: 'Influencers',
    freeTool: 'tiktok-creators',
    name: 'TikTok creator search',
    icon: Video,
    seoTitle: 'TikTok User Search: Find Creators by Niche',
    h1: 'TikTok user search',
    headline: 'The creators behind the videos in your niche.',
    summary: 'TikTok creators for any niche, from account search and from the videos that match it, with followers and engagement.',
    description: 'Free TikTok user search: find TikTok creators by niche or keyword, with followers, matching videos and their plays, engagement rate and bio contacts.',
    lede: 'Search TikTok by topic and see both the accounts that match it and the creators of the videos that do. Analyse any of them for average plays, engagement and the contacts in their bio.',
    points: ['Accounts and video creators', 'Followers and plays', 'Engagement rate'],
    appPath: '/tools/influencer-finder?platform=tiktok',
    worksWith: ['tiktok'],
    sectionsTitle: 'What the TikTok user search shows',
    sections: [
      { title: 'Two searches in one', body: 'TikTok’s user search and its video search, merged: a creator whose videos keep showing up for your niche ranks first, even with a different username.' },
      { title: 'Private accounts left out', body: 'Private accounts are dropped, because you cannot work with them.' },
      { title: 'Recent posts', body: 'Analysis reads up to 30 recent videos: average plays, likes and comments, engagement rate and how often they post.' },
      { title: 'Linked accounts', body: 'The link in bio and the Instagram, YouTube or X account the creator connected to TikTok.' },
    ],
    uses: [
      { title: 'Find UGC creators', body: 'Search a product category and shortlist creators who post about it regularly.' },
      { title: 'Check a creator before paying', body: 'Average plays across recent posts tell you more than a follower count.' },
    ],
    steps: influencerSteps,
    costs: [
      { action: 'User search and video search, one page each', price: '$0.02' },
      { action: 'Analyse one creator', price: '$0.02' },
    ],
    total: 'A search costs $0.02',
    costNote: 'A second or third page of results costs the same again.',
    faqs: creatorFaqs,
    guide: '/docs/tutorials/find-influencers',
  },
  {
    slug: 'instagram-influencer-finder',
    group: 'Influencers',
    freeTool: 'instagram-creators',
    name: 'Instagram influencer finder',
    icon: Camera,
    seoTitle: 'Instagram Influencer Finder: Find Creators',
    h1: 'Instagram influencer finder',
    headline: 'Instagram creators for your niche, and the ones like them.',
    summary: 'Instagram creators for any niche, with followers, engagement, emails from the bio and lookalike accounts.',
    description: 'Free Instagram influencer finder: find Instagram creators by niche, check followers and engagement rate, read bio emails and discover similar accounts.',
    lede: 'Find Instagram accounts for a niche from Instagram’s own search and from Google’s index of Instagram profiles. Then analyse them, and grow a shortlist with Instagram’s suggestions of similar accounts.',
    points: ['Followers and engagement', 'Emails and links from the bio', 'Similar accounts'],
    appPath: '/tools/influencer-finder?platform=instagram',
    worksWith: ['instagram'],
    sectionsTitle: 'What the Instagram influencer search shows',
    sections: [
      { title: 'Profiles for your niche', body: 'Accounts from Instagram search, plus profiles from Google’s index of Instagram with their follower counts.' },
      { title: 'Engagement rate', body: 'Average likes and comments of recent posts over followers, as a percentage.' },
      { title: 'Business details', body: 'Emails and phone numbers in the bio, the link in bio, the business category and city when the account shows them.' },
      { title: 'Lookalikes', body: 'Instagram’s own list of accounts similar to one you already like, for a fast way to grow a shortlist.' },
    ],
    uses: [
      { title: 'Grow from one good creator', body: 'Found a creator who fits? Ask for similar accounts and analyse the new names.' },
      { title: 'Spot inflated audiences', body: 'A large following with very low engagement is worth a second look before you pay.' },
    ],
    steps: influencerSteps,
    costs: [
      { action: 'Instagram search and Google’s profile index', price: '$0.03' },
      { action: 'Analyse one account', price: '$0.02' },
      { action: 'Similar accounts', price: '$0.01' },
    ],
    total: 'A search costs $0.03',
    costNote: 'More pages of Google’s profile index cost $0.02 each.',
    faqs: creatorFaqs,
    guide: '/docs/tutorials/find-influencers',
  },
  {
    slug: 'engagement-rate-calculator',
    glossary: ['engagement-rate', 'fake-followers', 'follower-audit'],
    group: 'Influencers',
    calculator: 'engagement',
    name: 'Creator analyser',
    icon: BadgePercent,
    seoTitle: 'Engagement Rate Calculator for TikTok, Instagram, YouTube',
    absoluteTitle: true,
    h1: 'Engagement rate calculator',
    headline: 'Type in the numbers, or let OpenReach read the posts.',
    summary: 'The engagement rate, average views and posting frequency of any TikTok, Instagram or YouTube account.',
    description: 'Free engagement rate calculator for Instagram, TikTok and YouTube: by followers and by views. Or paste a handle to have every recent post counted for you.',
    lede: 'Enter followers, likes, comments and views below for an instant rate, by followers and by views. In the app, paste a handle instead: OpenReach reads the recent posts and works out the rate, average views and posting frequency for you.',
    points: ['Free calculator, no sign-up', 'By followers and by views', 'Or from a handle in the app'],
    appPath: '/tools/creator',
    worksWith: ['tiktok', 'instagram', 'youtube'],
    sectionsTitle: 'How the engagement rate is calculated',
    sections: [
      { title: 'The formula', body: 'Engagement rate by followers = (likes + comments + shares + saves) per post ÷ followers × 100. By views, divide by the post’s views instead. Count the same interactions for every creator you compare.' },
      { title: 'By followers or by views', body: 'By followers shows how much of the audience reacts; by views shows how much of the people who saw a post reacted. On TikTok and Reels, where most views come from people who do not follow, the rate by views is often the fairer one.' },
      { title: 'TikTok and Instagram', body: 'Average likes plus comments per recent post, divided by followers. Up to 30 TikTok videos or 12 Instagram posts are read.' },
      { title: 'YouTube', body: 'YouTube listings show views, not likes, so engagement is average views of recent videos divided by subscribers.' },
      { title: 'Posting frequency', body: 'Posts per week across the span the recent posts cover, and the date of the last one.' },
      { title: 'Recent posts', body: 'Each recent post with its views, likes and comments, linked, so you can see what does well.' },
    ],
    uses: [
      { title: 'Vet a creator before a deal', body: 'Check that recent posts still get the reach the follower count suggests.' },
      { title: 'Compare two creators', body: 'Save both to a project and compare engagement and average views side by side.' },
    ],
    steps: [
      { title: 'Paste a handle', body: 'A @handle, a profile link or a YouTube channel ID, and the platform.' },
      { title: 'Read the numbers', body: 'Engagement rate, average views, likes, comments, posts per week and the last post.' },
      { title: 'Save it', body: 'Keep the creator in a project with a status, notes and tags.' },
    ],
    costs: [{ action: 'Profile and recent posts', price: '$0.02 – $0.03' }],
    total: 'One creator costs $0.02 to $0.03',
    costNote: 'A YouTube handle is looked up first ($0.01); a channel ID skips that step.',
    faqs: [
      {
        question: 'How do you calculate engagement rate?',
        answer: ['Add up a post’s likes, comments, shares and saves, divide by the account’s followers, and multiply by 100. For several posts, use the average per post. To calculate it by views, divide by the post’s views instead of the followers.'],
      },
      {
        question: 'What is a good engagement rate?',
        answer: ['It depends on the platform, the niche and the account’s size: smaller accounts usually have higher rates than large ones. Compare a creator with others of a similar size in the same niche, and look at the trend over their recent posts rather than one number.'],
      },
      {
        question: 'Is the engagement rate calculator free?',
        answer: ['Yes. The calculator on this page works in your browser, needs no account and sends nothing anywhere. Analysing a creator from a handle in the app reads their real posts and is a paid lookup from your own YepAPI key ($0.02 to $0.03).'],
      },
      ...creatorFaqs,
    ],
    guide: '/docs/tutorials/find-influencers',
  },

  // ── Leads ────────────────────────────────────────────────────────────────
  {
    slug: 'google-maps-scraper',
    glossary: ['google-maps-scraping', 'lead-list', 'google-business-profile'],
    group: 'Leads',
    freeTool: 'lead-finder',
    name: 'Lead finder',
    icon: MapPin,
    seoTitle: 'Google Maps Scraper Alternative: Business Leads',
    h1: 'Google Maps scraper',
    headline: 'Business leads from Google Maps, without scraping.',
    summary: 'Businesses from Google Maps for any search and place, with phone, website, rating and reviews, as a lead list.',
    description: 'Google Maps scraper alternative: export businesses with phone, website, rating and reviews from Google’s official Places data. Filter, find emails, save.',
    lede: 'Get the businesses a Google Maps search shows, with the details you need to reach them, from Google’s official Places data. Filter for the ones that fit your pitch and export them or save them as leads.',
    points: ['Phone, website, rating, reviews', 'Filters for your pitch', 'CSV export'],
    appPath: '/tools/lead-finder',
    worksWith: ['googlemaps'],
    sectionsTitle: 'Google Maps data you can export',
    sections: [
      { title: 'Business details', body: 'Name, category and types, address, phone, website, rating, review count, price level, opening hours and business status.' },
      { title: 'Filters with logic', body: 'Combine rules with all or any: has a website, rating under 4, under 20 reviews, a word in the name, one of several categories.' },
      { title: 'Emails', body: 'Read each business’s homepage for a contact email, or ask a business-email directory for the people at its domain.' },
      { title: 'Whole cities', body: 'In a project, a lead search covers a whole city with a grid of searches, or a list of towns, and saves every match once.' },
    ],
    uses: [
      { title: 'Sell web design', body: 'List local businesses without a website, or with only a Facebook page.' },
      { title: 'Sell reputation services', body: 'Find businesses with a low rating or very few reviews.' },
      { title: 'Build a B2B list', body: 'Every dentist, gym or café in a region, with phone and website, in a spreadsheet.' },
      { title: 'Track outreach', body: 'Save leads to a project and move each one from “to contact” to “won”.' },
    ],
    steps: leadSteps,
    costs: [
      { action: 'One page of up to 20 businesses', price: '$0.07' },
      { action: 'Email from a business’s homepage', price: '$0.01' },
      { action: 'Emails from a business-email directory', price: '$0.03' },
    ],
    total: 'From $0.07 for 20 businesses',
    costNote: 'One search returns up to 3 pages (60 businesses).',
    faqs: leadFaqs,
    guide: '/docs/tutorials/build-a-lead-list',
  },
  {
    slug: 'businesses-without-websites',
    group: 'Leads',
    name: 'Lead finder',
    icon: Store,
    seoTitle: 'Find Businesses Without Websites in Any City',
    h1: 'Businesses without websites',
    headline: 'Local businesses that still need a website.',
    summary: 'Local businesses on Google Maps with no website of their own, in any city, with phone numbers and reviews.',
    description: 'Find local businesses without websites in any city: Google Maps listings with no website or only a Facebook page, with phone, rating and reviews.',
    lede: 'Search a type of business in a place and keep only the ones with no website of their own. A Facebook page, an Instagram profile or a Linktree does not count as a website.',
    points: ['No website, or only a social page', 'Phone and address', 'Reviews and rating'],
    appPath: '/tools/lead-finder?rules=%7B%22match%22%3A%22all%22%2C%22rules%22%3A%5B%7B%22field%22%3A%22website%22%2C%22op%22%3A%22eq%22%2C%22value%22%3Afalse%7D%5D%7D',
    worksWith: ['googlemaps'],
    sectionsTitle: 'How to find businesses without websites',
    sections: [
      { title: 'The “No website” filter', body: 'One click keeps the places with no website, or a website that is only a profile on someone else’s platform.' },
      { title: 'Still open', body: 'Permanently closed places are left out, so the list is people you can actually call.' },
      { title: 'Worth calling first', body: 'Sort by reviews: a busy business with no website has the most to gain.' },
      { title: 'Every town', body: 'A lead search in a project runs the same filter across a list of towns or a whole city and saves the matches.' },
    ],
    uses: [
      { title: 'Web designers and agencies', body: 'A ready list of businesses to pitch a first website to.' },
      { title: 'Local marketing', body: 'Businesses without a site often need help with their Google profile too.' },
    ],
    steps: leadSteps,
    costs: [{ action: 'One page of up to 20 businesses', price: '$0.07' }],
    total: 'From $0.07 a search',
    costNote: 'Filters are free: they run on the results you already have.',
    faqs: leadFaqs,
    guide: '/docs/tutorials/build-a-lead-list',
  },
  {
    slug: 'lead-finder',
    glossary: ['lead-generation', 'ideal-customer-profile', 'cold-email'],
    group: 'Leads',
    name: 'Lead finder',
    icon: Search,
    seoTitle: 'Lead Finder: Local Business Leads',
    h1: 'Lead finder',
    headline: 'A lead list for your pitch, in any city.',
    summary: 'Search businesses by type and place, filter them for your pitch, find their emails and keep a lead list with statuses.',
    description: 'Open-source lead finder: search local businesses by type and city, filter by website, rating and reviews, find emails and track every lead to a deal.',
    lede: 'Lead finder turns a Google Maps search into a lead list: filter for the businesses that fit, find their emails, and keep each one with a status, notes and tags until it becomes a customer.',
    points: ['Search any city', 'Rules for your pitch', 'Status, notes and tags'],
    appPath: '/tools/lead-finder',
    worksWith: ['googlemaps'],
    sectionsTitle: 'What the lead finder does',
    sections: [
      { title: 'Search', body: 'Any type of business in any place, up to 60 per search, or whole cities with a lead search in a project.' },
      { title: 'Filter', body: 'Ready-made filters for common pitches, or your own rules on rating, reviews, website, phone, category and name.' },
      { title: 'Enrich', body: 'Contact emails from each business’s website, kept on the lead.' },
      { title: 'Track', body: 'New, to contact, contacted, replied, won or not a fit, with notes and tags, and a CSV of the list any time.' },
    ],
    uses: [
      { title: 'Agencies', body: 'Prospect lists for SEO, ads, web design or reputation services.' },
      { title: 'B2B sales', body: 'Every business of a type in your territory, kept as a pipeline.' },
    ],
    steps: leadSteps,
    costs: [
      { action: 'One page of up to 20 businesses', price: '$0.07' },
      { action: 'Email from a business’s homepage', price: '$0.01' },
    ],
    total: 'From $0.07 for 20 businesses',
    costNote: 'A lead search shows its size before it starts, and a monthly limit caps what you spend.',
    faqs: leadFaqs,
    guide: '/docs/tutorials/build-a-lead-list',
  },

  // ── Communities ──────────────────────────────────────────────────────────
  {
    slug: 'brand-monitoring',
    glossary: ['brand-monitoring', 'social-listening', 'share-of-voice'],
    group: 'Communities',
    freeTool: 'brand-mentions',
    name: 'Brand mentions',
    icon: AtSign,
    seoTitle: 'Brand Monitoring: Track Brand Mentions Online',
    h1: 'Brand monitoring',
    headline: 'Every new mention of your product, in one feed.',
    summary: 'Brand mentions across Reddit, Hacker News, GitHub, Stack Overflow, Quora, X, LinkedIn, review sites and more.',
    description: 'Open-source brand monitoring: track brand mentions on Reddit, Hacker News, GitHub, Stack Overflow, Quora, review sites and 60+ communities, on a schedule.',
    lede: 'Find the pages that name your product across more than 60 communities, and keep watching: a monitor checks on a schedule, reads only what is new, and lists it in a feed you can work through.',
    points: ['60+ communities', 'Only pages that name you', 'Daily or weekly checks'],
    appPath: '/tools/brand-mentions',
    worksWith: ['reddit', 'ycombinator', 'github', 'stackoverflow', 'quora', 'producthunt'],
    sectionsTitle: 'Brand mentions across communities',
    sections: [
      { title: 'Only real mentions', body: 'A page must contain one of your brand terms to be kept, and you can leave out words that bring noise, such as “jobs”.' },
      { title: 'Where people talk', body: 'Mentions are grouped by community, so you see which subreddits, forums and sites talk about you most.' },
      { title: 'Sentiment and replies', body: 'Each mention shows its community, author, age, reply count and sentiment. An optional AI check drops namesakes.' },
      { title: 'A feed to work through', body: 'Monitors add new pages after each run. Mark what you have replied to and ignore the rest.' },
    ],
    uses: [
      { title: 'Answer questions about you', body: 'Someone asks whether your product does X: reply while the thread is fresh.' },
      { title: 'Catch complaints early', body: 'Negative mentions surface in the feed, where you can fix the problem and reply.' },
      { title: 'Collect testimonials', body: 'Positive mentions are proof you can ask to quote.' },
      { title: 'Watch competitors', body: 'A monitor for a competitor’s name shows where their users talk, and what they wish it did.' },
    ],
    steps: communitySteps,
    costs: [
      { action: 'One community searched through Google, per brand term', price: '$0.01' },
      { action: 'Hacker News, GitHub and Stack Overflow', price: 'Free' },
      { action: 'Optional AI check, per 25 results', price: 'from $0.01' },
    ],
    total: 'About $0.10 to $0.25 a check',
    costNote: 'A daily monitor of one name over the default communities costs a few dollars a month.',
    faqs: communityFaqs,
    guide: '/docs/tutorials/monitor-brand-mentions',
  },
  {
    slug: 'reddit-monitoring',
    group: 'Communities',
    name: 'Reddit monitoring',
    icon: Radar,
    seoTitle: 'Reddit Monitoring: Keyword and Brand Alerts',
    h1: 'Reddit monitoring',
    headline: 'Know when Reddit talks about you, or your problem.',
    summary: 'Reddit threads that mention your brand or a keyword, checked on a schedule, grouped by subreddit.',
    description: 'Reddit monitoring for brands and keywords: new threads that name your product or ask about your problem, grouped by subreddit, checked daily or weekly.',
    lede: 'Set up a monitor for your brand or for the problem you solve, with Reddit as the source. Each run reads only threads that are new since the last one, and groups them by subreddit.',
    points: ['Brand and keyword monitors', 'Grouped by subreddit', 'Daily or weekly'],
    appPath: '/tools/brand-mentions?sources=reddit',
    worksWith: ['reddit'],
    sectionsTitle: 'How Reddit monitoring works',
    sections: [
      { title: 'Search results, not scraping', body: 'Reddit is searched through Google results restricted to reddit.com. A self-hosted install can use Reddit’s official API with its own app credentials instead.' },
      { title: 'Subreddit and replies', body: 'Each thread shows its subreddit, roughly how many comments it has and how old it is.' },
      { title: 'Only what is new', body: 'After the first run, each run looks only at threads newer than the last, so you are never shown the same thread twice.' },
      { title: 'Intent', body: 'For keyword monitors, threads asking for recommendations or alternatives rank first.' },
    ],
    uses: [
      { title: 'Join the right threads', body: 'Reply to “what tool do you use for…” threads in your space while they are active.' },
      { title: 'Learn the language', body: 'See how your audience describes the problem, in their words.' },
    ],
    steps: communitySteps,
    costs: [{ action: 'Reddit searched through Google, per term or phrasing', price: '$0.01' }],
    total: 'About $0.01 to $0.05 a check',
    costNote: 'With Reddit API credentials on a self-hosted install, Reddit searches are free.',
    faqs: communityFaqs,
    guide: '/docs/tutorials/find-customers-on-reddit',
  },
  {
    slug: 'reddit-lead-generation',
    glossary: ['reddit-marketing', 'self-promotion', 'astroturfing'],
    group: 'Communities',
    name: 'Customer finder',
    icon: MessageCircleQuestion,
    seoTitle: 'Reddit Lead Generation: Find Customers on Reddit',
    h1: 'Reddit lead generation',
    headline: 'People asking for what you sell.',
    summary: 'Threads where people ask for a tool, a recommendation or an alternative in your space, ranked by buying intent.',
    description: 'Reddit lead generation: find threads where people ask for recommendations or alternatives in your space, on Reddit, Quora and more, ranked by intent.',
    lede: 'Describe the problem your product solves in a buyer’s words. OpenReach searches Reddit, Quora, Hacker News, Stack Overflow, Indie Hackers and more with request phrasings, and ranks what it finds by how ready the person is to buy.',
    points: ['Request phrasings built in', 'Intent score 0–100', 'Competitors’ unhappy users'],
    appPath: '/tools/customer-finder',
    worksWith: ['reddit', 'quora', 'ycombinator', 'stackoverflow'],
    sectionsTitle: 'How the customer finder ranks threads',
    sections: [
      { title: 'Request phrasings', body: 'Each problem is searched as people ask for help: “best …”, “looking for …”, “alternative to …”, “how do you …”.' },
      { title: 'Intent score', body: 'A question in the title, a request for a recommendation, frustration with a current tool, a named competitor and recency raise the score; age lowers it.' },
      { title: 'AI check', body: 'Optional: an AI model reads each result, drops the ones that are not real requests, and explains the rest in a line.' },
      { title: 'Where they ask', body: 'The communities where these questions cluster, ranked, so you know where to spend your time.' },
    ],
    uses: [
      { title: 'Your first customers', body: 'Reply helpfully to people who already have the problem you solve.' },
      { title: 'Win switchers', body: 'Add competitors and find people unhappy with them.' },
    ],
    steps: communitySteps,
    costs: [
      { action: 'One community searched through Google, per phrasing', price: '$0.01' },
      { action: 'Hacker News, GitHub and Stack Overflow', price: 'Free' },
      { action: 'Optional AI check, per 25 results', price: 'from $0.01' },
    ],
    total: 'About $0.15 to $0.40 a search',
    costNote: 'Fewer phrasings or communities cost less; the price is shown before anything runs.',
    faqs: communityFaqs,
    guide: '/docs/tutorials/find-customers-on-reddit',
  },
  {
    slug: 'subreddit-finder',
    glossary: ['subreddit', 'reddit-karma', 'self-promotion'],
    group: 'Communities',
    freeTool: 'subreddit-finder',
    name: 'Subreddit finder',
    icon: Hash,
    seoTitle: 'Subreddit Finder: Search Subreddits by Topic',
    h1: 'Subreddit finder',
    headline: 'The subreddits where your audience asks for help.',
    summary: 'Subreddits ranked by how often your topic comes up, how many replies those threads get and how recent they are.',
    description: 'Free subreddit finder: search subreddits by topic and see where it is discussed most, ranked by matching threads, replies and recency.',
    lede: 'Type a topic, a problem or a product category. OpenReach searches Reddit for it in several phrasings and ranks the subreddits where it keeps coming up, with the threads behind each one.',
    points: ['Ranked by threads and replies', 'Example threads', 'How recent the activity is'],
    appPath: '/tools/subreddit-finder',
    worksWith: ['reddit'],
    sectionsTitle: 'Subreddit search, ranked by activity',
    sections: [
      { title: 'Threads found', body: 'How many matching threads each subreddit has, across every phrasing of your topic.' },
      { title: 'Replies', body: 'Roughly how many comments those threads got: a subreddit where questions get answered is worth joining.' },
      { title: 'Recency', body: 'When the newest matching thread was posted, so you skip subreddits that went quiet.' },
      { title: 'The threads themselves', body: 'Every thread behind the ranking, linked, with its intent score.' },
    ],
    uses: [
      { title: 'Plan community marketing', body: 'Pick three subreddits to become a helpful regular in, before you ever mention your product.' },
      { title: 'Validate an idea', body: 'See whether people discuss the problem at all, and where.' },
    ],
    steps: [
      { title: 'Type a topic', body: 'A problem, a category or an audience: “freelance invoicing”, “home espresso”.' },
      { title: 'Read the ranking', body: 'Subreddits by threads, replies and recency, with example threads.' },
      { title: 'Join and listen', body: 'Read the rules, answer questions, and set up a monitor for new threads.' },
    ],
    costs: [{ action: 'Three phrasings, 20 Google results each', price: '$0.06' }],
    total: 'A search costs about $0.06',
    costNote: 'Free on a self-hosted install with Reddit API credentials.',
    faqs: [
      {
        question: 'Does it show subscriber counts?',
        answer: ['Not yet. The ranking is based on how often your topic is discussed in each subreddit and how active those threads are, which tells you more about where your audience asks for help than subscriber counts do.'],
      },
      ...communityFaqs,
    ],
    guide: '/docs/tutorials/find-customers-on-reddit',
  },
];

export const TOOL_GROUPS: { id: string; group: ToolGroup; title: string; lede: string }[] = [
  { id: 'influencer-tools', group: 'Influencers', title: 'Influencer search tools', lede: 'Creators on YouTube, TikTok and Instagram for any niche, and the numbers that tell you if they are worth it.' },
  { id: 'lead-tools', group: 'Leads', title: 'Lead generation tools', lede: 'Local businesses from Google Maps, filtered for your pitch, with emails and a pipeline.' },
  { id: 'community-tools', group: 'Communities', title: 'Brand monitoring and community tools', lede: 'Where people talk about you, where they ask for what you sell, and where to be active.' },
];

export const getTool = (slug: string) => tools.find((tool) => tool.slug === slug);
