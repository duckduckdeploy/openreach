---
name: find-influencers
description: Find creators on YouTube, TikTok and Instagram who reach the user's audience, analyse the promising ones (followers, average views, engagement, contacts), and save a shortlist. Use when the user wants influencers, creators, YouTubers or TikTokers to promote a product.
---

# Find influencers

## Money rules (every OpenReach skill)

- Rough costs:
  - `find_creators` $0.02 per page on YouTube and TikTok, $0.03 on Instagram
  - `analyse_creator` $0.02–0.03 per creator; `analyse_creators` the same per creator, up to 25 at once
  - `similar_creators` $0.01
- Before each paid call, run it with `dry_run: true` and say the price. Agree a limit and pass it as `max_cost_usd`.
- End with what the paid calls cost in total.
- Never contact a creator for the user. Find, organise and draft; the user sends.

## Steps

1. **Brief.** Read the project with `get_project`. Agree with the user:
   - the platforms (one to start is fine)
   - the niche words creators would use, from the project's keywords
   - the size wanted: nano (under 10K), micro (10K–100K), mid-tier, macro or mega. Micro creators usually cost less and convert better.
   - the country, if it matters
2. **Discover.** Run `find_creators` per platform and niche word with `pages: 1`, then a second page only if the first was thin. Creators that came up for several videos rank first.
3. **Shortlist.** From the results, drop accounts that are brands or off-topic, or far outside the size wanted. Keep 10 to 25.
4. **Analyse.** Run `analyse_creators` on the shortlist (price it first). Rank by:
   - engagement rate (TikTok and Instagram: likes plus comments over followers; YouTube: views over subscribers)
   - average views, not followers
   - posts per week, and a last post within 30 days
   - a contact: an email in the bio, or YouTube's business email
5. **Lookalikes.** For the two or three best Instagram creators, run `similar_creators` and analyse the new names worth it.
6. **Save.** Save the final list with `save_creators`, `status: "to_contact"` and a tag for the campaign. Show the user a table: handle, platform, followers, average views, engagement, contact.
7. **Outreach drafts.** If asked, draft a short first message per creator that mentions one of their recent posts (`recent` from the analysis). The user sends them; afterwards set statuses with `update_creators`.
