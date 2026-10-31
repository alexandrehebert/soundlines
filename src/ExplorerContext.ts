import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { buildIndex } from './graph/graph.ts'
import { MAX_YEAR, MIN_YEAR } from './graph/layout.ts'
import { createTimelineModel, type TimelineView } from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'

type YearRange = [number, number]

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
  const [ranges, setRanges] = useState<Record<TimelineView, YearRange>>({
    genre: [MIN_YEAR, MAX_YEAR],
    artist: [MIN_YEAR, MAX_YEAR],
  })
  const model = useMemo(() => createTimelineModel(index, view), [index, view])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (selectedId) url.searchParams.set('focus', selectedId)
    else url.searchParams.delete('focus')
    if (view === 'artist') url.searchParams.set('view', 'artists')
    else url.searchParams.delete('view')
    window.history.replaceState(null, '', url)
  }, [selectedId, view])

  useEffect(() => {
    const onPopState = () => setLocation(readLocation())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [readLocation])

  const selectNode = useCallback((id: string | null) => {
    const node = id ? index.nodeById.get(id) : undefined
    if (id && !node) throw new Error(`Cannot select unknown node ${id}`)
    const nextView = node?.type === 'genre' || node?.type === 'artist' ? node.type : view
    setLocation({ view: nextView, selectedId: id })
    if (!node?.period) return
    const year = node.period.start
    setRanges((current) => {
      const [start, end] = current[nextView]
      if (year >= start && year <= end) return current
      const span = end - start
      const nextStart = Math.max(MIN_YEAR, Math.min(year - span * 0.25, MAX_YEAR - span))
      return { ...current, [nextView]: [nextStart, nextStart + span] }
    })
  }, [index, view])

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
