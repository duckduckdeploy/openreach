"use client";

import { Download, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { dateTime } from "@/lib/api";
import { downloadCsv, type LookupQuery } from "@/lib/lookup";

/**
 * When a whole view was fetched, with one refresh for all its lookups. A view is
 * one search: its lookups run together and are refreshed together. `refresh` narrows what
 * Refresh pays for, when some lookups follow from others: metrics keyed by a SERP's URLs are
 * left out, as the fresh SERP gives them their new input and they load from there.
 */
export function ViewMeta({ lookups, refresh = lookups, label }: { lookups: LookupQuery<unknown>[]; refresh?: LookupQuery<unknown>[]; label?: ReactNode }) {
  const done = lookups.filter((lookup) => lookup.result);
  if (!done.length) return null;
  const fetched = done.map((lookup) => lookup.result?.fetchedAt ?? "").sort().at(-1);
  const refreshing = refresh.some((lookup) => lookup.refreshing);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="min-w-0 text-[13px] text-muted">
        {label && <>{label} · </>}
        fetched {dateTime(fetched)}
      </p>
      <Button size="sm" variant="ghost" loading={refreshing} onClick={() => void Promise.all(refresh.map((lookup) => lookup.refresh()))}>
        {!refreshing && <RefreshCw className="size-3.5" aria-hidden />} Refresh
      </Button>
    </div>
  );
}

/** The errors of a view's lookups, each once. */
export function ViewErrors({ lookups }: { lookups: LookupQuery<unknown>[] }) {
  const errors = lookups.map((lookup) => lookup.error).filter(Boolean);
  if (!errors.length) return null;
  return (
    <div className="mb-6 space-y-2">
      {errors.map((error, index) => (
        <ErrorNote key={index} error={error} />
      ))}
    </div>
  );
}

/** Shown where results will appear: nothing is fetched until the user runs the lookup. */
export function RunPrompt({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</p>
    </div>
  );
}

export function ExportButton({ filename, rows, label = "Export CSV" }: { filename: string; rows: () => Record<string, unknown>[]; label?: string }) {
  return (
    <Button size="sm" onClick={() => downloadCsv(filename, rows())}>
      <Download className="size-3.5" aria-hidden /> {label}
    </Button>
  );
}
