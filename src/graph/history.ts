import { EVENT_CATEGORY_LABELS, type EventCategory, type GraphNode, type MusicGraph, type Period } from './types.ts'

export interface HistoryEvent extends GraphNode {
  type: 'event'
  period: Period
  category: EventCategory
}

export interface HistoryFilters {
  category: EventCategory | 'all'
  landmarksOnly: boolean
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
  category: 'all',
  landmarksOnly: false,
}

export const HISTORY_ERAS = [
  { id: 'before-1400', label: 'Before 1400', before: 1400 },
  { id: '1400-1599', label: '1400–1599', before: 1600 },
  { id: '1600-1899', label: '1600–1899', before: 1900 },
  { id: '1900-1949', label: '1900–1949', before: 1950 },
  { id: '1950-1999', label: '1950–1999', before: 2000 },
  { id: '2000-onward', label: '2000 onward', before: Infinity },
] as const

export function historyEvents(graph: MusicGraph): HistoryEvent[] {
  const events: HistoryEvent[] = []
  for (const node of graph.nodes) {
    if (node.type !== 'event') continue
    const { period, category } = node
    if (!period || !Number.isInteger(period.start) || !category || !Object.hasOwn(EVENT_CATEGORY_LABELS, category)) {
      throw new Error(`Historical event ${node.id} needs a dated period and a known category`)
    }
    if (period.end != null && (!Number.isInteger(period.end) || period.end < period.start)) {
      throw new Error(`Historical event ${node.id} has an invalid end year`)
    }
    events.push({ ...node, type: 'event', period, category })
  }
  return events.sort((a, b) =>
    a.period.start - b.period.start || a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  )
}

export function matchesHistoryFilters(
  event: Pick<GraphNode, 'category' | 'significance'>,
  filters: HistoryFilters,
): boolean {
  return (filters.category === 'all' || event.category === filters.category)
    && (!filters.landmarksOnly || event.significance === 'landmark')
}

export function filtersForSelectedEvent(filters: HistoryFilters, event: GraphNode): HistoryFilters {
  if (event.type !== 'event' || matchesHistoryFilters(event, filters)) return filters
  return {
    category: filters.category === event.category ? filters.category : 'all',
    landmarksOnly: filters.landmarksOnly && event.significance === 'landmark',
  }
}

export function groupHistoryEvents(events: readonly HistoryEvent[], filters: HistoryFilters) {
  const groups = HISTORY_ERAS.map((era) => ({ ...era, events: [] as HistoryEvent[] }))
  for (const event of events) {
    if (!matchesHistoryFilters(event, filters)) continue
    const group = groups.find((era) => event.period.start < era.before)
    if (!group) throw new Error(`No history era for ${event.id}`)
    group.events.push(event)
  }
  return groups.filter((group) => group.events.length > 0)
}

export function formatEventPeriod(period: Period): string {
  const prefix = period.precision === 'circa' ? 'c. ' : ''
  const end = period.end == null ? ' – now' : period.end === period.start ? '' : ` – ${period.end}`
  const approximate = period.precision === 'decade' ? ' (approx.)' : ''
  return `${prefix}${period.start}${end}${approximate}`
}
