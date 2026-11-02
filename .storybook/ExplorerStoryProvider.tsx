import { useCallback, useMemo, useState, type ContextType, type ReactNode, type SetStateAction } from 'react'
import { ExplorerContext } from '../src/ExplorerContext.ts'
import rawGraph from '../src/data/graph.json'
import type { GenreDisplay } from '../src/graph/bubbles.ts'
import { buildIndex } from '../src/graph/graph.ts'
import { revealEraRange, type TimelineOrder } from '../src/graph/layout.ts'
import {
  createTimelineModel, defaultViewRange, isTimelineView, type TimelineOrders, type TimelineView,
} from '../src/graph/timeline.ts'
import type { GraphNode, MusicGraph } from '../src/graph/types.ts'

type YearRange = [number, number]

export interface StoryExplorerOptions {
  initialView?: TimelineView
  initialSelectedId?: string | null
  initialOrder?: TimelineOrder
  initialGenreDisplay?: GenreDisplay
}

const index = buildIndex(rawGraph as MusicGraph)

function nodeView(node: GraphNode | undefined, currentView: TimelineView): TimelineView {
  return isTimelineView(node?.type) ? node.type : currentView
}

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
    const view = nodeView(node, initialView)
    const orders: TimelineOrders = { genre: 'family', artist: 'family', instrument: 'family' }
    orders[view] = initialOrder
    return {
      view,
      selectedId: initialSelectedId,
      orders,
      genreDisplay: initialGenreDisplay,
    }
  })
  const [ranges, setRanges] = useState<Record<TimelineView, YearRange>>(() => {
    const initial: Record<TimelineView, YearRange> = {
      genre: defaultViewRange('genre'),
      artist: defaultViewRange('artist'),
      instrument: defaultViewRange('instrument'),
    }
    const node = location.selectedId ? index.nodeById.get(location.selectedId) : undefined
    initial[location.view] = revealNode(initial[location.view], node)
    return initial
  })
  const model = useMemo(() => createTimelineModel(index, location.view), [location.view])

  const selectNode = useCallback((id: string | null) => {
    const node = id ? index.nodeById.get(id) : undefined
    if (id && !node) throw new Error(`Cannot select unknown node ${id}`)
    const view = nodeView(node, location.view)
    setLocation((current) => ({ ...current, view, selectedId: id }))
    if (node?.period) {
      setRanges((current) => ({ ...current, [view]: revealNode(current[view], node) }))
    }
  }, [location.view])

  const changeView = useCallback((view: TimelineView) => {
    setLocation((current) => current.view === view ? current : { ...current, view, selectedId: null })
  }, [])

  const changeOrder = useCallback((order: string) => {
    if (order !== 'family' && order !== 'oldest-first') {
      throw new Error(`Unknown timeline order ${order}`)
    }
    setLocation((current) => current.orders[current.view] === order ? current : {
      ...current, orders: { ...current.orders, [current.view]: order },
    })
  }, [])

  const changeGenreDisplay = useCallback((genreDisplay: GenreDisplay) => {
    setLocation((current) => ({ ...current, genreDisplay }))
  }, [])

  const goHome = useCallback(() => {
    setLocation({
      view: 'genre',
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
    setRanges((current) => ({
      ...current,
      [location.view]: typeof range === 'function' ? range(current[location.view]) : range,
    }))
  }, [location.view])

  const value = useMemo<NonNullable<ContextType<typeof ExplorerContext>>>(() => ({
    index,
    model,
    ...location,
    order: location.orders[location.view],
    selectNode,
    changeView,
    changeOrder,
    changeGenreDisplay,
    goHome,
    viewRange: ranges[location.view],
    setViewRange,
  }), [model, location, selectNode, changeView, changeOrder, changeGenreDisplay, goHome, ranges, setViewRange])

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>
}
