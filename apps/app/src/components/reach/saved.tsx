"use client";

import { type Creator, type Lead, PIPELINE, PIPELINE_LABELS, PLATFORM_IDS, PLATFORMS, type PipelineStatus } from "@openreach/shared";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, RefreshCw, StickyNote, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog, SidePanel } from "@/components/kit";
import { type Column, DataTable } from "@/components/research/data-table";
import { ExportButton } from "@/components/research/lookup-ui";
import { Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Select, Spinner, Textarea } from "@/components/ui";
import { api, dateOnly } from "@/lib/api";
import type { Project } from "@/lib/hooks";
import { StatusSelect } from "./bits";
import { creatorColumns, creatorCsv } from "./creators";
import { leadColumns, leadCsv } from "./leads";

type Row<T> = { id: string; status: PipelineStatus; notes: string; tags: string[]; createdAt: string; data: T; emails?: string[] };

const tagList = (text: string) => [...new Set(text.split(",").map((t) => t.trim()).filter(Boolean))];

/** Notes and tags for one saved row, in a side panel. */
function NotesPanel({ row, title, onClose, onSave, saving }: { row: Row<unknown> | null; title: string; onClose: () => void; onSave: (patch: { notes: string; tags: string[] }) => void; saving: boolean }) {
  const [notes, setNotes] = useState(row?.notes ?? "");
  const [tags, setTags] = useState(row?.tags.join(", ") ?? "");
  const [seen, setSeen] = useState(row?.id);
  if (row && seen !== row.id) {
    setSeen(row.id);
    setNotes(row.notes);
    setTags(row.tags.join(", "));
  }
  return (
    <SidePanel open={row !== null} onClose={onClose} title={title} subtitle={row ? `Saved ${dateOnly(row.createdAt)}` : undefined}>
      <Field label="Notes" hint="What you sent, what they said, what's next.">
        <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={8} maxLength={5000} />
      </Field>
      <Field label="Tags" hint="Comma separated, e.g. launch, tier-1">
        <Input value={tags} onChange={(event) => setTags(event.target.value)} />
      </Field>
      <Button variant="primary" loading={saving} onClick={() => onSave({ notes, tags: tagList(tags) })}>
        Save
      </Button>
    </SidePanel>
  );
}

function useSavedList<T>(project: Project, kind: "creators" | "leads", query: Record<string, string | undefined>) {
  const queryClient = useQueryClient();
  const key = [kind, project.id, query];
  const list = useQuery({
    queryKey: key,
    queryFn: () => api<{ total: number } & Record<string, Row<T>[] | number>>(`/projects/${project.id}/${kind}`, { query: { ...query, limit: 1000 } }),
    placeholderData: keepPreviousData,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: [kind, project.id] });
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Pick<Row<T>, "status" | "notes" | "tags">> }) => api(`/projects/${project.id}/${kind}/${id}`, { method: "PATCH", body }),
    onSuccess: refresh,
  });
  const bulk = useMutation({
    mutationFn: (body: { ids: string[]; status?: PipelineStatus; addTags?: string[] }) => api(`/projects/${project.id}/${kind}/bulk`, { method: "POST", body }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (ids: string[]) => api(`/projects/${project.id}/${kind}/delete`, { method: "POST", body: { ids } }),
    onSuccess: refresh,
  });
  const rows = (list.data?.[kind] as Row<T>[] | undefined) ?? [];
  return { list, rows, total: list.data?.total ?? 0, patch, bulk, remove, refresh };
}

function BulkBar({ count, onStatus, onTag, onDelete, pending, children }: { count: number; onStatus: (status: PipelineStatus) => void; onTag: (tags: string[]) => void; onDelete: () => void; pending: boolean; children?: React.ReactNode }) {
  const [tag, setTag] = useState("");
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-accent-soft/40 px-4 py-2 text-[13px]">
      <span className="font-medium">{count} selected</span>
      <Select value="" onChange={(event) => event.target.value && onStatus(event.target.value as PipelineStatus)} aria-label="Set status" className="h-8 w-36 text-[13px]" disabled={pending}>
        <option value="">Set status…</option>
        {PIPELINE.map((status) => (
          <option key={status} value={status}>
            {PIPELINE_LABELS[status]}
          </option>
        ))}
      </Select>
      <form
        className="flex items-center gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          if (tagList(tag).length) onTag(tagList(tag));
          setTag("");
        }}
      >
        <Input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="Add tag" aria-label="Add tag" className="h-8 w-28 text-[13px]" />
      </form>
      {children}
      <Button size="sm" variant="danger" onClick={onDelete}>
        <Trash2 className="size-3.5" aria-hidden /> Remove
      </Button>
    </div>
  );
}

function ListFilters({ status, onStatus, search, onSearch, extra }: { status: string; onStatus: (value: string) => void; search: string; onSearch: (value: string) => void; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search name, notes" aria-label="Search the list" className="h-8 w-48 text-[13px]" />
      <Select value={status} onChange={(event) => onStatus(event.target.value)} aria-label="Status" className="h-8 w-36 text-[13px]">
        <option value="">Any status</option>
        {PIPELINE.map((s) => (
          <option key={s} value={s}>
            {PIPELINE_LABELS[s]}
          </option>
        ))}
      </Select>
      {extra}
    </div>
  );
}

function workColumns<T>(onStatus: (row: Row<T>, status: PipelineStatus) => void, onNotes: (row: Row<T>) => void): Column<Row<T>>[] {
  return [
    { key: "status", header: "Status", sortValue: (r) => PIPELINE.indexOf(r.status), render: (r) => <StatusSelect value={r.status} onChange={(status) => onStatus(r, status)} label="Outreach status" /> },
    {
      key: "notes",
      header: "Notes",
      render: (r) => (
        <button type="button" onClick={() => onNotes(r)} className="flex max-w-56 items-center gap-1.5 text-left text-[13px] text-muted hover:text-ink">
          <StickyNote className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{r.notes || (r.tags.length ? r.tags.map((t) => `#${t}`).join(" ") : "Add notes")}</span>
        </button>
      ),
    },
  ];
}

/** Creators saved to a project, with where outreach stands. */
export function SavedCreators({ project }: { project: Project }) {
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState("");
  const [search, setSearch] = useState("");
  const saved = useSavedList<Creator>(project, "creators", { status: status || undefined, platform: platform || undefined, q: search || undefined });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notesFor, setNotesFor] = useState<Row<Creator> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const analyse = useMutation({
    mutationFn: (ids: string[]) => api<{ analysed: number; failed: { handle: string }[] }>(`/projects/${project.id}/creators/analyse`, { method: "POST", body: { ids } }),
    onSuccess: saved.refresh,
  });

  const ids = [...selected];
  const merged = saved.rows.map((r) => ({ ...r.data, _row: r }));
  const columns: Column<(typeof merged)[number]>[] = [
    ...creatorColumns().map((c) => c as unknown as Column<(typeof merged)[number]>),
    ...workColumns<Creator>(
      (row, s) => saved.patch.mutate({ id: row.id, body: { status: s } }),
      (row) => setNotesFor(row),
    ).map((c) => ({ ...c, render: (r: (typeof merged)[number]) => c.render(r._row), sortValue: c.sortValue ? (r: (typeof merged)[number]) => c.sortValue!(r._row) : undefined })),
  ];

  return (
    <Card>
      <CardHeader
        title={`${saved.total} saved creators`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ListFilters
              status={status}
              onStatus={setStatus}
              search={search}
              onSearch={setSearch}
              extra={
                <Select value={platform} onChange={(event) => setPlatform(event.target.value)} aria-label="Platform" className="h-8 w-32 text-[13px]">
                  <option value="">All platforms</option>
                  {PLATFORM_IDS.map((p) => (
                    <option key={p} value={p}>
                      {PLATFORMS[p]}
                    </option>
                  ))}
                </Select>
              }
            />
            <ExportButton filename={`${project.name}-creators.csv`} rows={() => saved.rows.map((r) => ({ ...creatorCsv([r.data])[0], status: PIPELINE_LABELS[r.status], notes: r.notes, tags: r.tags.join("; ") }))} />
          </div>
        }
      />
      <BulkBar
        count={selected.size}
        pending={saved.bulk.isPending}
        onStatus={(s) => saved.bulk.mutate({ ids, status: s })}
        onTag={(tags) => saved.bulk.mutate({ ids, addTags: tags })}
        onDelete={() => setConfirmDelete(true)}
      >
        <Button size="sm" loading={analyse.isPending} onClick={() => analyse.mutate(ids.slice(0, 25))} title="Fresh followers, views, engagement and contacts">
          <RefreshCw className="size-3.5" aria-hidden /> Re-analyse {Math.min(25, ids.length)}
        </Button>
      </BulkBar>
      <ErrorNote error={saved.list.error ?? saved.patch.error ?? saved.bulk.error ?? analyse.error} />
      {saved.list.isPending ? (
        <Spinner />
      ) : saved.total === 0 && !status && !platform && !search ? (
        <div className="p-4">
          <EmptyState title="No creators saved yet">Find creators for your niche and save the ones worth contacting. Their status, notes and tags live here.</EmptyState>
        </div>
      ) : (
        <DataTable
          rows={merged}
          columns={columns}
          rowKey={(r) => r._row.id}
          caption="Saved creators"
          selection={{ selected, onChange: setSelected, label: (r) => r.handle }}
          empty="No saved creators match."
        />
      )}
      <NotesPanel
        row={notesFor}
        title={notesFor ? (notesFor.data.name ?? notesFor.data.handle) : ""}
        onClose={() => setNotesFor(null)}
        saving={saved.patch.isPending}
        onSave={(body) => notesFor && saved.patch.mutate({ id: notesFor.id, body }, { onSuccess: () => setNotesFor(null) })}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Remove ${selected.size} creators?`}
        confirmLabel="Remove"
        danger
        pending={saved.remove.isPending}
        error={saved.remove.error}
        onConfirm={() =>
          saved.remove.mutate(ids, {
            onSuccess: () => {
              setSelected(new Set());
              setConfirmDelete(false);
            },
          })
        }
      >
        Their notes and status go with them. You can save them again from a search.
      </ConfirmDialog>
    </Card>
  );
}

/** The project's lead list: businesses saved by hand or by lead searches. */
export function SavedLeads({ project, searchId }: { project: Project; searchId?: string }) {
  const [status, setStatus] = useState("");
  const [website, setWebsite] = useState("");
  const [search, setSearch] = useState("");
  const saved = useSavedList<Lead>(project, "leads", { status: status || undefined, website: website || undefined, q: search || undefined, searchId });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notesFor, setNotesFor] = useState<Row<Lead> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const emails = useMutation({
    mutationFn: (ids: string[]) => api<{ checked: number; withEmails: number }>(`/projects/${project.id}/leads/emails`, { method: "POST", body: { ids, method: "website" } }),
    onSuccess: saved.refresh,
  });

  const ids = [...selected];
  const merged = saved.rows.map((r) => ({ ...r.data, emails: r.emails?.length ? r.emails : r.data.emails, _row: r }));
  const columns: Column<(typeof merged)[number]>[] = [
    ...leadColumns().map((c) => c as unknown as Column<(typeof merged)[number]>),
    ...workColumns<Lead>(
      (row, s) => saved.patch.mutate({ id: row.id, body: { status: s } }),
      (row) => setNotesFor(row),
    ).map((c) => ({ ...c, render: (r: (typeof merged)[number]) => c.render(r._row), sortValue: c.sortValue ? (r: (typeof merged)[number]) => c.sortValue!(r._row) : undefined })),
  ];

  return (
    <Card>
      <CardHeader
        title={`${saved.total} leads`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ListFilters
              status={status}
              onStatus={setStatus}
              search={search}
              onSearch={setSearch}
              extra={
                <Select value={website} onChange={(event) => setWebsite(event.target.value)} aria-label="Website" className="h-8 w-36 text-[13px]">
                  <option value="">Any website</option>
                  <option value="yes">Has a website</option>
                  <option value="no">No website</option>
                </Select>
              }
            />
            <ExportButton filename={`${project.name}-leads.csv`} rows={() => merged.map((r) => ({ ...leadCsv([r])[0], status: PIPELINE_LABELS[r._row.status], notes: r._row.notes, tags: r._row.tags.join("; ") }))} />
          </div>
        }
      />
      <BulkBar
        count={selected.size}
        pending={saved.bulk.isPending}
        onStatus={(s) => saved.bulk.mutate({ ids, status: s })}
        onTag={(tags) => saved.bulk.mutate({ ids, addTags: tags })}
        onDelete={() => setConfirmDelete(true)}
      >
        <Button size="sm" loading={emails.isPending} onClick={() => emails.mutate(ids.slice(0, 100))} title="Reads each selected business's homepage for a contact email">
          <Mail className="size-3.5" aria-hidden /> Find emails
        </Button>
        {emails.data && <span className="text-muted">Found emails for {emails.data.withEmails} of {emails.data.checked} with a website.</span>}
      </BulkBar>
      <ErrorNote error={saved.list.error ?? saved.patch.error ?? saved.bulk.error ?? emails.error} />
      {saved.list.isPending ? (
        <Spinner />
      ) : saved.total === 0 && !status && !website && !search ? (
        <div className="p-4">
          <EmptyState title="No leads yet">Run a lead search, or save businesses from the lead finder. Every lead keeps its status, notes and tags here.</EmptyState>
        </div>
      ) : (
        <DataTable rows={merged} columns={columns} rowKey={(r) => r._row.id} caption="Leads" selection={{ selected, onChange: setSelected, label: (r) => r.name }} empty="No leads match." />
      )}
      <NotesPanel
        row={notesFor}
        title={notesFor?.data.name ?? ""}
        onClose={() => setNotesFor(null)}
        saving={saved.patch.isPending}
        onSave={(body) => notesFor && saved.patch.mutate({ id: notesFor.id, body }, { onSuccess: () => setNotesFor(null) })}
      />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Remove ${selected.size} leads?`}
        confirmLabel="Remove"
        danger
        pending={saved.remove.isPending}
        error={saved.remove.error}
        onConfirm={() =>
          saved.remove.mutate(ids, {
            onSuccess: () => {
              setSelected(new Set());
              setConfirmDelete(false);
            },
          })
        }
      >
        Their notes and status go with them. A later lead search may find and save them again.
      </ConfirmDialog>
    </Card>
  );
}
