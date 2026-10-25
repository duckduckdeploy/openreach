"use client";

import { useQuery } from "@tanstack/react-query";
import { type Community, CommunityTable, SubredditFinder } from "@/components/reach/mentions";
import { ProjectPage } from "@/components/reach/project-page";
import { Card, CardHeader, ErrorNote, PageHeader, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import type { Project } from "@/lib/hooks";

function Communities({ project }: { project: Project }) {
  const found = useQuery({ queryKey: ["communities", project.id], queryFn: () => api<Community[]>(`/projects/${project.id}/communities`) });
  return (
    <>
      <PageHeader title="Communities" description="Where your audience asks for help: the places worth being a regular in." />
      <div className="space-y-8">
        <Card>
          <CardHeader title="From your monitors" description="Ranked by the mentions and conversations your monitors found there." />
          {found.isPending ? <Spinner /> : <CommunityTable rows={found.data ?? []} empty="Your monitors haven't found anything yet. Create a brand or conversation monitor first." />}
          <ErrorNote error={found.error} />
        </Card>
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Subreddit finder</h2>
          <SubredditFinder project={project} />
        </section>
      </div>
    </>
  );
}

export default function CommunitiesPage() {
  return <ProjectPage>{(project) => <Communities project={project} />}</ProjectPage>;
}
