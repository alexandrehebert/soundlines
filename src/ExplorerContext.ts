import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SetStateAction,
} from 'react'
import { flushSync } from 'react-dom'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { explorerUrl, readExplorerLocation, type ExplorerLocation } from './explorerLocation.ts'
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
  viewForNode,
  type ExplorerView,
  type TimelineView,
} from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'
import type { GenreDisplay } from './graph/bubbles.ts'
import { cancelPageTransition, finishPageLoading, transitionPage } from './pageLoading.ts'
import { DEFAULT_LOCALE, type Locale } from './i18n/routing.ts'
import { observeViewTransition } from './viewTransition.ts'

type YearRange = [number, number]
type RunningPageTransition = { transition: ViewTransition; didUpdate: boolean }

const HOME_TRANSITION = 'soundlines-home-transition'
const VIEW_TRANSITION = 'soundlines-view-transition'
const PAGE_TRANSITION_CLASSES = [HOME_TRANSITION, VIEW_TRANSITION]

function sameLocation(first: ExplorerLocation, second: ExplorerLocation): boolean {
  return first.isHome === second.isHome
    && first.view === second.view
    && first.timelineView === second.timelineView
    && first.selectedId === second.selectedId
    && first.genreDisplay === second.genreDisplay
    && first.orders.genre === second.orders.genre
    && first.orders.artist === second.orders.artist
    && first.orders.instrument === second.orders.instrument
}

export function useExplorerState(graph: MusicGraph, locale: Locale = DEFAULT_LOCALE) {
  const router = useRouter()
  const pathname = usePathname()
  const search = useSearchParams().toString()
  const routeKey = `${pathname}?${search}`
  const index = useMemo(() => buildIndex(graph), [graph])
  const readLocation = useCallback((href?: string): ExplorerLocation => {
    const url = new URL(href ?? window.location.href)
    return readExplorerLocation(url, index.nodeById)
  }, [index])
  const [location, setLocation] = useState(() => readLocation(new URL(routeKey, 'http://soundlines.invalid').href))
  const pageTransition = useRef<RunningPageTransition | null>(null)
  const pendingLoadingUpdate = useRef(false)
  const handledRoute = useRef<string | null>(null)
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS)
  const { isHome, view, timelineView, selectedId, orders, genreDisplay } = location
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

  const cancelViewTransition = useCallback(() => {
    const running = pageTransition.current
    if (!running) return
    pageTransition.current = null
    running.transition.skipTransition()
    document.documentElement.classList.remove(...PAGE_TRANSITION_CLASSES)
  }, [])

  const hasPendingUpdate = useCallback(() =>
    pendingLoadingUpdate.current || Boolean(pageTransition.current && !pageTransition.current.didUpdate), [])

  const cancelPendingUpdate = useCallback(() => {
    if (pendingLoadingUpdate.current) {
      pendingLoadingUpdate.current = false
      cancelPageTransition()
      finishPageLoading()
    }
    if (pageTransition.current && !pageTransition.current.didUpdate) cancelViewTransition()
  }, [cancelViewTransition])

  const startPageTransition = useCallback((className: string, update: () => void, resetScroll: boolean) => {
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      update()
      return
    }

    const root = document.documentElement
    root.classList.remove(...PAGE_TRANSITION_CLASSES)
    root.classList.add(className)
    const transition = document.startViewTransition(() => {
      const running = pageTransition.current
      if (running?.transition !== transition) return
      running.didUpdate = true
      flushSync(update)
      if (resetScroll) window.scrollTo({ top: 0, behavior: 'instant' })
    })
    pageTransition.current = { transition, didUpdate: false }
    const cleanup = () => {
      if (pageTransition.current?.transition !== transition) return
      pageTransition.current = null
      root.classList.remove(className)
    }
    observeViewTransition(transition, cleanup)
  }, [])

  const navigate = useCallback((next: ExplorerLocation) => {
    const changesPage = next.isHome !== isHome || next.view !== view
    const update = () => {
      const url = explorerUrl(next, locale, window.location.href)
      const href = `${url.pathname}${url.search}${url.hash}`
      if (url.pathname !== window.location.pathname) router.push(href, { scroll: false })
      else if (url.href !== window.location.href) router.replace(href, { scroll: false })
      setLocation(next)
    }
    const changesContent = changesPage || next.orders[next.timelineView] !== order || next.genreDisplay !== genreDisplay
    // Home transitions run to completion; a newer explorer navigation replaces one still in progress.
    const homeTransitionRunning = pageTransition.current && document.documentElement.classList.contains(HOME_TRANSITION)
    if (homeTransitionRunning && (isHome !== next.isHome || (changesContent && !isHome))) return
    cancelPendingUpdate()
    if (isHome !== next.isHome) {
      startPageTransition(HOME_TRANSITION, update, true)
    } else if (changesContent && !isHome) {
      startPageTransition(VIEW_TRANSITION, update, false)
    } else {
      update()
    }
  }, [isHome, view, order, genreDisplay, locale, router, cancelPendingUpdate, startPageTransition])

  useEffect(() => {
    if (handledRoute.current === routeKey) return
    handledRoute.current = routeKey

    const currentUrl = new URL(window.location.href)
    const parsed = readLocation(currentUrl.href)
    const canonical = explorerUrl(parsed, locale, currentUrl)
    if (canonical.href !== currentUrl.href) {
      const href = `${canonical.pathname}${canonical.search}${canonical.hash}`
      if (canonical.pathname === currentUrl.pathname && canonical.search === currentUrl.search) {
        // Next may treat removing an inherited redirect hash as a no-op.
        window.history.replaceState(window.history.state, '', href)
      } else {
        router.replace(href, { scroll: false })
      }
    }

    const next = parsed.view === 'history' && location.view === 'history'
      ? { ...parsed, timelineView: location.timelineView }
      : parsed
    cancelPendingUpdate()
    if (sameLocation(next, location)) return
    cancelViewTransition()
    // Reconcile selection and ranges with Next's completed navigation.
    // oxlint-disable-next-line react/set-state-in-effect
    revealSelection(next)
    if (next.isHome !== location.isHome) {
      pendingLoadingUpdate.current = true
      transitionPage(() => {
        pendingLoadingUpdate.current = false
        setLocation(next)
      })
    } else if (!location.isHome && next.view !== location.view) startPageTransition(VIEW_TRANSITION, () => setLocation(next), false)
    else setLocation(next)
  }, [routeKey, location, locale, readLocation, revealSelection, router, cancelPendingUpdate, cancelViewTransition, startPageTransition])

  const selectNode = useCallback((id: string | null) => {
    const node = id ? index.nodeById.get(id) : undefined
    if (id && !node) throw new Error(`Cannot select unknown node ${id}`)
    const nextView = viewForNode(node?.type, view)
    const next = {
      ...location,
      isHome: false,
      view: nextView,
      timelineView: isTimelineView(nextView) ? nextView : timelineView,
      selectedId: id,
    }
    revealSelection(next)
    navigate(next)
  }, [index, view, timelineView, location, revealSelection, navigate])

  const changeView = useCallback((nextView: ExplorerView) => {
    if (!isHome && view === nextView && !hasPendingUpdate()) return
    navigate({
      ...location,
      isHome: false,
      view: nextView,
      timelineView: isTimelineView(nextView) ? nextView : timelineView,
      selectedId: null,
    })
  }, [isHome, view, timelineView, location, navigate, hasPendingUpdate])

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
    if (order === nextOrder && !hasPendingUpdate()) return
    navigate({ ...location, orders: { ...orders, [view]: nextOrder } })
  }, [view, order, orders, location, navigate, hasPendingUpdate])

  const changeGenreDisplay = useCallback((display: GenreDisplay) => {
    if (genreDisplay === display && !hasPendingUpdate()) return
    navigate({ ...location, genreDisplay: display })
  }, [genreDisplay, location, navigate, hasPendingUpdate])

  const goHome = useCallback(() => {
    const params = new URLSearchParams()
    setHistoryFilters(DEFAULT_HISTORY_FILTERS)
    setRanges({
      genre: defaultViewRange('genre'),
      artist: defaultViewRange('artist'),
      instrument: defaultViewRange('instrument'),
    })
    navigate({ isHome: true, view: 'genre', timelineView: 'genre', selectedId: null, orders: readTimelineOrders(params), genreDisplay: 'bars' })
  }, [navigate])

  const setViewRange = useCallback((range: SetStateAction<YearRange>) => {
    if (!isTimelineView(view)) throw new Error('History does not have a timeline range')
    setRanges((current) => ({
      ...current,
      [view]: typeof range === 'function' ? range(current[view]) : range,
    }))
  }, [view])

  return useMemo(() => ({
    index, model, locale, isHome, view, selectedId, selectNode, changeView, order, changeOrder,
    genreDisplay, changeGenreDisplay, goHome, historyFilters, changeHistoryFilters,
    viewRange: ranges[timelineView], setViewRange,
  }), [index, model, locale, isHome, view, timelineView, selectedId, selectNode, changeView, order, changeOrder, genreDisplay, changeGenreDisplay, goHome, historyFilters, changeHistoryFilters, ranges, setViewRange])
}

export const ExplorerContext = createContext<ReturnType<typeof useExplorerState> | null>(null)

export function useExplorer() {
  const context = useContext(ExplorerContext)
  if (!context) throw new Error('useExplorer must be used inside ExplorerProvider')
  return context
}
