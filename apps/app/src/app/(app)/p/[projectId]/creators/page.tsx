"use client";

import { TabPanel, Tabs, useQueryState } from "@/components/kit";
import { InfluencerFinder } from "@/components/reach/creators";
import { ProjectPage } from "@/components/reach/project-page";
import { SavedCreators } from "@/components/reach/saved";
import { PageHeader } from "@/components/ui";
import type { Project } from "@/lib/hooks";

const TABS = ["saved", "find"] as const;

function Creators({ project }: { project: Project }) {
  const [tab, setTab] = useQueryState("tab", TABS, "saved");
  return (
    <>
      <PageHeader title="Influencers" description="Creators who reach your audience, and where outreach to each one stands." />
      <Tabs label="Influencers" value={tab} onChange={setTab} tabs={[{ id: "saved", label: "Saved creators" }, { id: "find", label: "Find creators" }]} />
      <TabPanel id="saved" hidden={tab !== "saved"}>
        {tab === "saved" && <SavedCreators project={project} />}
      </TabPanel>
      <TabPanel id="find" hidden={tab !== "find"}>
        {tab === "find" && <InfluencerFinder project={project} />}
      </TabPanel>
    </>
  );
}

export default function CreatorsPage() {
  return <ProjectPage>{(project) => <Creators project={project} />}</ProjectPage>;
}
