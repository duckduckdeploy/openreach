"use client";

import { MonitorsView } from "@/components/reach/monitors";
import { ProjectPage } from "@/components/reach/project-page";
import { PageHeader } from "@/components/ui";

export default function MentionsPage() {
  return (
    <ProjectPage>
      {(project) => (
        <>
          <PageHeader title="Brand mentions" description="Where people talk about your product, checked on a schedule. Mark what you've replied to, ignore the noise." />
          <MonitorsView project={project} kind="brand" />
        </>
      )}
    </ProjectPage>
  );
}
