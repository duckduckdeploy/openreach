"use client";

import { MonitorsView } from "@/components/reach/monitors";
import { ProjectPage } from "@/components/reach/project-page";
import { PageHeader } from "@/components/ui";

export default function ConversationsPage() {
  return (
    <ProjectPage>
      {(project) => (
        <>
          <PageHeader title="Customer conversations" description="People asking for what you sell, ranked by buying intent. Reply as yourself, and say who you are." />
          <MonitorsView project={project} kind="topic" />
        </>
      )}
    </ProjectPage>
  );
}
