import Link from 'next/link';
import { Callout, DocTable } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'errors';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function ErrorsPage() {
  return (
    <DocArticle slug={slug}>
      <p>
        Errors in the app, the REST API and MCP tools carry the same code and message. In the REST API they come back
        as <code>{'{ "ok": false, "error": { "code", "message", "details?" } }'}</code> with the HTTP status below.
        YepAPI does not bill a call it refuses. A timeout or a lost connection is different: the call may have
        completed at YepAPI, so OpenReach does not repeat it on its own.
      </p>

      <h2 id="money">Keys, credit and limits</h2>
      <DocTable
        caption="Key, credit and limit errors"
        head={['Code', 'Status', 'What to do']}
        mono={[0, 1]}
        rows={[
          ['yepapi_key_missing', '400', 'Add your YepAPI key under Settings and usage.'],
          ['yepapi_key_invalid', '400', 'YepAPI rejected the key. Copy the whole key again from YepAPI and replace it in Settings.'],
          ['yepapi_no_credits', '402', 'Your YepAPI balance is empty. Top up at yepapi.com; OpenReach cannot do it for you.'],
          ['yepapi_account_frozen', '402', 'YepAPI froze the account pending a billing review. Contact YepAPI support.'],
          ['budget_reached', '402', 'Your monthly OpenReach spending limit is reached. Raise or clear it in Settings, or wait for the next month (UTC).'],
          ['cost_ceiling_exceeded', '400', 'The call could cost more than the max_cost_usd you gave. Raise the ceiling or ask for less (fewer pages, communities or grid points). details.estimate has the price.'],
        ]}
      />

      <h2 id="requests">Requests</h2>
      <DocTable
        caption="Request errors"
        head={['Code', 'Status', 'What to do']}
        mono={[0, 1]}
        rows={[
          ['unauthorized', '401', 'Sign in again, or send a valid key as Authorization: Bearer oreach_… . Revoked keys stop working at once.'],
          ['forbidden_origin', '403', 'A cookie-authenticated change came from another website. Use the dashboard, or an API key for scripts.'],
          ['validation_error', '400', 'A field is missing or out of range. The message names the field; details lists every problem.'],
          ['bad_request', '400', 'The request cannot be done as asked, for example a location code that does not exist. The message says why.'],
          ['not_found', '404', 'The project, list item, search, monitor or run does not exist, or belongs to another account.'],
          ['creator_not_found', '404', 'No account with that handle on that platform. Check the spelling, or paste the profile link.'],
          ['conflict', '409', 'A run is already going for that monitor, or you have the most lead searches running at once (details.reason is run_in_progress). Wait, or cancel one. Also returned when deleting a lead search that is still running.'],
          ['too_large', '400', 'A lead search would make more Google Maps calls than this install allows (500 by default). Use fewer queries, places, grid points or pages.'],
          ['daily_limit', '429', 'The free tools on the website allow a few searches a day per visitor. Sign up to keep going.'],
          ['resting', '429', 'The free tools on the website used today’s budget. They are back tomorrow.'],
        ]}
      />

      <h2 id="provider">YepAPI and service problems</h2>
      <DocTable
        caption="Provider and service errors"
        head={['Code', 'Status', 'What to do']}
        mono={[0, 1]}
        rows={[
          ['yepapi_validation', '400', 'YepAPI refused the request. The message has its reason.'],
          ['yepapi_no_data', '404', 'YepAPI has nothing for that target.'],
          ['yepapi_rate_limited', '429', 'Too many requests at once. OpenReach already retried; try again shortly.'],
          ['yepapi_timeout', '504', 'YepAPI took too long to answer. The request may still have run there and been billed, so OpenReach did not retry it. Check your YepAPI usage, then try again if you need to.'],
          ['yepapi_error', '502', 'YepAPI returned an error. A paid call is not retried automatically after one, since it may have been billed. Try again; if it persists, the message includes YepAPI’s.'],
          ['queue_unavailable', '503', 'The background queue could not take the run. Nothing was spent and nothing is blocked; try again in a moment.'],
          ['internal_error', '500', 'Something unexpected went wrong in OpenReach. On a self-hosted install, the API log has the details.'],
        ]}
      />

      <h2 id="runs">When a run stops</h2>
      <p>Lead searches and monitor runs record why they stopped:</p>
      <ul>
        <li>
          <strong>failed</strong> with a key, credit or limit message: the run stopped at the first such error instead
          of repeating it. Fix the cause and run again.
        </li>
        <li>
          <strong>failed: Interrupted before it finished</strong>: the worker stopped making progress for 30 minutes
          (a restart or crash). Run it again.
        </li>
        <li>
          <strong>cancelled</strong>: you cancelled it. Results collected before that are kept and were billed.
        </li>
      </ul>

      <h2 id="sources">Community sources</h2>
      <ul>
        <li>
          <strong>A warning that a source is rate limiting this server</strong>: GitHub, Stack Exchange or Reddit refused a request. The run goes on
          without it and the result is not cached. On a self-hosted install, <code>GITHUB_TOKEN</code> and <code>STACKEXCHANGE_KEY</code> raise
          those limits.
        </li>
        <li>
          <strong>Instagram search was unavailable</strong>: Instagram’s own search failed upstream, so profiles came from Google’s index of Instagram
          instead.
        </li>
      </ul>

      <Callout title="Still stuck?">
        <p>
          On a self-hosted install, check that the API and worker are running and that <code>.env</code> is complete (see{' '}
          <Link href="/docs/self-hosting">Self-hosting</Link>). For questions about your balance or billing, contact
          YepAPI.
        </p>
      </Callout>
    </DocArticle>
  );
}
