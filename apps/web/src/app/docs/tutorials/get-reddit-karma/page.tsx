import Link from 'next/link';
import { Callout, DocTable, Step, Steps } from '@/components/doc-blocks';
import { DocArticle } from '@/components/doc-page';
import { getDoc } from '@/content/docs';
import { pageMeta } from '@/lib/metadata';

const slug = 'tutorials/get-reddit-karma';
const doc = getDoc(slug);

export const metadata = pageMeta({ title: doc.seoTitle, description: doc.description, path: `/docs/${slug}` });

export default function RedditKarmaPage() {
  return (
    <DocArticle slug={slug} brands={['reddit']}>
      <p>
        Karma is the score Reddit shows on every account. Many subreddits will not let a new or low-karma account post, and moderators look at an
        account’s history before they trust a link from it. This guide explains what karma is, how to earn it by taking part for real, how to
        find the subreddits where your knowledge is useful, and the shortcuts that get accounts banned.
      </p>

      <h2 id="what-is-karma">What Reddit karma is</h2>
      <p>
        <Link href="/glossary/reddit-karma">Reddit karma</Link> is a rough measure of how much other people have valued what you posted. It goes
        up when your posts and comments get upvotes, and can go down when they get downvoted. There are two main kinds, shown separately on your
        profile:
      </p>
      <DocTable
        caption="Kinds of Reddit karma"
        head={['Kind', 'Earned from', 'Good to know']}
        rows={[
          ['Post karma', 'Upvotes on your posts: links, text posts, images', 'Some subreddits check it before you can post'],
          ['Comment karma', 'Upvotes on your comments', 'The steadiest way to build trust in a community'],
          ['Awarder and awardee karma', 'Giving and receiving awards, where Reddit offers them', 'Small, and Reddit has changed awards several times'],
        ]}
      />
      <p>
        Reddit does not publish exactly how karma is calculated. It is not one point per upvote: votes are weighted, and Reddit adjusts the
        system against manipulation. What is clear is that consistent, useful participation raises it, and anything that games votes risks the
        account.
      </p>

      <h2 id="why">Why karma matters before you promote anything</h2>
      <p>
        If you want to use Reddit for your product or service, karma is the visible part of something more important: a history. Moderators and
        members check the profile of anyone who mentions a product. An account that only appears to post links to one website looks like spam
        and is treated as such, whatever its karma. An account with months of helpful comments in the same community gets the benefit of the
        doubt.
      </p>
      <p>
        Many subreddits also set their own minimums: a karma threshold, a minimum account age, or both, often enforced automatically. The rules
        are in each subreddit’s sidebar or wiki, and they differ from one community to the next.
      </p>

      <h2 id="how-to-earn">How to get karma on Reddit, step by step</h2>
      <Steps>
        <Step title="Pick communities where you know things">
          <p>
            Karma comes fastest where you can actually help. Choose a few subreddits on topics you know well, from your work or a hobby, and that
            are active enough that new posts get answers. The <Link href="/tools/subreddit-finder">subreddit finder</Link> ranks subreddits for
            a topic by how often it comes up, the replies those threads get and how recent they are.
          </p>
        </Step>
        <Step title="Read the rules and lurk first">
          <p>
            Read the sidebar, the pinned posts and the wiki. Spend a few days reading new and top posts to see what the community values, what
            gets removed, and what questions keep coming back. Being a <Link href="/glossary/lurker">lurker</Link> for a while is how most good
            members start.
          </p>
        </Step>
        <Step title="Answer questions in new posts">
          <p>
            Sort by <em>new</em> and answer questions early, while there is still room to be one of the first useful replies. A specific answer
            that solves the problem (steps, a number, what you tried, what to avoid) earns more upvotes than a general one, and much more trust.
          </p>
        </Step>
        <Step title="Write comments people want to upvote">
          <ul>
            <li>Answer the question that was asked, first, and keep it readable: short paragraphs, a list for steps.</li>
            <li>Share experience: what happened when you did it, not what you read somewhere.</li>
            <li>Admit what you don’t know, and correct yourself if someone shows you are wrong.</li>
            <li>Leave your product out unless someone asks, and say that it is yours when you mention it.</li>
          </ul>
        </Step>
        <Step title="Post things the community values">
          <p>
            Once you know the community, post: a write-up of something you learned, a guide to a question that keeps coming up, results with the
            details people ask for, a good question of your own. Follow the posting rules and flair, and stay to answer the comments: the
            discussion under your post earns comment karma too.
          </p>
        </Step>
        <Step title="Keep at it, a little each week">
          <p>
            A few useful comments most days does more than a burst once a month. Karma grows slowly at first and then faster, as you learn what a
            community likes and members start to recognise your name.
          </p>
        </Step>
      </Steps>

      <h2 id="avoid">What not to do</h2>
      <p>
        These shortcuts break Reddit’s rules. Reddit and moderators look for them, and the usual result is removed posts, a ban from the
        subreddit, a <Link href="/glossary/shadowban">shadowban</Link>, or the account suspended for good.
      </p>
      <ul>
        <li>
          <strong>Karma farming:</strong> reposting other people’s popular content, or posting low-effort content in subreddits created to hand
          out upvotes. Moderators recognise it, and many communities ban accounts that come from those subreddits.
        </li>
        <li>
          <strong>Buying or selling accounts and upvotes:</strong> against Reddit’s rules, and bought accounts often have a history that gets them
          caught.
        </li>
        <li>
          <strong>Vote manipulation:</strong> asking friends, colleagues or groups to upvote, using several accounts, or trading votes. See{' '}
          <Link href="/glossary/vote-manipulation">vote manipulation</Link> and <Link href="/glossary/sockpuppet">sockpuppets</Link>.
        </li>
        <li>
          <strong>Posting the same thing in many subreddits at once:</strong> it looks like spam, and Reddit’s filters treat it as spam.
        </li>
        <li>
          <strong>Self-promotion before trust:</strong> linking your own site in most of what you post. Many communities follow a rule of thumb
          that most of your activity should not be about your own thing; read about{' '}
          <Link href="/glossary/self-promotion">self-promotion</Link>.
        </li>
      </ul>

      <Callout tone="important" title="No tool should post for you">
        <p>
          Tools that post, comment or vote automatically put the account at risk and break the trust that makes Reddit worth using. OpenReach never
          posts, comments or votes: it finds the threads and communities, and you take part yourself.
        </p>
      </Callout>

      <h2 id="questions">Common questions about Reddit karma</h2>
      <h3>How much karma do I need to post?</h3>
      <p>
        It depends on the subreddit. Many have no minimum; some set one, sometimes together with an account age, and may not publish the exact
        number. If a post is removed automatically, read the subreddit’s rules or message the moderators politely.
      </p>
      <h3>Does karma go down?</h3>
      <p>
        Yes. Downvoted posts and comments can lower it, and removed content may stop counting. A downvoted comment is usually feedback: read the
        replies and learn what the community did not like.
      </p>
      <h3>Is it worth getting karma for marketing?</h3>
      <p>
        Only as a side effect of being a useful member. The real value is the reputation in the few communities your customers use. Read{' '}
        <Link href="/glossary/reddit-marketing">Reddit marketing</Link> and{' '}
        <Link href="/docs/tutorials/find-customers-on-reddit">how to find customers on Reddit</Link> for what to do once you are a regular.
      </p>

      <h2 id="openreach">Find the right threads with OpenReach</h2>
      <p>
        The hardest part of earning karma honestly is finding the posts where your answer helps, while they are new. OpenReach does the searching:
      </p>
      <ul>
        <li>
          The <Link href="/tools/subreddit-finder">subreddit finder</Link> shows where your topic is discussed most, with example threads.
        </li>
        <li>
          The <Link href="/tools/reddit-lead-generation">customer finder</Link> finds people asking about a problem, across Reddit, Quora, Hacker
          News and forums, ranked by intent, and a conversation monitor brings new ones to you.
        </li>
        <li>
          <Link href="/docs/tutorials/reddit-advanced-search">Reddit advanced search</Link> explains how to search Reddit yourself with operators.
        </li>
      </ul>
    </DocArticle>
  );
}
