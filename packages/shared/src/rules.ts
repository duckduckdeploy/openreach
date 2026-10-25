import { z } from "zod";

/**
 * Filter logic for result lists: nested groups of rules, each group matching all or any of its
 * rules. The app runs it on results already on screen (free), and the API runs the same rules on
 * project lead searches, so a saved filter means the same thing everywhere.
 */

export const RULE_OPS = ["exists", "missing", "eq", "neq", "gt", "gte", "lt", "lte", "contains", "not_contains", "matches", "in", "not_in"] as const;
export type RuleOp = (typeof RULE_OPS)[number];

export const OP_LABELS: Record<RuleOp, string> = {
  exists: "is set",
  missing: "is empty",
  eq: "is",
  neq: "is not",
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  contains: "contains",
  not_contains: "doesn't contain",
  matches: "matches pattern",
  in: "is one of",
  not_in: "is none of",
};

export type FieldType = "number" | "text" | "boolean" | "list";

/** Which operators make sense for a field type. */
export const OPS_FOR: Record<FieldType, RuleOp[]> = {
  number: ["gt", "gte", "lt", "lte", "eq", "neq", "exists", "missing"],
  text: ["contains", "not_contains", "eq", "neq", "matches", "in", "not_in", "exists", "missing"],
  boolean: ["eq"],
  list: ["contains", "not_contains", "in", "not_in", "exists", "missing"],
};

export type RuleValue = string | number | boolean | (string | number)[];
export type Rule = { field: string; op: RuleOp; value?: RuleValue };
export type RuleGroup = { match: "all" | "any"; rules: (Rule | RuleGroup)[] };

export type FieldDef<T> = { key: string; label: string; type: FieldType; get: (record: T) => unknown; hint?: string };

const ruleValue = z.union([z.string().max(500), z.number(), z.boolean(), z.array(z.union([z.string().max(200), z.number()])).max(100)]);

const ruleSchema = z.object({ field: z.string().min(1).max(60), op: z.enum(RULE_OPS), value: ruleValue.optional() });

/** Groups nest at most 3 deep and hold at most 30 rules each, which is far more than a filter needs. */
export const ruleGroupSchema: z.ZodType<RuleGroup> = z.lazy(() =>
  z.object({ match: z.enum(["all", "any"]), rules: z.array(z.union([ruleSchema, ruleGroupSchema])).max(30) }),
);

export const isGroup = (item: Rule | RuleGroup): item is RuleGroup => "rules" in item;

export const emptyGroup = (): RuleGroup => ({ match: "all", rules: [] });

const isBlank = (value: unknown) => value == null || value === "" || (Array.isArray(value) && value.length === 0);
const lower = (value: unknown) => String(value ?? "").toLowerCase();
const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map(lower) : isBlank(value) ? [] : [lower(value)]);
const asNumber = (value: unknown) => (typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN);

// Patterns come from users, so compile each once and refuse ones that do not compile.
const patterns = new Map<string, RegExp | null>();
function pattern(source: string): RegExp | null {
  if (!patterns.has(source)) {
    let compiled: RegExp | null = null;
    try {
      compiled = source.length <= 200 ? new RegExp(source, "i") : null;
    } catch {
      compiled = null;
    }
    if (patterns.size > 500) patterns.clear();
    patterns.set(source, compiled);
  }
  return patterns.get(source) ?? null;
}

function test(op: RuleOp, actual: unknown, expected: RuleValue | undefined, type: FieldType): boolean {
  switch (op) {
    case "exists":
      return !isBlank(actual) && actual !== false;
    case "missing":
      return isBlank(actual) || actual === false;
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const a = asNumber(actual);
      const b = asNumber(expected);
      // A missing number never passes a comparison: "reviews < 20" should not pick places Google gave no count.
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      return op === "gt" ? a > b : op === "gte" ? a >= b : op === "lt" ? a < b : a <= b;
    }
    case "eq":
    case "neq": {
      let same: boolean;
      if (type === "boolean") same = Boolean(actual) === (expected === true || expected === "true");
      else if (type === "number") same = asNumber(actual) === asNumber(expected);
      else same = lower(actual) === lower(expected);
      return op === "eq" ? same : !same;
    }
    case "contains":
    case "not_contains": {
      const needle = lower(expected).trim();
      const hit = needle === "" ? true : type === "list" ? asList(actual).some((item) => item.includes(needle)) : lower(actual).includes(needle);
      return op === "contains" ? hit : !hit;
    }
    case "matches": {
      const regex = pattern(String(expected ?? ""));
      return regex ? asList(actual).some((item) => regex.test(item)) : false;
    }
    case "in":
    case "not_in": {
      const options = (Array.isArray(expected) ? expected : String(expected ?? "").split(",")).map(lower).map((item) => item.trim()).filter(Boolean);
      const hit = asList(actual).some((item) => options.includes(item));
      return op === "in" ? hit : !hit;
    }
  }
}

/** True when the record passes the group. An empty group passes everything; an unknown field fails its rule. */
export function matches<T>(group: RuleGroup, record: T, fields: FieldDef<T>[]): boolean {
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const check = (item: Rule | RuleGroup): boolean => {
    if (isGroup(item)) {
      if (!item.rules.length) return true;
      return item.match === "all" ? item.rules.every(check) : item.rules.some(check);
    }
    const field = byKey.get(item.field);
    if (!field) return false;
    return test(item.op, field.get(record), item.value, field.type);
  };
  return check(group);
}

export const filterRecords = <T>(records: T[], group: RuleGroup | null | undefined, fields: FieldDef<T>[]): T[] =>
  group && group.rules.length ? records.filter((record) => matches(group, record, fields)) : records;

/** Rules in plain words, for summaries and agents: "website is empty and reviews < 20". */
export function describeRules<T>(group: RuleGroup, fields: FieldDef<T>[], nested = false): string {
  const label = (key: string) => fields.find((field) => field.key === key)?.label.toLowerCase() ?? key;
  const parts = group.rules.map((item) => {
    if (isGroup(item)) return describeRules(item, fields, true);
    const type = fields.find((field) => field.key === item.field)?.type;
    if (type === "boolean") return `${label(item.field)}: ${item.value === true || item.value === "true" ? "yes" : "no"}`;
    const value = item.op === "exists" || item.op === "missing" ? "" : ` ${Array.isArray(item.value) ? item.value.join(", ") : String(item.value ?? "")}`;
    return `${label(item.field)} ${OP_LABELS[item.op]}${value}`;
  });
  const joined = parts.join(group.match === "all" ? " and " : " or ");
  return nested && parts.length > 1 ? `(${joined})` : joined;
}
