"use client";

import { CreatorProfile } from "@/components/reach/creators";
import { ToolsPage } from "@/components/research/tools-page";

export default function CreatorProfileTool() {
  return <ToolsPage marketless>{(project) => <CreatorProfile project={project} />}</ToolsPage>;
}
