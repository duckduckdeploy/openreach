import { docPages } from '@/content/docs';
import { features } from '@/content/features';
import { glossaryCategories, termsIn } from '@/content/glossary';
import { plainText } from '@/components/rich-text';
import { tools } from '@/content/tools';
import { GITHUB_URL, MCP_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';

// llms.txt (llmstxt.org): a plain Markdown map of the site for AI assistants, built from the same content as the pages.
export const dynamic = 'force-static';

const link = (title: string, path: string, note: string) => `- [${title}](${SITE_URL}${path}): ${note}`;

export function GET() {
  const body = [
    `# ${SITE_NAME}`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    'OpenReach is an open-source (MIT) lead generation tool: influencer search on YouTube, TikTok and Instagram, local business leads from Google Maps, brand monitoring across 60+ communities, and finding people who ask for what you sell on Reddit, Quora and forums. It runs online or self-hosted with Docker, and AI agents can use every feature through its MCP server and REST API. It never posts or sends messages for its users, and never works around sites that block automated visits.',
    '',
    `- Source code: ${GITHUB_URL}`,
    `- MCP server: ${MCP_URL}`,
    '',
    link('Why OpenReach', '/why-openreach', 'What OpenReach is, who it is for and how it differs. Not related to other projects with a similar name.'),
    '',
    '## Tools',
    '',
    ...tools.map((tool) => link(tool.h1, `/tools/${tool.slug}`, tool.summary)),
    '',
    '## Features',
    '',
    ...features.map((feature) => link(feature.name, `/features/${feature.slug}`, feature.summary)),
    '',
    '## Docs',
    '',
    ...docPages.map((doc) => link(doc.h1, `/docs/${doc.slug}`, doc.description)),
    '',
    '## Marketing glossary',
    '',
    link('Marketing terms', '/glossary', 'Plain-English definitions of influencer marketing, lead generation, outreach, social listening, community and growth terms.'),
    ...glossaryCategories.flatMap((category) => [
      '',
      `### ${category.name}`,
      '',
      ...termsIn(category.id).map((term) => link(term.term, `/glossary/${term.slug}`, plainText(term.short))),
    ]),
    '',
    '## Optional',
    '',
    link('Pricing', '/pricing', 'Free software; data paid per lookup from your own key, with a monthly limit.'),
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
