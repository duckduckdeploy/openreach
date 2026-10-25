import type { FieldDef, Rule, RuleGroup, RuleOp } from "./rules";

/**
 * A business found on Google Maps, as OpenReach keeps it: the Places fields worth filtering and
 * contacting on, with the website reduced to its domain. Built from a `/v1/maps/search` result.
 */
export type Lead = {
  placeId: string;
  name: string;
  category: string | null;
  types: string[];
  address: string | null;
  phone: string | null;
  website: string | null;
  domain: string | null;
  rating: number | null;
  reviews: number | null;
  priceLevel: string | null;
  status: string | null;
  openNow: boolean | null;
  hours: string[];
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
  topReview: string | null;
  /** The search that found it, e.g. "plumber in Austin, TX". */
  query?: string;
  emails?: string[];
};

type PlaceLike = {
  id: string;
  name: string;
  types?: string[];
  primaryType?: string;
  address?: string;
  phone?: string;
  website?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  businessStatus?: string;
  openNow?: boolean;
  hours?: string[];
  topReview?: { text?: string };
};

/** The registrable-ish host of a website, without www. Social profiles and link pages count as no website. */
export function websiteDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, "");
    return host || null;
  } catch {
    return null;
  }
}

/** Hosts that are a profile on someone else's platform, not the business's own site. */
const NOT_OWN_SITE = /(^|\.)(facebook\.com|instagram\.com|linktr\.ee|tiktok\.com|x\.com|twitter\.com|yelp\.com|business\.site|wa\.me|linkedin\.com|youtube\.com)$/;

export const hasOwnWebsite = (lead: Pick<Lead, "domain">) => Boolean(lead.domain && !NOT_OWN_SITE.test(lead.domain));

export function toLead(place: PlaceLike, query?: string): Lead {
  const domain = websiteDomain(place.website);
  return {
    placeId: place.id.replace(/^places\//, ""),
    name: place.name,
    category: place.primaryType ? place.primaryType.replaceAll("_", " ") : null,
    types: (place.types ?? []).filter((type) => type !== "point_of_interest" && type !== "establishment").map((type) => type.replaceAll("_", " ")),
    address: place.address ?? null,
    phone: place.phone ?? null,
    website: place.website ?? null,
    domain,
    rating: place.rating ?? null,
    reviews: place.userRatingCount ?? null,
    priceLevel: place.priceLevel ?? null,
    status: place.businessStatus ?? null,
    openNow: place.openNow ?? null,
    hours: place.hours ?? [],
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    mapsUrl: place.googleMapsUrl ?? null,
    topReview: place.topReview?.text ?? null,
    query,
  };
}

export const LEAD_FIELDS: FieldDef<Lead>[] = [
  { key: "website", label: "Website", type: "boolean", get: (lead) => hasOwnWebsite(lead), hint: "Its own site; a Facebook page or Linktree doesn't count" },
  { key: "rating", label: "Rating", type: "number", get: (lead) => lead.rating },
  { key: "reviews", label: "Reviews", type: "number", get: (lead) => lead.reviews },
  { key: "name", label: "Name", type: "text", get: (lead) => lead.name },
  { key: "category", label: "Category", type: "text", get: (lead) => lead.category },
  { key: "types", label: "Types", type: "list", get: (lead) => lead.types },
  { key: "phone", label: "Phone", type: "text", get: (lead) => lead.phone },
  { key: "domain", label: "Website address", type: "text", get: (lead) => lead.domain },
  { key: "address", label: "Address", type: "text", get: (lead) => lead.address },
  { key: "priceLevel", label: "Price level", type: "text", get: (lead) => lead.priceLevel },
  { key: "status", label: "Business status", type: "text", get: (lead) => lead.status, hint: "OPERATIONAL, CLOSED_TEMPORARILY or CLOSED_PERMANENTLY" },
  { key: "openNow", label: "Open now", type: "boolean", get: (lead) => lead.openNow },
  { key: "topReview", label: "Top review", type: "text", get: (lead) => lead.topReview },
  { key: "query", label: "Found by search", type: "text", get: (lead) => lead.query },
];

const rule = (field: string, op: RuleOp, value?: Rule["value"]): Rule => ({ field, op, value });

/** Ready-made filters for common pitches. */
export const LEAD_PRESETS: { id: string; title: string; pitch: string; rules: RuleGroup }[] = [
  {
    id: "no-website",
    title: "No website",
    pitch: "Businesses that need a website",
    rules: { match: "all", rules: [rule("website", "eq", false), rule("status", "neq", "CLOSED_PERMANENTLY")] },
  },
  {
    id: "few-reviews",
    title: "Under 20 reviews",
    pitch: "Review and reputation campaigns",
    rules: { match: "all", rules: [rule("reviews", "lt", 20), rule("status", "eq", "OPERATIONAL")] },
  },
  {
    id: "low-rating",
    title: "Rated under 4.0",
    pitch: "Reputation management",
    rules: { match: "all", rules: [rule("rating", "lt", 4), rule("reviews", "gte", 10)] },
  },
  {
    id: "established",
    title: "Established, with a website",
    pitch: "SEO, ads and software for businesses that already invest",
    rules: { match: "all", rules: [rule("website", "eq", true), rule("reviews", "gte", 100), rule("rating", "gte", 4)] },
  },
  {
    id: "no-phone",
    title: "No phone listed",
    pitch: "Profile clean-up",
    rules: { match: "all", rules: [rule("phone", "missing")] },
  },
];
