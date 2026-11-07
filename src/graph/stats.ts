import type { GraphIndex } from './graph.ts'
import { CURRENT_YEAR } from './layout.ts'
import { timelineFamily, type TimelineView } from './timeline.ts'
import type { ArtistKind, Confidence, EdgeType, GraphNode, LaneFamily, NodeType } from './types.ts'

export type StatsTab = 'overview' | TimelineView | 'links' | 'review'

export interface RankedNode {
  node: GraphNode
  degree: number
}

export interface EmergenceBin {
  /** First year of the bin. */
  start: number
  label: string
  count: number
}

export interface EntityStats {
  total: number
  dated: number
  /** Dated entries with no end year, or an end year in the future. */
  active: number
  span: { start: number; end: number } | null
  families: { family: LaneFamily; count: number }[]
  unassigned: number
  emergence: EmergenceBin[]
  mostConnected: RankedNode[]
  oldest: GraphNode[]
  newest: GraphNode[]
  averageDegree: number
}

export interface DatasetStats {
  totalNodes: number
  totalEdges: number
  nodeTypes: { type: NodeType; count: number }[]
  edgeTypes: { type: EdgeType; count: number }[]
  confidence: Record<Confidence | 'unrated', number>
  sourcedNodes: number
  sourcedEdges: number
  sourceDomains: { domain: string; count: number }[]
  span: { start: number; end: number } | null
  averageDegree: number
  isolated: number
  mostConnected: RankedNode[]
  artistKinds: { kind: ArtistKind; count: number }[]
  entities: Record<TimelineView, EntityStats>
}

const TOP = 8

function degree(index: GraphIndex, id: string) {
  return (index.outEdges.get(id)?.length ?? 0) + (index.inEdges.get(id)?.length ?? 0)
}

function rank(index: GraphIndex, nodes: GraphNode[]): RankedNode[] {
  return nodes
    .map((node) => ({ node, degree: degree(index, node.id) }))
    .sort((a, b) => b.degree - a.degree || a.node.name.localeCompare(b.node.name))
    .slice(0, TOP)
}

function sortedCounts<K extends string>(counts: Map<K, number>) {
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

function tally<K extends string>(items: Iterable<K>) {
  const counts = new Map<K, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  return counts
}

/** Centuries before 1900, decades afterwards, mirroring the timeline's era scale. */
export function emergenceBinStart(year: number): number {
  return year < 1900 ? Math.floor(year / 100) * 100 : Math.floor(year / 10) * 10
}

function emergenceLabel(start: number) {
  return start < 1900 || start % 100 === 0 ? `${start}s` : `’${String(start).slice(2)}`
}

export function emergenceBins(years: number[]): EmergenceBin[] {
  if (years.length === 0) return []
  const counts = tally(years.map((year) => String(emergenceBinStart(year))))
  const first = emergenceBinStart(Math.min(...years))
  const last = emergenceBinStart(Math.max(...years))
  const bins: EmergenceBin[] = []
  for (let start = first; start <= last; start += start < 1900 ? 100 : 10) {
    bins.push({ start, label: emergenceLabel(start), count: counts.get(String(start)) ?? 0 })
  }
  return bins
}

function isActive(node: GraphNode, now: number) {
  if (!node.period) return false
  const { end } = node.period
  return end == null || end >= now
}

function span(nodes: GraphNode[], now: number) {
  const dated = nodes.filter((node) => node.period)
  if (dated.length === 0) return null
  return {
    start: Math.min(...dated.map((node) => node.period!.start)),
    end: Math.max(...dated.map((node) => node.period!.end ?? now)),
  }
}

function byStart(nodes: GraphNode[]) {
  return nodes
    .filter((node) => node.period)
    .sort((a, b) => a.period!.start - b.period!.start || a.name.localeCompare(b.name))
}

function entityStats(index: GraphIndex, type: TimelineView, now: number): EntityStats {
  const nodes = index.graph.nodes.filter((node) => node.type === type)
  const familyCounts = new Map<LaneFamily, number>()
  let unassigned = 0
  for (const node of nodes) {
    const family = timelineFamily(index, node)
    if (family) familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)
    else unassigned++
  }
  const chronological = byStart(nodes)
  const totalDegree = nodes.reduce((sum, node) => sum + degree(index, node.id), 0)
  return {
    total: nodes.length,
    dated: chronological.length,
    active: nodes.filter((node) => isActive(node, now)).length,
    span: span(nodes, now),
    families: sortedCounts(familyCounts).map(([family, count]) => ({ family, count })),
    unassigned,
    emergence: emergenceBins(chronological.map((node) => node.period!.start)),
    mostConnected: rank(index, nodes),
    oldest: chronological.slice(0, 5),
    newest: chronological.slice(-5).reverse(),
    averageDegree: nodes.length ? totalDegree / nodes.length : 0,
  }
}

function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').replace(/^[a-z]{2}\.wikipedia\.org$/, 'wikipedia.org')
  } catch {
    return null
  }
}

export function datasetStats(index: GraphIndex, now = CURRENT_YEAR): DatasetStats {
  const { nodes, edges } = index.graph
  const confidence: DatasetStats['confidence'] = { high: 0, medium: 0, low: 0, unrated: 0 }
  for (const edge of edges) confidence[edge.confidence ?? 'unrated']++

  const domains = tally(
    [...nodes, ...edges].flatMap((item) => item.sources ?? []).map(domainOf).filter((domain) => domain !== null),
  )

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodeTypes: sortedCounts(tally(nodes.map((node) => node.type))).map(([type, count]) => ({ type, count })),
    edgeTypes: sortedCounts(tally(edges.map((edge) => edge.type))).map(([type, count]) => ({ type, count })),
    confidence,
    sourcedNodes: nodes.filter((node) => node.sources?.length).length,
    sourcedEdges: edges.filter((edge) => edge.sources?.length).length,
    sourceDomains: sortedCounts(domains).slice(0, TOP).map(([domain, count]) => ({ domain, count })),
    span: span(nodes, now),
    averageDegree: nodes.length ? (edges.length * 2) / nodes.length : 0,
    isolated: nodes.filter((node) => degree(index, node.id) === 0).length,
    mostConnected: rank(index, nodes),
    artistKinds: sortedCounts(
      tally(nodes.filter((node) => node.type === 'artist' && node.kind).map((node) => node.kind!)),
    ).map(([kind, count]) => ({ kind, count })),
    entities: {
      genre: entityStats(index, 'genre', now),
      artist: entityStats(index, 'artist', now),
      instrument: entityStats(index, 'instrument', now),
    },
  }
}

export type LinkGroup = 'lineage' | 'people' | 'instruments' | 'industry' | 'tracks' | 'events' | 'festivals'

export const LINK_GROUPS: Record<LinkGroup, { label: string; types: readonly EdgeType[] }> = {
  lineage: {
    label: 'Genre lineage',
    types: ['influences', 'derived_from', 'subgenre_of', 'fusion_of', 'cross_pollination', 'revival_of'],
  },
  people: { label: 'Artists & members', types: ['key_artist_of', 'member_of', 'collaborated_with'] },
  instruments: { label: 'Instruments', types: ['featured_in', 'plays'] },
  industry: { label: 'Labels & places', types: ['signed_to', 'founded', 'originated_in'] },
  tracks: { label: 'Tracks', types: ['anthem_of', 'recorded_by', 'composed_by'] },
  events: { label: 'Events', types: ['shaped', 'context_for', 'recognized', 'involved', 'occurred_in'] },
  festivals: { label: 'Festivals', types: ['festival_related'] },
}

export interface ReviewProgress<K extends string> {
  key: K
  reviewed: number
  total: number
}

export interface ReviewStats {
  reviewed: number
  total: number
  reviewedNodes: number
  reviewedEdges: number
  lastReviewed: string | null
  nodeTypes: ReviewProgress<NodeType>[]
  linkGroups: ReviewProgress<LinkGroup>[]
  /** Genres and artists, grouped by their timeline family. */
  families: ReviewProgress<LaneFamily>[]
  /** Confidence of reviewed links only. */
  confidence: Record<Confidence | 'unrated', number>
  averageSources: { reviewed: number; pending: number }
  sourceDomains: { domain: string; count: number }[]
}

function progress<K extends string>(items: Iterable<[K, boolean]>): ReviewProgress<K>[] {
  const counts = new Map<K, ReviewProgress<K>>()
  for (const [key, done] of items) {
    const entry = counts.get(key) ?? { key, reviewed: 0, total: 0 }
    entry.total++
    if (done) entry.reviewed++
    counts.set(key, entry)
  }
  return [...counts.values()].sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
}

const LINK_GROUP_BY_TYPE = new Map(
  (Object.entries(LINK_GROUPS) as [LinkGroup, (typeof LINK_GROUPS)[LinkGroup]][]).flatMap(([group, { types }]) =>
    types.map((type) => [type, group] as const),
  ),
)

export function reviewStats(
  index: GraphIndex,
  status: { reviewed: readonly string[]; lastReviewed?: string | null },
): ReviewStats {
  const { nodes, edges } = index.graph
  const reviewed = new Set(status.reviewed)
  const isReviewed = (item: { id: string }) => reviewed.has(item.id)
  const reviewedItems = [...nodes, ...edges].filter(isReviewed)
  const pendingItems = [...nodes, ...edges].filter((item) => !isReviewed(item))
  const averageSources = (items: { sources?: string[] }[]) =>
    items.length ? items.reduce((sum, item) => sum + (item.sources?.length ?? 0), 0) / items.length : 0

  const confidence: ReviewStats['confidence'] = { high: 0, medium: 0, low: 0, unrated: 0 }
  for (const edge of edges) if (isReviewed(edge)) confidence[edge.confidence ?? 'unrated']++

  const families = progress(
    nodes
      .filter((node) => node.type === 'genre' || node.type === 'artist')
      .flatMap((node): [LaneFamily, boolean][] => {
        const family = timelineFamily(index, node)
        return family ? [[family, isReviewed(node)]] : []
      }),
  )

  const reviewedNodes = nodes.filter(isReviewed).length
  const reviewedEdges = edges.filter(isReviewed).length
  return {
    reviewed: reviewedNodes + reviewedEdges,
    total: nodes.length + edges.length,
    reviewedNodes,
    reviewedEdges,
    lastReviewed: status.lastReviewed ?? null,
    nodeTypes: progress(nodes.map((node) => [node.type, isReviewed(node)])),
    linkGroups: progress(edges.map((edge) => [LINK_GROUP_BY_TYPE.get(edge.type) ?? 'lineage', isReviewed(edge)])),
    families,
    confidence,
    averageSources: { reviewed: averageSources(reviewedItems), pending: averageSources(pendingItems) },
    sourceDomains: sortedCounts(
      tally(reviewedItems.flatMap((item) => item.sources ?? []).map(domainOf).filter((domain) => domain !== null)),
    )
      .slice(0, TOP)
      .map(([domain, count]) => ({ domain, count })),
  }
}
