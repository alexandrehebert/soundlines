import { ARTIST_EDGE_COLORS, LINEAGE_EDGE_COLORS } from '../theme.ts'
import { buildIndex, type GraphIndex } from './graph.ts'
import { CURRENT_YEAR, layoutFamilies } from './layout.ts'
import {
  FAMILY_ORDER,
  LINEAGE_ORIENTATION,
  type GenreFamily,
  type GraphNode,
  type RelationOrientation,
} from './types.ts'

export type TimelineView = 'genre' | 'artist'

const ARTIST_ORIENTATION: RelationOrientation = {
  influences: 'forward',
  member_of: 'forward',
  collaborated_with: 'forward',
}

export function artistFamily(index: GraphIndex, artist: GraphNode): GenreFamily | undefined {
  if (artist.family) return artist.family
  const counts = new Map<GenreFamily, number>()
  const genres = new Set<string>()
  for (const edge of index.outEdges.get(artist.id) ?? []) {
    if (edge.type !== 'key_artist_of' || genres.has(edge.to)) continue
    const genre = index.nodeById.get(edge.to)
    if (genre?.type !== 'genre' || !genre.family) continue
    genres.add(genre.id)
    counts.set(genre.family, (counts.get(genre.family) ?? 0) + 1)
  }
  return FAMILY_ORDER.filter((family) => counts.has(family))
    .sort((a, b) => counts.get(b)! - counts.get(a)!)[0]
}

export function createTimelineModel(
  index: GraphIndex,
  view: TimelineView,
  now = CURRENT_YEAR,
) {
  const nodes = index.graph.nodes.filter((node) => node.type === view).map((node) => {
    const family = view === 'artist' ? artistFamily(index, node) : node.family
    if (!family || !node.period) {
      throw new Error(`Timeline node ${node.id} needs a period and a genre family`)
    }
    return { ...node, family }
  })
  const ids = new Set(nodes.map((node) => node.id))
  const orientation = view === 'artist' ? ARTIST_ORIENTATION : LINEAGE_ORIENTATION
  const edges = index.graph.edges.filter((edge) =>
    orientation[edge.type] !== undefined && ids.has(edge.from) && ids.has(edge.to),
  )
  const graph = { version: index.graph.version, nodes, edges }
  return {
    index: buildIndex(graph),
    lanes: layoutFamilies(graph, now, view),
    orientation,
    edgeColors: view === 'artist' ? ARTIST_EDGE_COLORS : LINEAGE_EDGE_COLORS,
  }
}

export type TimelineModel = ReturnType<typeof createTimelineModel>
