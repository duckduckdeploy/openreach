import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ResearchTool } from '@/content/tools';

/**
 * The tools as cards: the tool's icon, its keyword-led title (the page's H1) and, where the app
 * calls it something else, the name to look for in the app.
 */
export function ToolCards({ tools }: { tools: ResearchTool[] }) {
  return (
    <ul className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        const appName = tool.name.toLowerCase() !== tool.h1.toLowerCase() ? tool.name : null;
        return (
          <li key={tool.slug} className="card card-link group relative flex flex-col p-6">
            <span className={`tile ${index % 2 === 1 ? 'tile-peach' : ''}`}>
              <Icon className="size-5" aria-hidden="true" strokeWidth={1.75} />
            </span>
            <h3 className="card-title mt-5">
              <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                {tool.h1}
              </Link>
            </h3>
            {(tool.freeTool || appName) && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-faint">
                {tool.freeTool && <span className="rounded-full bg-accent-soft px-2 py-0.5 font-sans font-medium text-accent-text">Free to try, no account</span>}
                {appName && <span>In the app: {appName}</span>}
              </p>
            )}
            <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-muted">{tool.summary}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-text" aria-hidden="true">
              Learn more
              <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
