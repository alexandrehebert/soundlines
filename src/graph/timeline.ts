import { ARTIST_EDGE_COLORS, INSTRUMENT_EDGE_COLORS, LINEAGE_EDGE_COLORS } from '../theme.ts'
import { buildIndex, type GraphIndex } from './graph.ts'
import { CURRENT_YEAR, DEFAULT_START_YEAR, layoutFamilies, MAX_YEAR, MIN_YEAR } from './layout.ts'
import {
  FAMILY_ORDER,
  isGenreFamily,
  isInstrumentFamily,
  LINEAGE_ORIENTATION,
  type GenreFamily,
  type GraphNode,
  type LaneFamily,
  type RelationOrientation,
} from './types.ts'

export type TimelineView = 'genre' | 'artist' | 'instrument'

export const TIMELINE_VIEWS: readonly TimelineView[] = ['genre', 'artist', 'instrument']

export function isTimelineView(type: string | undefined): type is TimelineView {
  return (TIMELINE_VIEWS as readonly (string | undefined)[]).includes(type)
}

const ARTIST_ORIENTATION: RelationOrientation = {
  influences: 'forward',
  member_of: 'forward',
  collaborated_with: 'forward',
}

/** Instruments span centuries, so their timeline opens on the full history. */
export function defaultViewRange(view: TimelineView): [number, number] {
  return [view === 'instrument' ? MIN_YEAR : DEFAULT_START_YEAR, MAX_YEAR]
}

/** URL `view` parameter values; genres are the default and have none. */
export const VIEW_PARAMS: Record<TimelineView, string | null> = {
  genre: null,
  artist: 'artists',
  instrument: 'instruments',
}

export function viewFromParam(param: string | null): TimelineView {
  return TIMELINE_VIEWS.find((view) => param !== null && VIEW_PARAMS[view] === param) ?? 'genre'
}

const INSTRUMENT_ORIENTATION: RelationOrientation = {
  influences: 'forward',
  derived_from: 'backward',
}

const ORIENTATIONS: Record<TimelineView, RelationOrientation> = {
  genre: LINEAGE_ORIENTATION,
  artist: ARTIST_ORIENTATION,
  instrument: INSTRUMENT_ORIENTATION,
}

const EDGE_COLORS = {
  genre: LINEAGE_EDGE_COLORS,
  artist: ARTIST_EDGE_COLORS,
  instrument: INSTRUMENT_EDGE_COLORS,
} satisfies Record<TimelineView, unknown>

export function artistFamily(index: GraphIndex, artist: GraphNode): GenreFamily | undefined {
  if (isGenreFamily(artist.family)) return artist.family
  const counts = new Map<GenreFamily, number>()
  const genres = new Set<string>()
  for (const edge of index.outEdges.get(artist.id) ?? []) {
    if (edge.type !== 'key_artist_of' || genres.has(edge.to)) continue
    const genre = index.nodeById.get(edge.to)
    if (genre?.type !== 'genre' || !isGenreFamily(genre.family)) continue
    genres.add(genre.id)
    counts.set(genre.family, (counts.get(genre.family) ?? 0) + 1)
  }
  return FAMILY_ORDER.filter((family) => counts.has(family))
    .sort((a, b) => counts.get(b)! - counts.get(a)!)[0]
}

/** The lane a node is drawn in, or undefined when it has none for its timeline. */
export function timelineFamily(index: GraphIndex, node: GraphNode): LaneFamily | undefined {
  if (node.type === 'artist') return artistFamily(index, node)
  if (node.type === 'genre') return isGenreFamily(node.family) ? node.family : undefined
  if (node.type === 'instrument') return isInstrumentFamily(node.family) ? node.family : undefined
  return node.family
}

export function createTimelineModel(
  index: GraphIndex,
  view: TimelineView,
  now = CURRENT_YEAR,
) {
  const nodes = index.graph.nodes.filter((node) => node.type === view).map((node) => {
    const family = timelineFamily(index, node)
    if (!family || !node.period) {
      throw new Error(`Timeline node ${node.id} needs a period and a ${view === 'instrument' ? 'known instrument' : 'genre'} family`)
    }
    return { ...node, family }
  })
  const ids = new Set(nodes.map((node) => node.id))
  const orientation = ORIENTATIONS[view]
  const edges = index.graph.edges.filter((edge) =>
    orientation[edge.type] !== undefined && ids.has(edge.from) && ids.has(edge.to),
  )
  const graph = { version: index.graph.version, nodes, edges }
  return {
    index: buildIndex(graph),
    lanes: layoutFamilies(graph, now, view),
    orientation,
    edgeColors: EDGE_COLORS[view],
  }
}

export type TimelineModel = ReturnType<typeof createTimelineModel>
