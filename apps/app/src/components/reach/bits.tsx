"use client";

import { PIPELINE, PIPELINE_LABELS, PLATFORMS, type PipelineStatus, type Platform } from "@openreach/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, FolderPlus } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { Button, cx, ErrorNote, Select } from "@/components/ui";
import { api, compact } from "@/lib/api";
import { useProjects } from "@/lib/hooks";
import { isToolsScope } from "@/lib/scope";
import { safeHref } from "@/lib/url";

/** Each platform's mark, drawn small. Paths from Simple Icons 13.21 (CC0). */
const MARKS: Record<Platform, string> = {
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  tiktok:
    "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  instagram:
    "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
};

export function PlatformMark({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx("size-3.5 shrink-0 fill-current", className)} role="img" aria-label={PLATFORMS[platform]}>
      <path d={MARKS[platform]} />
    </svg>
  );
}

export function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      <PlatformMark platform={platform} /> {PLATFORMS[platform]}
    </span>
  );
}

/** A link out to the page itself, in a new tab; anything that is not http(s) stays plain text. */
export function OutLink({ href, children, className }: { href: string | null | undefined; children: ReactNode; className?: string }) {
  const safe = safeHref(href);
  if (!safe) return <span className={className}>{children}</span>;
  return (
    <a href={safe} target="_blank" rel="noreferrer noopener" className={cx("inline-flex min-w-0 items-center gap-1 underline-offset-2 hover:underline", className)}>
      <span className="truncate">{children}</span>
      <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** A count people compare: compact, tabular, a dash when unknown. */
export const Count = ({ value }: { value: number | null | undefined }) => <span className="font-mono tabular">{compact(value)}</span>;

export function Percent({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-faint">—</span>;
  return <span className="font-mono tabular">{value >= 10 ? Math.round(value) : value.toFixed(1)}%</span>;
}

export function StatusSelect({ value, onChange, label }: { value: PipelineStatus; onChange: (status: PipelineStatus) => void; label: string }) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value as PipelineStatus)} aria-label={label} className="h-8 w-32 text-[13px]">
      {PIPELINE.map((status) => (
        <option key={status} value={status}>
          {PIPELINE_LABELS[status]}
        </option>
      ))}
    </Select>
  );
}

export function StatusPill({ status }: { status: PipelineStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] leading-none uppercase tracking-wide",
        status === "won" ? "border-pos/40 text-pos" : status === "lost" ? "border-line text-faint" : status === "new" ? "border-line text-muted" : "border-accent-line bg-accent-soft text-accent-text",
      )}
    >
      {PIPELINE_LABELS[status]}
    </span>
  );
}

/**
 * Saves rows to a project's list. Inside a project it saves there; in the standalone tools it asks
 * which project. `kind` picks the list: creators or leads.
 */
export function SaveToProject({ scopeId, kind, rows, onSaved, label = "Save" }: { scopeId: string; kind: "creators" | "leads"; rows: () => unknown[]; onSaved?: (count: number) => void; label?: string }) {
  const inProject = !isToolsScope(scopeId);
  const projects = useProjects();
  const [chosen, setChosen] = useState("");
  const [saved, setSaved] = useState<{ count: number; projectId: string } | null>(null);
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: async (projectId: string) => {
      const list = rows();
      let count = 0;
      for (let start = 0; start < list.length; start += 500) {
        const res = await api<{ saved: number }>(`/projects/${projectId}/${kind}`, { method: "POST", body: { [kind]: list.slice(start, start + 500) } });
        count += res.saved;
      }
      return { count, projectId };
    },
    onSuccess: (result) => {
      setSaved(result);
      onSaved?.(result.count);
      void queryClient.invalidateQueries({ queryKey: [kind, result.projectId] });
    },
  });
  const target = inProject ? scopeId : chosen;
  const empty = rows().length === 0;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2">
        {!inProject && (
          <Select value={chosen} onChange={(event) => setChosen(event.target.value)} aria-label="Project to save to" className="h-8 w-44 text-[13px]">
            <option value="">Choose a project…</option>
            {projects.data?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        )}
        <Button size="sm" variant="secondary" disabled={!target || empty} loading={save.isPending} onClick={() => target && save.mutate(target)}>
          <FolderPlus className="size-3.5" aria-hidden /> {label}
        </Button>
      </span>
      {saved && !save.isPending && (
        <span className="inline-flex items-center gap-1 text-[13px] text-muted">
          <Check className="size-3.5 text-pos" aria-hidden /> {saved.count} saved
          {!inProject && (
            <Link href={`/p/${saved.projectId}/${kind === "creators" ? "creators" : "leads"}`} className="ml-1 text-accent-text underline-offset-2 hover:underline">
              Open list
            </Link>
          )}
        </span>
      )}
      {save.error && <ErrorNote error={save.error} />}
      {!inProject && projects.data?.length === 0 && (
        <Link href="/projects" className="text-[13px] text-accent-text underline-offset-2 hover:underline">
          Create a project to save to
        </Link>
      )}
    </div>
  );
}

/** "3 days ago", "2 months ago": how old something is, at a glance. */
export function ago(iso: string | null | undefined): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (Number.isNaN(days)) return "—";
  if (days < 1) return "today";
  if (days < 2) return "yesterday";
  if (days < 31) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  const years = Math.round(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
