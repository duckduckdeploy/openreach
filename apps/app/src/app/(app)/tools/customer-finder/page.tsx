"use client";

import { CustomerFinder } from "@/components/reach/mentions";
import { ToolsPage } from "@/components/research/tools-page";

export default function CustomerFinderTool() {
  return <ToolsPage marketless>{(project) => <CustomerFinder project={project} />}</ToolsPage>;
}
