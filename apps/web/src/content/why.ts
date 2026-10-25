import { AGENT_SKILLS } from '@openreach/shared';
import type { Faq } from './pricing';

/** Content for /why-openreach: who OpenReach is for, what sets it apart, and plain answers about the project. */

export interface WhyCard {
  title: string;
  body: string;
  /** Things this reader gets, shown as a short list. */
  points?: string[];
}

export const audiences: WhyCard[] = [
  {
    title: 'Founders and indie makers',
    body: 'You built something and need your first hundred customers, without a sales team or a stack of monthly tools.',
    points: [
      'People asking for what you sell, ranked by intent',
      'Every mention of your product, in one feed',
      'Creators who reach your audience, with their contacts',
    ],
  },
  {
    title: 'Agencies and freelancers',
    body: 'You sell to local businesses or run campaigns for clients, and need lists you can trust.',
    points: [
      'Businesses without websites, with few reviews or low ratings, in any city',
      'One project per client or campaign, with statuses and notes',
      'CSV exports for your CRM',
    ],
  },
  {
    title: 'Developers and AI builders',
    body: 'You want lead and creator data your code and agents can call, on infrastructure you control.',
    points: ['A REST API and an MCP server with every feature', 'MIT licensed: fork it, extend it, ship it', 'One Docker command to run it on your own server'],
  },
];

export const differences: WhyCard[] = [
  {
    title: 'Open source, all of it',
    body: 'The app, the API and the MCP server are MIT licensed. Nothing is held back for a paid edition, so you can read every line and change what you need.',
  },
  {
    title: 'Your data stays yours',
    body: 'Self-host with Docker and your creators, leads and mentions live in your own database. The hosted app runs the same open code.',
  },
  {
    title: 'You decide what you spend',
    body: 'OpenReach never charges you. Data is billed per lookup to your own key, every call is listed with its cost, and a monthly limit stops spending past it.',
  },
  {
    title: 'Honest by design',
    body: 'No scraping around sites that block it, no automated posting, comments or DMs. OpenReach finds and organises; you reach out as yourself.',
  },
];

/** The skills in plugins/openreach/skills, described for readers. */
export const skills = AGENT_SKILLS.map((skill) => ({ name: skill.title, what: skill.summary }));

export const whyFaqs: Faq[] = [
  {
    question: 'What is OpenReach?',
    answer: [
      'OpenReach is a free, open-source lead generation tool. It finds influencers on YouTube, TikTok and Instagram, local businesses on Google Maps, mentions of your brand across communities and people asking for what you sell, and keeps them organised for outreach. Use it online or self-host it with Docker; AI agents can use every feature through its MCP server.',
    ],
  },
  {
    question: 'Is OpenReach free?',
    answer: [
      'The software is: MIT licensed, free and unlimited to self-host, and free to use online with every feature unlimited today. Data such as creator profiles and Google Maps results is billed per lookup to your own data key, never by OpenReach. See [pricing](/pricing).',
    ],
  },
  {
    question: 'Where does the OpenReach source code live?',
    answer: ['On GitHub at [github.com/duckduckdeploy/openreach](https://github.com/duckduckdeploy/openreach), under the MIT licence.'],
  },
  {
    question: 'Are there other tools called OpenReach?',
    answer: ['Other projects may use the same or a similar name and are not related to this one. This OpenReach has its code at github.com/duckduckdeploy/openreach.'],
  },
  {
    question: 'Does OpenReach work with ChatGPT and Claude?',
    answer: [
      'Yes. Connect Claude, ChatGPT, Cursor, Codex or Gemini to the [OpenReach MCP server](/features/marketing-mcp-server) and your agent can find creators, leads and conversations and save its work to your projects. The [MCP setup guide](/docs/mcp) walks through it.',
    ],
  },
  {
    question: 'Can I self-host OpenReach?',
    answer: [
      'Yes. One Docker image and one compose file run the database, API, dashboard and site on your PC, a home server or a small cloud server. Every feature is unlocked and unlimited. Read the [self-hosting guide](/docs/self-hosting).',
    ],
  },
];
