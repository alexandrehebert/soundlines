import {
  isTimelineView, readTimelineOrders, VIEW_PARAMS, viewFromParam, writeTimelineOrders, type TimelineView,
} from './graph/timeline.ts'
import { NODE_TYPE_LABELS, type GraphNode } from './graph/types.ts'

const START_MARKER = '<!-- social-metadata:start -->'
const END_MARKER = '<!-- social-metadata:end -->'
const IMAGE_ALT = 'Soundlines: a chronological map of music lineages'
const DESCRIPTION_LIMIT = 200

const VIEW_METADATA: Record<TimelineView, { title: string; description: string }> = {
  genre: {
    title: 'Music Genres | Soundlines',
    description: 'Explore the evolution of music genres and the lineages that connect them on the Soundlines timeline.',
  },
  artist: {
    title: 'Music Artists | Soundlines',
    description: 'Explore music artists, their influences, and their connections across history on the Soundlines timeline.',
  },
  instrument: {
    title: 'Musical Instruments | Soundlines',
    description: 'Explore the history of musical instruments and the sounds and musicians connected to them on Soundlines.',
  },
}

const BUBBLE_METADATA = {
  title: 'Music Genre Map | Soundlines',
  description: 'Explore an interactive map of music genres and the lineages that connect them on Soundlines.',
}

export interface SocialMetadata {
  title: string
  description: string
  url: string
  image: string
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

export function socialMetadata(url: URL, nodeById: ReadonlyMap<string, GraphNode>): SocialMetadata {
  const focus = url.searchParams.get('focus')
  const node = focus ? nodeById.get(focus) : undefined
  const view = isTimelineView(node?.type) ? node.type : viewFromParam(url.searchParams.get('view'))
  const bubbles = url.searchParams.get('layout') === 'bubbles'
  const canonical = new URL('/', url.origin)
  const viewParam = VIEW_PARAMS[view]
  if (viewParam) canonical.searchParams.set('view', viewParam)
  if (node) canonical.searchParams.set('focus', node.id)
  writeTimelineOrders(canonical.searchParams, readTimelineOrders(url.searchParams))
  if (bubbles) canonical.searchParams.set('layout', 'bubbles')

  const page = view === 'genre' && bubbles ? BUBBLE_METADATA : VIEW_METADATA[view]
  const title = node ? `${node.name} | ${NODE_TYPE_LABELS[node.type]} | Soundlines` : page.title
  const description = node
    ? node.description?.trim() || `Discover ${node.name} (${NODE_TYPE_LABELS[node.type]}) and explore connections across music history on Soundlines.`
    : page.description

  return {
    title,
    description: shortenDescription(description),
    url: canonical.href,
    image: new URL('/social-card.png', canonical).href,
  }
}

export function socialMetaTags(metadata: SocialMetadata): SocialMetaTag[] {
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
    { attribute: 'property', key: 'og:image:alt', content: IMAGE_ALT },
    { attribute: 'name', key: 'twitter:card', content: 'summary_large_image' },
    { attribute: 'name', key: 'twitter:title', content: metadata.title },
    { attribute: 'name', key: 'twitter:description', content: metadata.description },
    { attribute: 'name', key: 'twitter:image', content: metadata.image },
    { attribute: 'name', key: 'twitter:image:alt', content: IMAGE_ALT },
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
