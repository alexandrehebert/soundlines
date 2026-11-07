import type { GenreDisplay } from './graph/bubbles.ts'
import {
  isHomeUrl,
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
import type { GraphNode } from './graph/types.ts'
import { localizePath, type Locale } from './i18n/routing.ts'

export type ExplorerLocation = {
  isHome: boolean
  view: ExplorerView
  timelineView: TimelineView
  selectedId: string | null
  orders: TimelineOrders
  genreDisplay: GenreDisplay
}

export function readExplorerLocation(url: URL, nodeById: ReadonlyMap<string, GraphNode>): ExplorerLocation {
  const params = url.searchParams
  const id = params.get('focus')
  const node = id ? nodeById.get(id) : undefined
  const view = viewForNode(node?.type, viewFromUrl(url))
  const timelineView = isTimelineView(view) ? view : 'genre'
  const orders = readTimelineOrders(params)
  const genreDisplay = params.get('layout') === 'bubbles' ? 'bubbles' : 'bars'
  return { isHome: isHomeUrl(url, Boolean(node)), view, timelineView, selectedId: node?.id ?? null, orders, genreDisplay }
}

export function explorerUrl(
  { isHome, view, selectedId, orders, genreDisplay }: ExplorerLocation,
  locale: Locale,
  currentUrl: string | URL,
): URL {
  const url = new URL(currentUrl)
  url.pathname = localizePath(isHome ? '/' : VIEW_PATHS[view], locale)
  if (!isHome && url.hash === '#discover') url.hash = ''
  url.searchParams.delete('view')
  if (selectedId) url.searchParams.set('focus', selectedId)
  else url.searchParams.delete('focus')
  writeTimelineOrders(url.searchParams, orders)
  if (genreDisplay === 'bubbles') url.searchParams.set('layout', 'bubbles')
  else url.searchParams.delete('layout')
  return url
}
