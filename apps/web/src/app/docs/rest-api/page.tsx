import Link from 'next/link';
import { DocTable } from '@/components/doc-blocks';
import { CodeBlock } from '@/components/code-block';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'rest-api';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

const example = `# Price a lookup (free), then run it with a ceiling
curl -X POST "$API_URL/api/projects/$PROJECT/lookups/find_leads?dryRun=1" \\
  -H "Authorization: Bearer $OPENREACH_API_KEY" -H "Content-Type: application/json" \\
  -d '{"query":"plumber","location":"Austin, TX","pages":2}'

curl -X POST "$API_URL/api/projects/$PROJECT/lookups/find_leads?maxCostUsd=0.20" \\
  -H "Authorization: Bearer $OPENREACH_API_KEY" -H "Content-Type: application/json" \\
  -d '{"query":"plumber","location":"Austin, TX","pages":2}'`;

const reply = `{
  "ok": true,
  "data": {
    "name": "find_leads",
    "estimate": { "min": 0.07, "max": 0.14 },
    "data": { "query": "plumber", "location": "Austin, TX", "pages": 2, "leads": [ ... ] },
    "costUsd": 0.14,
    "cached": false,
    "fetchedAt": "2026-10-25T09:30:00.000Z"
  }
}`;

const LOOKUPS = 'find_creators, analyse_creator, analyse_creators, similar_creators, find_leads, lead_emails, brand_mentions, find_conversations, find_subreddits';

export default function RestApiPage() {
  return (
    <DocArticle slug={slug}>
      <p>
        The dashboard is built on this API, so anything you can do in the app you can script. The base URL is <code>{'{API_URL}'}/api</code> (
        <code>http://localhost:4300/api</code> on a default self-hosted install).
      </p>

      <h2 id="auth">Authentication</h2>
      <p>
        Send an OpenReach API key as <code>Authorization: Bearer oreach_…</code>. Create keys under Settings; a key is shown once and acts as you, so
        treat it like a password. Keys can be revoked at any time and cannot create further keys. The dashboard itself uses a session cookie and may
        only make changes from its own origin.
      </p>
      <p>
        Apps that sign in with OAuth, such as ChatGPT, get short-lived access tokens that work the same way. OpenReach is an OAuth 2.1 authorization
        server for its MCP endpoint, with discovery at <code>/.well-known/oauth-protected-resource</code>, dynamic client registration, PKCE (S256) and
        rotating refresh tokens.
      </p>

      <h2 id="envelope">Responses</h2>
      <p>
        Every response is JSON: <code>{'{ "ok": true, "data": … }'}</code> on success, or <code>{'{ "ok": false, "error": { "code", "message", "details?" } }'}</code>{' '}
        with a 4xx or 5xx status. Codes are listed in <Link href="/docs/errors">Errors and troubleshooting</Link>. IDs are UUIDs; a malformed one is
        a 404.
      </p>

      <h2 id="lookups">Lookups</h2>
      <p>
        <code>POST /projects/:projectId/lookups/:name</code> runs one paid lookup with its input as the JSON body. Inputs are validated before anything
        is spent; an omitted country or language defaults to the project’s. <code>POST /lookups/:name</code> runs the same lookups without a project,
        in the United States in English unless the input or <code>?country=&amp;language=</code> says otherwise.
      </p>
      <DocTable
        caption="Lookup query parameters"
        head={['Parameter', 'Effect']}
        mono={[0]}
        rows={[
          ['?dryRun=1', 'Return { estimate: { min, max } } and spend nothing. max is null when the AI check is on (token-priced).'],
          ['?refresh=1', 'Skip the cache and pay for fresh data.'],
          ['?maxCostUsd=0.50', 'Refuse with cost_ceiling_exceeded if the worst-case price is higher. Must be a positive number.'],
        ]}
      />
      <CodeBlock label="Terminal" code={example} />
      <CodeBlock label="Reply" code={reply} />
      <p>
        <code>cached: true</code> results have <code>costUsd: 0</code>. A result where some searches failed carries a <code>warnings</code> or{' '}
        <code>failed</code> list and is not cached. Names: {LOOKUPS}. <code>GET /lookups</code> lists them with descriptions and cache times.
      </p>

      <h2 id="account">Account</h2>
      <DocTable
        caption="Account routes"
        head={['Route', 'Notes']}
        mono={[0]}
        rows={[
          ['GET /me', 'User and settings: whether a YepAPI key is set, its hint, the monthly limit.'],
          ['PUT /settings/yepapi-key', '{ apiKey }. Verified without spending credits. Never returned.'],
          ['DELETE /settings/yepapi-key', 'Remove the key.'],
          ['PUT /settings/budget', '{ monthlyBudgetUsd: number | null }.'],
          ['GET /balance', 'Live YepAPI balance, with this month’s paid calls, spend and limit. Free.'],
          ['GET /usage', 'This month’s spend in total, by feature and by day, and the latest calls.'],
          ['GET, POST /api-keys; DELETE /api-keys/:id', 'List, create ({ name }; the key is in the reply once) and revoke. Creating needs a signed-in session.'],
          ['GET /sources', 'Every community and how it is searched (a free API or Google). Free.'],
          ['GET /filter-fields', 'The fields and presets for lead and creator filter rules. Free.'],
          ['GET /locations?q=&country=', 'Location codes for project markets. Free.'],
        ]}
      />

      <h2 id="projects">Projects</h2>
      <p>
        <code>GET/POST /projects</code>, <code>GET/PATCH/DELETE /projects/:projectId</code>. Fields: <code>name</code>, <code>domain</code>,{' '}
        <code>description</code>, <code>keywords</code> (niche and problem words), <code>competitors</code>, <code>locationCode</code>,{' '}
        <code>country</code>, <code>language</code>, <code>context</code> (free-form notes for agents). Deleting a project deletes everything in it.
      </p>

      <h2 id="creators">Creators</h2>
      <DocTable
        caption="Creator routes"
        head={['Route', 'Notes']}
        mono={[0]}
        rows={[
          ['GET /projects/:id/creators', '?platform= &status= &tag= &q= &sort=added|followers|engagement|views|name &order= &limit= &offset=. Returns { total, creators }.'],
          ['POST /projects/:id/creators', '{ creators, status?, tags? }. Saving again refreshes numbers and keeps status and notes.'],
          ['PATCH /projects/:id/creators/:creatorId', '{ status?, notes?, tags? }.'],
          ['POST /projects/:id/creators/bulk', '{ ids, status?, addTags?, removeTags? }.'],
          ['POST /projects/:id/creators/delete', '{ ids }.'],
          ['POST /projects/:id/creators/analyse', 'Paid. { ids } (up to 25): fresh profile and posts. ?dryRun=1, ?maxCostUsd=.'],
        ]}
      />

      <h2 id="leads">Leads and lead searches</h2>
      <DocTable
        caption="Lead routes"
        head={['Route', 'Notes']}
        mono={[0]}
        rows={[
          ['GET /projects/:id/leads', '?status= &tag= &q= &website=yes|no &searchId= &sort=added|name|rating|reviews &order= &limit= &offset=.'],
          ['POST /projects/:id/leads', '{ leads, status?, tags? }. One row per Google Place per project.'],
          ['PATCH /projects/:id/leads/:leadId', '{ status?, notes?, tags?, emails? }.'],
          ['POST /projects/:id/leads/bulk', '{ ids, status?, addTags?, removeTags? }.'],
          ['POST /projects/:id/leads/delete', '{ ids }.'],
          ['POST /projects/:id/leads/emails', 'Paid. { ids, method: website|directory }. ?dryRun=1, ?maxCostUsd=.'],
          ['GET, POST /projects/:id/lead-searches', 'POST { queries, locations?, mode: text|grid, grid?, pages, params?, filters?, autoSave? } starts a search (202). ?dryRun=1 returns its size and price.'],
          ['GET /lead-searches/:searchId', 'Progress and spend, with the places found: ?matched=all|yes|no &limit= &offset=.'],
          ['POST /lead-searches/:searchId/cancel; DELETE /lead-searches/:searchId', 'Cancel a running search, or delete a finished one (saved leads stay).'],
        ]}
      />

      <h2 id="monitors">Monitors and mentions</h2>
      <DocTable
        caption="Monitor routes"
        head={['Route', 'Notes']}
        mono={[0]}
        rows={[
          ['GET /projects/:id/monitors', '?kind=brand|topic. Each with its price per run and month, counts and last run.'],
          ['POST /projects/:id/monitors', '{ kind, terms, excludes?, competitors?, sources?, depth?, aiScoring?, schedule?, active? }. ?dryRun=1 for the price, ?run=1 to start the first run.'],
          ['GET, PATCH, DELETE /monitors/:monitorId', 'The monitor and its last 20 runs; change it; delete it with what it found.'],
          ['POST /monitors/:monitorId/runs', 'Paid. Run now (202). ?maxCostUsd=.'],
          ['GET /monitor-runs/:runId; POST /monitor-runs/:runId/cancel', 'A run’s progress, spend and warnings; cancel it.'],
          ['GET /projects/:id/mentions', '?kind= &monitorId= &status=new|read|replied|ignored|open &source= &sentiment= &minIntent= &q= &sort=newest|intent|published &limit= &offset=.'],
          ['POST /projects/:id/mentions/status', '{ ids, status }.'],
          ['GET /projects/:id/communities', 'Communities ranked by the mentions found there. ?kind= &monitorId=.'],
        ]}
      />

      <h2 id="mcp">MCP</h2>
      <p>
        <code>POST {'{API_URL}'}/mcp</code> is the MCP server, stateless streamable HTTP, with the same authentication. Its tools call the routes above;
        see <Link href="/docs/mcp-tools">MCP tools</Link>.
      </p>
    </DocArticle>
  );
}
