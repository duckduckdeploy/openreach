"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, AtSign, Hash, MapPin, MessageCircleQuestion, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProjectPage } from "@/components/reach/project-page";
import { Button, Card, CardHeader, ErrorNote, Field, Input, PageHeader, Stat, Textarea } from "@/components/ui";
import { api, num } from "@/lib/api";
import type { Project } from "@/lib/hooks";

const split = (text: string) => [...new Set(text.split(",").map((t) => t.trim()).filter(Boolean))];

function About({ project }: { project: Project }) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState(project.description ?? "");
  const [keywords, setKeywords] = useState((project.keywords ?? []).join(", "));
  const [competitors, setCompetitors] = useState((project.competitors ?? []).join(", "));
  const save = useMutation({
    mutationFn: () => api<Project>(`/projects/${project.id}`, { method: "PATCH", body: { description: description.trim() || null, keywords: split(keywords), competitors: split(competitors) } }),
    onSuccess: (updated) => queryClient.setQueryData(["project", project.id], updated),
  });
  const changed = description !== (project.description ?? "") || keywords !== (project.keywords ?? []).join(", ") || competitors !== (project.competitors ?? []).join(", ");
  return (
    <Card>
      <CardHeader title="About the product" description="Searches start from these: the niche words for creators and leads, the problems for conversations, the competitors for people unhappy with them." />
      <form
        className="grid gap-4 p-4 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="lg:col-span-3">
          <Field label="What it does, and for whom" hint="A sentence or two. The AI check reads it to judge whether a post is a fit.">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={2000} placeholder="A CRM for plumbers and electricians that books jobs and sends invoices." />
          </Field>
        </div>
        <Field label="Niche and problem words" hint="Comma separated, e.g. home espresso, crm for small business">
          <Input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
        </Field>
        <Field label="Competitors" hint="Comma separated, e.g. HubSpot, Pipedrive">
          <Input value={competitors} onChange={(event) => setCompetitors(event.target.value)} />
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit" variant="primary" loading={save.isPending} disabled={!changed}>
            Save
          </Button>
          <ErrorNote error={save.error} />
        </div>
      </form>
    </Card>
  );
}

function useTotal(path: string, query: Record<string, string | number> = {}) {
  return useQuery({ queryKey: ["total", path, query], queryFn: () => api<{ total: number }>(path, { query: { ...query, limit: 1 } }).then((r) => r.total) });
}

function Overview({ project }: { project: Project }) {
  const base = `/projects/${project.id}`;
  const creators = useTotal(`${base}/creators`);
  const contacted = useTotal(`${base}/creators`, { status: "contacted" });
  const leads = useTotal(`${base}/leads`);
  const mentions = useTotal(`${base}/mentions`, { kind: "brand", status: "new" });
  const conversations = useTotal(`${base}/mentions`, { kind: "topic", status: "new" });
  const p = `/p/${project.id}`;
  const keyword = project.keywords?.[0] ?? "";

  const areas = [
    { href: `${p}/creators?tab=find${keyword ? `&q=${encodeURIComponent(keyword)}` : ""}`, icon: Users, title: "Find influencers", text: "Creators on YouTube, TikTok and Instagram who reach your audience." },
    { href: `${p}/leads`, icon: MapPin, title: "Build a lead list", text: "Businesses on Google Maps that fit your pitch, across whole cities." },
    { href: `${p}/mentions`, icon: AtSign, title: "Monitor your brand", text: "Every new mention across Reddit, Hacker News, GitHub, review sites and more." },
    { href: `${p}/conversations`, icon: MessageCircleQuestion, title: "Find customers", text: "People asking for what you sell, ranked by how ready they are to buy." },
    { href: `${p}/communities`, icon: Hash, title: "Pick your communities", text: "The subreddits and forums where your audience asks for help." },
  ];

  return (
    <>
      <PageHeader title={project.name} description={project.description || project.domain || undefined} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Creators saved" value={num(creators.data)} sub={contacted.data ? `${num(contacted.data)} contacted` : undefined} />
        <Stat label="Leads" value={num(leads.data)} />
        <Stat label="New mentions" value={num(mentions.data)} />
        <Stat label="New conversations" value={num(conversations.data)} />
        <Stat label="Market" value={project.country.toUpperCase()} sub={project.locationName} />
      </div>
      <div className="space-y-6">
        <About key={project.id} project={project} />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <li key={area.href}>
              <Link href={area.href} className="group flex h-full flex-col rounded-lg border border-line bg-surface p-4 transition-colors hover:border-faint">
                <span className="mb-3 grid size-9 place-items-center rounded-md bg-accent-soft text-accent-text">
                  <area.icon className="size-4.5" aria-hidden />
                </span>
                <span className="flex items-center justify-between gap-2 font-display text-base font-semibold">
                  {area.title}
                  <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                </span>
                <span className="mt-1 text-[13px] text-muted">{area.text}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function ProjectOverview() {
  return <ProjectPage>{(project) => <Overview project={project} />}</ProjectPage>;
}
