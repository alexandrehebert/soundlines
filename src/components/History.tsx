import { ArrowUpRight, ChevronDown, Star } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../ExplorerContext.ts'
import type { GraphIndex } from '../graph/graph.ts'
import {
  createHistoryModel,
  formatEventPeriod,
  groupHistoryEvents,
  matchesHistoryFilters,
} from '../graph/history.ts'
import { EVENT_CATEGORY_LABELS, type EventCategory, type GraphNode } from '../graph/types.ts'
import { chartColor, NODE_TYPE_COLORS } from '../theme.ts'
import { graphLabels } from '../i18n/graphLabels.ts'
import { UndatedEntries } from './UndatedEntries.tsx'

const categories = Object.keys(EVENT_CATEGORY_LABELS) as EventCategory[]

function isEventCategory(value: string): value is EventCategory {
  return Object.hasOwn(EVENT_CATEGORY_LABELS, value)
}

function eventConnections(index: GraphIndex, id: string): GraphNode[] {
  const related = new Map<string, GraphNode>()
  for (const edge of index.outEdges.get(id) ?? []) {
    if (edge.type !== 'shaped' && edge.type !== 'context_for' && edge.type !== 'recognized'
      && edge.type !== 'involved' && edge.type !== 'occurred_in') continue
    const node = index.nodeById.get(edge.to)
    if (!node) throw new Error(`Event connection ${edge.id} references unknown node ${edge.to}`)
    related.set(node.id, node)
  }
  return [...related.values()].slice(0, 3)
}

export function History() {
  const { index, locale, selectedId, selectNode, historyFilters: filters, changeHistoryFilters } = useExplorer()
  const t = useTranslations('history')
  const tEras = useTranslations('history.eras')
  const labels = graphLabels(locale)
  const history = useMemo(() => createHistoryModel(index.graph), [index.graph])
  const events = history.dated
  const undated = useMemo(
    () => history.undated.filter((event) => matchesHistoryFilters(event, filters)),
    [history.undated, filters],
  )
  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedId), [events, selectedId])
  const groups = useMemo(() => groupHistoryEvents(events, filters), [events, filters])
  const eventSides = useMemo(() => new Map(
    groups.flatMap((group) => group.events)
      .map((event, index) => [event.id, index % 2 === 0 ? 'above' : 'below'] as const),
  ), [groups])
  const eventRefs = useRef(new Map<string, HTMLElement>())
  const eraRefs = useRef(new Map<string, HTMLElement>())
  const viewportRef = useRef<HTMLDivElement>(null)
  const navigationRef = useRef<HTMLElement>(null)
  const [activeEraId, setActiveEraId] = useState<string | null>(null)
  const currentEraId = groups.find((group) => group.id === activeEraId)?.id ?? groups[0]?.id
  const categoryId = useId()
  const resultCount = groups.reduce((count, group) => count + group.events.length, undated.length)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport || !groups.length) return
    const updateCurrentEra = () => {
      const horizontal = matchMedia('(min-width: 48rem)').matches
      const bounds = viewport.getBoundingClientRect()
      const position = horizontal ? viewport.scrollLeft : viewport.scrollTop
      const extent = horizontal
        ? viewport.scrollWidth - viewport.clientWidth
        : viewport.scrollHeight - viewport.clientHeight
      const leadingEdge = horizontal ? bounds.left + 32 : bounds.top + 24
      let current = groups[0].id
      for (const group of groups) {
        const era = eraRefs.current.get(group.id)
        if (!era) continue
        const rect = era.getBoundingClientRect()
        if ((horizontal ? rect.left : rect.top) <= leadingEdge + 1) current = group.id
      }
      if (extent > 0 && position >= extent - 1) current = groups[groups.length - 1].id
      setActiveEraId(current)
    }
    updateCurrentEra()
    viewport.addEventListener('scroll', updateCurrentEra, { passive: true })
    const observer = new ResizeObserver(updateCurrentEra)
    observer.observe(viewport)
    for (const era of eraRefs.current.values()) observer.observe(era)
    return () => {
      viewport.removeEventListener('scroll', updateCurrentEra)
      observer.disconnect()
    }
  }, [groups])

  useEffect(() => {
    const navigation = navigationRef.current
    const button = navigation?.querySelector<HTMLElement>('[aria-current="true"]')
    if (!navigation || !button) return
    const bounds = navigation.getBoundingClientRect()
    const rect = button.getBoundingClientRect()
    if (rect.left < bounds.left) navigation.scrollLeft -= bounds.left - rect.left
    else if (rect.right > bounds.right) navigation.scrollLeft += rect.right - bounds.right
  }, [currentEraId])

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
    <div className="flex h-full min-w-0 flex-col" role="region" aria-label={t('region')}>
      <div className="shrink-0 border-b border-slate-800 bg-slate-950/95 px-5 py-3 sm:px-8 md:grid md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-x-6">
        <div className="flex flex-wrap items-center justify-between gap-3 md:justify-start">
          <div className="flex rounded-full border border-slate-700 bg-slate-900 p-1" role="group" aria-label={t('importance')}>
            <button
              type="button"
              aria-pressed={!filters.landmarksOnly}
              onClick={() => changeHistoryFilters({ ...filters, landmarksOnly: false })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
                !filters.landmarksOnly ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('allEvents')}
            </button>
            <button
              type="button"
              aria-pressed={filters.landmarksOnly}
              onClick={() => changeHistoryFilters({ ...filters, landmarksOnly: true })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
                filters.landmarksOnly ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t('landmarks')}
            </button>
          </div>
          <label htmlFor={categoryId} className="relative block rounded-full border border-slate-700 bg-slate-900 p-1">
            <span className="sr-only">{t('topic')}</span>
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
              <option value="all" className="bg-slate-900 text-slate-200">{t('allTopics')}</option>
              {categories.map((category) => <option key={category} value={category} className="bg-slate-900 text-slate-200">{labels.eventCategories[category]}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-violet-200" aria-hidden="true" />
          </label>
        </div>
        {groups.length > 0 && (
          <nav ref={navigationRef} aria-label={t('jumpToEra')} className="mt-2 flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/50 p-0.5 md:mt-0">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                aria-current={currentEraId === group.id ? 'true' : undefined}
                onClick={() => eraRefs.current.get(group.id)?.scrollIntoView({ block: 'start', inline: 'start' })}
                className={`flex h-7 shrink-0 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/70 ${
                  currentEraId === group.id ? 'bg-violet-500/20 text-violet-200' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <span>{tEras(group.id)}</span>
              </button>
            ))}
          </nav>
        )}
        <p aria-live="polite" className="mt-2 text-xs leading-relaxed text-slate-500 md:col-span-2">
          {t('showing', {
            count: resultCount,
            dating: undated.length ? t('dating.undated', { count: undated.length }) : t('dating.dated'),
          })}
        </p>
      </div>

      <UndatedEntries label={t('undated')} nodes={undated} selectedId={selectedId} onSelect={selectNode} />

      <div
        ref={viewportRef}
        tabIndex={0}
        data-history-scroll
        className="min-h-0 flex-1 overflow-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400/70"
      >
        <div className="history-track px-5 pb-16 pt-6 sm:px-8 md:flex md:w-max md:min-w-full md:pb-6">
          {groups.length === 0 ? (
            <div role="status" className="rounded-2xl border border-slate-800 bg-slate-900/50 px-5 py-8 text-center">
              <p className="text-sm text-slate-300">
                {undated.length ? t('noDatedMatches') : t('noMatches')}
              </p>
              {!undated.length && (
                <button
                  type="button"
                  onClick={() => changeHistoryFilters({ category: 'all', landmarksOnly: false })}
                  className="mt-4 rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                >
                  {t('clearFilters')}
                </button>
              )}
            </div>
          ) : groups.map((group) => (
            <section
              key={group.id}
              ref={(element) => {
                if (element) eraRefs.current.set(group.id, element)
                else eraRefs.current.delete(group.id)
              }}
              className="history-era scroll-mt-6 md:shrink-0 md:scroll-ml-8"
              aria-labelledby={`history-era-${group.id}`}
            >
              <div className="mb-5 flex items-center gap-4">
                <h3 id={`history-era-${group.id}`} className="shrink-0 text-xs font-bold uppercase tracking-[0.16em] text-violet-300">
                  {group.label}
                </h3>
                <div className="h-px flex-1 bg-slate-800 md:hidden" />
              </div>
              <ol className="history-events relative mb-10 space-y-4 border-l border-slate-800 pl-5 sm:ml-3 sm:pl-8 md:mb-0 md:ml-0 md:space-y-0 md:border-l-0 md:pl-0 md:pr-8">
                {group.events.map((event, eventIndex) => {
                  const related = eventConnections(index, event.id)
                  const selected = selectedId === event.id
                  return (
                    <li
                      key={event.id}
                      data-history-event={event.id}
                      data-history-side={eventSides.get(event.id)}
                      style={{ gridColumn: `${eventIndex + 1} / span 2` }}
                      className="history-event relative scroll-mt-6 md:scroll-ml-8"
                    >
                      <span className="history-event-marker absolute -left-[25px] top-5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-rose-400 sm:-left-[37px] md:left-5" aria-hidden="true" />
                      <article
                        ref={(element) => {
                          if (element) eventRefs.current.set(event.id, element)
                          else eventRefs.current.delete(event.id)
                        }}
                        className={`history-event-card rounded-2xl border bg-slate-900/50 p-4 transition-colors sm:p-5 md:p-4 ${
                          selected ? 'border-violet-400/70 bg-violet-500/10' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="text-sm font-bold tabular-nums text-rose-300">{formatEventPeriod(event.period, locale)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {labels.eventCategories[event.category]}
                          </span>
                          {event.significance === 'landmark' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                              <Star className="h-3 w-3" aria-hidden="true" /> {t('landmarks')}
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
                        {event.description && <p className="mt-2 text-sm leading-6 text-slate-400 md:text-[13px] md:leading-5">{event.description}</p>}
                        {related.length > 0 && (
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">                            {t('connected')}</span>
                            {related.map((node) => (
                              <button
                                key={node.id}
                                type="button"
                                onClick={() => selectNode(node.id)}
                                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                              >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: chartColor(NODE_TYPE_COLORS[node.type]) }} aria-hidden="true" />
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
