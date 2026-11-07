import { useCallback, useMemo, useState, type ContextType, type ReactNode, type SetStateAction } from 'react'
import { ExplorerContext } from '../src/ExplorerContext.ts'
import rawGraph from '../src/data/graph.json'
import type { GenreDisplay } from '../src/graph/bubbles.ts'
import { buildIndex } from '../src/graph/graph.ts'
import {
  DEFAULT_HISTORY_FILTERS, filtersForSelectedEvent, matchesHistoryFilters, type HistoryFilters,
} from '../src/graph/history.ts'
import { revealEraRange, type TimelineOrder } from '../src/graph/layout.ts'
import {
  createTimelineModel, defaultViewRange, isTimelineView, viewForNode,
  type ExplorerView, type TimelineOrders, type TimelineView,
} from '../src/graph/timeline.ts'
import type { GraphNode, MusicGraph } from '../src/graph/types.ts'
import { DEFAULT_LOCALE } from '../src/i18n/routing.ts'

type YearRange = [number, number]

export interface StoryExplorerOptions {
  initialView?: ExplorerView
  initialSelectedId?: string | null
  initialOrder?: TimelineOrder
  initialGenreDisplay?: GenreDisplay
}

const index = buildIndex(rawGraph as MusicGraph)

function revealNode(range: YearRange, node: GraphNode | undefined): YearRange {
  const year = node?.period?.start
  return year === undefined || (year >= range[0] && year <= range[1])
    ? range
    : revealEraRange(range, year)
}

export function ExplorerStoryProvider({
  children,
  initialView = 'genre',
  initialSelectedId = null,
  initialOrder = 'family',
  initialGenreDisplay = 'bars',
}: StoryExplorerOptions & { children: ReactNode }) {
  const [location, setLocation] = useState(() => {
    const node = initialSelectedId ? index.nodeById.get(initialSelectedId) : undefined
    if (initialSelectedId && !node) throw new Error(`Unknown story node ${initialSelectedId}`)
    const view = viewForNode(node?.type, initialView)
    const timelineView = isTimelineView(view) ? view : 'genre'
    const orders: TimelineOrders = { genre: 'family', artist: 'family', instrument: 'family' }
    orders[timelineView] = initialOrder
    return {
      view,
      timelineView,
      selectedId: initialSelectedId,
      orders,
      genreDisplay: initialGenreDisplay,
    }
  })
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS)
  const [ranges, setRanges] = useState<Record<TimelineView, YearRange>>(() => {
    const initial: Record<TimelineView, YearRange> = {
      genre: defaultViewRange('genre'),
      artist: defaultViewRange('artist'),
      instrument: defaultViewRange('instrument'),
    }
    const node = location.selectedId ? index.nodeById.get(location.selectedId) : undefined
    if (isTimelineView(location.view)) {
      initial[location.view] = revealNode(initial[location.view], node)
    }
    return initial
  })
  const model = useMemo(() => createTimelineModel(index, location.timelineView), [location.timelineView])

  const selectNode = useCallback((id: string | null) => {
    const node = id ? index.nodeById.get(id) : undefined
    if (id && !node) throw new Error(`Cannot select unknown node ${id}`)
    if (node?.type === 'event') {
      setHistoryFilters((current) => filtersForSelectedEvent(current, node))
    }
    const view = viewForNode(node?.type, location.view)
    setLocation((current) => ({
      ...current, view, timelineView: isTimelineView(view) ? view : current.timelineView, selectedId: id,
    }))
    if (node?.period && isTimelineView(view)) {
      setRanges((current) => ({ ...current, [view]: revealNode(current[view], node) }))
    }
  }, [location.view])

  const changeView = useCallback((view: ExplorerView) => {
    setLocation((current) => current.view === view ? current : {
      ...current, view, timelineView: isTimelineView(view) ? view : current.timelineView, selectedId: null,
    })
  }, [])

  const changeHistoryFilters = useCallback((next: HistoryFilters) => {
    const node = location.selectedId ? index.nodeById.get(location.selectedId) : undefined
    if (node?.type === 'event' && !matchesHistoryFilters(node, next)) selectNode(null)
    setHistoryFilters(next)
  }, [location.selectedId, selectNode])

  const changeOrder = useCallback((order: string) => {
    if (order !== 'family' && order !== 'oldest-first') {
      throw new Error(`Unknown timeline order ${order}`)
    }
    setLocation((current) => {
      if (!isTimelineView(current.view)) throw new Error('History does not have a timeline order')
      return current.orders[current.view] === order ? current : {
        ...current, orders: { ...current.orders, [current.view]: order },
      }
    })
  }, [])

  const changeGenreDisplay = useCallback((genreDisplay: GenreDisplay) => {
    setLocation((current) => ({ ...current, genreDisplay }))
  }, [])

  const goHome = useCallback(() => {
    setHistoryFilters(DEFAULT_HISTORY_FILTERS)
    setLocation({
      view: 'genre',
      timelineView: 'genre',
      selectedId: null,
      orders: { genre: 'family', artist: 'family', instrument: 'family' },
      genreDisplay: 'bars',
    })
    setRanges({
      genre: defaultViewRange('genre'),
      artist: defaultViewRange('artist'),
      instrument: defaultViewRange('instrument'),
    })
  }, [])

  const setViewRange = useCallback((range: SetStateAction<YearRange>) => {
    if (!isTimelineView(location.view)) throw new Error('History does not have a timeline range')
    const view = location.view
    setRanges((current) => ({
      ...current,
      [view]: typeof range === 'function' ? range(current[view]) : range,
    }))
  }, [location.view])

  const value = useMemo<NonNullable<ContextType<typeof ExplorerContext>>>(() => ({
    index,
    model,
    locale: DEFAULT_LOCALE,
    isHome: false,
    ...location,
    order: location.orders[location.timelineView],
    selectNode,
    changeView,
    changeOrder,
    changeGenreDisplay,
    goHome,
    historyFilters,
    changeHistoryFilters,
    viewRange: ranges[location.timelineView],
    setViewRange,
  }), [model, location, selectNode, changeView, changeOrder, changeGenreDisplay, goHome, historyFilters, changeHistoryFilters, ranges, setViewRange])

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>
}
