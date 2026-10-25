"use client";

import { InfluencerFinder } from "@/components/reach/creators";
import { ToolsPage } from "@/components/research/tools-page";

export default function InfluencerFinderTool() {
  return <ToolsPage>{(project) => <InfluencerFinder project={project} />}</ToolsPage>;
}
