"use client";

import { LeadFinder } from "@/components/reach/leads";
import { ToolsPage } from "@/components/research/tools-page";

export default function LeadFinderTool() {
  return <ToolsPage>{(project) => <LeadFinder project={project} />}</ToolsPage>;
}
