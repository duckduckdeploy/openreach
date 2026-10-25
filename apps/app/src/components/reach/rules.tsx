"use client";

import { type FieldDef, isGroup, OP_LABELS, OPS_FOR, type Rule, type RuleGroup, type RuleOp } from "@openreach/shared";
import { Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { Button, cx, Input, Select } from "@/components/ui";

type Fields = Pick<FieldDef<unknown>, "key" | "label" | "type" | "hint">[];

const needsValue = (op: RuleOp) => op !== "exists" && op !== "missing";

function defaultRule(fields: Fields): Rule {
  const field = fields[0]!;
  return { field: field.key, op: OPS_FOR[field.type][0]!, value: field.type === "boolean" ? true : undefined };
}

/** A fixed-width box: form fields fill their parent, so the width lives here. */
const Box = ({ width, children }: { width: string; children: ReactNode }) => <div className={cx(width, "shrink-0")}>{children}</div>;

function RuleRow({ rule, fields, onChange, onRemove }: { rule: Rule; fields: Fields; onChange: (rule: Rule) => void; onRemove: () => void }) {
  const field = fields.find((f) => f.key === rule.field) ?? fields[0]!;
  const ops = OPS_FOR[field.type];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Box width="w-44">
        <Select
          value={field.key}
          onChange={(event) => {
            const next = fields.find((f) => f.key === event.target.value)!;
            onChange({ field: next.key, op: OPS_FOR[next.type][0]!, value: next.type === "boolean" ? true : undefined });
          }}
          aria-label="Field"
          title={field.hint}
          className="h-8 text-[13px]"
        >
          {fields.map((f) => (
            <option key={f.key} value={f.key}>
              {f.label}
            </option>
          ))}
        </Select>
      </Box>
      {field.type === "boolean" ? (
        <Box width="w-24">
          <Select value={String(rule.value === true || rule.value === "true")} onChange={(event) => onChange({ ...rule, op: "eq", value: event.target.value === "true" })} aria-label="Value" className="h-8 text-[13px]">
            <option value="true">yes</option>
            <option value="false">no</option>
          </Select>
        </Box>
      ) : (
        <>
          <Box width="w-40">
            <Select value={rule.op} onChange={(event) => onChange({ ...rule, op: event.target.value as RuleOp })} aria-label="Condition" className="h-8 text-[13px]">
              {ops.map((op) => (
                <option key={op} value={op}>
                  {OP_LABELS[op]}
                </option>
              ))}
            </Select>
          </Box>
          {needsValue(rule.op) && (
            <Box width="w-40">
              <Input
                value={Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value ?? "")}
                onChange={(event) => {
                  const raw = event.target.value;
                  const value = field.type === "number" && raw.trim() !== "" && !Number.isNaN(Number(raw)) ? Number(raw) : raw;
                  onChange({ ...rule, value });
                }}
                inputMode={field.type === "number" ? "decimal" : undefined}
                placeholder={rule.op === "in" || rule.op === "not_in" ? "a, b, c" : rule.op === "matches" ? "regex, e.g. ^dr " : field.type === "number" ? "number" : "text"}
                aria-label="Value"
                className="h-8 text-[13px]"
              />
            </Box>
          )}
        </>
      )}
      <button type="button" onClick={onRemove} aria-label="Remove rule" className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunken hover:text-ink">
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/**
 * Filter rules: match all or any of a list, where an item can be one nested group. The same
 * rules run in the browser on results already shown and on the server for lead searches.
 */
export function RulesBuilder({ value, onChange, fields, nested = false }: { value: RuleGroup; onChange: (group: RuleGroup) => void; fields: Fields; nested?: boolean }) {
  const set = (index: number, item: Rule | RuleGroup) => onChange({ ...value, rules: value.rules.map((r, i) => (i === index ? item : r)) });
  const remove = (index: number) => onChange({ ...value, rules: value.rules.filter((_, i) => i !== index) });
  return (
    <div className={cx("space-y-2", nested && "rounded-md border border-line bg-sunken/50 p-2")}>
      {value.rules.length > 1 && (
        <div className="flex items-center gap-2 text-[13px] text-muted">
          Match
          <Box width="w-20">
            <Select value={value.match} onChange={(event) => onChange({ ...value, match: event.target.value as "all" | "any" })} aria-label="Match all or any" className="h-7 text-[13px]">
              <option value="all">all</option>
              <option value="any">any</option>
            </Select>
          </Box>
          of these
        </div>
      )}
      {value.rules.map((item, index) =>
        isGroup(item) ? (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              <RulesBuilder value={item} onChange={(group) => set(index, group)} fields={fields} nested />
            </div>
            <button type="button" onClick={() => remove(index)} aria-label="Remove group" className="grid size-8 place-items-center rounded-md text-muted hover:bg-sunken hover:text-ink">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <RuleRow key={index} rule={item} fields={fields} onChange={(rule) => set(index, rule)} onRemove={() => remove(index)} />
        ),
      )}
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="ghost" onClick={() => onChange({ ...value, rules: [...value.rules, defaultRule(fields)] })}>
          <Plus className="size-3.5" aria-hidden /> Rule
        </Button>
        {!nested && (
          <Button size="sm" variant="ghost" onClick={() => onChange({ ...value, rules: [...value.rules, { match: "any", rules: [defaultRule(fields)] }] })}>
            <Plus className="size-3.5" aria-hidden /> Group
          </Button>
        )}
      </div>
    </div>
  );
}

/** Rules as they travel in a URL: compact JSON, or null when there are none or they don't parse. */
export const rulesToParam = (group: RuleGroup) => (group.rules.length ? JSON.stringify(group) : null);

export function rulesFromParam(value: string | null): RuleGroup {
  if (!value) return { match: "all", rules: [] };
  try {
    const parsed = JSON.parse(value) as RuleGroup;
    return parsed && Array.isArray(parsed.rules) && (parsed.match === "all" || parsed.match === "any") ? parsed : { match: "all", rules: [] };
  } catch {
    return { match: "all", rules: [] };
  }
}
