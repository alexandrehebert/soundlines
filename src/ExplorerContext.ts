import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type SetStateAction,
} from 'react'
import { buildIndex } from './graph/graph.ts'
import {
  DEFAULT_HISTORY_FILTERS, filtersForSelectedEvent, matchesHistoryFilters, type HistoryFilters,
} from './graph/history.ts'
import { revealEraRange } from './graph/layout.ts'
import {
  createTimelineModel,
  defaultViewRange,
  isTimelineView,
  readTimelineOrders,
  VIEW_PATHS,
  viewForNode,
  viewFromUrl,
  writeTimelineOrders,
  type ExplorerView,
  type TimelineOrders,
  type TimelineView,
} from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'
import type { GenreDisplay } from './graph/bubbles.ts'
import { finishPageLoading, transitionPage } from './pageLoading.ts'
import { socialMetadata } from './socialMetadata.ts'
import { updateDocumentMetadata } from './socialMetadataClient.ts'

type YearRange = [number, number]
type ExplorerLocation = {
  view: ExplorerView
  timelineView: TimelineView
  selectedId: string | null
  orders: TimelineOrders
  genreDisplay: GenreDisplay
}

function explorerUrl({ view, selectedId, orders, genreDisplay }: ExplorerLocation): URL {
  const url = new URL(window.location.href)
  url.pathname = VIEW_PATHS[view]
  url.searchParams.delete('view')
  if (selectedId) url.searchParams.set('focus', selectedId)
  else url.searchParams.delete('focus')
  writeTimelineOrders(url.searchParams, orders)
  if (genreDisplay === 'bubbles') url.searchParams.set('layout', 'bubbles')
  else url.searchParams.delete('layout')
  return url
}

export function useExplorerState(graph: MusicGraph) {
  const index = useMemo(() => buildIndex(graph), [graph])
  const readLocation = useCallback((): ExplorerLocation => {
    const url = new URL(window.location.href)
    const params = url.searchParams
    const id = params.get('focus')
    const node = id ? index.nodeById.get(id) : undefined
    const view = viewForNode(node?.type, viewFromUrl(url))
    const timelineView = isTimelineView(view) ? view : 'genre'
    const orders = readTimelineOrders(params)
    const genreDisplay = params.get('layout') === 'bubbles' ? 'bubbles' : 'bars'
    return { view, timelineView, selectedId: node?.id ?? null, orders, genreDisplay }
  }, [index])
  const [location, setLocation] = useState(readLocation)
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS)
  const { view, timelineView, selectedId, orders, genreDisplay } = location
  const order = orders[timelineView]
  const [ranges, setRanges] = useState<Record<TimelineView, YearRange>>(() => {
    const node = location.selectedId ? index.nodeById.get(location.selectedId) : undefined
    const initial: Record<TimelineView, YearRange> = {
      genre: defaultViewRange('genre'),
      artist: defaultViewRange('artist'),
      instrument: defaultViewRange('instrument'),
    }
    if (node?.period && isTimelineView(location.view)) {
      initial[location.view] = revealEraRange(initial[location.view], node.period.start)
    }
    return initial
  })
  const model = useMemo(() => createTimelineModel(index, timelineView), [index, timelineView])

  useEffect(() => finishPageLoading(), [location])

  const revealSelection = useCallback((next: ExplorerLocation) => {
    const node = next.selectedId ? index.nodeById.get(next.selectedId) : undefined
    if (node?.type === 'event') {
      setHistoryFilters((current) => filtersForSelectedEvent(current, node))
    }
    if (!node?.period || !isTimelineView(next.view)) return
    const targetView = next.view
    const year = node.period.start
    setRanges((current) => {
      const [start, end] = current[targetView]
      if (year >= start && year <= end) return current
      return {
        ...current,
        [targetView]: revealEraRange([start, end], year),
      }
    })
  }, [index])

  const navigate = useCallback((next: ExplorerLocation) => {
    const update = () => {
      if (next.view !== view) window.history.pushState(null, '', explorerUrl(next))
      setLocation(next)
    }
    if (next.view !== view || next.orders[next.timelineView] !== order || next.genreDisplay !== genreDisplay) {
      transitionPage(update)
    } else {
      update()
    }
  }, [view, order, genreDisplay])

  useEffect(() => {
    const url = explorerUrl(location)
    if (url.href !== window.location.href) window.history.replaceState(null, '', url)
    updateDocumentMetadata(document, socialMetadata(url, index.nodeById))
  }, [index, location])

  useEffect(() => {
    const onPopState = () => {
      const next = readLocation()
      revealSelection(next)
      transitionPage(() => setLocation(next))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [readLocation, revealSelection])

  const selectNode = useCallback((id: string | null) => {
    const node = id ? index.nodeById.get(id) : undefined
    if (id && !node) throw new Error(`Cannot select unknown node ${id}`)
    const nextView = viewForNode(node?.type, view)
    const next = {
      ...location,
      view: nextView,
      timelineView: isTimelineView(nextView) ? nextView : timelineView,
      selectedId: id,
    }
    revealSelection(next)
    navigate(next)
  }, [index, view, timelineView, location, revealSelection, navigate])

  const changeView = useCallback((nextView: ExplorerView) => {
    if (view === nextView) return
    navigate({
      ...location,
      view: nextView,
      timelineView: isTimelineView(nextView) ? nextView : timelineView,
      selectedId: null,
    })
  }, [view, timelineView, location, navigate])

  const changeHistoryFilters = useCallback((next: HistoryFilters) => {
    const node = selectedId ? index.nodeById.get(selectedId) : undefined
    if (node?.type === 'event' && !matchesHistoryFilters(node, next)) selectNode(null)
    setHistoryFilters(next)
  }, [index, selectedId, selectNode])

  const changeOrder = useCallback((nextOrder: string) => {
    if (!isTimelineView(view)) throw new Error('History does not have a timeline order')
    if (nextOrder !== 'family' && nextOrder !== 'oldest-first') {
      throw new Error(`Unknown timeline order ${nextOrder}`)
    }
    if (order === nextOrder) return
    navigate({ ...location, orders: { ...orders, [view]: nextOrder } })
  }, [view, order, orders, location, navigate])

  const changeGenreDisplay = useCallback((display: GenreDisplay) => {
    if (genreDisplay === display) return
    navigate({ ...location, genreDisplay: display })
  }, [genreDisplay, location, navigate])

  const goHome = useCallback(() => {
    const params = new URLSearchParams()
    setHistoryFilters(DEFAULT_HISTORY_FILTERS)
    setRanges({
      genre: defaultViewRange('genre'),
      artist: defaultViewRange('artist'),
      instrument: defaultViewRange('instrument'),
    })
    navigate({ view: 'genre', timelineView: 'genre', selectedId: null, orders: readTimelineOrders(params), genreDisplay: 'bars' })
  }, [navigate])

  const setViewRange = useCallback((range: SetStateAction<YearRange>) => {
    if (!isTimelineView(view)) throw new Error('History does not have a timeline range')
    setRanges((current) => ({
      ...current,
      [view]: typeof range === 'function' ? range(current[view]) : range,
    }))
  }, [view])

  return useMemo(() => ({
    index, model, view, selectedId, selectNode, changeView, order, changeOrder,
    genreDisplay, changeGenreDisplay, goHome, historyFilters, changeHistoryFilters,
    viewRange: ranges[timelineView], setViewRange,
  }), [index, model, view, timelineView, selectedId, selectNode, changeView, order, changeOrder, genreDisplay, changeGenreDisplay, goHome, historyFilters, changeHistoryFilters, ranges, setViewRange])
}

export const ExplorerContext = createContext<ReturnType<typeof useExplorerState> | null>(null)

export function useExplorer() {
  const context = useContext(ExplorerContext)
  if (!context) throw new Error('useExplorer must be used inside ExplorerProvider')
  return context
}
