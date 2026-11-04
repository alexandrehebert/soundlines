import { ARTIST_EDGE_COLORS, INSTRUMENT_EDGE_COLORS, LINEAGE_EDGE_COLORS } from '../theme.ts'
import { buildIndex, type GraphIndex } from './graph.ts'
import { CURRENT_YEAR, DEFAULT_START_YEAR, layoutFamilies, MAX_YEAR, MIN_YEAR, type TimelineOrder } from './layout.ts'
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
export type ExplorerView = TimelineView | 'history'
export type TimelineOrders = Record<TimelineView, TimelineOrder>

export const TIMELINE_VIEWS: readonly TimelineView[] = ['genre', 'artist', 'instrument']
export const EXPLORER_VIEWS: readonly ExplorerView[] = [...TIMELINE_VIEWS, 'history']

export const VIEW_LABELS: Record<TimelineView, string> = {
  genre: 'Genre',
  artist: 'Artist',
  instrument: 'Instrument',
}

const ORDER_PARAMS: Record<TimelineView, string> = {
  genre: 'sort',
  artist: 'artist-sort',
  instrument: 'instrument-sort',
}

export function readTimelineOrders(params: URLSearchParams): TimelineOrders {
  const orderFor = (view: TimelineView): TimelineOrder =>
    params.get(ORDER_PARAMS[view]) === 'oldest-first' ? 'oldest-first' : 'family'
  return { genre: orderFor('genre'), artist: orderFor('artist'), instrument: orderFor('instrument') }
}

export function writeTimelineOrders(params: URLSearchParams, orders: TimelineOrders): void {
  for (const view of TIMELINE_VIEWS) {
    const param = ORDER_PARAMS[view]
    if (orders[view] === 'oldest-first') params.set(param, 'oldest-first')
    else params.delete(param)
  }
}

export function isTimelineView(type: string | undefined): type is TimelineView {
  return (TIMELINE_VIEWS as readonly (string | undefined)[]).includes(type)
}

export function viewForNode(type: string | undefined, currentView: ExplorerView): ExplorerView {
  if (type === 'event') return 'history'
  return isTimelineView(type) ? type : currentView
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
export const VIEW_PARAMS: Record<ExplorerView, string | null> = {
  genre: null,
  artist: 'artists',
  instrument: 'instruments',
  history: 'history',
}

export function viewFromParam(param: string | null): ExplorerView {
  return EXPLORER_VIEWS.find((view) => param !== null && VIEW_PARAMS[view] === param) ?? 'genre'
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
    if (!family) {
      throw new Error(`Timeline node ${node.id} needs a ${view === 'instrument' ? 'known instrument' : 'genre'} family`)
    }
    if (node.period != null && !Number.isInteger(node.period.start)) {
      throw new Error(`Timeline node ${node.id} has an invalid start year`)
    }
    if (node.period?.end != null && (!Number.isInteger(node.period.end) || node.period.end < node.period.start)) {
      throw new Error(`Timeline node ${node.id} has an invalid end year`)
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
    view,
    index: buildIndex(graph),
    lanes: layoutFamilies(graph, now, view),
    undated: nodes.filter((node) => node.period == null)
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    orientation,
    edgeColors: EDGE_COLORS[view],
  }
}

export type TimelineModel = ReturnType<typeof createTimelineModel>
