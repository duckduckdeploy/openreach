---
name: brand-monitor
description: Find where a product is being talked about across Reddit, Hacker News, GitHub, Stack Overflow, Quora, X, LinkedIn, Product Hunt and review sites, pick the mentions worth a reply, and set up a monitor that checks on a schedule. Use when the user asks about brand mentions, what people say about their product, or social listening.
---

# Brand monitor

## Money rules (every OpenReach skill)

- Rough costs:
  - `brand_mentions` $0.01 per Google-searched source per brand term; Hacker News, GitHub and Stack Overflow are free
  - a monitor costs the same per run; `list_monitors` shows the price per run and per month
  - AI scoring adds about $0.01 per 25 results
- Before each paid call, run it with `dry_run: true` and say the price. Agree a limit and pass it as `max_cost_usd`.
- End with what the paid calls cost in total.
- Never post a reply for the user. Draft it; the user posts it.

## Steps

1. **Terms.** From `get_project`, list the brand names to search: the product name, the domain, common misspellings. Add excluded words for namesakes (a product called "Notion" needs exclusions). Check the sources with `list_sources`.
2. **Look back.** Run `brand_mentions` with `days: 90` over the default sources. Results already only include pages that name a term.
3. **Read it.** Group the mentions:
   - questions and comparisons the user should answer
   - complaints to fix or reply to
   - praise worth sharing or turning into a testimonial
   - where they come from (`communities` in the result)
4. **Reply drafts.** For the three to five mentions most worth it, draft a helpful, honest reply that discloses the user's role. No marketing voice; answer the question.
5. **Monitor.** Offer a brand monitor with `create_monitor` (`kind: "brand"`, the same terms and exclusions, `schedule: "daily"` or `"weekly"`). Quote the price per month from the dry run first. Later, `list_mentions` with `status: "new"` shows what came in.
