import type { GenreDisplay } from './graph/bubbles.ts'
import {
  isHomeUrl,
  isTimelineView,
  readTimelineOrders,
  VIEW_PATHS,
  viewForNode,
  viewFromPath,
  viewFromUrl,
  writeTimelineOrders,
  type ExplorerView,
  type TimelineOrders,
  type TimelineView,
} from './graph/timeline.ts'
import type { GraphNode } from './graph/types.ts'
import { localizePath, stripLocalePrefix, type Locale } from './i18n/routing.ts'

export function isJukeboxPath(pathname: string | null) {
  return pathname !== null && stripLocalePrefix(pathname).replace(/\/$/, '') === '/jukebox'
}

export function nodePath(id: string, locale: Locale, currentView: ExplorerView = 'genre'): string {
  const [type, slug] = id.split(':')
  const view = viewForNode(type, currentView)
  const entry = isTimelineView(type) || type === 'event' ? slug : `${type}/${slug}`
  return localizePath(`${VIEW_PATHS[view]}/${entry}`, locale)
}

function nodeIdFromPath(pathname: string): string | null {
  const view = viewFromPath(pathname)
  if (!view) return null
  const segments = stripLocalePrefix(pathname).replace(/\/$/, '').split('/').slice(2)
  if (segments.length === 0 || segments.length > 2) return null

  const [type, slug] = segments.length === 1 ? [view === 'history' ? 'event' : view, segments[0]] : segments
  try {
    return `${type}:${decodeURIComponent(slug)}`
  } catch {
    return null
  }
}

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
  const id = nodeIdFromPath(url.pathname) ?? params.get('focus')
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
  url.pathname = selectedId ? nodePath(selectedId, locale, view) : localizePath(isHome ? '/' : VIEW_PATHS[view], locale)
  if (!isHome && url.hash === '#discover') url.hash = ''
  url.searchParams.delete('view')
  url.searchParams.delete('focus')
  writeTimelineOrders(url.searchParams, orders)
  if (genreDisplay === 'bubbles') url.searchParams.set('layout', 'bubbles')
  else url.searchParams.delete('layout')
  return url
}
