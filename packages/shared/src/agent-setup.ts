/** The skills that ship in the OpenReach plugin (plugins/openreach/skills). */
export const AGENT_SKILLS = [
  { name: "find-influencers", title: "Find influencers", summary: "Creators in your niche on YouTube, TikTok and Instagram, with contacts, shortlisted and saved." },
  { name: "find-leads", title: "Find leads", summary: "Businesses on Google Maps that match your pitch, filtered and saved as a lead list." },
  { name: "brand-monitor", title: "Brand monitor", summary: "Where your product is being talked about, and the mentions worth a reply." },
  { name: "find-customers", title: "Find customers", summary: "People asking for what you sell, in communities, ranked by intent." },
  { name: "community-plan", title: "Community plan", summary: "The subreddits and communities worth being active in, and how to start." },
] as const;

/** Agents with tested setup instructions in the docs. */
export const AGENT_CLIENTS = ["ChatGPT", "Claude", "Claude Code", "Cursor", "VS Code", "Codex", "Gemini CLI", "OpenCode", "Windsurf"] as const;

/**
 * A prompt the user pastes into their agent so it connects itself to OpenReach. It never asks
 * for the key in chat, and verifies the connection with free calls only.
 */
export function agentSetupPrompt({ mcpUrl, docsUrl }: { mcpUrl: string; docsUrl: string }): string {
  return `Connect yourself to OpenReach, an open-source suite for finding customers, leads and influencers, over MCP. Work through these steps in order and stop at any step that needs me.

1. Check first. Work out which agent you are (for example Claude Code, Claude Desktop, Cursor, VS Code, Codex, Gemini CLI, OpenCode or Windsurf) and whether an MCP server named "openreach" is already set up. If it is and its tools work, go to step 5.
   If you are ChatGPT, or Claude on the web or in the desktop app, you cannot add servers yourself: tell me to add a custom connector in your settings with the URL ${mcpUrl} and OAuth sign-in, which needs no API key, then stop.

2. The key. The connection needs an OpenReach API key, which starts with oreach_. Ask me to create one in the OpenReach app under Settings, API keys, and to store it in an environment variable named OPENREACH_API_KEY. Never ask me to paste the key into this chat, and never write it into a file inside a code repository.

3. Add the server. Add a remote MCP server named "openreach" with:
   - URL: ${mcpUrl}
   - Transport: streamable HTTP
   - Header: Authorization: Bearer <value of OPENREACH_API_KEY>
   Use your own supported way of adding MCP servers, and read the key from the environment variable. If you cannot change your own configuration, tell me exactly what to add and where. Instructions for each agent: ${docsUrl}

4. Reload. If the openreach tools are not available yet, tell me how to restart or reload you, and stop.

5. Verify, for free. Call whoami and list_projects. Both are free. During setup, do not run any paid lookup, create projects or change settings.

6. Report back in under 120 words: what you set up, whether whoami worked, the projects you found, and three things I could ask you next. Mention that paid lookups show their price first, and that I can give you a spending limit for any request.`;
}
