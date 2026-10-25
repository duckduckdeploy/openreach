'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { GlossaryCategory, GlossaryHat } from '@/content/glossary/types';
import { HatBadge } from './hat-badge';

export interface GlossaryEntry {
  slug: string;
  term: string;
  aka: string[];
  short: string;
  category: GlossaryCategory;
  hat?: GlossaryHat;
  letter: string;
}

interface GlossarySearchProps {
  entries: GlossaryEntry[];
  categories: { id: GlossaryCategory; name: string }[];
}

const anchor = (letter: string) => `letter-${letter === '#' ? 'num' : letter}`;
const chip = 'inline-flex rounded-full border px-3.5 py-1.5 text-sm transition-colors';

/** The A-Z list with a search box and topic filter. The full list renders on the server, so every term is a plain link without JavaScript. */
export function GlossarySearch({ entries, categories }: GlossarySearchProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>('all');
  const inputId = useId();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (entry) =>
        (category === 'all' || entry.category === category) &&
        (!q || entry.term.toLowerCase().includes(q) || entry.aka.some((name) => name.toLowerCase().includes(q)) || entry.short.toLowerCase().includes(q)),
    );
  }, [entries, query, category]);

  const letters = [...new Set(shown.map((entry) => entry.letter))];
  const filtered = shown.length !== entries.length;

  return (
    <>
      <div className="sticky top-[4.25rem] z-10 mx-auto mt-10 max-w-4xl bg-bg/90 py-3 backdrop-blur">
        <label htmlFor={inputId} className="sr-only">
          Search marketing terms
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search terms, e.g. engagement rate, ICP, astroturfing"
            className="h-12 w-full rounded-md border border-edge bg-surface pr-3.5 pl-10 text-ink placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none"
          />
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Filter by topic">
          {[{ id: 'all' as const, name: 'All topics' }, ...categories].map((option) => (
            <li key={option.id}>
              <button
                type="button"
                aria-pressed={category === option.id}
                onClick={() => setCategory(option.id)}
                className={`${chip} ${category === option.id ? 'border-accent bg-accent text-accent-fg' : 'border-line text-muted hover:border-accent-line hover:text-accent-text'}`}
              >
                {option.name}
              </button>
            </li>
          ))}
        </ul>
        {filtered ? null : (
          <nav aria-label="Letters" className="mt-3">
            <ul className="flex flex-wrap gap-1.5">
              {letters.map((letter) => (
                <li key={letter}>
                  <a href={`#${anchor(letter)}`} className="inline-flex size-8 items-center justify-center rounded-md border border-line font-mono text-sm hover:border-accent-line hover:text-accent-text">
                    {letter}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered ? `${shown.length} terms shown` : ''}
      </p>

      <div className="mx-auto mt-10 max-w-4xl space-y-14">
        {shown.length === 0 ? (
          <p className="text-center text-muted">No terms match “{query}”. Try a shorter word or another topic.</p>
        ) : null}
        {letters.map((letter) => (
          <section key={letter} aria-labelledby={anchor(letter)} className="scroll-mt-60">
            <h3 id={anchor(letter)} className="border-b border-line pb-3 font-display text-3xl font-bold">
              {letter}
            </h3>
            <dl className="mt-2 divide-y divide-line">
              {shown
                .filter((entry) => entry.letter === letter)
                .map((entry) => (
                  <div key={entry.slug} className="grid gap-1 py-4 sm:grid-cols-[16rem_1fr] sm:gap-6">
                    <dt className="flex flex-wrap items-center gap-2 font-semibold">
                      <Link href={`/glossary/${entry.slug}`} className="hover:text-accent-text hover:underline">
                        {entry.term}
                      </Link>
                      {entry.hat ? <HatBadge hat={entry.hat} /> : null}
                    </dt>
                    <dd className="text-[0.9375rem] leading-relaxed text-muted">{entry.short}</dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
