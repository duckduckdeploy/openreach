"use client";

import { describeRules, filterRecords, hasOwnWebsite, type Lead, LEAD_FIELDS, LEAD_PRESETS, type RuleGroup } from "@openreach/shared";
import { Mail, MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/kit";
import { type Column, DataTable } from "@/components/research/data-table";
import { ExportButton, RunPrompt, ViewErrors, ViewMeta } from "@/components/research/lookup-ui";
import { SearchBar, useChangeMarket, useMarket, useToolNav, useUrlText } from "@/components/research/search-bar";
import { Button, Card, CardHeader, cx, ErrorNote, Input, WithIcon } from "@/components/ui";
import type { Project } from "@/lib/hooks";
import { useLookup, useLookupQuery } from "@/lib/lookup";
import { Count, OutLink, SaveToProject } from "./bits";
import { RulesBuilder, rulesFromParam, rulesToParam } from "./rules";

type LeadResult = { query: string; location: string | null; pages: number; leads: Lead[] };

export function Rating({ rating, reviews }: { rating: number | null; reviews: number | null }) {
  if (rating == null) return <span className="text-faint">no rating</span>;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Star className="size-3 fill-current text-warn" aria-hidden />
      <span className="font-mono tabular">{rating.toFixed(1)}</span>
      <span className="font-mono text-xs text-muted tabular">({reviews ?? 0})</span>
    </span>
  );
}

export function leadColumns(): Column<Lead>[] {
  return [
    {
      key: "name",
      header: "Business",
      rowHeader: true,
      sortValue: (l) => l.name.toLowerCase(),
      render: (l) => (
        <div className="min-w-52">
          <OutLink href={l.mapsUrl} className="font-medium">
            {l.name}
          </OutLink>
          <p className="max-w-72 truncate text-xs text-muted">{l.address ?? "—"}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", sortValue: (l) => l.category, render: (l) => <span className="text-[13px] text-muted">{l.category ?? "—"}</span> },
    { key: "rating", header: "Rating", sortValue: (l) => l.rating, render: (l) => <Rating rating={l.rating} reviews={l.reviews} /> },
    { key: "reviews", header: "Reviews", align: "right", sortValue: (l) => l.reviews, render: (l) => <Count value={l.reviews} /> },
    {
      key: "website",
      header: "Website",
      sortValue: (l) => (hasOwnWebsite(l) ? l.domain : null),
      render: (l) =>
        hasOwnWebsite(l) ? (
          <OutLink href={l.website} className="max-w-44 font-mono text-xs text-muted">
            {l.domain}
          </OutLink>
        ) : (
          <span className={cx("text-[13px]", l.domain ? "text-muted" : "text-faint")}>{l.domain ? `only ${l.domain}` : "none"}</span>
        ),
    },
    { key: "phone", header: "Phone", render: (l) => (l.phone ? <a href={`tel:${l.phone}`} className="font-mono text-xs whitespace-nowrap hover:underline">{l.phone}</a> : <span className="text-faint">—</span>) },
    {
      key: "email",
      header: "Email",
      render: (l) =>
        l.emails?.length ? (
          <a href={`mailto:${l.emails[0]}`} className="inline-flex max-w-48 items-center gap-1 font-mono text-xs text-accent-text hover:underline">
            <Mail className="size-3 shrink-0" aria-hidden /> <span className="truncate">{l.emails[0]}</span>
          </a>
        ) : (
          <span className="text-faint">—</span>
        ),
    },
    { key: "open", header: "Open", title: "Business status on Google Maps", render: (l) => <span className="text-[13px] text-muted">{l.status === "OPERATIONAL" ? "Open" : l.status === "CLOSED_TEMPORARILY" ? "Closed for now" : l.status === "CLOSED_PERMANENTLY" ? "Closed" : "—"}</span> },
  ];
}

export const leadCsv = (rows: Lead[]) =>
  rows.map((l) => ({
    name: l.name,
    category: l.category,
    address: l.address,
    phone: l.phone,
    website: l.website,
    has_own_website: hasOwnWebsite(l),
    emails: l.emails?.join("; "),
    rating: l.rating,
    reviews: l.reviews,
    status: l.status,
    google_maps: l.mapsUrl,
    latitude: l.latitude,
    longitude: l.longitude,
    found_by: l.query,
  }));

/** Presets and the full rule builder, side by side. Free: they filter what is already on screen. */
export function LeadFilters({ rules, onChange }: { rules: RuleGroup; onChange: (rules: RuleGroup) => void }) {
  const active = LEAD_PRESETS.find((preset) => JSON.stringify(preset.rules) === JSON.stringify(rules));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {LEAD_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(active?.id === preset.id ? { match: "all", rules: [] } : preset.rules)}
            aria-pressed={active?.id === preset.id}
            title={preset.pitch}
            className={cx("rounded-full border px-3 py-1 text-[13px]", active?.id === preset.id ? "border-accent-line bg-accent-soft text-accent-text" : "border-line text-muted hover:border-edge hover:text-ink")}
          >
            {preset.title}
          </button>
        ))}
      </div>
      <RulesBuilder value={rules} onChange={onChange} fields={LEAD_FIELDS} />
      {rules.rules.length > 0 && <p className="text-xs text-muted">Showing businesses where {describeRules(rules, LEAD_FIELDS)}.</p>}
    </div>
  );
}

/**
 * The lead finder: one Google Maps search ("plumber" in "Austin, TX"), up to 60 places, then
 * filters, emails and saving. For many places or a whole city, a project's lead search runs the
 * same search at scale in the background.
 */
export function LeadFinder({ project }: { project: Project }) {
  const params = useSearchParams();
  const nav = useToolNav();
  const market = useMarket(project);
  const changeMarket = useChangeMarket();
  const query = params.get("q")?.trim() ?? "";
  const where = params.get("where")?.trim() ?? "";
  const [whereText, setWhereText] = useUrlText(where);
  const pages = Math.min(3, Math.max(1, Number(params.get("pages")) || 1));
  const rules = useMemo(() => rulesFromParam(params.get("rules")), [params]);
  const [showFilters, setShowFilters] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emails, setEmails] = useState<Map<string, string[]>>(new Map());

  const search = useLookupQuery<LeadResult>(project.id, "find_leads", query ? { query, location: where || undefined, pages, country: market.country, language: market.language } : null);
  const findEmails = useLookup<{ results: { placeId: string; emails: string[] }[]; failed: string[] }>(project.id, "lead_emails");

  const all = useMemo(() => (search.data?.leads ?? []).map((l) => (emails.has(l.placeId) ? { ...l, emails: emails.get(l.placeId) } : l)), [search.data, emails]);
  const rows = useMemo(() => filterRecords(all, rules, LEAD_FIELDS), [all, rules]);
  const chosen = rows.filter((l) => selected.has(l.placeId));
  const withSite = (chosen.length ? chosen : rows).filter((l) => hasOwnWebsite(l) && !emails.has(l.placeId));

  async function lookUpEmails() {
    const batch = withSite.slice(0, 25).map((l) => ({ placeId: l.placeId, name: l.name, website: l.website, domain: l.domain }));
    const result = await findEmails.runAsync({ leads: batch, method: "website" }).catch(() => null);
    if (!result) return;
    setEmails((previous) => {
      const next = new Map(previous);
      for (const r of result.data.results) next.set(r.placeId, r.emails);
      return next;
    });
  }

  const setRules = (group: RuleGroup) => nav({ rules: rulesToParam(group) }, { replace: true });

  return (
    <>
      <SearchBar
        value={query}
        onSearch={(q) => nav({ q, where: whereText.trim() || null })}
        label="Type of business"
        icon={Search}
        placeholder="What to find, e.g. plumber, dentist, vegan restaurant"
        market={market}
        onMarket={changeMarket}
        button="Find leads"
        pending={search.loading}
        extra={
          <WithIcon icon={MapPin} className="w-full sm:w-56">
            <Input value={whereText} onChange={(event) => setWhereText(event.target.value)} placeholder="City, area or postcode" aria-label="Where" className="h-11 pl-9 text-[14px]" />
          </WithIcon>
        }
      >
        <Segmented label="Pages" value={String(pages)} onChange={(value) => nav({ pages: value === "1" ? null : value })} options={[1, 2, 3].map((n) => ({ id: String(n), label: `${n * 20} places` }))} />
        <span className="text-xs text-muted">Google Maps returns up to 60 places per search. For a whole city or many places, use a lead search in a project.</span>
      </SearchBar>

      {!query && (
        <RunPrompt title="Find businesses on Google Maps">
          Search a type of business in a place, then filter: no website, few reviews, a low rating, a word in the name. Filters are free; save the list to a project or export it.
        </RunPrompt>
      )}
      <ViewErrors lookups={[search]} />
      {search.data && (
        <Card>
          <CardHeader
            title={`${rows.length} of ${all.length} businesses`}
            description={<ViewMeta lookups={[search]} label={`“${search.data.query}”${search.data.location ? ` in ${search.data.location}` : ""}`} />}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={showFilters ? "secondary" : "ghost"} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
                  <SlidersHorizontal className="size-3.5" aria-hidden /> Filters{rules.rules.length ? ` (${rules.rules.length})` : ""}
                </Button>
                <Button size="sm" loading={findEmails.isPending} disabled={!withSite.length} onClick={() => void lookUpEmails()} title="Reads each business's homepage for a contact email">
                  <Mail className="size-3.5" aria-hidden /> Find emails{withSite.length ? ` (${Math.min(25, withSite.length)})` : ""}
                </Button>
                <SaveToProject scopeId={project.id} kind="leads" rows={() => (chosen.length ? chosen : rows)} label={chosen.length ? `Save ${chosen.length}` : "Save all"} />
                <ExportButton filename={`leads-${query}${where ? `-${where}` : ""}.csv`} rows={() => leadCsv(chosen.length ? chosen : rows)} />
              </div>
            }
          />
          {showFilters && (
            <div className="border-b border-line px-4 py-3">
              <LeadFilters rules={rules} onChange={setRules} />
            </div>
          )}
          {findEmails.error && (
            <div className="px-4 pt-3">
              <ErrorNote error={findEmails.error} />
            </div>
          )}
          <DataTable rows={rows} columns={leadColumns()} rowKey={(l) => l.placeId} caption={`Businesses for ${query}`} selection={{ selected, onChange: setSelected, label: (l) => l.name }} empty="No businesses match these filters." />
        </Card>
      )}
    </>
  );
}
