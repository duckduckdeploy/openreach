"use client";

import { useParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { ErrorNote, Spinner } from "@/components/ui";
import { type Project, useProject } from "@/lib/hooks";

function Load({ children }: { children: (project: Project) => ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useProject(projectId);
  if (project.isPending) return <Spinner />;
  if (project.error) return <ErrorNote error={project.error} />;
  return <>{children(project.data)}</>;
}

/** A page inside a project: loads the project from the route and hands it to the page. */
export function ProjectPage({ children }: { children: (project: Project) => ReactNode }) {
  return (
    <Suspense fallback={<Spinner />}>
      <Load>{children}</Load>
    </Suspense>
  );
}
