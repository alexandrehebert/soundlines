import { createTranslator } from 'next-intl'
import {
  isHomeUrl, readTimelineOrders, VIEW_PATHS, viewForNode, viewFromUrl, writeTimelineOrders,
} from './graph/timeline.ts'
import type { GraphNode } from './graph/types.ts'
import { DEFAULT_LOCALE, localeFromPath, localizePath, type Locale } from './i18n/routing.ts'
import { pageMetadata } from './i18n/seo.ts'
import { graphLabels } from './i18n/graphLabels.ts'
import { catalogueFor } from './i18n/catalogue.ts'

const START_MARKER = '<!-- social-metadata:start -->'
const END_MARKER = '<!-- social-metadata:end -->'
const DESCRIPTION_LIMIT = 200

export interface SocialMetadata {
  title: string
  description: string
  url: string
  image: string
  imageAlt?: string
}

interface SocialMetaTag {
  attribute: 'name' | 'property'
  key: string
  content: string
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
  const focus = url.searchParams.get('focus')
  const node = focus ? nodeById.get(focus) : undefined
  const view = viewForNode(node?.type, viewFromUrl(url))
  const bubbles = url.searchParams.get('layout') === 'bubbles'
  const home = isHomeUrl(url, Boolean(node))
  const locale = requestedLocale ?? localeFromPath(url.pathname) ?? DEFAULT_LOCALE
  const labels = graphLabels(locale)
  const copy = catalogueFor(locale).social
  const tSocial = createTranslator({ locale, messages: catalogueFor(locale), namespace: 'social' })
  const canonical = new URL(localizePath(home ? '/' : VIEW_PATHS[view], locale), url.origin)
  if (node) canonical.searchParams.set('focus', node.id)
  writeTimelineOrders(canonical.searchParams, readTimelineOrders(url.searchParams))
  if (bubbles) canonical.searchParams.set('layout', 'bubbles')

  const page = pageMetadata(locale, home ? 'home' : view === 'genre' && bubbles ? 'bubbles' : view)
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

export function socialMetaTags(metadata: SocialMetadata): SocialMetaTag[] {
  const imageAlt = metadata.imageAlt ?? catalogueFor(DEFAULT_LOCALE).social.imageAlt
  return [
    { attribute: 'name', key: 'description', content: metadata.description },
    { attribute: 'property', key: 'og:type', content: 'website' },
    { attribute: 'property', key: 'og:site_name', content: 'Soundlines' },
    { attribute: 'property', key: 'og:title', content: metadata.title },
    { attribute: 'property', key: 'og:description', content: metadata.description },
    { attribute: 'property', key: 'og:url', content: metadata.url },
    { attribute: 'property', key: 'og:image', content: metadata.image },
    { attribute: 'property', key: 'og:image:type', content: 'image/png' },
    { attribute: 'property', key: 'og:image:width', content: '1200' },
    { attribute: 'property', key: 'og:image:height', content: '630' },
    { attribute: 'property', key: 'og:image:alt', content: imageAlt },
    { attribute: 'name', key: 'twitter:card', content: 'summary_large_image' },
    { attribute: 'name', key: 'twitter:title', content: metadata.title },
    { attribute: 'name', key: 'twitter:description', content: metadata.description },
    { attribute: 'name', key: 'twitter:image', content: metadata.image },
    { attribute: 'name', key: 'twitter:image:alt', content: imageAlt },
  ]
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!)
}

export function renderSocialMetadata(html: string, metadata: SocialMetadata): string {
  const start = html.indexOf(START_MARKER)
  const end = html.indexOf(END_MARKER, start + START_MARKER.length)
  if (start < 0 || end < 0) throw new Error('Social metadata markers are missing from the HTML template')

  const tags = socialMetaTags(metadata).map(({ attribute, key, content }) =>
    `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`)
  const contents = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<link rel="canonical" href="${escapeHtml(metadata.url)}" />`,
    ...tags,
  ].join('\n    ')
  return `${html.slice(0, start + START_MARKER.length)}\n    ${contents}\n    ${html.slice(end)}`
}
