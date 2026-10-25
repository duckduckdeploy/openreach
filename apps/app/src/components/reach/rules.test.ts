import { describe, expect, it } from "vitest";
import { rulesFromParam, rulesToParam } from "./rules";

describe("rules in the URL", () => {
  it("round-trips a rule group and drops an empty one", () => {
    const group = { match: "any" as const, rules: [{ field: "reviews", op: "lt" as const, value: 20 }] };
    expect(rulesFromParam(rulesToParam(group))).toEqual(group);
    expect(rulesToParam({ match: "all", rules: [] })).toBeNull();
  });

  it("ignores a param that is not a rule group", () => {
    expect(rulesFromParam("not json")).toEqual({ match: "all", rules: [] });
    expect(rulesFromParam('{"match":"some","rules":[]}')).toEqual({ match: "all", rules: [] });
    expect(rulesFromParam(null)).toEqual({ match: "all", rules: [] });
  });
});
