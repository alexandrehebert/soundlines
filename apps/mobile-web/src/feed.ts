import { artistFamily } from '@soundlines/catalogue/artistFamily'
import { buildIndex, groupedRelations } from '@soundlines/catalogue/graph'
import { resolveSoundtrail, SOUNDTRAILS, type SoundtrailId } from '@soundlines/catalogue/soundtrails'
import type { GraphNode, MusicGraph, NodeType } from '@soundlines/catalogue/types'
import { FAMILY_COLORS, NODE_TYPE_COLORS } from '@soundlines/design-tokens'
import { APP_URL } from '@soundlines/project-config'
import english from '../../web/src/i18n/locales/en.json' with { type: 'json' }

export interface FeedNode {
  id: string
  name: string
  type: NodeType
  era: string | null
  addedOn?: string
  description: string
  accent: string
}

export interface TrailStep {
  node: FeedNode
  connection: string | null
}

type NodeCard = { kind: 'node'; id: string; node: FeedNode; spotlight?: true }
type TrailCard = { kind: 'trail'; id: string; title: string; steps: TrailStep[] }

export type FeedCard = NodeCard | TrailCard

export interface AtlasEntry {
  node: FeedNode
  description: string
  period: string | null
  startYear?: number
  estimateNote?: string
  classification?: string
  timelineGroup?: { id: string; label: string; accent?: string }
  confidence?: GraphNode['confidence']
  sources: string[]
  relations: { id: string; labels: string[] }[]
}

export interface FeedCatalogue {
  atlas: AtlasEntry[]
  entries: NodeCard[]
  spotlights: NodeCard[]
  trails: TrailCard[]
}

const featuredIds = [
  'genre:disco',
  'artist:miles-davis',
  'track:planet-rock',
  'genre:dub',
  'instrument:tr-808',
  'artist:the-beatles',
  'genre:funk',
  'instrument:saxophone',
  'genre:hip-hop',
  'genre:jazz',
]

const trailTitles = {
  'soul-to-techno': 'From soul to techno',
  'breakbeat-science': 'Breakbeat science',
  'island-bass': 'Island bass',
  'blues-to-grunge': 'From the blues to grunge',
  'birth-of-cool': 'The birth of cool',
  'gamelan-to-synthwave': 'From gamelan to synthwave',
} satisfies Record<SoundtrailId, string>

const kindOrder = ['genre', 'artist', 'track', 'event', 'instrument', 'festival', 'place', 'scene', 'label'] satisfies NodeType[]
const ADDS_BEFORE_SPOTLIGHT = 4
const ADDS_PER_ROUND = 8
const CARDS_PER_ROUND = ADDS_PER_ROUND + 2

export function cardAt(catalogue: FeedCatalogue, position: number): FeedCard {
  const round = Math.floor(position / CARDS_PER_ROUND)
  const slot = position % CARDS_PER_ROUND
  if (slot === ADDS_BEFORE_SPOTLIGHT) return catalogue.spotlights[round % catalogue.spotlights.length]
  if (slot === CARDS_PER_ROUND - 1) return catalogue.trails[round % catalogue.trails.length]
  const entry = round * ADDS_PER_ROUND + slot - Number(slot > ADDS_BEFORE_SPOTLIGHT)
  return catalogue.entries[entry % catalogue.entries.length]
}

function firstSentence(value: string) {
  return value.split(/(?<=[.!?])\s+(?=[A-Z])/, 1)[0]
}

function periodLabel(period: GraphNode['period']) {
  if (!period) return null
  if (period.precision === 'decade') return `${Math.floor(period.start / 10) * 10}s`
  if (period.precision === 'century') {
    const century = Math.ceil(Math.abs(period.start) / 100)
    const ordinal = new Intl.PluralRules('en', { type: 'ordinal' }).select(century)
    const suffix = { one: 'st', two: 'nd', few: 'rd', other: 'th', many: 'th', zero: 'th' }[ordinal]
    return `${century}${suffix} century${period.start < 0 ? ' BCE' : ''}`
  }
  return `${period.precision === 'circa' ? 'c. ' : ''}${Math.abs(period.start) || 1}${period.start <= 0 ? ' BCE' : ''}`
}

function detailPeriod(node: GraphNode) {
  const period = node.period
  const start = periodLabel(period)
  if (!period || !start || period.end === period.start) return start
  const end = period.end == null
    ? (node.type === 'event' || node.type === 'track' ? null : 'Present')
    : periodLabel({ start: period.end, precision: period.precision })
  return end && end !== start ? `${start} – ${end}` : start
}

const desktopHost = new URL(APP_URL).hostname

function isSourceLink(source: string) {
  const url = URL.parse(source)
  return url != null && url.hostname !== desktopHost && (url.protocol === 'https:' || url.protocol === 'http:')
}

function toFeedNode({ id, name, type, period, family, addedOn, description = '' }: GraphNode): FeedNode {
  return {
    id, name, type, addedOn,
    era: periodLabel(period),
    description: id === 'genre:disco'
      ? 'Shaped by Black, Latino, and LGBTQ communities, disco filled dance floors in New York, Philadelphia, and beyond.'
      : firstSentence(description),
    accent: family ? FAMILY_COLORS[family] : NODE_TYPE_COLORS[type],
  }
}

function interleaveKinds(nodes: GraphNode[]) {
  const columns = kindOrder.map((type) => nodes.filter((node) => node.type === type))
  const largest = Math.max(...columns.map((column) => column.length))
  return Array.from({ length: largest }, (_, row) =>
    columns.flatMap((column) => column[row] ? [column[row]] : [])).flat()
}

export function createFeed(graph: MusicGraph): FeedCatalogue {
  const index = buildIndex(graph)
  const spotlights = featuredIds.map((id): NodeCard => {
    const node = index.nodeById.get(id)
    if (!node) throw new Error(`Unknown feed spotlight ${id}.`)
    return { kind: 'node', id, node: toFeedNode(node), spotlight: true }
  })
  const featured = new Set(spotlights.map(({ id }) => id))
  const dated = new Map<string, GraphNode[]>()
  for (const node of graph.nodes) {
    if (featured.has(node.id)) continue
    const date = node.addedOn ?? ''
    const sameDate = dated.get(date)
    if (sameDate) sameDate.push(node)
    else dated.set(date, [node])
  }
  const entries = [...dated].sort(([a], [b]) => b.localeCompare(a))
    .flatMap(([, nodes]) => interleaveKinds(nodes))
    .map((node): NodeCard => ({ kind: 'node', id: node.id, node: toFeedNode(node) }))
  const trails = SOUNDTRAILS.map((trail): TrailCard => ({
    kind: 'trail',
    id: trail.id,
    title: trailTitles[trail.id],
    steps: resolveSoundtrail(index, trail).map(({ node, link }) => ({
      node: toFeedNode(node),
      connection: link?.edge.note ? firstSentence(link.edge.note) : null,
    })),
  }))
  const feedNodes = new Map([...entries, ...spotlights].map(({ id, node }) => [id, node]))
  const labels = english.graphLabels
  const atlas = [...graph.nodes]
    .sort((a, b) => (b.period?.start ?? -Infinity) - (a.period?.start ?? -Infinity) || a.name.localeCompare(b.name))
    .map((node): AtlasEntry => {
      const family = node.type === 'artist' ? artistFamily(index, node) : node.family
      const relations = new Map<string, Set<string>>()
      for (const group of groupedRelations(index, node.id)) {
        const label = (group.direction === 'out' ? labels.edges : labels.inverseEdges)[group.type]
        for (const { node: other } of group.entries) {
          if (other.id === node.id) continue
          const existing = relations.get(other.id)
          if (existing) existing.add(label)
          else relations.set(other.id, new Set([label]))
        }
      }
      return {
        node: feedNodes.get(node.id)!,
        description: node.description ?? '',
        period: detailPeriod(node),
        startYear: node.period?.start,
        estimateNote: node.period?.estimated ? node.period.estimateNote || 'The dates are approximate.' : undefined,
        classification: node.family ? labels.families[node.family] : node.category ? labels.eventCategories[node.category] : node.kind,
        timelineGroup: family
          ? { id: family, label: labels.families[family], accent: FAMILY_COLORS[family] }
          : node.category ? { id: node.category, label: labels.eventCategories[node.category] } : undefined,
        confidence: node.confidence,
        sources: [...new Set(node.sources?.filter(isSourceLink))],
        relations: [...relations].map(([id, relationLabels]) => ({ id, labels: [...relationLabels] })),
      }
    })
  return { entries, spotlights, trails, atlas }
}
