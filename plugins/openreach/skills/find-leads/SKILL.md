---
name: find-leads
description: Build a list of local businesses from Google Maps that fit the user's pitch, such as businesses with no website, few reviews or a low rating in a city, filter it, find emails and save it as leads. Use when the user sells to local businesses or asks for leads, prospects or a list of companies in a place.
---

# Find leads

## Money rules (every OpenReach skill)

- Rough costs:
  - `find_leads` $0.07 per page of 20 places, up to 3 pages
  - `start_lead_search` $0.07 per page searched: queries × places × pages, or grid points × queries × pages
  - `find_saved_lead_emails` $0.01 per lead (homepage) or $0.03 (email directory)
- Before each paid call, run it with `dry_run: true` and say the price. Agree a limit and pass it as `max_cost_usd`. Always confirm a lead search's price before starting it.
- End with what the paid calls cost in total.
- Never email or call anyone for the user.

## Steps

1. **Pitch.** Agree what is being sold and to whom. Turn it into:
   - the business types to search (one to three phrasings, e.g. "plumber", "emergency plumber")
   - the places (cities, suburbs or postcodes)
   - the filter that makes a business a lead. Read `get_filter_fields` for the fields and presets: "No website", "Under 20 reviews", "Rated under 4.0", "Established, with a website".
2. **Sample.** Run `find_leads` once for the main type in the main place, `pages: 1`. Show how many of the 20 pass the filter, so the user can sharpen it before paying for more.
3. **Search at scale.** Start a `start_lead_search` with every query and place and the filter as `filters`, `autoSave: true`:
   - text mode for a list of places
   - grid mode for one big city: one search stops at 60 places, a grid covers every neighbourhood. 4×4 with 3 km spacing suits a mid-size city.

   Poll `get_lead_search` until it is completed.
4. **Clean.** Read the saved leads with `list_leads` (`search_id` from the search). Point out chains and duplicates and remove what the user doesn't want with `update_leads` (status `lost`).
5. **Emails.** For leads with a website, offer `find_saved_lead_emails` with `method: "website"` first; the directory only for the ones still missing.
6. **Hand over.** A table: name, category, rating, reviews, phone, website, email. Tag the batch with `update_leads` and tell the user the CSV export is in the app's lead list.
