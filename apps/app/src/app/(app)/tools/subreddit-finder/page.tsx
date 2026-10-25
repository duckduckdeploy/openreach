"use client";

import { SubredditFinder } from "@/components/reach/mentions";
import { ToolsPage } from "@/components/research/tools-page";

export default function SubredditFinderTool() {
  return <ToolsPage marketless>{(project) => <SubredditFinder project={project} />}</ToolsPage>;
}
