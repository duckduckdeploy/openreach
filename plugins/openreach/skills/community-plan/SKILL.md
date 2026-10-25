---
name: community-plan
description: Find the subreddits and other communities where the user's audience talks about their problem, rank them by activity, and write a plan for becoming a helpful regular there without spamming. Use when the user asks which subreddits to post in, where their audience hangs out, or how to do community marketing.
---

# Community plan

## Money rules (every OpenReach skill)

- Rough costs:
  - `find_subreddits` $0.02 per phrasing per topic (20 Google results each), free with a Reddit API set up on the server
  - `find_conversations` $0.01 per Google-searched source per phrasing
  - `get_communities` is free and ranks the communities a project's monitors already found
- Before each paid call, run it with `dry_run: true` and say the price. Agree a limit and pass it as `max_cost_usd`.
- End with what the paid calls cost in total.

## Steps

1. **Topics.** From `get_project`, list two to five topics the audience discusses: the problem, the job it is part of, and the audience itself ("freelance designers", "home baristas").
2. **Subreddits.** Run `find_subreddits` with those topics. Rank the results by threads, replies and how recent the newest is. Split them:
   - core: the problem is discussed weekly
   - adjacent: the audience is there, the problem comes up sometimes
   - skip: big general subreddits where a small account gets buried
3. **Beyond Reddit.** Run `find_conversations` over the non-Reddit sources (Quora, Stack Exchange, Indie Hackers, Hacker News, forums) and take the top of `communities`. If the project has monitors, `get_communities` adds what they found, free.
4. **Read the rules.** For the top five communities, tell the user to read the rules and the pinned posts: many ban self-promotion or allow it only in a weekly thread.
5. **Plan.** A four-week plan:
   - weeks 1–2: answer questions only, no links
   - week 3: one genuinely useful post (a guide, data, a lesson learned)
   - week 4 on: mention the product only where it answers the question, with the user's role disclosed

   Name two or three open threads per community to start with, from the results.
6. **Remember.** Save the chosen communities in the project context with `update_project`, and offer a topic monitor (`create_monitor`) so new questions arrive in the feed.
