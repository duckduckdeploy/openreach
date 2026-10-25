import Link from 'next/link';
import { Callout, DocTable, Step, Steps, Ui } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'tutorials/reddit-advanced-search';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function RedditAdvancedSearchPage() {
  return (
    <DocArticle slug={slug} brands={['reddit']}>
      <p>
        Reddit’s search box looks simple, but it understands operators that narrow a search to a subreddit, an author, the title or the text of a
        post, and it combines words with AND, OR and NOT. This guide lists the operators, shows how to search one subreddit, explains sorting and
        time filters, when Google finds what Reddit’s own search misses, and how to keep a search running without checking it by hand.
      </p>

      <h2 id="operators">Reddit search operators</h2>
      <p>
        Type an operator straight into the search box, followed by a colon and the value, with no space after the colon. Operators work on posts;
        comment search is more limited.
      </p>
      <DocTable
        caption="Reddit search operators"
        head={['Operator', 'Finds', 'Example']}
        mono={[0, 2]}
        rows={[
          ['title:', 'Posts with the word in the title', 'title:recommendation'],
          ['selftext:', 'Text posts with the word in the body', 'selftext:invoice'],
          ['subreddit:', 'Posts in one subreddit', 'subreddit:smallbusiness'],
          ['author:', 'Posts by one user', 'author:username'],
          ['site:', 'Link posts to a domain', 'site:github.com'],
          ['url:', 'Link posts whose address contains the text', 'url:youtube'],
          ['flair:', 'Posts with a flair (the label a subreddit sets)', 'flair:question'],
          ['self:yes / self:no', 'Only text posts, or only link posts', 'self:yes'],
          ['nsfw:yes / nsfw:no', 'Include or leave out posts marked NSFW', 'nsfw:no'],
        ]}
      />

      <h3>Combine words with AND, OR, NOT and quotes</h3>
      <DocTable
        caption="Combining search terms on Reddit"
        head={['Write', 'Finds', 'Example']}
        mono={[0, 2]}
        rows={[
          ['"exact phrase"', 'The words together, in that order', '"looking for a crm"'],
          ['AND', 'Both words (the default between words)', 'crm AND freelancer'],
          ['OR', 'Either word', 'crm OR spreadsheet'],
          ['NOT', 'Leaves out posts with the word', 'crm NOT salesforce'],
          ['( )', 'Groups terms', '(crm OR spreadsheet) title:recommend'],
        ]}
      />
      <p>
        Write AND, OR and NOT in capitals. Operators and words combine freely, so{' '}
        <code>subreddit:freelance title:(invoice OR invoicing) self:yes</code> finds text posts in r/freelance with either word in the title.
      </p>

      <Callout title="Search behaviour changes">
        <p>
          Reddit has changed its search several times, and not every operator works the same everywhere: on the website, in the apps and on
          old.reddit.com. If an operator seems to be ignored, try the same search on old.reddit.com or through Google (below).
        </p>
      </Callout>

      <h2 id="recipes">Reddit search examples for marketing and research</h2>
      <p>
        Operators are most useful as small recipes you reuse. Replace the words with your own topic, product or competitor:
      </p>
      <DocTable
        caption="Reddit search recipes"
        head={['Goal', 'Search']}
        mono={[1]}
        rows={[
          ['People asking for a recommendation', 'title:(recommend OR recommendation OR "looking for") crm'],
          ['People unhappy with a competitor', '"alternative to" competitorname'],
          ['Questions in one community', 'subreddit:smallbusiness title:(how OR what OR which) website self:yes'],
          ['Discussion of your brand, without your own posts', 'yourbrand NOT author:yourusername'],
          ['Links to your site or a competitor’s', 'site:yourdomain.com'],
          ['Posts with a question flair', 'subreddit:freelance flair:question pricing'],
          ['Text posts only, no links', 'invoicing app self:yes'],
        ]}
      />
      <p>
        Sort recommendation searches by <strong>New</strong> to find questions you can still answer, and by <strong>Top</strong> over the past
        year to see which answers the community valued most: they show what your buyers care about and the words they use, which is useful well
        beyond Reddit, for landing pages and ads.
      </p>
      <p>
        Brand searches need care with names that are also common words. Put the name in quotes, add a word that only appears near your product
        (<code>"canopy" app</code> for a product called Canopy), and leave out the meanings you don’t want with NOT.
      </p>

      <h2 id="comments">Search Reddit comments</h2>
      <p>
        Many of the best answers, and many mentions of products, are in comments rather than posts. Use the <Ui>Comments</Ui> tab in the search
        results to search comment text. It does not support every operator the post search does, so keep comment searches to words and phrases
        in quotes. For older comments, Google with <code>site:reddit.com</code> and the exact phrase in quotes usually finds more.
      </p>

      <h2 id="subreddit">How to search a subreddit</h2>
      <p>There are three ways to search inside one subreddit:</p>
      <Steps>
        <Step title="From the subreddit page">
          <p>
            Open the subreddit and use the search box at the top. On the website, the search is limited to that subreddit while you are on its
            page; remove the subreddit from the search box to search all of Reddit again.
          </p>
        </Step>
        <Step title="With the subreddit: operator">
          <p>
            From anywhere, add <code>subreddit:name</code> to the search: <code>subreddit:smallbusiness "website"</code>. To search a few
            subreddits at once, group them: <code>(subreddit:freelance OR subreddit:smallbusiness) invoice</code>.
          </p>
        </Step>
        <Step title="Through Google">
          <p>
            Search Google for <code>site:reddit.com/r/smallbusiness website builder</code>. Google often finds older threads and comments that
            Reddit’s own search ranks low.
          </p>
        </Step>
      </Steps>

      <h2 id="sort">Sort and time filters</h2>
      <p>Below the search box, Reddit lets you sort results and limit them to a period:</p>
      <ul>
        <li>
          <strong>Relevance</strong>: Reddit’s best guess, the default.
        </li>
        <li>
          <strong>Hot</strong>, <strong>Top</strong> and <strong>New</strong>: what is popular now, the most upvoted, or the latest first.
        </li>
        <li>
          <strong>Comments</strong>: the posts with the most discussion.
        </li>
        <li>
          <strong>Time</strong>: the past hour, day, week, month or year, or all time. Use it with Top to find the most valued posts of a
          period, or with New to find questions you can still answer.
        </li>
      </ul>
      <p>
        Switch between <Ui>Posts</Ui>, <Ui>Communities</Ui>, <Ui>Comments</Ui> and <Ui>People</Ui> to search each separately. Searching
        communities finds subreddits by name and description; it does not tell you where a topic is actually discussed.
      </p>

      <h2 id="google">Search Reddit with Google</h2>
      <p>
        Google is often better than Reddit’s own search for old threads, long comments and exact phrases. Useful patterns:
      </p>
      <DocTable
        caption="Google searches for Reddit"
        head={['Google search', 'Finds']}
        mono={[0]}
        rows={[
          ['site:reddit.com best crm for freelancers', 'Threads on the topic, from all of Reddit'],
          ['site:reddit.com/r/freelance invoicing', 'Threads in one subreddit'],
          ['"looking for" crm reddit', 'Requests, phrased the way people ask'],
          ['site:reddit.com "alternative to" yourcompetitor', 'People unhappy with a product'],
        ]}
      />
      <p>
        Add the word <em>reddit</em> to a normal search to get mostly Reddit threads, and use Google’s <em>Tools</em> menu to limit results to
        the past week or month.
      </p>

      <h2 id="limits">Limits of Reddit search</h2>
      <ul>
        <li>Results are capped: very broad searches show only part of what matches. Narrow with operators and time filters instead.</li>
        <li>Comment search is less complete than post search; Google finds many comments Reddit’s search does not.</li>
        <li>There are no saved searches or alerts: to catch new posts, you have to run the search again.</li>
        <li>It searches Reddit only. The same question is often asked on Quora, Hacker News or a forum.</li>
      </ul>

      <h2 id="openreach">Let OpenReach run your Reddit searches</h2>
      <p>
        If you search Reddit to find customers, track your brand or pick subreddits, OpenReach runs the searches for you, across Reddit and the
        other communities where the same people ask:
      </p>
      <ul>
        <li>
          <strong>Customer finder</strong>: describe a problem your product solves, and the{' '}
          <Link href="/tools/reddit-lead-generation">customer finder</Link> searches with request phrasings (“best …”, “looking for …”,
          “alternative to …”) and ranks posts by buying intent from 0 to 100.
        </li>
        <li>
          <strong>Brand mentions</strong>: <Link href="/tools/brand-monitoring">brand monitoring</Link> and{' '}
          <Link href="/tools/reddit-monitoring">Reddit monitoring</Link> find posts that name your brand or a competitor, and a monitor checks
          on a schedule so new ones reach you, which Reddit’s search cannot do.
        </li>
        <li>
          <strong>Subreddits</strong>: the <Link href="/tools/subreddit-finder">subreddit finder</Link> ranks the subreddits where your topic is
          discussed most, with example threads.
        </li>
      </ul>
      <p>
        OpenReach reads search results and official APIs; it never posts, comments or votes. Once you have found the threads, you reply yourself:{' '}
        <Link href="/docs/tutorials/find-customers-on-reddit">how to find customers on Reddit</Link> covers how, and{' '}
        <Link href="/docs/tutorials/get-reddit-karma">how to get karma on Reddit</Link> covers becoming a member people trust.
      </p>

      <Callout tone="cost" title="What it costs">
        <p>
          A community search is $0.01 per source and phrasing through Google, on your own YepAPI key.
        </p>
      </Callout>
    </DocArticle>
  );
}
