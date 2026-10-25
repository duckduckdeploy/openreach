"use client";

import type { RuleGroup } from "@openreach/shared";
import { describeRules, LEAD_FIELDS } from "@openreach/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Check, ConfirmDialog, Group, isActive, lines, type RunStatus, RunProgress, Segmented, StatusBadge, useRunPoll } from "@/components/kit";
import { Button, Card, CardHeader, ErrorNote, Field, Input, Spinner, Textarea } from "@/components/ui";
import { api, dateTime, num } from "@/lib/api";
import type { Project } from "@/lib/hooks";
import { LeadFilters } from "./leads";

export type LeadSearch = {
  id: string;
  name: string;
  status: RunStatus;
  queries: string[];
  locations: string[];
  mode: "text" | "grid";
  pages: number;
  filters: RuleGroup | null;
  totalCalls: number;
  doneCalls: number;
  found: number;
  matched: number;
  saved: number;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
};

type Draft = {
  queries: string;
  locations: string;
  mode: "text" | "grid";
  latitude: string;
  longitude: string;
  size: string;
  spacingKm: string;
  pages: string;
  rules: RuleGroup;
  autoSave: boolean;
};

const blank = (project: Project): Draft => ({
  queries: (project.keywords ?? []).slice(0, 2).join("\n"),
  locations: "",
  mode: "text",
  latitude: "",
  longitude: "",
  size: "4",
  spacingKm: "3",
  pages: "1",
  rules: { match: "all", rules: [] },
  autoSave: true,
});

function body(draft: Draft) {
  return {
    queries: lines(draft.queries),
    locations: draft.mode === "text" ? lines(draft.locations) : [],
    mode: draft.mode,
    grid: draft.mode === "grid" ? { latitude: Number(draft.latitude), longitude: Number(draft.longitude), size: Number(draft.size), spacingKm: Number(draft.spacingKm) } : undefined,
    pages: Number(draft.pages),
    filters: draft.rules.rules.length ? draft.rules : undefined,
    autoSave: draft.autoSave,
  };
}

/** A new lead search: what to find, where, how deep, and what makes a place a lead. */
function NewSearch({ project, onStarted, onCancel }: { project: Project; onStarted: () => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => blank(project));
  const [confirm, setConfirm] = useState<{ searches: number; maxCalls: number } | null>(null);
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const queryClient = useQueryClient();
  const size = useMutation({
    mutationFn: () => api<{ estimate: { searches: number; maxCalls: number } }>(`/projects/${project.id}/lead-searches`, { method: "POST", body: body(draft), query: { dryRun: 1 } }),
    onSuccess: (data) => setConfirm(data.estimate),
  });
  const start = useMutation({
    mutationFn: () => api(`/projects/${project.id}/lead-searches`, { method: "POST", body: body(draft) }),
    onSuccess: () => {
      setConfirm(null);
      void queryClient.invalidateQueries({ queryKey: ["lead-searches", project.id] });
      onStarted();
    },
  });
  const ready = lines(draft.queries).length > 0 && (draft.mode === "text" || (draft.latitude.trim() !== "" && draft.longitude.trim() !== ""));

  return (
    <Card className="mb-6">
      <CardHeader title="New lead search" description="Runs in the background. Places that pass your filters are added to the lead list as they're found." />
      <form
        className="grid gap-5 p-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) size.mutate();
        }}
      >
        <Field label="What to find" hint="One per line, e.g. plumber, emergency plumber. Up to 20.">
          <Textarea value={draft.queries} onChange={(event) => set({ queries: event.target.value })} rows={4} required />
        </Field>
        <div className="space-y-3">
          <Group label="Where">
            <Segmented
              label="Where"
              value={draft.mode}
              onChange={(mode) => set({ mode })}
              options={[
                { id: "text", label: "A list of places" },
                { id: "grid", label: "Cover a city" },
              ]}
            />
          </Group>
          {draft.mode === "text" ? (
            <Field label="Places" hint="One per line: cities, suburbs or postcodes. Empty searches the query as typed.">
              <Textarea value={draft.locations} onChange={(event) => set({ locations: event.target.value })} rows={4} placeholder={"Austin, TX\nRound Rock, TX"} />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Centre latitude">
                <Input value={draft.latitude} onChange={(event) => set({ latitude: event.target.value })} inputMode="decimal" placeholder="30.2672" />
              </Field>
              <Field label="Centre longitude">
                <Input value={draft.longitude} onChange={(event) => set({ longitude: event.target.value })} inputMode="decimal" placeholder="-97.7431" />
              </Field>
              <Field label="Grid size" hint="Points per side">
                <Input value={draft.size} onChange={(event) => set({ size: event.target.value })} type="number" min={2} max={15} />
              </Field>
              <Field label="Spacing (km)">
                <Input value={draft.spacingKm} onChange={(event) => set({ spacingKm: event.target.value })} type="number" min={0.2} max={20} step={0.1} />
              </Field>
              <p className="col-span-2 text-xs text-muted">One Maps search stops at 60 places. A grid searches from every point, so a whole city is covered: a 4 × 4 grid with 3 km spacing covers about 12 × 12 km.</p>
            </div>
          )}
        </div>
        <Group label="Depth">
          <Segmented label="Pages per search" value={draft.pages as "1"} onChange={(pages) => set({ pages })} options={[1, 2, 3].map((n) => ({ id: String(n) as "1", label: `${n * 20} places` }))} />
        </Group>
        <Check checked={draft.autoSave} onChange={(autoSave) => set({ autoSave })}>
          Add matching places to the lead list as they're found
        </Check>
        <div className="lg:col-span-2">
          <Group label="What makes a place a lead" hint="Every place found is kept with the search; these rules decide which go to the lead list.">
            <LeadFilters rules={draft.rules} onChange={(rules) => set({ rules })} />
          </Group>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
          <Button type="submit" variant="primary" disabled={!ready} loading={size.isPending}>
            Start search
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <ErrorNote error={size.error} />
        </div>
      </form>
      <ConfirmDialog open={confirm !== null} onClose={() => setConfirm(null)} onConfirm={() => start.mutate()} title="Start this lead search?" confirmLabel="Start" pending={start.isPending} error={start.error}>
        {confirm && (
          <p>
            {num(confirm.searches)} Maps searches{confirm.maxCalls > confirm.searches ? `, up to ${num(confirm.maxCalls)} pages in all` : ""}. It runs in the background; you can leave this page and cancel it any time.
          </p>
        )}
        {draft.rules.rules.length > 0 && <p>Leads: places where {describeRules(draft.rules, LEAD_FIELDS)}.</p>}
      </ConfirmDialog>
    </Card>
  );
}

function ActiveSearch({ search, onDone }: { search: LeadSearch; onDone: () => void }) {
  const poll = useRunPoll<LeadSearch>(["lead-search", search.id], `/lead-searches/${search.id}?limit=0`, onDone, true);
  const current = poll.data ?? search;
  const cancel = useMutation({ mutationFn: () => api(`/lead-searches/${search.id}/cancel`, { method: "POST" }) });
  return (
    <RunProgress
      title={`${current.name}: ${num(current.found)} places, ${num(current.matched)} leads`}
      status={current.status}
      done={current.doneCalls}
      total={current.totalCalls}
      unit="searches"
      onCancel={() => cancel.mutate()}
      cancelling={cancel.isPending}
      cancelError={cancel.error}
    />
  );
}

/** A project's lead searches: a form for a new one, the running ones live, and the history. */
export function LeadSearches({ project, onOpen }: { project: Project; onOpen: (searchId: string) => void }) {
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ["lead-searches", project.id], queryFn: () => api<LeadSearch[]>(`/projects/${project.id}/lead-searches`) });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["lead-searches", project.id] });
    void queryClient.invalidateQueries({ queryKey: ["leads", project.id] });
  };
  const active = list.data?.filter((s) => isActive(s.status)) ?? [];
  const past = list.data?.filter((s) => !isActive(s.status)) ?? [];

  return (
    <>
      {creating ? (
        <NewSearch project={project} onStarted={() => setCreating(false)} onCancel={() => setCreating(false)} />
      ) : (
        <div className="mb-5">
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden /> New lead search
          </Button>
        </div>
      )}
      {active.map((search) => (
        <ActiveSearch key={search.id} search={search} onDone={refresh} />
      ))}
      {list.isPending && <Spinner />}
      <ErrorNote error={list.error} />
      {past.length > 0 && (
        <Card>
          <CardHeader title="Past searches" />
          <ul>
            {past.map((search) => (
              <li key={search.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <StatusBadge status={search.status} /> <span className="truncate">{search.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {dateTime(search.createdAt)} · {num(search.found)} places · {num(search.matched)} matched · {num(search.saved)} saved
                    {search.filters?.rules.length ? ` · leads where ${describeRules(search.filters, LEAD_FIELDS)}` : ""}
                  </p>
                  {search.error && <p className="mt-1 text-xs text-warn">{search.error}</p>}
                </div>
                <Button size="sm" onClick={() => onOpen(search.id)}>
                  View leads
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
