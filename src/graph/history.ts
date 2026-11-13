import { buildIndex, type GraphIndex } from './graph.ts'
import { EVENT_CATEGORY_LABELS, type EventCategory, type GraphNode, type MusicGraph, type Period } from './types.ts'
import { catalogueFor } from '../i18n/catalogue.ts'
import { DEFAULT_LOCALE, type Locale } from '../i18n/routing.ts'
import { formatYear } from '../theme.ts'

const eraLabels = catalogueFor(DEFAULT_LOCALE).history.eras

export interface HistoryEntry extends GraphNode {
  type: 'event'
  category: EventCategory
  genreIds: readonly string[]
}

export interface HistoryEvent extends HistoryEntry {
  period: Period
}

export interface HistoryFilters {
  category: EventCategory | 'all'
  landmarksOnly: boolean
  genreId?: string
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
  category: 'all',
  landmarksOnly: false,
}

export const HISTORY_ERAS = [
  { id: 'before-1400', label: eraLabels['before-1400'], before: 1400 },
  { id: '1400-1599', label: eraLabels['1400-1599'], before: 1600 },
  { id: '1600-1899', label: eraLabels['1600-1899'], before: 1900 },
  { id: '1900-1949', label: eraLabels['1900-1949'], before: 1950 },
  { id: '1950-1999', label: eraLabels['1950-1999'], before: 2000 },
  { id: '2000-onward', label: eraLabels['2000-onward'], before: Infinity },
] as const

export function historyEventGenreIds(index: GraphIndex, id: string): string[] {
  const ids = new Set<string>()
  for (const { type, to } of index.outEdges.get(id) ?? []) {
    if ((type === 'context_for' || type === 'recognized' || type === 'shaped')
      && index.nodeById.get(to)?.type === 'genre') ids.add(to)
  }
  return [...ids]
}

export function createHistoryModel(graph: MusicGraph, index = buildIndex(graph)) {
  const dated: HistoryEvent[] = []
  const undated: HistoryEntry[] = []
  for (const node of graph.nodes) {
    if (node.type !== 'event') continue
    const { period, category } = node
    if (!category || !Object.hasOwn(EVENT_CATEGORY_LABELS, category)) {
      throw new Error(`Historical event ${node.id} needs a known category`)
    }
    const event = { ...node, type: 'event' as const, category, genreIds: historyEventGenreIds(index, node.id) }
    if (period == null) {
      undated.push(event)
      continue
    }
    if (!Number.isInteger(period.start)) {
      throw new Error(`Historical event ${node.id} has an invalid start year`)
    }
    if (period.end != null && (!Number.isInteger(period.end) || period.end < period.start)) {
      throw new Error(`Historical event ${node.id} has an invalid end year`)
    }
    dated.push({ ...event, period })
  }
  const byName = (a: GraphNode, b: GraphNode) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  return {
    dated: dated.sort((a, b) => a.period.start - b.period.start || byName(a, b)),
    undated: undated.sort(byName),
  }
}

export function matchesHistoryFilters(
  event: Pick<GraphNode, 'category' | 'significance'>,
  filters: HistoryFilters,
  genreIds: readonly string[] = [],
): boolean {
  return (filters.category === 'all' || event.category === filters.category)
    && (!filters.genreId || genreIds.includes(filters.genreId))
    && (!filters.landmarksOnly || event.significance === 'landmark')
}

export function filtersForSelectedEvent(
  filters: HistoryFilters,
  event: GraphNode,
  genreIds: readonly string[] = [],
): HistoryFilters {
  if (event.type !== 'event' || matchesHistoryFilters(event, filters, genreIds)) return filters
  return {
    ...(filters.genreId && genreIds.includes(filters.genreId) ? { genreId: filters.genreId } : {}),
    category: filters.category === event.category ? filters.category : 'all',
    landmarksOnly: filters.landmarksOnly && event.significance === 'landmark',
  }
}

export function groupHistoryEvents(events: readonly HistoryEvent[], filters: HistoryFilters) {
  const groups = HISTORY_ERAS.map((era) => ({ ...era, events: [] as HistoryEvent[] }))
  for (const event of events) {
    if (!matchesHistoryFilters(event, filters, event.genreIds)) continue
    const group = groups.find((era) => event.period.start < era.before)
    if (!group) throw new Error(`No history era for ${event.id}`)
    group.events.push(event)
  }
  return groups.filter((group) => group.events.length > 0)
}

export function formatEventPeriod(period: Period, locale: Locale = DEFAULT_LOCALE): string {
  const dates = catalogueFor(locale).dates
  const prefix = period.precision === 'circa' ? `${dates.circa} ` : ''
  const end = period.end == null
    ? ` – ${dates.now}`
    : period.end === period.start ? '' : ` – ${formatYear(period.end, locale)}`
  const approximate = period.precision === 'decade' ? dates.approximate : ''
  const estimated = period.estimated && period.precision !== 'circa' ? dates.estimated : ''
  return `${prefix}${formatYear(period.start, locale)}${end}${approximate}${estimated}`
}
