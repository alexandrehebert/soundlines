import type { NodeType } from '@soundlines/catalogue/types'

export type Page = 'home' | 'search' | 'library'
export type EntryOrigin = 'home' | 'search'
export type LibrarySelection = { type: NodeType | null; group: string | null }

export const libraryCategories = {
  artist: 'Artists', instrument: 'Instruments', genre: 'Genres', track: 'Tracks',
  event: 'Events', festival: 'Festivals', scene: 'Scenes', label: 'Labels', place: 'Places',
} satisfies Record<NodeType, string>

export function readRoute(search: string) {
  const params = new URLSearchParams(search)
  const view = params.get('view')
  const page: Page = view === 'library' || view === 'timeline' ? 'library' : view === 'search' ? 'search' : 'home'
  const nodeId = page === 'library' ? params.get('node') : null
  const type = page === 'library' ? params.get('type') : null
  const libraryType = type && Object.hasOwn(libraryCategories, type) ? type as NodeType : null
  const from = params.get('from')
  const origin: EntryOrigin | null = nodeId !== null && (from === 'home' || from === 'search') ? from : null
  return {
    page, nodeId, libraryType, libraryGroup: libraryType ? params.get('group') : null,
    origin,
  }
}

export function pageHref(page: Page) {
  return page === 'home' ? window.location.pathname : `?view=${page}`
}

export function libraryHref({ type, group }: LibrarySelection) {
  const params = new URLSearchParams({ view: 'library' })
  if (type) params.set('type', type)
  if (type && group) params.set('group', group)
  return `?${params}`
}

export function mobileBackLink(
  { page, nodeId, origin, libraryType: type, libraryGroup: group }: ReturnType<typeof readRoute>,
  groupLabel?: string,
) {
  if (page !== 'library') return undefined
  if (origin) return { href: pageHref(origin), label: origin === 'home' ? 'Home' : 'Search' }
  if (!type) return nodeId === null ? undefined : { href: pageHref('library'), label: 'Library' }
  const category = libraryCategories[type]
  if (nodeId !== null) {
    const label = group === 'all' ? `All ${category.toLowerCase()}` : groupLabel ?? category
    return { href: libraryHref({ type, group }), label }
  }
  if (group) return { href: libraryHref({ type, group: null }), label: category }
  return { href: pageHref('library'), label: 'Library' }
}

export function nodeUrl(node: { id: string }, from?: EntryOrigin, selection?: LibrarySelection) {
  const params = new URLSearchParams(selection ? libraryHref(selection) : pageHref('library'))
  params.set('node', node.id)
  if (from) params.set('from', from)
  return `?${params}`
}
