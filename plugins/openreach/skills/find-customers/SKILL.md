---
name: find-customers
description: Find people in communities who are asking for what the user's product does, such as "best tool for…", "looking for…" and "alternative to…" threads on Reddit, Quora, Hacker News, Stack Overflow, Indie Hackers and more, ranked by buying intent, with reply drafts. Use when the user wants customers, users, demand signals or conversations to join.
---

# Find customers

## Money rules (every OpenReach skill)

- Rough costs:
  - `find_conversations` $0.01 per Google-searched source per phrasing; Hacker News, GitHub and Stack Overflow are free
  - AI scoring adds about $0.01 per 25 results and filters out posts that aren't real requests
- Before each paid call, run it with `dry_run: true` and say the price. Agree a limit and pass it as `max_cost_usd`.
- End with what the paid calls cost in total.
- Never post for the user. Draft replies; the user posts them, disclosing who they are.

## Steps

1. **Problems.** From `get_project`, write one to three problems the product solves in the words a buyer would use ("crm for small business", "track freelance invoices"), not the product's own name. Add the main competitors: people unhappy with them are warm leads.
2. **Search.** Run `find_conversations` with the problems, competitors and `days: 180`. Turn on `aiScoring` when the problems are broad and noisy.
3. **Rank.** Take the results with intent 60 or more. For each: what they need, how recent it is, how many replies it has, and whether the product truly fits. Drop the ones where it doesn't.
4. **Reply drafts.** For the best five, draft a reply that helps first (answer the question, mention alternatives honestly) and names the product once, with the user's role disclosed. Keep each under 120 words.
5. **Where to be.** From `communities`, name the three communities where these questions keep coming up; suggest the `community-plan` skill for a longer plan.
6. **Keep listening.** Offer a topic monitor with `create_monitor` (`kind: "topic"`, the problems as terms, the competitors) on a weekly schedule, priced first with `dry_run`.
