import { extractEmails, hasOwnWebsite, type Lead, toLead } from "@openreach/shared";
import type { MapsCircle, MapsPriceLevel, YepApi } from "@openreach/yepapi";
import type { LeadSearchParams } from "../db/data-schema";

/**
 * Businesses from Google Maps. One text query returns up to 20 places a page and at most 3 pages
 * (60 places); a grid of biased searches goes past that for a whole city. Each page is $0.07.
 */

export const MAPS_PAGE_USD = 0.07;
export const MAPS_PAGE_SIZE = 20;
export const MAX_PAGES = 3;

export type PlacesQuery = {
  query: string;
  /** Appended as "in <location>": a city, region, postcode or neighbourhood. */
  location?: string | null;
  pages: number;
  params?: LeadSearchParams;
  bias?: MapsCircle;
};

export const queryText = (q: Pick<PlacesQuery, "query" | "location">) => (q.location?.trim() ? `${q.query.trim()} in ${q.location.trim()}` : q.query.trim());

export async function searchPlaces(yep: YepApi, q: PlacesQuery): Promise<{ leads: Lead[]; costUsd: number; pages: number }> {
  const text = queryText(q);
  const leads: Lead[] = [];
  let costUsd = 0;
  let pageToken: string | undefined;
  let pages = 0;
  for (let page = 0; page < Math.min(q.pages, MAX_PAGES); page++) {
    const res = await yep.maps.search({
      query: text,
      limit: MAPS_PAGE_SIZE,
      language: q.params?.language,
      region: q.params?.region,
      min_rating: q.params?.minRating,
      open_now: q.params?.openNow || undefined,
      included_type: q.params?.includedType || undefined,
      price_levels: q.params?.priceLevels?.length ? (q.params.priceLevels as MapsPriceLevel[]) : undefined,
      location_bias: q.bias,
      page_token: pageToken,
    });
    costUsd += res.costUsd;
    pages += 1;
    for (const place of res.data.results ?? []) leads.push(toLead(place, text));
    pageToken = res.data.nextPageToken || undefined;
    if (!pageToken) break;
  }
  return { leads, costUsd: Math.round(costUsd * 100) / 100, pages };
}

/** Keeps the first copy of each place. */
export function dedupeLeads(leads: Lead[]): Lead[] {
  const seen = new Map<string, Lead>();
  for (const lead of leads) if (!seen.has(lead.placeId)) seen.set(lead.placeId, lead);
  return [...seen.values()];
}

export type EmailMethod = "website" | "directory";
export const EMAIL_USD: Record<EmailMethod, { min: number; max: number }> = {
  // /v1/scrape of the homepage, $0.01.
  website: { min: 0.01, max: 0.01 },
  // /v1/email/domain-search, $0.03 per 10 emails, 10 at most here.
  directory: { min: 0.03, max: 0.03 },
};

/**
 * Contact emails for a lead with its own website: either what the homepage shows (a mailto or
 * a written address), or the people a business-email directory knows at that domain.
 */
export async function findLeadEmails(yep: YepApi, lead: Lead, method: EmailMethod): Promise<{ emails: string[]; costUsd: number }> {
  if (!lead.domain || !hasOwnWebsite(lead)) return { emails: [], costUsd: 0 };
  if (method === "directory") {
    const res = await yep.email.domainSearch({ domain: lead.domain, limit: 10 });
    const emails = (res.data.emails ?? []).filter((e) => (e.confidenceScore ?? 100) >= 50).map((e) => e.email.toLowerCase());
    return { emails: [...new Set(emails)], costUsd: res.costUsd };
  }
  const res = await yep.scrape.page({ url: lead.website ?? `https://${lead.domain}`, format: "markdown" });
  const body = String(res.data.markdown ?? res.data.content ?? "");
  // Addresses on the business's own domain first; others (a gmail address) are often the owner's.
  const emails = extractEmails(body.replace(/mailto:/gi, " ")).sort((a, b) => Number(b.endsWith(`@${lead.domain}`)) - Number(a.endsWith(`@${lead.domain}`)));
  return { emails: emails.slice(0, 5), costUsd: res.costUsd };
}
