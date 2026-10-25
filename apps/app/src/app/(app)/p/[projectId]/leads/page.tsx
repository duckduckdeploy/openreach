"use client";

import { useSearchParams } from "next/navigation";
import { TabPanel, Tabs, useQueryState } from "@/components/kit";
import { LeadSearches } from "@/components/reach/lead-searches";
import { LeadFinder } from "@/components/reach/leads";
import { ProjectPage } from "@/components/reach/project-page";
import { SavedLeads } from "@/components/reach/saved";
import { useToolNav } from "@/components/research/search-bar";
import { Button, PageHeader } from "@/components/ui";
import type { Project } from "@/lib/hooks";

const TABS = ["list", "searches", "quick"] as const;

function Leads({ project }: { project: Project }) {
  const [tab, setTab] = useQueryState("tab", TABS, "list");
  const params = useSearchParams();
  const nav = useToolNav();
  const searchId = params.get("search") ?? undefined;
  return (
    <>
      <PageHeader title="Leads" description="Businesses from Google Maps that fit your pitch, with emails and where each one stands." />
      <Tabs
        label="Leads"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "list", label: "Lead list" },
          { id: "searches", label: "Lead searches" },
          { id: "quick", label: "Quick search" },
        ]}
      />
      <TabPanel id="list" hidden={tab !== "list"}>
        {searchId && (
          <div className="mb-3 flex items-center gap-2 text-[13px] text-muted">
            Showing the leads one search found.
            <Button size="sm" variant="ghost" onClick={() => nav({ search: null })}>
              Show all
            </Button>
          </div>
        )}
        {tab === "list" && <SavedLeads project={project} searchId={searchId} />}
      </TabPanel>
      <TabPanel id="searches" hidden={tab !== "searches"}>
        {tab === "searches" && <LeadSearches project={project} onOpen={(id) => nav({ tab: null, search: id })} />}
      </TabPanel>
      <TabPanel id="quick" hidden={tab !== "quick"}>
        {tab === "quick" && <LeadFinder project={project} />}
      </TabPanel>
    </>
  );
}

export default function LeadsPage() {
  return <ProjectPage>{(project) => <Leads project={project} />}</ProjectPage>;
}
