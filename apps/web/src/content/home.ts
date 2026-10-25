import { AtSign, MapPin, MessageCircleQuestion, Users, type LucideIcon } from 'lucide-react';
import type { Brand } from '@/components/brand-icon';
import type { Faq } from './pricing';

/** One of the four areas on the homepage, with the tool pages that belong to it. */
export interface HomeArea {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  /** H2, keyword-led. */
  title: string;
  body: string;
  points: string[];
  brands: Brand[];
  /** Tool page slugs, shown as links. */
  tools: string[];
}

export const areas: HomeArea[] = [
  {
    id: 'influencers',
    icon: Users,
    eyebrow: 'Influencers',
    title: 'Influencer search for YouTube, TikTok and Instagram',
    body: 'Search a niche and get the creators who keep coming up for it. Analyse the promising ones for their real reach, then keep a shortlist with where outreach stands.',
    points: ['Ranked by matching videos and their views', 'Engagement rate, average views, posts per week', 'Emails, links and linked accounts from the bio'],
    brands: ['youtube', 'tiktok', 'instagram'],
    tools: ['influencer-search-tool', 'youtube-channel-finder', 'tiktok-user-search', 'engagement-rate-calculator'],
  },
  {
    id: 'leads',
    icon: MapPin,
    eyebrow: 'Local leads',
    title: 'Google Maps lead generation for any niche',
    body: 'Every business of a type in a place, with phone, website, rating and reviews. Filter for your pitch with rules, find emails, and cover whole cities with a lead search.',
    points: ['Businesses with or without a website', 'More or fewer than X reviews, rated above or below Y', 'Any keyword, any place, whole city grids'],
    brands: ['googlemaps'],
    tools: ['google-maps-scraper', 'businesses-without-websites', 'lead-finder'],
  },
  {
    id: 'mentions',
    icon: AtSign,
    eyebrow: 'Brand mentions',
    title: 'Brand monitoring across 60+ communities',
    body: 'Where people talk about your product: Reddit, Hacker News, GitHub, Stack Overflow, Quora, X, LinkedIn, Product Hunt, review sites and more. A monitor checks on a schedule and lists what is new.',
    points: ['Only pages that actually name you', 'Daily or weekly, reading only what is new', 'Replied, read and ignored, like an inbox'],
    brands: ['reddit', 'ycombinator', 'github', 'stackoverflow', 'producthunt'],
    tools: ['brand-monitoring', 'reddit-monitoring'],
  },
  {
    id: 'customers',
    icon: MessageCircleQuestion,
    eyebrow: 'Customers in communities',
    title: 'Find customers on Reddit and Quora',
    body: 'People asking for what you sell: “best tool for…”, “looking for…”, “alternative to…”. Ranked by buying intent, with the subreddits and forums where these questions keep coming up.',
    points: ['Intent score from 0 to 100', 'Competitors’ unhappy users', 'The best subreddits to be active in'],
    brands: ['reddit', 'quora', 'ycombinator'],
    tools: ['reddit-lead-generation', 'subreddit-finder'],
  },
];

export const homeFaqs: Faq[] = [
  {
    question: 'What is OpenReach?',
    answer: [
      'An open-source lead generation tool. It finds influencers on YouTube, TikTok and Instagram, local businesses on Google Maps, mentions of your brand across communities, and people asking for what you sell, and keeps them organised so you can reach out.',
    ],
  },
  {
    question: 'Is it free?',
    answer: [
      'The software is free and open source under the MIT licence: use it online or run it on your own server. Data is paid per lookup from your own YepAPI key, under a monthly limit you set. A Google Maps page of 20 businesses is $0.07; a creator search is $0.02.',
    ],
  },
  {
    question: 'Does it scrape sites or post for me?',
    answer: [
      'Neither. Data comes from a licensed data provider and from official APIs, and OpenReach never works around a site that blocks automated visits. It never posts, comments or sends messages: you reach out yourself.',
    ],
  },
  {
    question: 'Can my AI agent use it?',
    answer: [
      'Yes. OpenReach has an MCP server with 38 tools and a Claude Code plugin with ready-made skills. Every paid tool shows its price first and takes a spending ceiling. See [Connect your agent](/docs/mcp).',
    ],
  },
  {
    question: 'Can I self-host it?',
    answer: ['Yes, with one Docker command. The whole stack is in the repository: database, API, MCP server, dashboard and this site. See [Self-hosting](/docs/self-hosting).'],
  },
];
