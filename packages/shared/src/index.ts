import catalog from "./models.json" with { type: "json" };

export * from "./agent-setup";
export * from "./conversations";
export * from "./creators";
export * from "./leads";
export * from "./rules";
export * from "./sources";

export type AiModel = {
  id: string;
  name: string;
  provider: string;
  contextWindow: number | null;
  /** USD per million input tokens, as listed in YepAPI's docs when this file was generated. */
  inputPerM: number | null;
  outputPerM: number | null;
  /** Searches the web on every request, with or without the webSearch option. */
  searchGrounded: boolean;
};

/** Snapshot of YepAPI's chat models. The API's live list takes precedence when it can be read. */
export const MODEL_CATALOG: AiModel[] = catalog;

/**
 * The model that scores mentions and conversations and writes search phrasings. Cheap and reliable
 * with JSON; YepAPI bills at least $0.01 a request, so results are scored in batches.
 */
export const SCORING_MODEL = "google/gemini-2.5-flash";

export type Schedule = "manual" | "daily" | "weekly" | "monthly";

export const RUNS_PER_MONTH: Record<Schedule, number> = { manual: 0, daily: 30, weekly: 4.35, monthly: 1 };

/** Where a saved creator or lead is in outreach. The same steps for both, so lists read alike. */
export const PIPELINE = ["new", "to_contact", "contacted", "replied", "won", "lost"] as const;
export type PipelineStatus = (typeof PIPELINE)[number];
export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  new: "New",
  to_contact: "To contact",
  contacted: "Contacted",
  replied: "Replied",
  won: "Won",
  lost: "Not a fit",
};
