import {
  LINEAGE_ORIENTATION,
  type EdgeType,
  type GraphEdge,
  type GraphNode,
  type MusicGraph,
  type RelationOrientation,
} from './types.ts'

/**
 * In-memory index over the raw graph JSON. All UI code queries the graph
 * exclusively through this module, so swapping the JSON file for a real
 * graph database later only requires reimplementing this layer.
 */
export interface GraphIndex {
  graph: MusicGraph
  nodeById: Map<string, GraphNode>
  outEdges: Map<string, GraphEdge[]>
  inEdges: Map<string, GraphEdge[]>
}

export function buildIndex(graph: MusicGraph): GraphIndex {
  const nodeById = new Map<string, GraphNode>()
  for (const node of graph.nodes) {
    nodeById.set(node.id, node)
  }
  const outEdges = new Map<string, GraphEdge[]>()
  const inEdges = new Map<string, GraphEdge[]>()
  for (const edge of graph.edges) {
    push(outEdges, edge.from, edge)
    push(inEdges, edge.to, edge)
  }
  return { graph, nodeById, outEdges, inEdges }
}

function push(map: Map<string, GraphEdge[]>, key: string, edge: GraphEdge) {
  const list = map.get(key)
  if (list) {
    list.push(edge)
  } else {
    map.set(key, [edge])
  }
}

export interface NeighborEntry {
  edge: GraphEdge
  node: GraphNode
  direction: 'out' | 'in'
}

/** Every edge touching `id`, with the node on the other end resolved. */
export function neighbors(index: GraphIndex, id: string): NeighborEntry[] {
  const result: NeighborEntry[] = []
  for (const edge of index.outEdges.get(id) ?? []) {
    const node = index.nodeById.get(edge.to)
    if (node) result.push({ edge, node, direction: 'out' })
  }
  for (const edge of index.inEdges.get(id) ?? []) {
    const node = index.nodeById.get(edge.from)
    if (node) result.push({ edge, node, direction: 'in' })
  }
  return result
}

export interface Lineage {
  /** Nodes reachable by walking lineage edges backwards (what fed this node). */
  ancestors: Set<string>
  /** Nodes reachable by walking lineage edges forwards (what this node fed). */
  descendants: Set<string>
  /** Edge ids on any ancestor/descendant path. */
  edges: Set<string>
}

/**
 * Full lineage of a node following lineage-type edges only, honoring each
 * edge type's orientation (`influences` points ancestor -> descendant while
 * `derived_from` points descendant -> ancestor).
 */
export function lineage(
  index: GraphIndex,
  id: string,
  orientation: RelationOrientation = LINEAGE_ORIENTATION,
): Lineage {
  const ancestors = new Set<string>()
  const descendants = new Set<string>()
  const edges = new Set<string>()

  walk(index, id, 'ancestors', ancestors, edges, orientation)
  walk(index, id, 'descendants', descendants, edges, orientation)

  return { ancestors, descendants, edges }
}

export function lineageHighlight(
  index: GraphIndex,
  id: string | null,
  orientation: RelationOrientation = LINEAGE_ORIENTATION,
) {
  if (!id || !index.nodeById.has(id)) return null
  const result = lineage(index, id, orientation)
  return {
    nodes: new Set([id, ...result.ancestors, ...result.descendants]),
    edges: result.edges,
  }
}

/** Resolve the ancestor-side node id of a lineage edge, or null if not a lineage edge. */
export function lineageSource(
  edge: GraphEdge,
  orientations: RelationOrientation = LINEAGE_ORIENTATION,
): string | null {
  const orientation = orientations[edge.type]
  if (!orientation) return null
  return orientation === 'forward' ? edge.from : edge.to
}

/** Resolve the descendant-side node id of a lineage edge, or null if not a lineage edge. */
export function lineageTarget(
  edge: GraphEdge,
  orientations: RelationOrientation = LINEAGE_ORIENTATION,
): string | null {
  const orientation = orientations[edge.type]
  if (!orientation) return null
  return orientation === 'forward' ? edge.to : edge.from
}

function walk(
  index: GraphIndex,
  start: string,
  toward: 'ancestors' | 'descendants',
  visited: Set<string>,
  edges: Set<string>,
  orientation: RelationOrientation,
) {
  const queue = [start]
  const seen = new Set([start])
  while (queue.length > 0) {
    const current = queue.shift()!
    const touching = [
      ...(index.outEdges.get(current) ?? []),
      ...(index.inEdges.get(current) ?? []),
    ]
    for (const edge of touching) {
      const source = lineageSource(edge, orientation)
      const target = lineageTarget(edge, orientation)
      if (source === null || target === null) continue
      const next =
        toward === 'ancestors'
          ? target === current
            ? source
            : null
          : source === current
            ? target
            : null
      if (next === null) continue
      edges.add(edge.id)
      if (!seen.has(next)) {
        seen.add(next)
        visited.add(next)
        queue.push(next)
      }
    }
  }
}

/** Nodes whose active period intersects [start, end]. */
export function nodesInPeriod(
  graph: MusicGraph,
  start: number,
  end: number,
  now = new Date().getFullYear(),
): GraphNode[] {
  return graph.nodes.filter((node) => {
    if (!node.period) return false
    const nodeEnd = node.period.end ?? now
    return node.period.start <= end && nodeEnd >= start
  })
}

export interface SearchResult {
  node: GraphNode
  score: number
}

/** Case-insensitive subsequence search, ranked: exact > prefix > substring > subsequence. */
export function searchNodes(graph: MusicGraph, query: string, limit = 8): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return []
  const results: SearchResult[] = []
  for (const node of graph.nodes) {
    const name = node.name.toLowerCase()
    let score: number | null = null
    if (name === q) score = 100
    else if (name.startsWith(q)) score = 80
    else if (name.includes(q)) score = 60
    else if (isSubsequence(q, name)) score = 30
    if (score !== null) {
      results.push({ node, score: score - name.length * 0.1 })
    }
  }
  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0
  for (const char of haystack) {
    if (char === needle[i]) i += 1
    if (i === needle.length) return true
  }
  return i === needle.length
}

/** Group a node's neighbors by edge type for display, outgoing before incoming. */
export function groupedRelations(
  index: GraphIndex,
  id: string,
): { type: EdgeType; direction: 'out' | 'in'; entries: NeighborEntry[] }[] {
  const groups = new Map<string, NeighborEntry[]>()
  for (const entry of neighbors(index, id)) {
    const key = `${entry.direction}:${entry.edge.type}`
    const list = groups.get(key)
    if (list) list.push(entry)
    else groups.set(key, [entry])
  }
  return [...groups.entries()]
    .map(([key, entries]) => {
      const [direction, type] = key.split(':') as ['out' | 'in', EdgeType]
      return { type, direction, entries }
    })
    .sort((a, b) =>
      a.direction === b.direction
        ? a.type.localeCompare(b.type)
        : a.direction === 'out'
          ? -1
          : 1,
    )
}
