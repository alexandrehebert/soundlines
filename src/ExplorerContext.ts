import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { buildIndex } from './graph/graph.ts'
import { DEFAULT_START_YEAR, MAX_YEAR, revealEraRange } from './graph/layout.ts'
import { createTimelineModel, type TimelineView } from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'

type YearRange = [number, number]
type ExplorerLocation = { view: TimelineView; selectedId: string | null }

export function useExplorerState(graph: MusicGraph) {
  const index = useMemo(() => buildIndex(graph), [graph])
  const readLocation = useCallback(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('focus')
    const node = id ? index.nodeById.get(id) : undefined
    const view: TimelineView = node?.type === 'artist' || node?.type === 'genre'
      ? node.type
      : params.get('view') === 'artists' ? 'artist' : 'genre'
    return { view, selectedId: node?.id ?? null }
  }, [index])
  const [location, setLocation] = useState(readLocation)
  const { view, selectedId } = location
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
    window.history.replaceState(null, '', url)
  }, [selectedId, view])

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
    const next = { view: nextView, selectedId: id }
    revealSelection(next)
    setLocation(next)
  }, [index, view, revealSelection])

  const changeView = useCallback((nextView: TimelineView) => {
    setLocation((current) => current.view === nextView
      ? current
      : { view: nextView, selectedId: null })
  }, [])

  const setViewRange = useCallback((range: YearRange) => {
    setRanges((current) => ({ ...current, [view]: range }))
  }, [view])

  return useMemo(() => ({
    index, model, view, selectedId, selectNode, changeView,
    viewRange: ranges[view], setViewRange,
  }), [index, model, view, selectedId, selectNode, changeView, ranges, setViewRange])
}

export const ExplorerContext = createContext<ReturnType<typeof useExplorerState> | null>(null)

export function useExplorer() {
  const context = useContext(ExplorerContext)
  if (!context) throw new Error('useExplorer must be used inside ExplorerProvider')
  return context
}
