"use client";

import { type Creator, CREATOR_FIELDS, creatorTier, filterRecords, PLATFORM_IDS, PLATFORMS, type Platform, type RuleGroup } from "@openreach/shared";
import { BadgeCheck, Mail, Search, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/kit";
import { type Column, DataTable } from "@/components/research/data-table";
import { ExportButton, RunPrompt, ViewErrors, ViewMeta } from "@/components/research/lookup-ui";
import { SearchBar, useChangeMarket, useMarket, useToolNav } from "@/components/research/search-bar";
import { Button, Card, CardHeader, cx, ErrorNote, Stat } from "@/components/ui";
import { compact, dateOnly } from "@/lib/api";
import type { Project } from "@/lib/hooks";
import { useLookup, useLookupQuery } from "@/lib/lookup";
import { toolLinks } from "@/lib/scope";
import { safeHref } from "@/lib/url";
import { ago, Count, OutLink, Percent, PlatformBadge, PlatformMark, SaveToProject } from "./bits";
import { RulesBuilder, rulesFromParam, rulesToParam } from "./rules";

type Discovery = { platform: Platform; query: string; creators: Creator[]; notes: string[] };

export const creatorKey = (c: Pick<Creator, "platform" | "id">) => `${c.platform}:${c.id}`;

export function Avatar({ src, name, size = 32 }: { src: string | null | undefined; name: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const href = safeHref(src ?? undefined);
  const initials = name.replace(/^@/, "").slice(0, 2).toUpperCase();
  if (!href || broken) {
    return (
      <span className="grid shrink-0 place-items-center rounded-full bg-sunken font-mono text-[11px] text-muted" style={{ width: size, height: size }} aria-hidden>
        {initials}
      </span>
    );
  }
  // Platform CDNs refuse requests that carry our referrer.
  return <img src={href} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="shrink-0 rounded-full bg-sunken object-cover" style={{ width: size, height: size }} />;
}

function CreatorCell({ creator }: { creator: Creator }) {
  return (
    <div className="flex min-w-56 items-center gap-2.5">
      <Avatar src={creator.avatar} name={creator.name ?? creator.handle} />
      <div className="min-w-0">
        <Link href={toolLinks.creator(creator.platform, creator.platform === "youtube" ? creator.id : creator.handle)} className="flex items-center gap-1 font-medium hover:underline">
          <span className="truncate">{creator.name || creator.handle}</span>
          {creator.verified && <BadgeCheck className="size-3.5 shrink-0 text-accent-text" aria-label="Verified" />}
        </Link>
        <OutLink href={creator.url} className="max-w-56 font-mono text-xs text-muted">
          {creator.handle.startsWith("@") || creator.platform === "youtube" ? creator.handle : `@${creator.handle}`}
        </OutLink>
      </div>
    </div>
  );
}

export function creatorColumns(options: { discovery?: boolean } = {}): Column<Creator>[] {
  return [
    { key: "creator", header: "Creator", rowHeader: true, render: (c) => <CreatorCell creator={c} />, sortValue: (c) => (c.name ?? c.handle).toLowerCase() },
    { key: "platform", header: "Platform", render: (c) => <PlatformBadge platform={c.platform} /> },
    { key: "followers", header: "Followers", align: "right", sortValue: (c) => c.followers, render: (c) => <Count value={c.followers} />, title: "Followers or subscribers" },
    { key: "tier", header: "Tier", render: (c) => <span className="text-[13px] text-muted">{creatorTier(c.followers) ?? "—"}</span> },
    ...(options.discovery
      ? [{ key: "matched", header: "Matched", align: "right" as const, sortValue: (c: Creator) => c.matchedViews ?? c.matchedPosts ?? null, title: "Videos for this search, and their views", render: (c: Creator) => (c.matchedPosts ? <span className="font-mono tabular">{c.matchedPosts} · {compact(c.matchedViews)}</span> : <span className="text-faint">account</span>) }]
      : []),
    { key: "views", header: "Avg views", align: "right", sortValue: (c) => c.avgViews, render: (c) => <Count value={c.avgViews} /> },
    { key: "engagement", header: "Engagement", align: "right", sortValue: (c) => c.engagementRate, render: (c) => <Percent value={c.engagementRate} />, title: "TikTok and Instagram: likes and comments per post over followers. YouTube: views over subscribers." },
    { key: "frequency", header: "Posts/wk", align: "right", sortValue: (c) => c.postsPerWeek, render: (c) => <span className="font-mono tabular">{c.postsPerWeek ?? "—"}</span> },
    { key: "last", header: "Last post", sortValue: (c) => c.lastPostAt ?? null, render: (c) => <span className="text-[13px] whitespace-nowrap text-muted">{c.lastPostAt ? ago(c.lastPostAt) : "—"}</span> },
    {
      key: "contact",
      header: "Contact",
      render: (c) =>
        c.emails?.length ? (
          <a href={`mailto:${c.emails[0]}`} className="inline-flex max-w-48 items-center gap-1 font-mono text-xs text-accent-text hover:underline">
            <Mail className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{c.emails[0]}</span>
          </a>
        ) : c.hasBusinessEmail ? (
          <span className="text-xs text-muted" title="YouTube shows this channel's business email after a CAPTCHA, on its About tab">on YouTube</span>
        ) : (
          <span className="text-faint">{c.analysed ? "none listed" : "—"}</span>
        ),
    },
  ];
}

/** Creator rows as a spreadsheet wants them. */
export const creatorCsv = (rows: Creator[]) =>
  rows.map((c) => ({
    platform: PLATFORMS[c.platform],
    name: c.name,
    handle: c.handle,
    url: c.url,
    followers: c.followers,
    avg_views: c.avgViews,
    engagement_pct: c.engagementRate,
    posts_per_week: c.postsPerWeek,
    last_post: c.lastPostAt?.slice(0, 10),
    country: c.country,
    emails: c.emails?.join("; "),
    links: c.links?.join("; "),
    bio: c.bio,
  }));

const PAGE_OPTIONS = [1, 2, 3] as const;

/**
 * The influencer finder: a niche keyword on one platform, ranked creators, free filters, then
 * an analysis of the ones worth a closer look and saving to a project. Everything it shows is in
 * its URL (?platform=tiktok&q=espresso&pages=2&rules=…).
 */
export function InfluencerFinder({ project }: { project: Project }) {
  const params = useSearchParams();
  const nav = useToolNav();
  const market = useMarket(project);
  const changeMarket = useChangeMarket();
  const platform = (PLATFORM_IDS as string[]).includes(params.get("platform") ?? "") ? (params.get("platform") as Platform) : "youtube";
  const query = params.get("q")?.trim() ?? "";
  const pages = Math.min(3, Math.max(1, Number(params.get("pages")) || 1));
  const rules = useMemo(() => rulesFromParam(params.get("rules")), [params]);
  const [showFilters, setShowFilters] = useState(rules.rules.length > 0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const discovery = useLookupQuery<Discovery>(project.id, "find_creators", query ? { platform, query, pages, country: market.country, language: market.language } : null);
  const analyse = useLookup<{ creators: Creator[]; failed: { handle: string; error: string }[] }>(project.id, "analyse_creators");
  const [analysed, setAnalysed] = useState<Map<string, Creator>>(new Map());

  const rows = useMemo(() => {
    const found = discovery.data?.creators ?? [];
    // Analysed numbers replace the search ones; discovery keeps its "matched" counts.
    const merged = found.map((c) => {
      const full = analysed.get(creatorKey(c)) ?? analysed.get(`${c.platform}:${c.handle.toLowerCase()}`);
      return full ? { ...c, ...full, id: c.id, matchedPosts: c.matchedPosts, matchedViews: c.matchedViews } : c;
    });
    return filterRecords(merged, rules, CREATOR_FIELDS);
  }, [discovery.data, analysed, rules]);

  const chosen = rows.filter((c) => selected.has(creatorKey(c)));

  async function runAnalysis(list: Creator[]) {
    const handles = list.slice(0, 25).map((c) => (c.platform === "youtube" ? c.id : c.handle));
    const result = await analyse.runAsync({ platform, handles }).catch(() => null);
    if (!result) return;
    setAnalysed((previous) => {
      const next = new Map(previous);
      // Keyed both ways: TikTok and Instagram search rows may carry the handle where the analysis has the numeric ID.
      for (const c of result.data.creators) {
        next.set(creatorKey(c), c);
        next.set(`${c.platform}:${c.handle.toLowerCase()}`, c);
      }
      return next;
    });
  }

  const setRules = (group: RuleGroup) => nav({ rules: rulesToParam(group) }, { replace: true });

  return (
    <>
      <SearchBar
        value={query}
        onSearch={(q) => nav({ q, rules: params.get("rules") })}
        label="Niche or topic"
        icon={Search}
        placeholder="A niche or topic, e.g. home espresso, budget travel, indie games"
        market={market}
        onMarket={changeMarket}
        button="Find creators"
        pending={discovery.loading}
      >
        <Segmented label="Platform" value={platform} onChange={(value) => nav({ platform: value })} options={PLATFORM_IDS.map((id) => ({ id, label: PLATFORMS[id] }))} />
        <Segmented label="Pages" value={String(pages)} onChange={(value) => nav({ pages: value === "1" ? null : value })} options={PAGE_OPTIONS.map((n) => ({ id: String(n), label: n === 1 ? "1 page" : `${n} pages` }))} />
      </SearchBar>

      {!query && (
        <RunPrompt title="Find creators by niche">
          Type the words your audience searches for. Creators who keep coming up for them rank first, and you can analyse the ones worth a look for their real views, engagement and contacts.
        </RunPrompt>
      )}
      <ViewErrors lookups={[discovery]} />
      {discovery.data && (
        <Card>
          <CardHeader
            title={`${rows.length} creators on ${PLATFORMS[platform]}`}
            description={<ViewMeta lookups={[discovery]} label={`“${discovery.data.query}”`} />}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={showFilters ? "secondary" : "ghost"} onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
                  <SlidersHorizontal className="size-3.5" aria-hidden /> Filters{rules.rules.length ? ` (${rules.rules.length})` : ""}
                </Button>
                <Button size="sm" variant="primary" loading={analyse.isPending} disabled={!chosen.length && !rows.length} onClick={() => void runAnalysis(chosen.length ? chosen : rows.slice(0, 10))}>
                  <Sparkles className="size-3.5" aria-hidden /> {chosen.length ? `Analyse ${Math.min(chosen.length, 25)}` : "Analyse top 10"}
                </Button>
                <SaveToProject scopeId={project.id} kind="creators" rows={() => (chosen.length ? chosen : rows)} label={chosen.length ? `Save ${chosen.length}` : "Save all"} />
                <ExportButton filename={`creators-${platform}-${query}.csv`} rows={() => creatorCsv(chosen.length ? chosen : rows)} />
              </div>
            }
          />
          {discovery.data.notes.map((note) => (
            <p key={note} className="border-b border-line px-4 py-2 text-[13px] text-muted">
              {note}
            </p>
          ))}
          {showFilters && (
            <div className="border-b border-line px-4 py-3">
              <RulesBuilder value={rules} onChange={setRules} fields={CREATOR_FIELDS} />
              <p className="mt-2 text-xs text-muted">Average views, engagement, posting and contacts are known once a creator is analysed. Filters cost nothing.</p>
            </div>
          )}
          {analyse.error && (
            <div className="px-4 pt-3">
              <ErrorNote error={analyse.error} />
            </div>
          )}
          {analyse.data?.failed.length ? <p className="px-4 pt-3 text-[13px] text-warn">Could not analyse: {analyse.data.failed.map((f) => f.handle).join(", ")}</p> : null}
          <DataTable
            rows={rows}
            columns={creatorColumns({ discovery: true })}
            rowKey={creatorKey}
            caption={`Creators on ${PLATFORMS[platform]} for ${query}`}
            selection={{ selected, onChange: setSelected, label: (c) => c.handle }}
            empty="No creators match. Loosen the filters or try another word."
          />
        </Card>
      )}
    </>
  );
}

/** One creator in full: audience, averages, contacts and recent posts. */
export function CreatorProfile({ project }: { project: Project }) {
  const params = useSearchParams();
  const nav = useToolNav();
  const platform = (PLATFORM_IDS as string[]).includes(params.get("platform") ?? "") ? (params.get("platform") as Platform) : "youtube";
  const handle = params.get("handle")?.trim() ?? "";
  const profile = useLookupQuery<Creator>(project.id, "analyse_creator", handle ? { platform, handle } : null);
  const c = profile.data;

  return (
    <>
      <SearchBar value={handle} onSearch={(h) => nav({ handle: h })} label="Handle or profile link" placeholder="@handle, profile link or YouTube channel ID" button="Analyse" pending={profile.loading}>
        <Segmented label="Platform" value={platform} onChange={(value) => nav({ platform: value })} options={PLATFORM_IDS.map((id) => ({ id, label: PLATFORMS[id] }))} />
      </SearchBar>
      {!handle && <RunPrompt title="Analyse a creator">Paste a handle or a profile link to see their real reach: average views, engagement, how often they post, and how to reach them.</RunPrompt>}
      <ViewErrors lookups={[profile]} />
      {c && (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar src={c.avatar} name={c.name ?? c.handle} size={64} />
                <div className="min-w-0">
                  <h1 className="flex items-center gap-1.5 font-display text-2xl font-semibold tracking-tight">
                    <span className="truncate">{c.name || c.handle}</span>
                    {c.verified && <BadgeCheck className="size-5 shrink-0 text-accent-text" aria-label="Verified" />}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <PlatformMark platform={c.platform} /> {PLATFORMS[c.platform]}
                    </span>
                    <OutLink href={c.url} className="font-mono text-xs">
                      {c.handle}
                    </OutLink>
                    {c.country && <span>{c.country}</span>}
                    {c.category && <span>{c.category}</span>}
                    {creatorTier(c.followers) && <span>{creatorTier(c.followers)} creator</span>}
                  </div>
                </div>
              </div>
              <SaveToProject scopeId={project.id} kind="creators" rows={() => [c]} label="Save creator" />
            </div>
            {c.bio && <p className="mt-4 max-w-3xl text-sm whitespace-pre-line text-muted">{c.bio}</p>}
            <ViewMeta lookups={[profile]} />
          </Card>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label={c.platform === "youtube" ? "Subscribers" : "Followers"} value={compact(c.followers)} sub={c.posts != null ? `${compact(c.posts)} posts` : undefined} />
            <Stat label="Avg views" value={compact(c.avgViews)} sub={c.recent?.length ? `last ${c.recent.length} posts` : undefined} />
            <Stat label="Engagement" value={c.engagementRate == null ? "—" : `${c.engagementRate}%`} sub={c.platform === "youtube" ? "views per subscriber" : "likes and comments per follower"} />
            <Stat label="Posts per week" value={c.postsPerWeek ?? "—"} />
            <Stat label="Last post" value={c.lastPostAt ? ago(c.lastPostAt) : "—"} sub={c.lastPostAt ? dateOnly(c.lastPostAt) : undefined} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <Card>
              <CardHeader title="Contact" description="What the creator publishes: their bio and links." />
              <div className="space-y-3 px-4 py-3 text-[13px]">
                {c.emails?.length ? (
                  c.emails.map((email) => (
                    <a key={email} href={`mailto:${email}`} className="flex items-center gap-2 font-mono text-accent-text hover:underline">
                      <Mail className="size-3.5" aria-hidden /> {email}
                    </a>
                  ))
                ) : (
                  <p className="text-muted">No email in the bio.</p>
                )}
                {c.hasBusinessEmail && <p className="text-muted">This channel lists a business email on its YouTube About tab (YouTube shows it after a CAPTCHA).</p>}
                {c.phones?.map((phone) => (
                  <p key={phone} className="font-mono">
                    {phone}
                  </p>
                ))}
                {c.links?.length ? (
                  <ul className="space-y-1">
                    {c.links.map((link) => (
                      <li key={link}>
                        <OutLink href={/^https?:/.test(link) ? link : `https://${link}`} className="max-w-full font-mono text-xs text-muted">
                          {link.replace(/^https?:\/\//, "")}
                        </OutLink>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Card>
            <Card>
              <CardHeader title="Recent posts" />
              <DataTable
                rows={c.recent ?? []}
                rowKey={(p) => p.id || p.url}
                caption="Recent posts"
                empty="No recent posts."
                columns={[
                  { key: "title", header: "Post", rowHeader: true, render: (p) => <OutLink href={p.url} className="max-w-96 text-[13px]">{p.title || "Untitled"}</OutLink> },
                  { key: "views", header: "Views", align: "right", sortValue: (p) => p.views, render: (p) => <Count value={p.views} /> },
                  { key: "likes", header: "Likes", align: "right", sortValue: (p) => p.likes, render: (p) => <Count value={p.likes} /> },
                  { key: "comments", header: "Comments", align: "right", sortValue: (p) => p.comments, render: (p) => <Count value={p.comments} /> },
                  { key: "date", header: "Posted", sortValue: (p) => p.publishedAt, render: (p) => <span className={cx("whitespace-nowrap text-muted")}>{ago(p.publishedAt)}</span> },
                ]}
              />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
