"use client";

import { DEFAULT_CONVERSATION_SOURCES, DEFAULT_MENTION_SOURCES, type Mention, type MentionStatus, SOURCE_GROUPS, type SourceGroup, sourceById, SOURCES } from "@openreach/shared";
import { useQuery } from "@tanstack/react-query";
import { Check, EyeOff, Hash, MessageSquare, Search, Sparkles, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { Segmented } from "@/components/kit";
import { DataTable } from "@/components/research/data-table";
import { ExportButton, RunPrompt, ViewErrors, ViewMeta } from "@/components/research/lookup-ui";
import { SearchBar, useToolNav, useUrlText } from "@/components/research/search-bar";
import { Button, Card, CardHeader, cx, Input } from "@/components/ui";
import { api } from "@/lib/api";
import type { Project } from "@/lib/hooks";
import { useLookupQuery } from "@/lib/lookup";
import { ago, OutLink } from "./bits";

export type Community = { community: string; sourceId: string; threads: number; comments: number; newest: string | null; avgIntent: number; examples: { title: string; url: string }[] };
export type FeedItem = Mention & { id?: string; status?: MentionStatus; aiNote?: string | null };

const list = (value: string | null) =>
  (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

export function IntentMeter({ value }: { value: number }) {
  const level = value >= 70 ? "high" : value >= 40 ? "medium" : "low";
  return (
    <span className="inline-flex items-center gap-1.5" title={`Buying or help-seeking intent ${value} of 100`}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-sunken">
        <span className={cx("block h-full rounded-full", level === "high" ? "bg-accent" : level === "medium" ? "bg-accent/60" : "bg-other")} style={{ width: `${value}%` }} />
      </span>
      <span className="font-mono text-xs tabular">{value}</span>
      <span className="sr-only">({level} intent)</span>
    </span>
  );
}

export function SentimentWord({ value }: { value: Mention["sentiment"] }) {
  if (value === "neutral") return null;
  return <span className={cx("font-mono text-[11px] uppercase tracking-wide", value === "positive" ? "text-pos" : "text-neg")}>{value}</span>;
}

/** One page in the feed: where, who, how old, how much it invites a reply, and why. */
export function MentionRow({ item, showIntent, actions }: { item: FeedItem; showIntent?: boolean; actions?: ReactNode }) {
  const source = sourceById.get(item.sourceId);
  return (
    <li className={cx("border-b border-line px-4 py-3 last:border-b-0", item.status === "ignored" && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="font-medium text-ink">{source?.name ?? item.sourceId}</span>
            {item.community && item.community !== source?.name && <span>{item.community}</span>}
            {item.author && <span>by {item.author}</span>}
            <span>{ago(item.publishedAt)}</span>
            {item.comments != null && (
              <span className="inline-flex items-center gap-0.5">
                <MessageSquare className="size-3" aria-hidden /> {item.comments}
              </span>
            )}
            <SentimentWord value={item.sentiment} />
            {item.status === "new" && <span className="rounded-sm bg-accent-soft px-1 font-mono text-[10px] uppercase text-accent-text">new</span>}
          </div>
          <OutLink href={item.url} className="text-[14px] font-medium text-ink">
            {item.title}
          </OutLink>
          {item.snippet && <p className="mt-1 line-clamp-2 max-w-4xl text-[13px] text-muted">{item.snippet}</p>}
          {(item.aiNote || item.signals.length > 0) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-faint">
              {item.aiNote && (
                <span className="inline-flex items-center gap-1 text-muted">
                  <Sparkles className="size-3" aria-hidden /> {item.aiNote}
                </span>
              )}
              {!item.aiNote && item.signals.map((signal) => <span key={signal}>· {signal}</span>)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {showIntent && <IntentMeter value={item.intent} />}
          {actions}
        </div>
      </div>
    </li>
  );
}

export function StatusActions({ item, onStatus }: { item: FeedItem; onStatus: (status: MentionStatus) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant={item.status === "replied" ? "secondary" : "ghost"} onClick={() => onStatus(item.status === "replied" ? "read" : "replied")} aria-pressed={item.status === "replied"} title="Mark as replied">
        <Check className="size-3.5" aria-hidden /> Replied
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onStatus(item.status === "ignored" ? "read" : "ignored")} aria-pressed={item.status === "ignored"} title={item.status === "ignored" ? "Bring back" : "Ignore"}>
        <EyeOff className="size-3.5" aria-hidden /> {item.status === "ignored" ? "Restore" : "Ignore"}
      </Button>
    </div>
  );
}

export function CommunityTable({ rows, empty = "No communities yet." }: { rows: Community[]; empty?: string }) {
  return (
    <DataTable
      rows={rows}
      rowKey={(c) => `${c.sourceId}:${c.community}`}
      caption="Communities"
      initialSort={{ key: "threads", order: "desc" }}
      empty={empty}
      columns={[
        {
          key: "community",
          header: "Community",
          rowHeader: true,
          sortValue: (c) => c.community.toLowerCase(),
          render: (c) => {
            const reddit = c.community.match(/^r\/(\w+)$/);
            return (
              <div className="min-w-48">
                {reddit ? (
                  <OutLink href={`https://www.reddit.com/${c.community}/`} className="font-medium">
                    {c.community}
                  </OutLink>
                ) : (
                  <span className="font-medium">{c.community}</span>
                )}
                <p className="text-xs text-muted">{sourceById.get(c.sourceId)?.name ?? c.sourceId}</p>
              </div>
            );
          },
        },
        { key: "threads", header: "Threads", align: "right", sortValue: (c) => c.threads, render: (c) => c.threads, title: "Matching threads found" },
        { key: "comments", header: "Replies", align: "right", sortValue: (c) => c.comments, render: (c) => c.comments || "—", title: "Replies on those threads" },
        { key: "intent", header: "Intent", sortValue: (c) => c.avgIntent, render: (c) => <IntentMeter value={c.avgIntent} />, title: "Average intent of the threads" },
        { key: "newest", header: "Newest", sortValue: (c) => c.newest, render: (c) => <span className="whitespace-nowrap text-muted">{ago(c.newest)}</span> },
        {
          key: "examples",
          header: "Example threads",
          render: (c) => (
            <ul className="max-w-md space-y-0.5">
              {c.examples.slice(0, 2).map((e) => (
                <li key={e.url}>
                  <OutLink href={e.url} className="max-w-md text-xs text-muted">
                    {e.title}
                  </OutLink>
                </li>
              ))}
            </ul>
          ),
        },
      ]}
    />
  );
}

type SourceInfo = { id: string; via: "api" | "google" };

/** Every source in groups, with the free ones marked. The selection is a list of source IDs. */
export function SourcePicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const info = useQuery({ queryKey: ["sources"], queryFn: () => api<{ sources: SourceInfo[] }>("/sources"), staleTime: Infinity });
  const via = new Map(info.data?.sources.map((s) => [s.id, s.via]));
  const chosen = new Set(value);
  const toggle = (id: string) => onChange(chosen.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(SOURCE_GROUPS) as SourceGroup[]).map((group) => {
        const sources = SOURCES.filter((s) => s.group === group);
        const all = sources.every((s) => chosen.has(s.id));
        return (
          <fieldset key={group}>
            <legend className="mb-1.5 flex w-full items-center justify-between font-mono text-[11px] uppercase tracking-wide text-muted">
              {SOURCE_GROUPS[group]}
              <button type="button" className="normal-case tracking-normal text-accent-text hover:underline" onClick={() => onChange(all ? value.filter((id) => !sources.some((s) => s.id === id)) : [...new Set([...value, ...sources.map((s) => s.id)])])}>
                {all ? "none" : "all"}
              </button>
            </legend>
            <div className="space-y-1">
              {sources.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" className="size-3.5 accent-(--color-accent)" checked={chosen.has(s.id)} onChange={() => toggle(s.id)} />
                  <span>{s.name}</span>
                  {via.get(s.id) === "api" && <span className="font-mono text-[10px] uppercase text-pos" title="Searched through its free official API">free</span>}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

export const mentionCsv = (rows: FeedItem[]) =>
  rows.map((m) => ({
    source: sourceById.get(m.sourceId)?.name ?? m.sourceId,
    community: m.community,
    title: m.title,
    url: m.url,
    snippet: m.snippet,
    author: m.author,
    published: m.publishedAt?.slice(0, 10),
    replies: m.comments,
    intent: m.intent,
    sentiment: m.sentiment,
    status: m.status,
  }));

const DAYS = [
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "365", label: "1 year" },
] as const;

/** Shared settings row of the community tools: sources and period, kept in the URL. */
function SearchSettings({ defaults, extra }: { defaults: string[]; extra?: ReactNode }) {
  const params = useSearchParams();
  const nav = useToolNav();
  const [open, setOpen] = useState(false);
  const sources = params.get("sources") ? list(params.get("sources")) : defaults;
  return (
    <>
      <Segmented label="Period" value={(DAYS.find((d) => d.id === params.get("days"))?.id ?? "90") as "90"} onChange={(value) => nav({ days: value === "90" ? null : value })} options={DAYS.map((d) => ({ ...d }))} />
      {extra}
      <Button size="sm" variant="ghost" onClick={() => setOpen(!open)} aria-expanded={open}>
        <Hash className="size-3.5" aria-hidden /> {sources.length} sources
      </Button>
      {open && (
        <div className="w-full border-t border-line pt-3">
          <SourcePicker value={sources} onChange={(ids) => nav({ sources: ids.sort().join(",") === [...defaults].sort().join(",") ? null : ids.join(",") }, { replace: true })} />
        </div>
      )}
    </>
  );
}

type SearchResult = { mentions: FeedItem[]; communities: Community[]; warnings: string[] };

function Results({ data, lookup, title, showIntent }: { data: SearchResult; lookup: Parameters<typeof ViewMeta>[0]["lookups"][number]; title: string; showIntent?: boolean }) {
  const [filter, setFilter] = useState("");
  const shown = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle ? data.mentions.filter((m) => `${m.title} ${m.snippet} ${m.community}`.toLowerCase().includes(needle)) : data.mentions;
  }, [data.mentions, filter]);
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader
          title={`${data.mentions.length} ${title}`}
          description={<ViewMeta lookups={[lookup]} />}
          action={
            <div className="flex items-center gap-2">
              <Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter" aria-label="Filter results" className="h-8 w-40 text-[13px]" />
              <ExportButton filename={`${title.replaceAll(" ", "-")}.csv`} rows={() => mentionCsv(shown)} />
            </div>
          }
        />
        {data.warnings.map((warning) => (
          <p key={warning} className="border-b border-line px-4 py-2 text-[13px] text-warn">
            {warning}
          </p>
        ))}
        {shown.length ? (
          <ul>
            {shown.map((item) => (
              <MentionRow key={item.url} item={item} showIntent={showIntent} />
            ))}
          </ul>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted">Nothing found in this period. Try more sources, a longer period or other words.</p>
        )}
      </Card>
      <Card className="self-start">
        <CardHeader title="Where it comes from" description="Communities ranked by threads found." />
        <CommunityTable rows={data.communities} />
      </Card>
    </div>
  );
}

const daysOf = (params: URLSearchParams, fallback = 90) => Number(params.get("days")) || fallback;

/** Brand mentions: pages that name the brand, across the chosen communities. */
export function BrandMentions({ project }: { project: Project }) {
  const params = useSearchParams();
  const nav = useToolNav();
  const terms = list(params.get("q"));
  const sources = params.get("sources") ? list(params.get("sources")) : DEFAULT_MENTION_SOURCES;
  const exclude = list(params.get("not"));
  const [excludeText, setExcludeText] = useUrlText(exclude.join(", "));
  const lookup = useLookupQuery<SearchResult>(project.id, "brand_mentions", terms.length ? { terms: terms.slice(0, 5), excludes: exclude, sources, days: daysOf(params) } : null);
  return (
    <>
      <SearchBar
        value={terms.join(", ")}
        onSearch={(q) => nav({ q, not: excludeText.trim() || null })}
        label="Brand names"
        icon={Search}
        placeholder="Your brand, e.g. Acme, acme.io (up to 5, comma separated)"
        button="Find mentions"
        pending={lookup.loading}
        extra={<Input value={excludeText} onChange={(event) => setExcludeText(event.target.value)} placeholder="Leave out words, e.g. jobs" aria-label="Words to leave out" className="h-11 w-full text-[14px] sm:w-52" />}
      >
        <SearchSettings defaults={DEFAULT_MENTION_SOURCES} />
      </SearchBar>
      {!terms.length && (
        <RunPrompt title="Where people talk about your product">
          Reddit, Hacker News, GitHub, Stack Overflow, Quora, X, LinkedIn, Product Hunt, review sites and more. Only pages that actually name your brand are kept.
        </RunPrompt>
      )}
      <ViewErrors lookups={[lookup]} />
      {lookup.data && <Results data={lookup.data} lookup={lookup} title="mentions" />}
    </>
  );
}

/** The customer finder: people asking for what you sell, ranked by intent. */
export function CustomerFinder({ project }: { project: Project }) {
  const params = useSearchParams();
  const nav = useToolNav();
  const problems = list(params.get("q"));
  const competitors = list(params.get("vs"));
  const sources = params.get("sources") ? list(params.get("sources")) : DEFAULT_CONVERSATION_SOURCES;
  const ai = params.get("ai") === "1";
  const [vsText, setVsText] = useUrlText(competitors.join(", "));
  const lookup = useLookupQuery<SearchResult>(project.id, "find_conversations", problems.length ? { problems: problems.slice(0, 3), competitors: competitors.slice(0, 5), sources, days: daysOf(params, 365), aiScoring: ai } : null);
  return (
    <>
      <SearchBar
        value={problems.join(", ")}
        onSearch={(q) => nav({ q, vs: vsText.trim() || null })}
        label="Problems your product solves"
        icon={Users}
        placeholder="The problem in a buyer's words, e.g. crm for small business"
        button="Find people"
        pending={lookup.loading}
        extra={<Input value={vsText} onChange={(event) => setVsText(event.target.value)} placeholder="Competitors, e.g. HubSpot" aria-label="Competitors" className="h-11 w-full text-[14px] sm:w-52" />}
      >
        <SearchSettings
          defaults={DEFAULT_CONVERSATION_SOURCES}
          extra={
            <label className="inline-flex items-center gap-2 text-[13px] text-muted">
              <input type="checkbox" className="size-3.5 accent-(--color-accent)" checked={ai} onChange={(event) => nav({ ai: event.target.checked })} />
              AI check: drop posts that aren't real requests
            </label>
          }
        />
      </SearchBar>
      {!problems.length && (
        <RunPrompt title="People asking for what you sell">
          Threads like “best tool for…”, “looking for…” and “alternative to…” across Reddit, Quora, Hacker News, Stack Overflow, Indie Hackers and more, scored by how ready the person is to buy.
        </RunPrompt>
      )}
      <ViewErrors lookups={[lookup]} />
      {lookup.data && <Results data={lookup.data} lookup={lookup} title="conversations" showIntent />}
    </>
  );
}

type SubredditResult = { subreddits: Community[]; threads: FeedItem[]; warnings: string[] };

/** The subreddit finder: where a topic is discussed most. */
export function SubredditFinder({ project }: { project: Project }) {
  const params = useSearchParams();
  const nav = useToolNav();
  const topics = list(params.get("q"));
  const lookup = useLookupQuery<SubredditResult>(project.id, "find_subreddits", topics.length ? { topics: topics.slice(0, 5) } : null);
  return (
    <>
      <SearchBar value={topics.join(", ")} onSearch={(q) => nav({ q })} label="Topics" icon={Hash} placeholder="Topics your audience discusses, e.g. freelance invoicing, home espresso" button="Find subreddits" pending={lookup.loading} />
      {!topics.length && <RunPrompt title="The best subreddits for your audience">Subreddits ranked by how often your topics come up, how many replies those threads get and how recent they are.</RunPrompt>}
      <ViewErrors lookups={[lookup]} />
      {lookup.data && (
        <div className="space-y-6">
          <Card>
            <CardHeader title={`${lookup.data.subreddits.length} subreddits`} description={<ViewMeta lookups={[lookup]} />} />
            <CommunityTable rows={lookup.data.subreddits} empty="No subreddits found for these topics." />
          </Card>
          <Card>
            <CardHeader title="Threads" description="The discussions behind the ranking." />
            <ul>
              {lookup.data.threads.slice(0, 50).map((item) => (
                <MentionRow key={item.url} item={item} showIntent />
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
