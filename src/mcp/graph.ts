import type { z } from 'zod/v4'
import { graphForLocale } from '../data/graphLocale.ts'
import { buildIndex, neighbors, type GraphIndex, type NeighborEntry } from '../graph/graph.ts'
import type { GraphEdge, GraphNode } from '../graph/types.ts'
import type { Locale } from '../i18n/routing.ts'
import type { toolDefinitions } from './tools.ts'

type Input<T extends keyof typeof toolDefinitions> = z.output<(typeof toolDefinitions)[T]['inputSchema']>
type Pattern = Input<'query_graph'>
type NodeFilter = Pattern['root']
type Step = Pattern['branches'][number][number]
const indexes = new Map<Locale, GraphIndex>()

function indexFor(locale: Locale) {
  const existing = indexes.get(locale)
  if (existing) return existing
  const index = buildIndex(graphForLocale(locale))
  indexes.set(locale, index)
  return index
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function matchesNode(node: GraphNode, filter: NodeFilter, text?: string) {
  return (filter.id === undefined || node.id === filter.id)
    && node.id !== filter.excludeId
    && (filter.type === undefined || node.type === filter.type)
    && (text === undefined || normalize(node.name).includes(text) || normalize(node.id).includes(text))
    && (filter.activeIn === undefined || (
      node.period != null && filter.activeIn >= node.period.start && filter.activeIn <= (node.period.end ?? Infinity)
    ))
}

function matchesEdge(entry: NeighborEntry, filter: Step) {
  return (filter.direction === 'either' || entry.direction === filter.direction)
    && (!filter.types || filter.types.includes(entry.edge.type))
    && (!filter.confidence || filter.confidence === entry.edge.confidence)
}

function page<T>(items: T[], offset: number, limit: number) {
  return { items: items.slice(offset, offset + limit), nextOffset: items.length > offset + limit ? offset + limit : null }
}

export function searchNodes({ locale, limit, offset, ...filter }: Input<'search_nodes'>) {
  const text = normalize(filter.text)
  const found = indexFor(locale).graph.nodes.filter((node) => matchesNode(node, filter, text))
  const { items: nodes, nextOffset } = page(found, offset, limit)
  return { locale, nodes, nextOffset }
}

export function getNode({ locale, id }: Input<'get_node'>) {
  const node = indexFor(locale).nodeById.get(id)
  if (!node) throw new Error(`Unknown node: ${id}`)
  return { locale, node }
}

export function getRelationships({ locale, id, limit, offset, ...filter }: Input<'get_relationships'>) {
  const { node } = getNode({ locale, id })
  const found = neighbors(indexFor(locale), id).filter((entry) => matchesEdge(entry, filter))
  const { items: relationships, nextOffset } = page(found, offset, limit)
  return { locale, node, relationships, nextOffset }
}

const maxPaths = 5
const maxEdgeChecks = 100_000

function matchBranch(index: GraphIndex, root: GraphNode, steps: Step[], checkEdge: () => void) {
  const paths: NeighborEntry[][] = []
  const path: NeighborEntry[] = []
  const visited = new Set([root.id])
  const texts = steps.map(({ node }) => node?.text === undefined ? undefined : normalize(node.text))

  function walk(id: string) {
    if (path.length === steps.length) {
      paths.push([...path])
      return
    }

    const step = steps[path.length]
    for (const entry of neighbors(index, id)) {
      checkEdge()
      if (!matchesEdge(entry, step) || visited.has(entry.node.id)) continue
      if (step.node && !matchesNode(entry.node, step.node, texts[path.length])) continue
      visited.add(entry.node.id)
      path.push(entry)
      walk(entry.node.id)
      path.pop()
      visited.delete(entry.node.id)
      if (paths.length > maxPaths) return
    }
  }

  walk(root.id)
  return { paths: paths.slice(0, maxPaths), truncated: paths.length > maxPaths }
}

export function queryGraph({ locale, root, branches, limit, offset }: Pattern) {
  const index = indexFor(locale)
  const nodes = new Map<string, GraphNode>()
  const edges = new Map<string, GraphEdge>()
  const matches = []
  const rootText = root.text === undefined ? undefined : normalize(root.text)
  let skipped = 0
  let nextOffset = null
  let edgeChecks = 0

  function checkEdge() {
    if (++edgeChecks > maxEdgeChecks) {
      throw new Error('Query exceeded its traversal budget. Narrow the root or step filters and try again.')
    }
  }

  for (const node of index.graph.nodes) {
    if (!matchesNode(node, root, rootText)) continue
    const evidence = []
    for (const branch of branches) {
      const result = matchBranch(index, node, branch, checkEdge)
      if (!result.paths.length) break
      evidence.push(result)
    }
    if (evidence.length !== branches.length) continue
    if (skipped < offset) {
      skipped++
      continue
    }
    if (matches.length === limit) {
      nextOffset = offset + limit
      break
    }

    nodes.set(node.id, node)
    matches.push({
      rootId: node.id,
      branches: evidence.map(({ paths, truncated }) => ({
        truncated,
        paths: paths.map((entries) => entries.map((entry) => {
          nodes.set(entry.node.id, entry.node)
          edges.set(entry.edge.id, entry.edge)
          return { nodeId: entry.node.id, edgeId: entry.edge.id, direction: entry.direction }
        })),
      })),
    })
  }

  return { locale, matches, nodes: [...nodes.values()], edges: [...edges.values()], nextOffset }
}
