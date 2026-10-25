import { AGENT_CLIENTS, AGENT_SKILLS } from '@openreach/shared';
import { setupPrompt } from '@/content/snippets';
import { BrandIcon, BrandRow, CLIENT_BRANDS } from './brand-icon';
import { ButtonLink } from './button';
import { CopyPromptButton } from './copy-prompt-button';
import { SectionHeader } from './section';

type Line = { kind: 'prompt' | 'call' | 'out' | 'ok' | 'muted' | 'blank'; text: string };

// An example session: priced first, run under a limit, saved. Figures are illustrative.
const session: Line[] = [
  { kind: 'prompt', text: '› find 20 home espresso creators on tiktok with an email, under $0.50' },
  { kind: 'blank', text: '' },
  { kind: 'call', text: '⏺ openreach.find_creators(platform: "tiktok", query: "home espresso", dry_run: true)' },
  { kind: 'muted', text: '  price: $0.02 · a repeat within a day is free' },
  { kind: 'blank', text: '' },
  { kind: 'call', text: '⏺ openreach.analyse_creators(handles: [19 handles], max_cost_usd: 0.48)' },
  { kind: 'out', text: '  creator              followers   avg views   engagement' },
  { kind: 'out', text: '  @espresso.lab           48,200      61,300         7.9%' },
  { kind: 'out', text: '  @morningshots           22,900      18,400         6.1%' },
  { kind: 'out', text: '  …17 more, each with an email in their bio' },
  { kind: 'blank', text: '' },
  { kind: 'call', text: '⏺ openreach.save_creators(19, status: "to_contact", tags: ["launch"])' },
  { kind: 'ok', text: '✓ Saved 19 creators. Spent $0.40 of your $0.50 limit.' },
];

const tone: Record<Line['kind'], string> = {
  prompt: 'text-code-fg font-semibold',
  call: 'text-[#ff9cc2]',
  out: 'text-code-fg',
  ok: 'text-[#4ade94]',
  muted: 'text-code-muted',
  blank: '',
};

export function AgentFold() {
  return (
    <section aria-labelledby="agents-title" className="band-night relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50rem_26rem_at_50%_0%,color-mix(in_srgb,var(--color-accent)_30%,transparent),transparent_70%),radial-gradient(36rem_22rem_at_100%_100%,color-mix(in_srgb,var(--color-orange)_22%,transparent),transparent_70%)]" aria-hidden="true" />
      <div className="container-page relative py-20 md:py-28 xl:py-32">
      <SectionHeader
        align="center"
        eyebrow="Agents and MCP"
        id="agents-title"
        title="Marketing MCP server for your AI agent"
        lede="Connect your agent in two minutes, then use ready-made skills or just ask. Every paid call shows its price first and stays under the limit you set."
      />

      <figure className="mx-auto mt-14 max-w-4xl md:mt-16">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-hard-lg ring-1 ring-white/5 backdrop-blur">
          <div className="flex items-center justify-between border-b border-code-line px-5 py-3 text-xs text-code-muted">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="size-2.5 rounded-full bg-code-line" />
              <span className="size-2.5 rounded-full bg-code-line" />
              <span className="size-2.5 rounded-full bg-code-line" />
            </span>
            <span>agent · openreach mcp</span>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[0.75rem] leading-relaxed sm:p-7 sm:text-[0.875rem]" role="img" aria-label="Example agent session: the agent prices a TikTok creator search first, analyses 19 creators under a 50 cent limit, and saves them, spending 40 cents.">
            {session.map((line, index) => (
              <span key={index} className={`block ${line.kind === 'out' ? '' : 'whitespace-pre-wrap break-words'} ${tone[line.kind]}`}>
                {line.text || ' '}
              </span>
            ))}
          </pre>
        </div>
        <figcaption className="mt-4 text-center text-sm text-faint">Example session with illustrative handles and figures.</figcaption>
      </figure>

      <ul className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2">
        {AGENT_SKILLS.map((skill) => (
          <li key={skill.name} className="card card-link p-5">
            <p className="font-mono text-sm font-semibold text-orange-text">/{skill.name}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{skill.summary}</p>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-10 max-w-2xl text-center">
        <BrandRow items={AGENT_CLIENTS.map((name) => ({ name, brand: CLIENT_BRANDS[name] ?? null }))} />
        <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-1.5 text-[0.9375rem] text-muted">
          And any client that connects to an
          <span className="inline-flex items-center gap-1.5 text-ink">
            <BrandIcon brand="mcp" />
            MCP server
          </span>
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center">
          <CopyPromptButton text={setupPrompt} />
          <ButtonLink href="/docs/mcp" variant="secondary" size="lg">
            Setup guide
          </ButtonLink>
        </div>
        <p className="mt-4 text-sm text-faint">Paste the prompt into your agent. It connects itself and checks the connection without spending anything.</p>
      </div>
      </div>
    </section>
  );
}
