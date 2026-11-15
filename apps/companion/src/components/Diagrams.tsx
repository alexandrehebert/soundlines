import type { CSSProperties, ReactNode } from 'react'
import { PreviewView } from './Previews.tsx'
import { actors, fill, type Actor, type LocalizedContent, type Example, type Flow, type FlowLoop, type Locale, type Output, type Page } from '../content.ts'

const actorColor = (actor: Actor) => ({ '--actor': `var(--color-${actor})` }) as CSSProperties

const icons: Record<Actor, ReactNode> = {
  human: (
    <>
      <circle cx="8" cy="5" r="2.75" />
      <path d="M2.5 14.5c0-3 2.5-4.75 5.5-4.75s5.5 1.75 5.5 4.75" />
    </>
  ),
  agent: <path d="M8 1.5 9.6 6.4 14.5 8 9.6 9.6 8 14.5 6.4 9.6 1.5 8 6.4 6.4Z" />,
  model: <path d="M1 8h2.2l1.6-4.5 2.8 9 2.4-7 1.8 4.5H15" />,
  script: <path d="m5.5 4-4 4 4 4m5-8 4 4-4 4" />,
  test: (
    <>
      <circle cx="8" cy="8" r="6.5" />
      <path d="m5 8.2 2 2 4-4.2" />
    </>
  ),
}

const outputIcons: Record<Output, ReactNode> = {
  doc: (
    <>
      <path d="M3.5 1.5h6l3 3v10h-9Z" />
      <path d="M6 8h4.5M6 11h4.5" />
    </>
  ),
  decision: <path d="M3.5 14.5v-12h9l-2 3 2 3h-9" />,
  log: <path d="M6 4h8M6 8h8M6 12h8M2.5 4h.01M2.5 8h.01M2.5 12h.01" />,
  data: <path d="M5.5 2.5c-1.5 0-2 .7-2 2V6c0 1-.5 2-1.5 2 1 0 1.5 1 1.5 2v1.5c0 1.3.5 2 2 2m5-11c1.5 0 2 .7 2 2V6c0 1 .5 2 1.5 2-1 0-1.5 1-1.5 2v1.5c0 1.3-.5 2-2 2" />,
  report: (
    <>
      <rect x="3" y="2.5" width="10" height="12" rx="1.5" />
      <path d="m5.75 8.75 1.75 1.75 3-3.25M6.5 1.5h3" />
    </>
  ),
  code: <path d="m5 4.5-3.5 3.5L5 11.5m6-7 3.5 3.5-3.5 3.5M9.25 2.5l-2.5 11" />,
  image: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <circle cx="5.5" cy="6" r="1.25" />
      <path d="m14.5 11-4-4-6.5 6.5" />
    </>
  ),
  audio: (
    <>
      <path d="M6 12.5V3l7-1.5V11" />
      <circle cx="4.25" cy="12.5" r="1.75" />
      <circle cx="11.25" cy="11" r="1.75" />
    </>
  ),
  app: (
    <>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <path d="M1.5 5.5h13M4 4h.01M6 4h.01" />
    </>
  ),
}

function Icon({ children, className = 'size-4' }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

const ActorIcon = ({ actor, className }: { actor: Actor; className?: string }) => <Icon className={className}>{icons[actor]}</Icon>

export function Legend({ content, flows }: { content: LocalizedContent; flows: Flow[] }) {
  const usedActors = new Set(flows.flatMap((flow) => flow.steps.map((step) => step.actor)))
  if (usedActors.size === 0) return null

  return (
    <div className="mt-4 border-y border-line py-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="eyebrow text-muted">{content.legend}</span>
        {actors.filter((actor) => usedActors.has(actor)).map((actor) => (
          <span key={actor} className="inline-flex items-center gap-1.5" style={actorColor(actor)}>
            <span className="grid size-6 place-items-center rounded-full border border-(--actor) text-(--actor)">
              <ActorIcon actor={actor} className="size-3.5" />
            </span>
            {content.actors[actor]}
          </span>
        ))}
      </div>
    </div>
  )
}

const loopEnd = (loop: FlowLoop) => Math.max(...loop.from)

/** Dashed return paths in the gutter left of the line, one lane per loop (shortest innermost). `row` 0 is the station, 1 the product. */
function LoopLanes({ loops, step, row }: { loops: FlowLoop[]; step: number; row: 0 | 1 }) {
  return (
    <span aria-hidden="true" className="flow-gutter">
      {loops.map((loop, lane) => {
        const end = loopEnd(loop)
        if (step < loop.to || step > end) return null
        const style = { '--lane': lane } as CSSProperties
        if (row === 0) return <span key={lane} style={style} className={step === loop.to ? 'flow-loop-in' : 'flow-loop-pass'} />
        if (step === end) return <span key={lane} style={style} className="flow-loop-out" />
        return (
          <span key={lane} className="contents">
            <span style={style} className="flow-loop-pass flow-loop-gap" />
            {loop.from.includes(step) && <span style={style} className="flow-loop-branch" />}
          </span>
        )
      })}
    </span>
  )
}

/** A workflow drawn as a vertical metro line; what each step produces sits on the arrow to the next. */
export function FlowDiagram({ content, flow, id, locale }: { content: LocalizedContent; flow: Flow; id: string; locale: Locale }) {
  const loops = [...(flow.loops ?? [])].sort((a, b) => loopEnd(a) - a.to - (loopEnd(b) - b.to))
  return (
    <section aria-labelledby={id} className="my-14">
      <h2 id={id} className="heading-2">{flow.title}</h2>
      <p className="mt-2 max-w-190 text-muted">{flow.caption}</p>
      <ol className={`flow mt-8 ${loops.length ? 'flow-looped' : ''}`} style={{ '--lanes': loops.length } as CSSProperties}>
        {flow.steps.map((step, i) => {
          const final = i === flow.steps.length - 1
          return (
            <li key={step.title} className="flow-step" style={actorColor(step.actor)}>
              {loops.length > 0 && <LoopLanes loops={loops} step={i + 1} row={0} />}
              <span className="flow-rail-cell">
                <span className="flow-node">
                  <ActorIcon actor={step.actor} className="size-5" />
                  <span className="flow-number">{i + 1}</span>
                </span>
                <span className="flow-rail" />
              </span>
              <div className="pb-4">
                <p className="text-[0.7rem] font-semibold tracking-widest text-(--actor) uppercase">{content.actors[step.actor]}</p>
                <h3 className="mt-1 font-semibold leading-snug">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-[1.7] text-muted">{step.text}</p>
              </div>
              {loops.length > 0 && <LoopLanes loops={loops} step={i + 1} row={1} />}
              <span className="flow-rail-cell">
                <span className={`flow-output-icon ${final ? 'flow-output-final' : ''}`}>
                  <Icon className="size-3.5">{outputIcons[step.output[0]]}</Icon>
                </span>
                {!final && <span className="flow-rail flow-rail-out" />}
              </span>
              <div className="grid min-w-0 justify-items-start gap-2.5 pt-1">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className={`text-[0.65rem] font-semibold tracking-widest uppercase ${final ? 'text-accent' : 'text-muted'}`}>{final ? content.result : content.produces}</span>
                  <span className="font-medium">{step.output[1]}</span>
                </p>
                <PreviewView preview={step.preview} locale={locale} final={final} />
                {loops
                  .filter((loop) => loopEnd(loop) === i + 1)
                  .map((loop) => (
                    <p key={loop.to} className="flex flex-wrap items-center gap-x-2 rounded-lg border border-dashed border-accent/60 px-3 py-1.5 text-sm">
                      <span aria-hidden="true" className="text-accent">↺</span>
                      {loop.label}
                      <span className="font-medium text-accent">
                        → {content.backTo} {loop.to}
                      </span>
                    </p>
                  ))}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

const laneColors = ['--color-agent', '--color-human', '--color-model']

export function Overview({ overview }: { overview: NonNullable<Page['overview']> }) {
  return (
    <section aria-labelledby="overview" className="my-14">
      <h2 id="overview" className="heading-2">{overview.title}</h2>
      <p className="mt-2 max-w-190 text-muted">{overview.intro}</p>
      <div className="mt-8 grid items-center gap-6 rounded-2xl border border-line bg-surface p-5 sm:p-8 lg:grid-cols-[1fr_auto_11rem]">
        <div className="grid gap-5">
          {overview.lanes.map(([title, stations], lane) => (
            <div key={title} className="grid gap-3 sm:grid-cols-[6.5rem_1fr] sm:items-center" style={{ '--lane': `var(${laneColors[lane % laneColors.length]})` } as CSSProperties}>
              <h3 className="font-semibold text-(--lane)">{title}</h3>
              <ol aria-label={title} className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm">
                {stations.map((station, i) => (
                  <li key={station} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden="true" className="text-(--lane)">→</span>}
                    <span className="rounded-full border border-(--lane)/40 bg-bg px-3 py-1">{station}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <span aria-hidden="true" className="justify-self-center text-2xl text-accent max-lg:rotate-90">⟶</span>
        <p className="grid place-items-center rounded-xl border-2 border-accent p-5 text-center font-semibold">
          <span className="mb-1 text-2xl" aria-hidden="true">◎</span>
          {overview.destination}
        </p>
      </div>
    </section>
  )
}

export function Stats({ content, locale }: { content: LocalizedContent; locale: Locale }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
      {content.stats.map(([key, label]) => (
        <div key={key} className="flex flex-col bg-surface p-5">
          <dt className="mt-1 text-sm text-muted">{label}</dt>
          <dd className="order-first text-3xl font-bold tracking-tight text-fg">{fill(`{${key}}`, locale)}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ExampleCard({ content, example, href }: { content: LocalizedContent; example: Example; href: string }) {
  return (
    <section aria-labelledby="example" className="my-14 max-w-212 rounded-2xl border border-accent/50 bg-surface p-6 sm:p-8">
      <p className="eyebrow">{content.example}</p>
      <h2 id="example" className="heading-2 mt-2">{example.title}</h2>
      <p className="mt-2 text-muted">{example.intro}</p>
      <dl className="mt-6 grid gap-x-6 gap-y-3 border-t border-line pt-6 text-sm sm:grid-cols-[9rem_1fr]">
        {example.rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-mono text-xs tracking-wider text-accent uppercase sm:pt-0.5">{label}</dt>
            <dd className="leading-[1.7] max-sm:mb-2">{value}</dd>
          </div>
        ))}
      </dl>
      <a className="mt-6 inline-block underline underline-offset-4" href={href}>
        {example.link} <span aria-hidden="true">↗</span>
      </a>
    </section>
  )
}
