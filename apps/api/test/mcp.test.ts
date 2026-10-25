import { describe, expect, it } from "vitest";
import { processLeadSearch } from "../src/services/lead-search";
import { getApp, readyUser } from "./client";
import { harness } from "./harness";

let id = 0;

async function rpc(auth: { apiKey?: string; cookie?: string }, method: string, params: Record<string, unknown> = {}) {
  const headers: Record<string, string> = { accept: "application/json, text/event-stream", "content-type": "application/json" };
  if (auth.apiKey) headers.authorization = `Bearer ${auth.apiKey}`;
  if (auth.cookie) headers.cookie = auth.cookie;
  const res = await (await getApp()).inject({ method: "POST", url: "/mcp", headers, payload: { jsonrpc: "2.0", id: ++id, method, params } });
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null };
}

async function agent(project: Record<string, unknown> = {}) {
  const user = await readyUser(project);
  const { key } = await user.api.ok<{ key: string }>("POST", "/api-keys", { name: "agent" });
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const res = await rpc({ apiKey: key }, "tools/call", { name, arguments: args });
    const result = res.body.result as { content: { text: string }[]; isError?: boolean };
    const text = result.content[0]?.text ?? "";
    return {
      isError: result.isError === true,
      text,
      json: (() => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })(),
    };
  };
  return { ...user, key, call };
}

describe("MCP server", () => {
  it("only accepts OpenReach API keys, not browser sessions", async () => {
    const user = await readyUser();
    expect((await rpc({}, "tools/list")).status).toBe(401);
    expect((await rpc({ cookie: user.cookie }, "tools/list")).status).toBe(401);
    const app = await getApp();
    expect((await app.inject({ method: "GET", url: "/mcp" })).statusCode).toBe(405);
  });

  it("initialises and lists every tool, with spending controls on every paid one", async () => {
    const { key } = await agent();
    const init = await rpc({ apiKey: key }, "initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } });
    expect(init.body.result.serverInfo.name).toBe("openreach");
    expect(init.body.result.instructions).toMatch(/Never contact anyone/);
    const { body } = await rpc({ apiKey: key }, "tools/list");
    const tools = body.result.tools as { name: string; annotations?: { readOnlyHint?: boolean }; inputSchema: { properties: Record<string, unknown> } }[];
    expect(tools).toHaveLength(38);
    for (const name of ["find_creators", "analyse_creators", "find_leads", "brand_mentions", "find_conversations", "find_subreddits", "start_lead_search", "find_saved_lead_emails", "reanalyse_creators"]) {
      const tool = tools.find((t) => t.name === name);
      expect(Object.keys(tool!.inputSchema.properties), name).toEqual(expect.arrayContaining(["max_cost_usd", "dry_run"]));
    }
    for (const name of ["list_sources", "list_creators", "list_leads", "list_mentions", "get_communities"]) {
      const tool = tools.find((t) => t.name === name);
      expect(tool?.annotations?.readOnlyHint, name).toBe(true);
      expect(tool?.inputSchema.properties).not.toHaveProperty("max_cost_usd");
    }
  });

  it("uses the only project when project_id is left out, and dry runs spend nothing", async () => {
    const { call, project } = await agent();
    expect((await call("list_projects")).json[0].id).toBe(project.id);
    const before = harness.fake.requests.length;
    expect((await call("find_leads", { query: "plumber", pages: 3, dry_run: true })).json).toMatchObject({ dryRun: true, costUsd: 0, estimate: { max: 0.21 } });
    const tooLow = await call("find_leads", { query: "plumber", pages: 3, max_cost_usd: 0.1 });
    expect(tooLow.isError).toBe(true);
    expect(tooLow.text).toMatch(/above the \$0\.10 ceiling/);
    expect((await call("start_lead_search", { queries: ["plumber"], locations: ["Austin, TX"], dry_run: true })).json).toMatchObject({ dryRun: true, estimate: { searches: 1 } });
    expect(harness.fake.requests.length).toBe(before);
  });

  it("answers with what an agent reads, not images and layout fields", async () => {
    const { call } = await agent();
    const creators = (await call("find_creators", { platform: "youtube", query: "espresso" })).json.data.creators;
    expect(creators[0]).not.toHaveProperty("avatar");
    expect(creators[0]).toMatchObject({ platform: "youtube", handle: expect.any(String) });

    const lead = (await call("find_leads", { query: "plumber" })).json.data.leads[0];
    expect(Object.keys(lead)).not.toEqual(expect.arrayContaining(["latitude", "hours", "types"]));

    const profile = (await call("analyse_creator", { platform: "instagram", handle: "brewlab" })).json.data;
    expect(profile.recent.length).toBeLessThanOrEqual(5);
    expect(profile).toMatchObject({ emails: ["collabs@brewlab.example"] });

    const project = (await call("get_project")).json;
    expect(project).not.toHaveProperty("userId");
  });

  it("finds, saves and updates creators and leads end to end", async () => {
    const { call } = await agent();
    const found = (await call("find_creators", { platform: "tiktok", query: "espresso" })).json.data.creators;
    expect((await call("save_creators", { creators: found.slice(0, 3), status: "to_contact", tags: ["launch"] })).json).toEqual({ saved: 3 });
    const saved = (await call("list_creators", { status: "to_contact" })).json;
    expect(saved.total).toBe(3);
    await call("update_creators", { ids: [saved.creators[0].id], status: "contacted" });
    expect((await call("list_creators", { status: "contacted" })).json.total).toBe(1);

    const search = (await call("start_lead_search", { queries: ["plumber"], locations: ["Austin, TX"], filters: { match: "all", rules: [{ field: "reviews", op: "lt", value: 20 }] } })).json;
    await processLeadSearch(search.id);
    const progress = (await call("get_lead_search", { search_id: search.id, matched: "yes" })).json;
    expect(progress.status).toBe("completed");
    expect(progress.places.every((p: { matched: boolean }) => p.matched)).toBe(true);
    expect((await call("list_leads", { search_id: search.id })).json.total).toBe(progress.saved);
  });

  it("creates a monitor priced first, and reads the feed", async () => {
    const { call } = await agent();
    const priced = (await call("create_monitor", { kind: "topic", terms: ["crm for plumbers"], sources: ["reddit", "hackernews"], dry_run: true })).json;
    expect(priced).toMatchObject({ dryRun: true, estimate: { googleSearches: 3, freeSearches: 2 } });
    const monitor = (await call("create_monitor", { kind: "topic", terms: ["crm for plumbers"], sources: ["hackernews"], schedule: "weekly" })).json;
    expect((await call("list_monitors")).json[0]).toMatchObject({ id: monitor.id, schedule: "weekly" });
    const run = (await call("run_monitor", { monitor_id: monitor.id })).json;
    expect(run.status).toBe("queued");
    expect((await call("list_mentions")).json).toMatchObject({ total: 0 });
  });

  it("ships skills and a plugin that only name tools that exist", async () => {
    const { readFileSync, readdirSync } = await import("node:fs");
    const root = new URL("../../../", import.meta.url);
    const { key } = await agent();
    const { body } = await rpc({ apiKey: key }, "tools/list");
    const toolNames = new Set((body.result.tools as { name: string }[]).map((t) => t.name));
    // Tool inputs and other identifiers a skill may mention that are not tools.
    const notTools = new Set(["dry_run", "max_cost_usd", "search_id", "to_contact"]);

    const skillsDir = new URL("plugins/openreach/skills/", root);
    const skills = readdirSync(skillsDir);
    expect(skills.sort()).toEqual(["brand-monitor", "community-plan", "find-customers", "find-influencers", "find-leads"]);
    for (const skill of skills) {
      const text = readFileSync(new URL(`${skill}/SKILL.md`, skillsDir), "utf8");
      expect(text, skill).toMatch(new RegExp(`^---\\nname: ${skill}\\ndescription: .{40,}\\n---`));
      const named = [...text.matchAll(/`([a-z]+(?:_[a-z0-9]+)+)`/g)].map((m) => m[1] as string).filter((n) => !notTools.has(n));
      for (const name of named) expect(toolNames.has(name), `${skill} names ${name}`).toBe(true);
    }

    const plugin = JSON.parse(readFileSync(new URL("plugins/openreach/.claude-plugin/plugin.json", root), "utf8"));
    const marketplace = JSON.parse(readFileSync(new URL(".claude-plugin/marketplace.json", root), "utf8"));
    const mcp = JSON.parse(readFileSync(new URL("plugins/openreach/.mcp.json", root), "utf8"));
    expect(plugin.name).toBe("openreach");
    expect(marketplace.plugins[0]).toMatchObject({ name: "openreach", source: "./plugins/openreach" });
    expect(mcp.mcpServers.openreach).toMatchObject({ type: "http", headers: { Authorization: "Bearer ${OPENREACH_API_KEY}" } });
  });

  it("gives the dashboard this install's agent endpoint for the setup prompt", async () => {
    const { api } = await readyUser();
    expect((await api.ok("GET", "/me")).links).toEqual({ mcpUrl: "http://localhost:4300/mcp", docsUrl: "http://localhost:3301/docs/mcp" });
  });
});
