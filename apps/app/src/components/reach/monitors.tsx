"use client";

import { DEFAULT_CONVERSATION_SOURCES, DEFAULT_MENTION_SOURCES, type MentionStatus, SOURCES } from "@openreach/shared";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Pause, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Check, ConfirmDialog, Group, isActive, type RunStatus, RunProgress, SCHEDULES, type Schedule, Segmented, StatusBadge, useRunPoll } from "@/components/kit";
import { ExportButton } from "@/components/research/lookup-ui";
import { Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Select, Spinner } from "@/components/ui";
import { api, dateTime, num } from "@/lib/api";
import type { Project } from "@/lib/hooks";
import { ago } from "./bits";
import { type FeedItem, mentionCsv, MentionRow, SourcePicker, StatusActions } from "./mentions";

type Kind = "brand" | "topic";

type Run = { id: string; status: RunStatus; searchesTotal: number; searchesDone: number; found: number; added: number; warnings: string[]; error: string | null; createdAt: string; finishedAt: string | null };

export type Monitor = {
  id: string;
  kind: Kind;
  name: string;
  terms: string[];
  excludes: string[];
  competitors: string[];
  sources: string[];
  depth: number;
  aiScoring: boolean;
  schedule: Schedule;
  active: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  estimate: { searches: number; googleSearches: number; freeSearches: number };
  mentions: { total: number; unread: number };
  lastRun: Run | null;
};

const COPY: Record<Kind, { noun: string; plural: string; termsLabel: string; termsHint: string; placeholder: string }> = {
  brand: {
    noun: "brand monitor",
    plural: "mentions",
    termsLabel: "Brand names",
    termsHint: "Your product's name, domain and common spellings. A page must contain one of them.",
    placeholder: "Acme, acme.io",
  },
  topic: {
    noun: "conversation monitor",
    plural: "conversations",
    termsLabel: "Problems your product solves",
    termsHint: "In a buyer's words. Each is searched with request phrasings: “best …”, “looking for …”, “alternative to …”.",
    placeholder: "crm for small business, track sales leads",
  },
};

const split = (text: string) => [...new Set(text.split(",").map((t) => t.trim()).filter(Boolean))];
const SCHEDULE_LABELS: Record<Schedule, string> = { manual: "Manual", daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

function NewMonitor({ project, kind, onDone }: { project: Project; kind: Kind; onDone: () => void }) {
  const copy = COPY[kind];
  const queryClient = useQueryClient();
  const [terms, setTerms] = useState(kind === "brand" ? [project.name, project.domain].filter(Boolean).join(", ") : (project.keywords ?? []).slice(0, 2).join(", "));
  const [excludes, setExcludes] = useState("");
  const [competitors, setCompetitors] = useState((project.competitors ?? []).slice(0, 5).join(", "));
  const [sources, setSources] = useState<string[]>(kind === "brand" ? DEFAULT_MENTION_SOURCES : DEFAULT_CONVERSATION_SOURCES);
  const [schedule, setSchedule] = useState<Schedule>(kind === "brand" ? "daily" : "weekly");
  const [aiScoring, setAiScoring] = useState(kind === "topic");
  const [showSources, setShowSources] = useState(false);
  const create = useMutation({
    mutationFn: () =>
      api<Monitor>(`/projects/${project.id}/monitors`, {
        method: "POST",
        query: { run: 1 },
        body: { kind, terms: split(terms).slice(0, 5), excludes: split(excludes), competitors: kind === "topic" ? split(competitors).slice(0, 5) : [], sources, schedule, aiScoring },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["monitors", project.id] });
      onDone();
    },
  });
  return (
    <Card className="mb-6">
      <CardHeader title={`New ${copy.noun}`} description="The first run starts now and looks back a few weeks. After that, each run only reads pages that are new since the last." />
      <form
        className="grid gap-4 p-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (split(terms).length && sources.length) create.mutate();
        }}
      >
        <Field label={copy.termsLabel} hint={copy.termsHint}>
          <Input value={terms} onChange={(event) => setTerms(event.target.value)} placeholder={copy.placeholder} required />
        </Field>
        {kind === "topic" ? (
          <Field label="Competitors" hint="People unhappy with them are warm leads. Optional.">
            <Input value={competitors} onChange={(event) => setCompetitors(event.target.value)} placeholder="HubSpot, Pipedrive" />
          </Field>
        ) : (
          <Field label="Leave out pages with" hint="For namesakes and noise, e.g. jobs, hiring. Optional.">
            <Input value={excludes} onChange={(event) => setExcludes(event.target.value)} placeholder="jobs, hiring" />
          </Field>
        )}
        <Group label="Schedule">
          <Segmented label="Schedule" value={schedule} onChange={setSchedule} options={SCHEDULES.map((s) => ({ id: s, label: SCHEDULE_LABELS[s] }))} />
        </Group>
        <div className="space-y-2">
          <Check checked={aiScoring} onChange={setAiScoring}>
            AI check: keep only results that are really {kind === "brand" ? "about your brand" : "people asking for help"}, and explain each in a line
          </Check>
        </div>
        <div className="lg:col-span-2">
          <Button size="sm" variant="ghost" onClick={() => setShowSources(!showSources)} aria-expanded={showSources}>
            {sources.length} of {SOURCES.length} sources
          </Button>
          {showSources && (
            <div className="mt-3">
              <SourcePicker value={sources} onChange={setSources} />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
          <Button type="submit" variant="primary" loading={create.isPending} disabled={!split(terms).length || !sources.length}>
            Create and run
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <ErrorNote error={create.error} />
        </div>
      </form>
    </Card>
  );
}

function RunningMonitor({ monitor, onDone }: { monitor: Monitor; onDone: () => void }) {
  const run = monitor.lastRun!;
  const poll = useRunPoll<Run>(["monitor-run", run.id], `/monitor-runs/${run.id}`, onDone, true);
  const current = poll.data ?? run;
  const cancel = useMutation({ mutationFn: () => api(`/monitor-runs/${run.id}/cancel`, { method: "POST" }) });
  return <RunProgress title={`${monitor.name}: searching`} status={current.status} done={current.searchesDone} total={current.searchesTotal} unit="searches" onCancel={() => cancel.mutate()} cancelling={cancel.isPending} cancelError={cancel.error} />;
}

function MonitorCard({ monitor, project, onChanged }: { monitor: Monitor; project: Project; onChanged: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const run = useMutation({ mutationFn: () => api(`/monitors/${monitor.id}/runs`, { method: "POST" }), onSuccess: onChanged });
  const toggle = useMutation({ mutationFn: () => api(`/monitors/${monitor.id}`, { method: "PATCH", body: { active: !monitor.active } }), onSuccess: onChanged });
  const remove = useMutation({ mutationFn: () => api(`/monitors/${monitor.id}`, { method: "DELETE" }), onSuccess: onChanged });
  const last = monitor.lastRun;
  return (
    <li className="border-b border-line px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {monitor.name}
            {!monitor.active && <span className="ml-2 font-mono text-[11px] uppercase text-faint">paused</span>}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {monitor.sources.length} sources · {monitor.active ? SCHEDULE_LABELS[monitor.schedule].toLowerCase() : "paused"}
            {monitor.aiScoring ? " · AI check" : ""} · {num(monitor.mentions.total)} found, {num(monitor.mentions.unread)} new
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-xs text-faint">
            {last ? (
              <>
                <StatusBadge status={last.status} /> {ago(last.createdAt)}, {last.added} added
                {last.error && <span className="text-warn">{last.error}</span>}
              </>
            ) : (
              "Not run yet"
            )}
            {monitor.active && monitor.nextRunAt && <span>· next {dateTime(monitor.nextRunAt)}</span>}
          </p>
          {last?.warnings.length ? <p className="mt-1 text-xs text-warn">{last.warnings[0]}</p> : null}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => run.mutate()} loading={run.isPending} disabled={isActive(last?.status)}>
            <Play className="size-3.5" aria-hidden /> Run now
          </Button>
          <Button size="sm" variant="ghost" onClick={() => toggle.mutate()} loading={toggle.isPending} title={monitor.active ? "Pause the schedule" : "Resume the schedule"}>
            <Pause className="size-3.5" aria-hidden /> {monitor.active ? "Pause" : "Resume"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} aria-label={`Delete ${monitor.name}`}>
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
      <ErrorNote error={run.error ?? toggle.error} />
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => remove.mutate()} title={`Delete “${monitor.name}”?`} confirmLabel="Delete" danger pending={remove.isPending} error={remove.error}>
        Everything it found in {project.name} goes with it.
      </ConfirmDialog>
    </li>
  );
}

type FeedRow = FeedItem & { id: string; status: MentionStatus; monitorId: string };

/** A project's monitors of one kind, and the feed of what they found. */
export function MonitorsView({ project, kind }: { project: Project; kind: Kind }) {
  const copy = COPY[kind];
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string>("open");
  const [source, setSource] = useState("");
  const [monitorId, setMonitorId] = useState("");
  const [minIntent, setMinIntent] = useState(kind === "topic" ? "40" : "");
  const [sort, setSort] = useState<"newest" | "intent">(kind === "topic" ? "intent" : "newest");

  const monitors = useQuery({ queryKey: ["monitors", project.id, kind], queryFn: () => api<Monitor[]>(`/projects/${project.id}/monitors`, { query: { kind } }) });
  const feed = useQuery({
    queryKey: ["mentions", project.id, kind, status, source, monitorId, minIntent, sort],
    queryFn: () => api<{ total: number; mentions: FeedRow[] }>(`/projects/${project.id}/mentions`, { query: { kind, status: status || undefined, source: source || undefined, monitorId: monitorId || undefined, minIntent: minIntent || undefined, sort, limit: 200 } }),
    placeholderData: keepPreviousData,
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["monitors", project.id] });
    void queryClient.invalidateQueries({ queryKey: ["mentions", project.id] });
  };
  const setMentionStatus = useMutation({
    mutationFn: ({ ids, status: next }: { ids: string[]; status: MentionStatus }) => api(`/projects/${project.id}/mentions/status`, { method: "POST", body: { ids, status: next } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["mentions", project.id] }),
  });

  const list = monitors.data ?? [];
  const running = list.filter((m) => isActive(m.lastRun?.status));
  const rows = feed.data?.mentions ?? [];
  const unread = rows.filter((m) => m.status === "new");
  const usedSources = [...new Set(list.flatMap((m) => m.sources))];

  return (
    <>
      {creating ? (
        <NewMonitor project={project} kind={kind} onDone={() => setCreating(false)} />
      ) : list.length > 0 ? (
        <div className="mb-5">
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden /> New {copy.noun}
          </Button>
        </div>
      ) : null}
      {monitors.isPending && <Spinner />}
      <ErrorNote error={monitors.error} />
      {monitors.data && list.length === 0 && !creating && (
        <EmptyState title={kind === "brand" ? "Know when people talk about you" : "Hear when people ask for what you sell"} action={<Button variant="primary" onClick={() => setCreating(true)}>Create a {copy.noun}</Button>}>
          {kind === "brand"
            ? "A brand monitor searches Reddit, Hacker News, GitHub, Stack Overflow, Quora, X, LinkedIn, Product Hunt and review sites for your name on a schedule, and lists what's new here."
            : "A conversation monitor looks for threads where people ask for recommendations or alternatives in your space, scores how ready they are to buy, and lists them here."}
        </EmptyState>
      )}
      {running.map((m) => (
        <RunningMonitor key={m.lastRun!.id} monitor={m} onDone={refresh} />
      ))}

      {list.length > 0 && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader
              title={`${num(feed.data?.total ?? 0)} ${copy.plural}`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status" className="h-8 w-32 text-[13px]">
                    <option value="open">To review</option>
                    <option value="new">New</option>
                    <option value="replied">Replied</option>
                    <option value="ignored">Ignored</option>
                    <option value="">All</option>
                  </Select>
                  {list.length > 1 && (
                    <Select value={monitorId} onChange={(event) => setMonitorId(event.target.value)} aria-label="Monitor" className="h-8 w-40 text-[13px]">
                      <option value="">All monitors</option>
                      {list.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </Select>
                  )}
                  <Select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Source" className="h-8 w-40 text-[13px]">
                    <option value="">All sources</option>
                    {SOURCES.filter((s) => usedSources.includes(s.id)).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                  {kind === "topic" && (
                    <Select value={minIntent} onChange={(event) => setMinIntent(event.target.value)} aria-label="Minimum intent" className="h-8 w-36 text-[13px]">
                      <option value="">Any intent</option>
                      <option value="40">Intent 40+</option>
                      <option value="60">Intent 60+</option>
                      <option value="80">Intent 80+</option>
                    </Select>
                  )}
                  <Segmented label="Sort" value={sort} onChange={setSort} options={[{ id: "newest", label: "Newest" }, { id: "intent", label: "Intent" }]} />
                  {unread.length > 0 && (
                    <Button size="sm" variant="ghost" onClick={() => setMentionStatus.mutate({ ids: unread.map((m) => m.id), status: "read" })} loading={setMentionStatus.isPending}>
                      <CheckCheck className="size-3.5" aria-hidden /> Mark {unread.length} read
                    </Button>
                  )}
                  <ExportButton filename={`${project.name}-${copy.plural}.csv`} rows={() => mentionCsv(rows)} />
                </div>
              }
            />
            <ErrorNote error={feed.error ?? setMentionStatus.error} />
            {rows.length ? (
              <ul>
                {rows.map((item) => (
                  <MentionRow key={item.id} item={item} showIntent={kind === "topic"} actions={<StatusActions item={item} onStatus={(next) => setMentionStatus.mutate({ ids: [item.id], status: next })} />} />
                ))}
              </ul>
            ) : (
              <p className="px-4 py-10 text-center text-sm text-muted">{feed.isPending ? "Loading…" : "Nothing to review here. New finds appear after each run."}</p>
            )}
          </Card>
          <Card className="self-start">
            <CardHeader title="Monitors" />
            <ul>
              {list.map((m) => (
                <MonitorCard key={m.id} monitor={m} project={project} onChanged={refresh} />
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
