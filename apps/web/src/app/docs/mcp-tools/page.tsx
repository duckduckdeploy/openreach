import Link from 'next/link';
import { Callout, DocTable } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'mcp-tools';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

const head = ['Tool', 'What it does', 'Cost'];

export default function McpToolsPage() {
  return (
    <DocArticle slug={slug}>
      <p>
        The MCP server at <code>{'{API_URL}'}/mcp</code> offers 38 tools. Each one calls the same REST route the dashboard uses, with the caller’s
        API key, so validation, prices, caching and limits are identical. Most tools take an optional <code>project_id</code>; leave it out when the
        account has one project. With no project at all, paid lookups run on their own in the United States market unless the input names a country.
      </p>
      <Callout title="Every paid tool also takes">
        <ul className="list-[square] space-y-1 pl-5">
          <li>
            <code>dry_run</code>: return the price only and spend nothing.
          </li>
          <li>
            <code>max_cost_usd</code>: refuse the call if its price could be higher.
          </li>
          <li>
            <code>refresh</code> (lookups): skip the cache and pay for fresh data.
          </li>
        </ul>
      </Callout>

      <h2 id="account">Account and projects</h2>
      <DocTable
        caption="Account and project tools"
        head={head}
        mono={[0, 2]}
        rows={[
          ['whoami', 'The signed-in user and whether a YepAPI key is connected.', 'free'],
          ['get_balance', 'Remaining YepAPI balance, and this month’s paid calls, spend and limit.', 'free'],
          ['get_usage', 'This month’s spend by feature and day, with the latest calls.', 'free'],
          ['list_projects', 'Projects with website, description, niche words, competitors and market.', 'free'],
          ['create_project', 'Create a project for a product.', 'free'],
          ['get_project', 'A project and its shared context notes.', 'free'],
          ['update_project', 'Change the description, niche words, competitors or context notes.', 'free'],
          ['list_sources', 'Every community searched, its group and whether it goes through a free API or Google.', 'free'],
          ['get_filter_fields', 'The fields and presets for lead and creator filter rules.', 'free'],
        ]}
      />

      <h2 id="lookups">Paid lookups</h2>
      <p>The lookups share their names with the REST lookup routes. Their inputs are in each tool’s schema. Prices are YepAPI’s at the time of writing.</p>
      <DocTable
        caption="Paid lookup tools"
        head={head}
        mono={[0, 2]}
        rows={[
          ['find_creators', 'Creators on YouTube, TikTok or Instagram for a niche, ranked by matching videos, views and audience.', '$0.02 – $0.03 per page'],
          ['analyse_creator', 'One creator’s profile and recent posts: averages, engagement, frequency, contacts.', '$0.02 – $0.03'],
          ['analyse_creators', 'The same for up to 25 creators on one platform.', '$0.02 – $0.03 each'],
          ['similar_creators', 'Instagram’s suggestions of accounts like one you know.', '$0.01'],
          ['find_leads', 'Businesses on Google Maps for a search in a place, up to 3 pages of 20.', '$0.07 per page'],
          ['lead_emails', 'Contact emails for up to 25 businesses with a website, from the homepage or a directory.', '$0.01 or $0.03 each'],
          ['brand_mentions', 'Pages in communities that name your brand, with the communities they come from.', '$0.01 per Google search'],
          ['find_conversations', 'People asking about a problem, ranked by intent, with the communities they cluster in.', '$0.01 per Google search'],
          ['find_subreddits', 'Subreddits ranked by matching threads, replies and recency.', '$0.02 – $0.03 per phrasing'],
        ]}
      />

      <h2 id="creators">Saved creators</h2>
      <DocTable
        caption="Creator list tools"
        head={head}
        mono={[0, 2]}
        rows={[
          ['list_creators', 'Saved creators with status, notes, tags and numbers; filter by platform, status, tag or search.', 'free'],
          ['save_creators', 'Save creators from a search or analysis; saving again refreshes numbers and keeps notes.', 'free'],
          ['update_creators', 'Set the status of saved creators and add or remove tags.', 'free'],
          ['reanalyse_creators', 'Refresh up to 25 saved creators’ numbers.', '$0.02 – $0.03 each'],
        ]}
      />

      <h2 id="leads">Leads and lead searches</h2>
      <DocTable
        caption="Lead tools"
        head={head}
        mono={[0, 2]}
        rows={[
          ['list_leads', 'Saved leads with status, notes, tags and emails; filter by website, status, tag or search.', 'free'],
          ['save_leads', 'Save businesses from find_leads to the lead list.', 'free'],
          ['update_leads', 'Set the status of saved leads and add or remove tags.', 'free'],
          ['find_saved_lead_emails', 'Find and store emails for up to 100 saved leads with a website.', '$0.01 or $0.03 each'],
          ['start_lead_search', 'Search Google Maps at scale in the background: queries × places, or a city grid, with filter rules.', '$0.07 per page'],
          ['get_lead_search', 'A lead search’s progress, spend and the places it found.', 'free'],
          ['list_lead_searches', 'The project’s lead searches with status, counts and spend.', 'free'],
          ['cancel_lead_search', 'Stop a running lead search; what it found stays.', 'free'],
        ]}
      />

      <h2 id="monitors">Monitors and the feed</h2>
      <DocTable
        caption="Monitor tools"
        head={head}
        mono={[0, 2]}
        rows={[
          ['list_monitors', 'Brand and conversation monitors with schedule, price per run and month, counts and the last run.', 'free'],
          ['create_monitor', 'Create a brand or topic monitor; dry_run for the price, run_now to start the first run.', 'free to create'],
          ['update_monitor', 'Change terms, sources, schedule or AI check, or pause it.', 'free'],
          ['run_monitor', 'Run a monitor now, in the background.', 'per run'],
          ['get_monitor_run', 'A run’s status, searches done, pages found and added, spend and warnings.', 'free'],
          ['list_mentions', 'The feed of mentions and conversations, filtered and sorted.', 'free'],
          ['set_mention_status', 'Mark mentions read, replied or ignored.', 'free'],
          ['get_communities', 'Where the project’s mentions and conversations come from, ranked.', 'free'],
        ]}
      />

      <p>
        Set-up instructions for each agent are in <Link href="/docs/mcp">Connect your agent</Link>.
      </p>
    </DocArticle>
  );
}
