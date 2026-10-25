import type { Faq } from './pricing';

/** One email to copy. Placeholders are in braces: {first_name}, {business_name}. */
export interface EmailTemplate {
  /** Anchor on the page. */
  id: string;
  /** H3: the situation it is for. */
  title: string;
  /** When to use it, one or two sentences. */
  when: string;
  /** Subject lines to choose from. The first is copied with the body. */
  subjects: string[];
  body: string;
  /** Why it works: short points, markdown-style links allowed. */
  why: string[];
}

export interface TemplateSection {
  id: string;
  /** H2, keyword-led. */
  title: string;
  body?: string[];
  list?: string[];
  /** Shown after the list. */
  after?: string[];
}

export interface TemplatePage {
  /** URL slug under /templates. The head keyword. */
  slug: string;
  /** Short name for cards, the footer and breadcrumbs. */
  name: string;
  /** Title tag, keyword first. The " · OpenReach" suffix is added by the template. */
  seoTitle: string;
  /** Page H1: the head keyword. */
  h1: string;
  /** Meta description and card text, 120 to 155 characters. */
  description: string;
  /** Paragraphs under the H1. */
  intro: string[];
  /** H2 above the templates. */
  templatesTitle: string;
  templates: EmailTemplate[];
  sections: TemplateSection[];
  /** Where OpenReach helps: a paragraph and links. */
  openreach: { title: string; body: string; links: { href: string; label: string }[] };
  faqTitle: string;
  faqs: Faq[];
  /** Glossary slugs shown at the end. */
  glossary: string[];
}

/** The honesty and law rules every template page repeats in its own words. */
const RULES_NOTE =
  'None of this is legal advice. Laws differ by country and change; if email is a large part of how you sell, check the rules that apply to you and the people you write to.';

export const templatePages: TemplatePage[] = [
  {
    slug: 'cold-email-templates',
    name: 'Cold email templates',
    seoTitle: 'Cold Email Templates: 8 B2B Examples to Copy',
    h1: 'Cold email templates',
    description: 'Cold email templates for B2B sales, agencies and local businesses: 8 examples to copy, with subject lines, why each works and how to personalise it.',
    intro: [
      'A [cold email](/glossary/cold-email) is a first message to someone who has never heard of you. The ones that get answers are short, about the reader rather than the sender, and specific enough that they could only have been sent to that person.',
      'The templates below are starting points, not mail merges. Each has a gap you fill with something true about the reader: what you saw on their site, their Google profile or a public post. If you cannot fill that gap for a lead, that lead is probably not a good fit yet.',
    ],
    templatesTitle: 'Cold email templates to copy',
    templates: [
      {
        id: 'no-website',
        title: 'Local business without a website',
        when: 'For web designers and agencies writing to a business that has a Google Maps listing but no site of its own. A Facebook page or a booking link does not count as a website.',
        subjects: ['A website for {business_name}?', 'Saw {business_name} on Google Maps', 'Quick question about {business_name}'],
        body: `Hi {first_name},

I found {business_name} on Google Maps while looking for {category} in {city}. You have {review_count} reviews and people mention {detail_from_reviews}, but there is no website linked from your listing, so anyone who wants to see your prices or book has to call.

I build simple sites for local businesses: one page with your services, photos, hours and a booking or quote form, linked from your Google profile.

If it would help, I can send a rough mock-up of what yours could look like, free and with no obligation. Would that be useful?

{your_name}
{your_business} · {your_phone}`,
        why: [
          'It proves you looked: the reviews and the detail from them can only come from their listing.',
          'It names a problem they recognise (people have to call) instead of a feature (responsive design).',
          'The ask is small and free: a mock-up, not a meeting.',
        ],
      },
      {
        id: 'few-reviews',
        title: 'Local business with few reviews',
        when: 'For review, reputation and marketing services, writing to a well-rated business with only a handful of reviews. Check the Maps results first: only say the places above them have more reviews if they do.',
        subjects: ['{business_name}’s Google reviews', 'Your {rating}-star rating in {city}'],
        body: `Hi {first_name},

{business_name} has a {rating}-star rating on Google, which is better than most {category} businesses near you, but only {review_count} reviews. The places above you in Maps results for “{category} {city}” have a lot more.

I help local businesses ask happy customers for reviews in a way that is simple and within Google’s rules: a short link, a card at the counter and a follow-up message after each job. No fake or paid reviews.

Would a 10-minute call this week be worth it to see whether it fits how you work?

{your_name}`,
        why: [
          'It starts with a compliment that is true and checkable.',
          'It says plainly what you will not do: [fake reviews](/glossary/fake-reviews) and [review gating](/glossary/review-gating) break platform rules, and a business owner who has been burned will be glad to hear it.',
          'One clear ask with a time limit the reader controls.',
        ],
      },
      {
        id: 'weak-website',
        title: 'Business with a site that is hard to use',
        when: 'For web, SEO or conversion agencies, writing to a business whose site works but makes something important hard: no prices, no booking, no mobile layout.',
        subjects: ['Booking on {business_name}’s site', 'Something I noticed on {website}'],
        body: `Hi {first_name},

I was on {website} trying to {task, e.g. book a cleaning} and couldn’t find a way to do it on my phone; I had to look for your number instead. I suspect some visitors give up at that point.

I fix exactly this kind of thing for {category} businesses: {one concrete change, e.g. a booking button on every page that opens your calendar}.

If you like, I can send a short screen recording of what I saw and what I’d change. No charge for that. Shall I?

{your_name}`,
        why: [
          'It describes one real problem you hit, not a vague “your site could be better”.',
          'The offer (a screen recording) is useful even if they never hire you.',
          'It never insults the site; the owner may have built it themselves.',
        ],
      },
      {
        id: 'saas-team',
        title: 'B2B software to a team',
        when: 'For a SaaS product writing to someone whose team has the problem you solve. Works best with a trigger: a job post, a launch, a public complaint, a new market.',
        subjects: ['{trigger}, and {problem}', 'Question about {team} at {company}'],
        body: `Hi {first_name},

Saw that {company} is {trigger, e.g. hiring two more support agents}. Teams at that stage usually start to feel {problem, e.g. the same questions arriving in three different inboxes}.

{product} {what it does in one sentence, e.g. puts every customer conversation in one queue, so nothing is answered twice or missed}. {similar_customer} uses it for {result in their words, only if true and allowed to share}.

Is {problem} something you are dealing with right now? If not, no worries, and I won’t keep writing.

{your_name}
{title}, {product}`,
        why: [
          'The trigger shows timing: you are writing now for a reason.',
          'One sentence on the product, no feature list.',
          'The question can be answered with a yes or no, and the promise not to keep writing lowers the pressure.',
        ],
      },
      {
        id: 'agency-service',
        title: 'Agency or freelancer offering a service',
        when: 'For content, ads, design or development services pitching a company that matches your [ideal customer profile](/glossary/ideal-customer-profile).',
        subjects: ['Idea for {company}’s {channel}', '{company} + {specific idea}'],
        body: `Hi {first_name},

I read {something they published, e.g. your post on moving to usage-based pricing}. {One specific, honest reaction or idea that follows from it}.

I run {your_business}, a small {service} studio. We recently {relevant work, with a link}, which had a similar problem: {problem}.

I have two or three ideas for {company} along the same lines. Would it be useful if I wrote them up in a short email, no call needed?

{your_name}
{portfolio_link}`,
        why: [
          'It leads with their work, and an idea they can judge on its own.',
          'One example of your own work, linked, beats a list of clients.',
          'The ask is a written follow-up, which busy people prefer to a call.',
        ],
      },
      {
        id: 'public-request',
        title: 'Someone who asked publicly for a recommendation',
        when: 'When someone asked for a tool or service in a public thread on Reddit, Hacker News or a forum and invited people to email or message them. If they did not, reply in the thread instead, as yourself.',
        subjects: ['Re: your question about {topic}', 'Your post in {community}'],
        body: `Hi {first_name},

You asked in {community} for {what they asked for, in their words} and said email was fine, so here I am.

Full disclosure: I make {product}, so I am biased. It does {the part of their question it answers}. It does not {an honest limitation that matters to them}.

{Link to the most relevant page, not the home page}

Whatever you pick, {one genuinely useful tip about their problem}.

{your_name}`,
        why: [
          'It quotes their request, so it is clearly not a blast.',
          'Disclosing that you are the maker is honest, and many community rules require it (see [self-promotion](/glossary/self-promotion)).',
          'Naming a limitation makes the rest believable, and the tip helps even if they choose something else.',
        ],
      },
      {
        id: 'partnership',
        title: 'Partnership or integration',
        when: 'For two products with the same customers: an integration, a co-written guide, a bundle or a shared webinar.',
        subjects: ['{your_product} × {their_product}', 'Our users keep asking about {their_product}'],
        body: `Hi {first_name},

I run {your_product}, {one line on what it does}. A number of our users also use {their_product}, and {how you know, e.g. three asked this month whether the two connect}.

Would you be open to {specific idea, e.g. a simple integration that sends X to Y}? We would build our side and write the docs.

If it is not a priority, I understand. Is there someone on your team who handles partnerships I should talk to instead?

{your_name}`,
        why: [
          'It brings evidence of demand from shared customers.',
          'It offers to do most of the work.',
          'The fallback question gets you to the right person even if the answer is no.',
        ],
      },
      {
        id: 'right-person',
        title: 'Asking for the right person',
        when: 'When you have a company that fits but no named contact, or the person you found is not the one who decides.',
        subjects: ['Who handles {area} at {company}?', 'Quick question'],
        body: `Hi {first_name},

I am trying to reach whoever looks after {area, e.g. local marketing for your clinics} at {company}. Would that be you, or could you point me to the right person?

For context, I help {type of company} with {outcome, one line}.

Thank you,
{your_name}`,
        why: [
          'It is easy and polite to answer, even for someone who is not a buyer.',
          'An introduction from inside the company is warmer than a second cold email.',
        ],
      },
    ],
    sections: [
      {
        id: 'personalise',
        title: 'How to personalise a cold email template',
        body: ['Personalisation is not “Hi {first_name}”. It is one sentence that shows why you are writing to this person and not a thousand others. Good sources, in order of how much they say:'],
        list: [
          'Something they did recently: a launch, a job post, a new location, a post or a talk.',
          'Something you noticed as a customer would: a missing booking form, no prices, a slow mobile page.',
          'Something from their public profile: their Google Maps reviews, rating and categories, their bio or their site’s about page.',
          'Something you share: a community you are both in, a mutual customer, the same tools.',
        ],
        after: ['Write that sentence first, then decide whether the rest of the template still fits. If it does not, change the template, not the facts.'],
      },
      {
        id: 'subject-lines',
        title: 'Cold email subject lines that read like a person',
        body: ['The subject line decides whether the email is opened, and a subject that looks like marketing gets treated like marketing. A few habits that help:'],
        list: [
          'Keep it short and in lower case or sentence case, like a note to a colleague.',
          'Use their name, their business or the thing you noticed, never “Partnership opportunity!!!”.',
          'Do not fake a thread with “Re:” unless you are really replying to something they wrote.',
          'Avoid words that trigger spam filters and suspicion: “free money”, “guaranteed”, all capitals, lots of exclamation marks.',
        ],
      },
      {
        id: 'rules',
        title: 'Cold email rules: honesty and the law',
        body: ['A cold email is only worth sending if it would be fine to receive. The basics:'],
        list: [
          'Write to business addresses about something relevant to their work. In the US the [CAN-SPAM Act](/glossary/can-spam-act) requires an honest subject and sender, your postal address and a way to opt out; in the EU and UK, [GDPR](/glossary/gdpr) and e-privacy rules apply to personal data and to emails to individuals.',
          'Never [buy email lists](/glossary/buying-email-lists). Bought lists are full of old addresses and [spam traps](/glossary/spam-traps), and the people on them did not expect to hear from you.',
          'Send from a domain set up with [SPF](/glossary/spf-record), [DKIM](/glossary/dkim) and [DMARC](/glossary/dmarc), and in small numbers, so your [email deliverability](/glossary/email-deliverability) survives.',
          'Stop when someone says no, and honour every opt-out straight away.',
          'Do not pretend to know someone, invent a referral or claim results you cannot show.',
        ],
        after: [RULES_NOTE],
      },
    ],
    openreach: {
      title: 'Find the leads these templates are for',
      body: 'OpenReach builds the list the templates need: local businesses from Google Maps with their rating, reviews, website and phone, filtered for your pitch (no website, few reviews, low rating), with contact emails read from their sites. It never sends email for you: you write and send each message yourself.',
      links: [
        { href: '/tools/businesses-without-websites', label: 'Find businesses without websites' },
        { href: '/tools/lead-finder', label: 'Open the lead finder' },
        { href: '/docs/tutorials/build-a-lead-list', label: 'How to build a lead list' },
      ],
    },
    faqTitle: 'Cold email FAQ',
    faqs: [
      {
        question: 'How long should a cold email be?',
        answer: ['Short enough to read on a phone without scrolling: usually three to five short paragraphs. Say why you are writing, what you offer in one sentence, and one small ask.'],
      },
      {
        question: 'Is cold email legal?',
        answer: [
          'In many countries it is, within rules. In the US, the [CAN-SPAM Act](/glossary/can-spam-act) allows commercial email with an honest sender and subject, a postal address and a working opt-out. In the EU and UK the rules are stricter, especially for emails to individuals; see [GDPR](/glossary/gdpr). This is not legal advice.',
        ],
      },
      {
        question: 'How many follow-ups should I send?',
        answer: ['One or two, spaced a few days apart, each adding something new, then stop. The [follow-up email template](/templates/follow-up-email-template) page has examples, including a polite last email.'],
      },
      {
        question: 'Can I send the same template to everyone?',
        answer: ['You can, but it will read like it. Keep the structure and rewrite the first sentence for each lead with something true about them. Fewer, better emails also protect your domain’s reputation.'],
      },
      {
        question: 'Does OpenReach send cold emails?',
        answer: ['No. OpenReach finds leads and their public contact details and keeps your list with statuses and notes. You write and send every email yourself, from your own inbox.'],
      },
    ],
    glossary: ['cold-email', 'cold-outreach', 'follow-up-email', 'email-deliverability', 'can-spam-act', 'ideal-customer-profile'],
  },
  {
    slug: 'follow-up-email-template',
    name: 'Follow-up email template',
    seoTitle: 'Follow-Up Email Template: 7 Polite Examples',
    h1: 'Follow-up email template',
    description: 'Follow-up email templates for when there is no reply: after a cold email, a call, a proposal or a creator pitch, plus a last email to close the loop.',
    intro: [
      'Most replies to outreach come after the first email, not to it, because people are busy rather than uninterested. A [follow-up email](/glossary/follow-up-email) gives them a second chance to answer without making them feel chased.',
      'A good follow-up is shorter than the first email and adds something: a new detail, a useful link, an easier question. “Just bumping this to the top of your inbox” adds nothing, and it reads that way.',
    ],
    templatesTitle: 'Follow-up email templates to copy',
    templates: [
      {
        id: 'first-follow-up',
        title: 'First follow-up after no reply',
        when: 'A few working days after a cold email with no answer. Reply in the same thread so they can see the first message.',
        subjects: ['Re: {original_subject}'],
        body: `Hi {first_name},

One more thought on {topic}: {a new, specific detail, e.g. I noticed your Saturday hours aren’t on Google either, which is an easy fix}.

If now is a bad time, just say so and I won’t follow up again.

{your_name}`,
        why: [
          'It is a real reply, so “Re:” is honest.',
          'It adds a new reason to answer instead of repeating the first email.',
          'Offering an easy “not now” often gets an answer either way.',
        ],
      },
      {
        id: 'second-follow-up',
        title: 'Second follow-up with something useful',
        when: 'About a week after the first follow-up. Change the angle: give them something they can use whether or not they reply.',
        subjects: ['Re: {original_subject}', 'A {resource} for {company}'],
        body: `Hi {first_name},

I put together {something small and specific, e.g. a one-page mock-up of a homepage for {business_name} / three ideas for your onboarding emails}: {link}.

It is yours to use either way. If you’d like help putting it in place, I’m happy to talk.

{your_name}`,
        why: [
          'Giving something away shows your work better than describing it.',
          'There is no pressure in the ask, which suits a second follow-up.',
        ],
      },
      {
        id: 'breakup',
        title: 'Last email to close the loop',
        when: 'When two follow-ups have had no answer. It ends the sequence politely and leaves the door open.',
        subjects: ['Closing the loop', 'Re: {original_subject}'],
        body: `Hi {first_name},

I haven’t heard back, so I’ll assume {topic} isn’t a priority right now, and this is my last email about it.

If that changes, you can reach me at this address any time.

All the best with {something specific about their business},
{your_name}`,
        why: [
          'It is honest: you say you will stop, and you do.',
          'People who meant to reply often do so when they see it is the last chance.',
          'Ending warmly keeps your name in good standing for later.',
        ],
      },
      {
        id: 'after-call',
        title: 'Follow-up after a call or meeting',
        when: 'The same day as a call, while it is fresh. Confirm what was agreed and the next step.',
        subjects: ['Notes from today', 'Next steps: {topic}'],
        body: `Hi {first_name},

Thanks for your time today. A quick summary so we’re on the same page:

- You’re looking for {need, in their words}
- The main concern is {concern}
- Next step: I’ll {your action} by {date}; you’ll {their action, if any}

{The link, document or answer you promised}

Anything I got wrong, tell me and I’ll fix it.

{your_name}`,
        why: [
          'Writing down their words shows you listened.',
          'Clear next steps with dates stop deals from drifting.',
          'Inviting corrections makes the summary a shared record, not a pitch.',
        ],
      },
      {
        id: 'after-proposal',
        title: 'Follow-up on a proposal or quote',
        when: 'A few days after sending a quote or proposal with no answer.',
        subjects: ['Re: Proposal for {project}', 'Questions about the {project} quote?'],
        body: `Hi {first_name},

Following up on the proposal for {project}. Is there anything I can clarify, or anything you would change?

If the budget is the sticking point, I can {an honest smaller option, e.g. start with the homepage and booking form only and add the rest later}.

{your_name}`,
        why: [
          'It invites objections, which are easier to answer than silence.',
          'A smaller option gives a hesitant buyer a way to say yes.',
        ],
      },
      {
        id: 'not-now',
        title: 'Checking back after “not right now”',
        when: 'When someone said the timing was wrong and agreed you could check back. Send it when they said to, not before.',
        subjects: ['Checking back, as promised', '{topic}, a few months on'],
        body: `Hi {first_name},

In {month} you mentioned {topic} wasn’t a priority until {their timing, e.g. after the summer season}. Is now a better time to look at it?

Since we last spoke, {one relevant change, e.g. we added online booking that links straight to Google}.

If not, no problem; I’ll leave it there.

{your_name}`,
        why: [
          'It reminds them they agreed to this, so it is welcome rather than cold.',
          'A real update gives a reason to look again.',
        ],
      },
      {
        id: 'creator-follow-up',
        title: 'Follow-up to a creator',
        when: 'A week or so after pitching a creator who has not answered. Creators get many pitches, so make the second one even easier to say yes to.',
        subjects: ['Re: {original_subject}'],
        body: `Hi {creator_name},

Following up on my note about {product}. To make it simple: we’d like {one deliverable, e.g. one dedicated video}, paid at your usual rate, and you keep full creative control.

If you have a media kit or rate card, I’d love to see it. And if it’s not a fit, a one-word “pass” is completely fine.

{your_name}`,
        why: [
          'It narrows the ask to one deliverable and respects their rates.',
          'Asking for the [media kit](/glossary/media-kit) moves things forward without a call.',
          'Making “pass” easy saves both sides time.',
        ],
      },
    ],
    sections: [
      {
        id: 'timing',
        title: 'When to send a follow-up email',
        body: [
          'There is no perfect interval, but a rhythm that respects people’s time works well: a first follow-up a few working days after the first email, a second about a week later, and a last one a week or two after that. Then stop.',
          'Follow up sooner after a call or a promised document (the same day), and later after “not right now” (when they told you to). Avoid weekends and holidays for business email.',
        ],
      },
      {
        id: 'what-to-add',
        title: 'What to add in each follow-up',
        body: ['Each email in a [sales cadence](/glossary/sales-cadence) should give the reader one new reason to answer:'],
        list: [
          'A detail you have noticed since the first email.',
          'Something useful: a mock-up, a short list of ideas, a relevant guide.',
          'A smaller or easier ask than the first one.',
          'A clear way out: “if it is not a fit, just say so”.',
        ],
      },
      {
        id: 'mistakes',
        title: 'Follow-up email mistakes to avoid',
        list: [
          '“Just checking in” or “bumping this up” with nothing new.',
          'Guilt: “I’m surprised I haven’t heard back”.',
          'Fake urgency or a discount that expires tonight.',
          'A new thread with a fake “Re:” subject.',
          'Following up after someone has said no, or after they have unsubscribed.',
          'Long sequences that keep going for weeks: they hurt your [email deliverability](/glossary/email-deliverability) and your name.',
        ],
        after: [
          'The same rules as the first email apply to every follow-up: an honest sender and subject, a way to opt out, and the laws where your readers are (in the US, the [CAN-SPAM Act](/glossary/can-spam-act); in the EU and UK, [GDPR](/glossary/gdpr)). ' + RULES_NOTE,
        ],
      },
    ],
    openreach: {
      title: 'Keep track of who to follow up with',
      body: 'OpenReach keeps every lead and creator with a status (to contact, contacted, replied, won, not a fit) and your notes, so you can see who is due a follow-up. It never sends emails or messages for you: every follow-up is written and sent by you.',
      links: [
        { href: '/features/influencer-crm', label: 'See the influencer CRM' },
        { href: '/features/local-lead-generation', label: 'See local lead generation' },
        { href: '/templates/cold-email-templates', label: 'Cold email templates' },
      ],
    },
    faqTitle: 'Follow-up email FAQ',
    faqs: [
      {
        question: 'How long should I wait before following up?',
        answer: ['A few working days after a first email is a common choice, then about a week between follow-ups. After a call or a promised document, follow up the same day.'],
      },
      {
        question: 'How many follow-up emails is too many?',
        answer: ['After two follow-ups with no answer, send a polite last email and stop. More than that rarely helps and starts to feel like pressure.'],
      },
      {
        question: 'Should a follow-up be a reply or a new email?',
        answer: ['Reply in the same thread, so the reader can see what you sent before. Only use “Re:” when you really are replying.'],
      },
      {
        question: 'What do I write in a follow-up email?',
        answer: ['One new thing: a detail, something useful or an easier question, and a clear way to say no. Keep it shorter than the first email.'],
      },
      {
        question: 'Can OpenReach send follow-ups automatically?',
        answer: ['No, on purpose. OpenReach tracks statuses and notes so you know who to follow up with; you write and send each message yourself.'],
      },
    ],
    glossary: ['follow-up-email', 'sales-cadence', 'cold-email', 'warm-outreach', 'email-deliverability', 'sales-pipeline'],
  },
  {
    slug: 'influencer-outreach-email-template',
    name: 'Influencer outreach email template',
    seoTitle: 'Influencer Outreach Email Template: 6 Examples',
    h1: 'Influencer outreach email template',
    description: 'Influencer outreach email templates for paid sponsorships, gifted products, affiliate deals, UGC and ambassadors, with what to include and what to avoid.',
    intro: [
      '[Influencer outreach](/glossary/influencer-outreach) works when the creator can tell, in the first two lines, that you have watched their content and that the offer is clear and fair. Creators with an audience get many pitches; vague ones (“we love your vibe, let’s collab!”) are the first to be ignored.',
      'Each template below is for one kind of deal. Say what you want, what you offer and what they keep, and leave room for their own ideas: they know their audience better than you do.',
    ],
    templatesTitle: 'Influencer outreach email templates to copy',
    templates: [
      {
        id: 'paid-sponsorship',
        title: 'Paid sponsorship',
        when: 'For a paid video, post or integration on YouTube, TikTok or Instagram. Send it to the business email in their bio or channel, not a DM, if they list one.',
        subjects: ['Paid sponsorship: {product} × {channel_name}', 'Sponsorship for your {topic} videos'],
        body: `Hi {creator_name},

I’m {your_name} from {brand}. I watched your video on {specific video and one detail from it}, and {product} fits that kind of content: {one line on what it does for their audience}.

We’d like to sponsor {deliverable, e.g. a 60–90 second integration in one video} in {month}. This is a paid deal at your rate, with the product sent free beforehand. You choose how to present it, and it would be clearly marked as a paid partnership.

Could you send your rates or media kit? Happy to answer any questions first.

{your_name}
{title}, {brand} · {website}`,
        why: [
          'The specific video shows you are not mass-mailing.',
          'Deliverable, timing, payment and creative control are all in one paragraph.',
          'It asks for their [rate card](/glossary/influencer-rate-card) instead of naming a low price first.',
          'Disclosure is mentioned up front: see [FTC disclosure](/glossary/ftc-disclosure).',
        ],
      },
      {
        id: 'gifted',
        title: 'Gifted product, no obligation',
        when: 'For [product seeding](/glossary/product-seeding) or [gifting](/glossary/gifting), usually with smaller creators. It only works if there really is no obligation.',
        subjects: ['Can I send you {product}?', 'A {product} for you, no strings'],
        body: `Hi {creator_name},

I loved {specific post}. We make {product}, and I think you might genuinely like it, given {reason from their content}.

Could we send you one? There’s no obligation to post. If you do mention it and like it, great; if not, keep it anyway.

If you’re interested, just reply with a shipping address (or a P.O. box) and I’ll send it this week.

{your_name}, {brand}`,
        why: [
          'It is honest about what it is: a gift, not a disguised unpaid ad.',
          'One reply is all it takes to accept.',
          'Offering a P.O. box respects their privacy.',
        ],
      },
      {
        id: 'affiliate',
        title: 'Affiliate partnership',
        when: 'For creators whose audience buys what they recommend. Better as an addition to a paid deal than a replacement for one.',
        subjects: ['Affiliate offer from {brand}', '{commission}% on {product} for your audience'],
        body: `Hi {creator_name},

I’m {your_name} at {brand}. Your {topic} audience asks you for recommendations a lot (I saw {example comment or video}), and {product} is one we think holds up.

We run an affiliate programme: {commission} on every sale through your link or code, tracked for {cookie window}, paid {payment schedule}. We’ll send you the product first so you only recommend it if you like it.

Want me to set up a link and a {promo code idea} code for you?

{your_name}`,
        why: [
          'Commission, tracking and payment terms are stated, so they can decide quickly.',
          'Sending the product first lets them recommend it honestly.',
          'See [affiliate marketing](/glossary/affiliate-marketing) and [promo codes](/glossary/promo-code) for how these deals work.',
        ],
      },
      {
        id: 'ugc',
        title: 'UGC content request',
        when: 'When you want videos or photos to use in your own ads or site, not posts on the creator’s channel. Usage rights are the main point to agree.',
        subjects: ['UGC videos for {brand}', 'Paid UGC project: {product}'],
        body: `Hi {creator_name},

I’m looking for a creator to make {number} short videos of {product} for our own ads and website. This is a [UGC](/glossary/ugc) project, so nothing needs to go on your channel.

What we’d need: {format, length, style}. What we’d offer: {fee or ask for their rate}, the product, and {usage terms, e.g. use in paid ads for 6 months}.

If that sounds interesting, could you send your rates and a few examples?

{your_name}`,
        why: [
          'It makes clear nothing is posted on their channel, which changes the price.',
          'It states the [usage rights](/glossary/usage-rights) instead of leaving them for later.',
        ],
      },
      {
        id: 'ambassador',
        title: 'Long-term ambassador programme',
        when: 'For a creator you have already worked with, or one who already uses and mentions your product.',
        subjects: ['Working together for the year?', 'Ambassador programme at {brand}'],
        body: `Hi {creator_name},

Your {video or post} about {product} did really well for us, and our customers mentioned it. Thank you.

We’d like to make it ongoing: {deliverables per month or quarter} for {length}, at {fee or “a rate we agree”}, plus {perks, e.g. early access and a code for your audience}. You’d keep full control of how you talk about us.

Would you like to talk through what would work for you?

{your_name}`,
        why: [
          'It starts with results and thanks, which is the strongest opener there is.',
          'A [brand ambassador](/glossary/brand-ambassador) deal is a bigger commitment, so it invites a conversation rather than a yes.',
        ],
      },
      {
        id: 'rates',
        title: 'Asking for rates and a media kit',
        when: 'When you are comparing several creators before deciding. Short and easy to answer.',
        subjects: ['Rates for a {platform} sponsorship?', 'Media kit request from {brand}'],
        body: `Hi {creator_name},

I’m planning a {product category} campaign for {month} and your channel is on our shortlist, especially {specific video or series}.

Could you send your media kit and rates for {deliverable}? We’ll decide within {timeframe} and I’ll let you know either way.

{your_name}, {brand}`,
        why: [
          'It is honest that they are on a shortlist.',
          'Promising an answer either way is a courtesy many brands skip.',
        ],
      },
    ],
    sections: [
      {
        id: 'before',
        title: 'Before you send an influencer outreach email',
        list: [
          'Watch or read recent content, not just the follower count. Check the [engagement rate](/glossary/engagement-rate) and average views of recent posts.',
          'Check that the audience is yours: language, country and topic. See [audience demographics](/glossary/audience-demographics).',
          'Look for signs of [fake followers](/glossary/fake-followers): a big count with very low views or comments.',
          'Find the business email in their bio or channel; use DMs only when there is none.',
          'Decide your budget, deliverables and usage before you write, so the email can be specific.',
        ],
      },
      {
        id: 'include',
        title: 'What every influencer outreach email should include',
        list: [
          'Who you are and what the product is, in one sentence.',
          'Why them: a specific piece of their content.',
          'The deal: paid, gifted, affiliate or UGC, and the deliverables.',
          'What they keep: creative control, and how long you can use the content.',
          'Disclosure: sponsored content must be clearly labelled; see [FTC disclosure](/glossary/ftc-disclosure) and [paid partnership](/glossary/paid-partnership).',
          'A next step: rates, a media kit or a short reply.',
        ],
      },
      {
        id: 'avoid',
        title: 'Influencer outreach mistakes to avoid',
        list: [
          'Asking for free posts in exchange for “exposure”.',
          'Copy-paste compliments that could be about anyone.',
          'Asking creators to hide that a post is sponsored.',
          'Sending the same pitch by email, DM and comment at once.',
          'Tying a gift to a guaranteed positive review.',
        ],
        after: [RULES_NOTE],
      },
    ],
    openreach: {
      title: 'Find creators and track every pitch',
      body: 'OpenReach finds creators on YouTube, TikTok and Instagram for your niche, with followers, average views, engagement and the contacts in their bio, and keeps each one in an influencer CRM with a status and notes. It never contacts creators for you: you write and send every message yourself.',
      links: [
        { href: '/tools/influencer-search-tool', label: 'Open the influencer search tool' },
        { href: '/features/influencer-crm', label: 'See the influencer CRM' },
        { href: '/docs/tutorials/find-influencers', label: 'How to find influencers' },
      ],
    },
    faqTitle: 'Influencer outreach FAQ',
    faqs: [
      {
        question: 'Should I email or DM an influencer?',
        answer: ['Email the business address in their bio or channel if they list one: it is where they expect brand deals. Use a DM only when there is no email, and keep it shorter.'],
      },
      {
        question: 'How much should I offer an influencer?',
        answer: ['Rates vary a lot by platform, niche, audience and deliverable. Ask for their [rate card](/glossary/influencer-rate-card) rather than naming a figure first, and compare it with their recent average views, not their follower count.'],
      },
      {
        question: 'Is it OK to only offer free product?',
        answer: ['For a gift with no obligation, yes. If you expect a post, it is work and should be paid. Either way, posts about products received for free must be disclosed.'],
      },
      {
        question: 'Do sponsored posts need to be disclosed?',
        answer: ['Yes. In the US the FTC expects clear disclosure of paid or gifted content, and most platforms have their own paid partnership labels; other countries have similar rules. See [FTC disclosure](/glossary/ftc-disclosure).'],
      },
      {
        question: 'Does OpenReach send outreach to influencers?',
        answer: ['No. OpenReach finds creators, shows their public contacts and tracks your pipeline. Every email or message is written and sent by you.'],
      },
    ],
    glossary: ['influencer-outreach', 'media-kit', 'influencer-rate-card', 'ftc-disclosure', 'product-seeding', 'usage-rights'],
  },
];

export const getTemplatePage = (slug: string) => templatePages.find((page) => page.slug === slug);

/** The text the copy button copies: the first subject line, then the body. */
export const copyText = (template: EmailTemplate) => `Subject: ${template.subjects[0]}\n\n${template.body}`;
