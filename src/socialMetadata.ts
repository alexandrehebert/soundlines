import { createTranslator } from 'next-intl'
import { explorerUrl, readExplorerLocation } from './explorerLocation.ts'
import type { GraphNode } from './graph/types.ts'
import { DEFAULT_LOCALE, localeFromPath, type Locale } from './i18n/routing.ts'
import { pageMetadata } from './i18n/seo.ts'
import { graphLabels } from './i18n/graphLabels.ts'
import { catalogueFor } from './i18n/catalogue.ts'

const DESCRIPTION_LIMIT = 200

export interface SocialMetadata {
  title: string
  description: string
  url: string
  image: string
  imageAlt?: string
}

function shortenDescription(description: string): string {
  const text = description.replace(/\s+/g, ' ').trim()
  const characters = Array.from(text)
  if (characters.length <= DESCRIPTION_LIMIT) return text
  const excerpt = characters.slice(0, DESCRIPTION_LIMIT - 1).join('')
  const boundary = excerpt.lastIndexOf(' ')
  return `${(boundary > 0 ? excerpt.slice(0, boundary) : excerpt).trimEnd()}…`
}

export function socialMetadata(
  url: URL,
  nodeById: ReadonlyMap<string, GraphNode>,
  requestedLocale?: Locale,
): SocialMetadata {
  const location = readExplorerLocation(url, nodeById)
  const { selectedId, view, isHome, genreDisplay } = location
  const node = selectedId ? nodeById.get(selectedId) : undefined
  const locale = requestedLocale ?? localeFromPath(url.pathname) ?? DEFAULT_LOCALE
  const labels = graphLabels(locale)
  const copy = catalogueFor(locale).social
  const tSocial = createTranslator({ locale, messages: catalogueFor(locale), namespace: 'social' })
  const canonical = explorerUrl(location, locale, url.origin)

  const page = pageMetadata(locale, isHome ? 'home' : view === 'genre' && genreDisplay === 'bubbles' ? 'bubbles' : view)
  const nodeTypeLabel = labels.nodeTypes[node?.type ?? 'genre']
  const title = node ? `${node.name} | ${nodeTypeLabel} | Soundlines` : page.title
  const description = node
    ? node.description?.trim() || tSocial('nodeDescription', { name: node.name, type: nodeTypeLabel })
    : page.description

  return {
    title,
    description: shortenDescription(description),
    url: canonical.href,
    image: new URL('/social-card.png', canonical).href,
    imageAlt: copy.imageAlt,
  }
}
