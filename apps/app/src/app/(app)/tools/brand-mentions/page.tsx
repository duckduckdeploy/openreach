"use client";

import { BrandMentions } from "@/components/reach/mentions";
import { ToolsPage } from "@/components/research/tools-page";

export default function BrandMentionsTool() {
  return <ToolsPage marketless>{(project) => <BrandMentions project={project} />}</ToolsPage>;
}
