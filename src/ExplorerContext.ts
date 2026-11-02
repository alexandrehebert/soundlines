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
import { revealEraRange } from './graph/layout.ts'
import {
  createTimelineModel,
  defaultViewRange,
  isTimelineView,
  readTimelineOrders,
  VIEW_PARAMS,
  viewFromParam,
  writeTimelineOrders,
  type TimelineOrders,
  type TimelineView,
} from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'
import type { GenreDisplay } from './graph/bubbles.ts'
import { finishPageLoading, transitionPage } from './pageLoading.ts'
import { socialMetadata } from './socialMetadata.ts'
import { updateDocumentMetadata } from './socialMetadataClient.ts'

type YearRange = [number, number]
type ExplorerLocation = { view: TimelineView; selectedId: string | null; orders: TimelineOrders; genreDisplay: GenreDisplay }

export function useExplorerState(graph: MusicGraph) {
  const index = useMemo(() => buildIndex(graph), [graph])
  const readLocation = useCallback((): ExplorerLocation => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('focus')
    const node = id ? index.nodeById.get(id) : undefined
    const view: TimelineView = isTimelineView(node?.type) ? node.type : viewFromParam(params.get('view'))
    const orders = readTimelineOrders(params)
    const genreDisplay = params.get('layout') === 'bubbles' ? 'bubbles' : 'bars'
    return { view, selectedId: node?.id ?? null, orders, genreDisplay }
  }, [index])
  const [location, setLocation] = useState(readLocation)
  const { view, selectedId, orders, genreDisplay } = location
  const order = orders[view]
  const [ranges, setRanges] = useState<Record<TimelineView, YearRange>>(() => {
    const node = location.selectedId ? index.nodeById.get(location.selectedId) : undefined
    const initial: Record<TimelineView, YearRange> = {
      genre: defaultViewRange('genre'),
      artist: defaultViewRange('artist'),
      instrument: defaultViewRange('instrument'),
    }
    if (node?.period) {
      initial[location.view] = revealEraRange(initial[location.view], node.period.start)
    }
    return initial
  })
  const model = useMemo(() => createTimelineModel(index, view), [index, view])

  useEffect(() => finishPageLoading(), [view, order, genreDisplay])

  const revealSelection = useCallback((next: ExplorerLocation) => {
    const node = next.selectedId ? index.nodeById.get(next.selectedId) : undefined
    if (!node?.period) return
    const year = node.period.start
    setRanges((current) => {
      const [start, end] = current[next.view]
      if (year >= start && year <= end) return current
      return {
        ...current,
        [next.view]: revealEraRange([start, end], year),
      }
    })
  }, [index])

  const navigate = useCallback((next: ExplorerLocation) => {
    const update = () => setLocation(next)
    if (next.view !== view || next.orders[next.view] !== order || next.genreDisplay !== genreDisplay) {
      transitionPage(update)
    } else {
      update()
    }
  }, [view, order, genreDisplay])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (selectedId) url.searchParams.set('focus', selectedId)
    else url.searchParams.delete('focus')
    const viewParam = VIEW_PARAMS[view]
    if (viewParam) url.searchParams.set('view', viewParam)
    else url.searchParams.delete('view')
    writeTimelineOrders(url.searchParams, orders)
    if (genreDisplay === 'bubbles') url.searchParams.set('layout', 'bubbles')
    else url.searchParams.delete('layout')
    window.history.replaceState(null, '', url)
    updateDocumentMetadata(document, socialMetadata(url, index.nodeById))
  }, [index, selectedId, view, orders, genreDisplay])

  useEffect(() => {
    const onPopState = () => {
      const next = readLocation()
      revealSelection(next)
      navigate(next)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [readLocation, revealSelection, navigate])

  const selectNode = useCallback((id: string | null) => {
    const node = id ? index.nodeById.get(id) : undefined
    if (id && !node) throw new Error(`Cannot select unknown node ${id}`)
    const nextView = isTimelineView(node?.type) ? node.type : view
    const next = { ...location, view: nextView, selectedId: id }
    revealSelection(next)
    navigate(next)
  }, [index, view, location, revealSelection, navigate])

  const changeView = useCallback((nextView: TimelineView) => {
    if (view === nextView) return
    navigate({ ...location, view: nextView, selectedId: null })
  }, [view, location, navigate])

  const changeOrder = useCallback((nextOrder: string) => {
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

  const setViewRange = useCallback((range: SetStateAction<YearRange>) => {
    setRanges((current) => ({
      ...current,
      [view]: typeof range === 'function' ? range(current[view]) : range,
    }))
  }, [view])

  return useMemo(() => ({
    index, model, view, selectedId, selectNode, changeView, order, changeOrder,
    genreDisplay, changeGenreDisplay,
    viewRange: ranges[view], setViewRange,
  }), [index, model, view, selectedId, selectNode, changeView, order, changeOrder, genreDisplay, changeGenreDisplay, ranges, setViewRange])
}

export const ExplorerContext = createContext<ReturnType<typeof useExplorerState> | null>(null)

export function useExplorer() {
  const context = useContext(ExplorerContext)
  if (!context) throw new Error('useExplorer must be used inside ExplorerProvider')
  return context
}
