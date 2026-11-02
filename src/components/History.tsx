import { ArrowUpRight, ChevronDown, Star } from 'lucide-react'
import { useEffect, useId, useMemo, useRef } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import type { GraphIndex } from '../graph/graph.ts'
import {
  formatEventPeriod,
  groupHistoryEvents,
  historyEvents,
} from '../graph/history.ts'
import { EVENT_CATEGORY_LABELS, type EventCategory, type GraphNode } from '../graph/types.ts'
import { NODE_TYPE_COLORS } from '../theme.ts'

const categories = Object.entries(EVENT_CATEGORY_LABELS) as [EventCategory, string][]

function isEventCategory(value: string): value is EventCategory {
  return Object.hasOwn(EVENT_CATEGORY_LABELS, value)
}

function eventConnections(index: GraphIndex, id: string): GraphNode[] {
  const related = new Map<string, GraphNode>()
  for (const edge of index.outEdges.get(id) ?? []) {
    if (edge.type !== 'shaped' && edge.type !== 'involved' && edge.type !== 'occurred_in') continue
    const node = index.nodeById.get(edge.to)
    if (!node) throw new Error(`Event connection ${edge.id} references unknown node ${edge.to}`)
    related.set(node.id, node)
  }
  return [...related.values()].slice(0, 3)
}

export function History() {
  const { index, selectedId, selectNode, historyFilters: filters, changeHistoryFilters } = useExplorer()
  const events = useMemo(() => historyEvents(index.graph), [index.graph])
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedId), [events, selectedId])
  const groups = useMemo(() => groupHistoryEvents(events, filters), [events, filters])
  const eventRefs = useRef(new Map<string, HTMLLIElement>())
  const eraRefs = useRef(new Map<string, HTMLElement>())
  const viewportRef = useRef<HTMLDivElement>(null)
  const categoryId = useId()
  const resultCount = groups.reduce((count, group) => count + group.events.length, 0)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!selectedEvent || !viewport) return
    const revealSelection = () => {
      eventRefs.current.get(selectedEvent.id)?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
    revealSelection()
    const observer = new ResizeObserver(revealSelection)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [selectedEvent, groups])

  return (
    <div className="flex h-full min-w-0 flex-col" role="region" aria-label="Music history timeline">
      <div className="shrink-0 border-b border-slate-800 bg-slate-950/95 px-5 py-3 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full border border-slate-700 bg-slate-900 p-1" role="group" aria-label="Event importance">
            <button
              type="button"
              aria-pressed={!filters.landmarksOnly}
              onClick={() => changeHistoryFilters({ ...filters, landmarksOnly: false })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
                !filters.landmarksOnly ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All events
            </button>
            <button
              type="button"
              aria-pressed={filters.landmarksOnly}
              onClick={() => changeHistoryFilters({ ...filters, landmarksOnly: true })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
                filters.landmarksOnly ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Landmarks
            </button>
          </div>
          <label htmlFor={categoryId} className="relative block rounded-full border border-slate-700 bg-slate-900 p-1">
            <span className="sr-only">Topic</span>
            <select
              id={categoryId}
              value={filters.category}
              onChange={(event) => {
                const category = event.currentTarget.value
                if (category !== 'all' && !isEventCategory(category)) throw new Error(`Unknown event category ${category}`)
                changeHistoryFilters({ ...filters, category })
              }}
              className="block max-w-48 cursor-pointer appearance-none rounded-full bg-violet-500/20 py-1.5 pl-3 pr-8 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All topics</option>
              {categories.map(([category, label]) => <option key={category} value={category} className="bg-slate-900 text-slate-200">{label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-200" aria-hidden="true" />
          </label>
        </div>
        {groups.length > 0 && (
          <nav aria-label="Jump to an era" className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-0.5">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => eraRefs.current.get(group.id)?.scrollIntoView({ block: 'start', inline: 'start' })}
                className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              >
                {group.label}
              </button>
            ))}
          </nav>
        )}
        <p aria-live="polite" className="mt-2 text-xs leading-relaxed text-slate-500">
          Showing {resultCount} {resultCount === 1 ? 'event' : 'events'} by start year · dates may be approximate,
          landmarks are editorial.
        </p>
      </div>

      <div
        ref={viewportRef}
        tabIndex={0}
        data-history-scroll
        className="min-h-0 flex-1 overflow-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/70"
      >
        <div className="px-5 pb-16 pt-6 sm:px-8 md:flex md:w-max md:min-w-full md:items-start md:pb-8">
          {groups.length === 0 ? (
            <div role="status" className="rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-8 text-center">
              <p className="text-sm text-slate-300">No events match these filters.</p>
              <button
                type="button"
                onClick={() => changeHistoryFilters({ category: 'all', landmarksOnly: false })}
                className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              >
                Clear filters
              </button>
            </div>
          ) : groups.map((group) => (
            <section
              key={group.id}
              ref={(element) => {
                if (element) eraRefs.current.set(group.id, element)
                else eraRefs.current.delete(group.id)
              }}
              className="scroll-mt-6 md:shrink-0 md:scroll-ml-8"
              aria-labelledby={`history-era-${group.id}`}
            >
              <div className="mb-5 flex items-center gap-4">
                <h3 id={`history-era-${group.id}`} className="shrink-0 text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                  {group.label}
                </h3>
                <div className="h-px flex-1 bg-slate-800 md:hidden" />
              </div>
              <ol className="relative mb-10 space-y-4 border-l border-slate-800 pl-5 sm:ml-3 sm:pl-8 md:mb-0 md:ml-0 md:flex md:items-start md:gap-4 md:space-y-0 md:border-l-0 md:border-t md:pl-0 md:pr-8 md:pt-6">
                {group.events.map((event) => {
                  const related = eventConnections(index, event.id)
                  const selected = selectedId === event.id
                  return (
                    <li
                      key={event.id}
                      ref={(element) => {
                        if (element) eventRefs.current.set(event.id, element)
                        else eventRefs.current.delete(event.id)
                      }}
                      data-history-event={event.id}
                      className="relative scroll-mt-6 md:w-[22rem] md:shrink-0 md:scroll-ml-8"
                    >
                      <span className="absolute -left-[25px] top-5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-rose-400 sm:-left-[37px] md:-top-[30px] md:left-5 md:after:absolute md:after:left-1/2 md:after:top-full md:after:h-6 md:after:w-px md:after:bg-slate-800" aria-hidden="true" />
                      <article className={`rounded-2xl border bg-slate-900/50 p-4 transition-colors sm:p-5 ${
                        selected ? 'border-violet-400/70 bg-violet-500/10' : 'border-slate-800 hover:border-slate-700'
                      }`}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="text-sm font-bold tabular-nums text-rose-300">{formatEventPeriod(event.period)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {EVENT_CATEGORY_LABELS[event.category]}
                          </span>
                          {event.significance === 'landmark' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                              <Star className="h-3 w-3" aria-hidden="true" /> Landmark
                            </span>
                          )}
                        </div>
                        <h4 className="mt-2">
                          <button
                            type="button"
                            aria-pressed={selected}
                            onClick={() => selectNode(event.id)}
                            className="rounded text-left text-base font-bold leading-snug text-slate-100 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                          >
                            {event.name}
                          </button>
                        </h4>
                        {event.description && <p className="mt-2 text-sm leading-6 text-slate-400">{event.description}</p>}
                        {related.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Connected</span>
                            {related.map((node) => (
                              <button
                                key={node.id}
                                type="button"
                                onClick={() => selectNode(node.id)}
                                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                              >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: NODE_TYPE_COLORS[node.type] }} aria-hidden="true" />
                                {node.name}
                                <ArrowUpRight className="h-3 w-3 text-slate-500" aria-hidden="true" />
                              </button>
                            ))}
                          </div>
                        )}
                      </article>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
