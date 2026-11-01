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
import { DEFAULT_START_YEAR, MAX_YEAR, revealEraRange, type GenreOrder } from './graph/layout.ts'
import { createTimelineModel, type TimelineView } from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'
import type { GenreDisplay } from './graph/bubbles.ts'

type YearRange = [number, number]
type ExplorerLocation = { view: TimelineView; selectedId: string | null; genreOrder: GenreOrder; genreDisplay: GenreDisplay }

export function useExplorerState(graph: MusicGraph) {
  const index = useMemo(() => buildIndex(graph), [graph])
  const readLocation = useCallback((): ExplorerLocation => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('focus')
    const node = id ? index.nodeById.get(id) : undefined
    const view: TimelineView = node?.type === 'artist' || node?.type === 'genre'
      ? node.type
      : params.get('view') === 'artists' ? 'artist' : 'genre'
    const genreOrder = params.get('sort') === 'oldest-first' ? 'oldest-first' : 'family'
    const genreDisplay = params.get('layout') === 'bubbles' ? 'bubbles' : 'bars'
    return { view, selectedId: node?.id ?? null, genreOrder, genreDisplay }
  }, [index])
  const [location, setLocation] = useState(readLocation)
  const { view, selectedId, genreOrder, genreDisplay } = location
  const [ranges, setRanges] = useState<Record<TimelineView, YearRange>>(() => {
    const node = location.selectedId ? index.nodeById.get(location.selectedId) : undefined
    const initial: Record<TimelineView, YearRange> = {
      genre: [DEFAULT_START_YEAR, MAX_YEAR],
      artist: [DEFAULT_START_YEAR, MAX_YEAR],
    }
    if (node?.period) {
      initial[location.view] = revealEraRange(initial[location.view], node.period.start)
    }
    return initial
  })
  const model = useMemo(() => createTimelineModel(index, view), [index, view])

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

  useEffect(() => {
    const url = new URL(window.location.href)
    if (selectedId) url.searchParams.set('focus', selectedId)
    else url.searchParams.delete('focus')
    if (view === 'artist') url.searchParams.set('view', 'artists')
    else url.searchParams.delete('view')
    if (genreOrder === 'oldest-first') url.searchParams.set('sort', 'oldest-first')
    else url.searchParams.delete('sort')
    if (genreDisplay === 'bubbles') url.searchParams.set('layout', 'bubbles')
    else url.searchParams.delete('layout')
    window.history.replaceState(null, '', url)
  }, [selectedId, view, genreOrder, genreDisplay])

  useEffect(() => {
    const onPopState = () => {
      const next = readLocation()
      revealSelection(next)
      setLocation(next)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [readLocation, revealSelection])

  const selectNode = useCallback((id: string | null) => {
    const node = id ? index.nodeById.get(id) : undefined
    if (id && !node) throw new Error(`Cannot select unknown node ${id}`)
    const nextView = node?.type === 'genre' || node?.type === 'artist' ? node.type : view
    const next = { view: nextView, selectedId: id, genreOrder, genreDisplay }
    revealSelection(next)
    setLocation(next)
  }, [index, view, genreOrder, genreDisplay, revealSelection])

  const changeView = useCallback((nextView: TimelineView) => {
    setLocation((current) => current.view === nextView
      ? current
      : { ...current, view: nextView, selectedId: null })
  }, [])

  const changeGenreOrder = useCallback((order: string) => {
    if (order !== 'family' && order !== 'oldest-first') {
      throw new Error(`Unknown genre order ${order}`)
    }
    setLocation((current) => current.genreOrder === order
      ? current
      : { ...current, genreOrder: order })
  }, [])

  const changeGenreDisplay = useCallback((display: GenreDisplay) => {
    setLocation((current) => ({ ...current, genreDisplay: display }))
  }, [])

  const setViewRange = useCallback((range: SetStateAction<YearRange>) => {
    setRanges((current) => ({
      ...current,
      [view]: typeof range === 'function' ? range(current[view]) : range,
    }))
  }, [view])

  return useMemo(() => ({
    index, model, view, selectedId, selectNode, changeView, genreOrder, changeGenreOrder,
    genreDisplay, changeGenreDisplay,
    viewRange: ranges[view], setViewRange,
  }), [index, model, view, selectedId, selectNode, changeView, genreOrder, changeGenreOrder, genreDisplay, changeGenreDisplay, ranges, setViewRange])
}

export const ExplorerContext = createContext<ReturnType<typeof useExplorerState> | null>(null)

export function useExplorer() {
  const context = useContext(ExplorerContext)
  if (!context) throw new Error('useExplorer must be used inside ExplorerProvider')
  return context
}
