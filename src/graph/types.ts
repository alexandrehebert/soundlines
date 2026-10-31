/**
 * Property-graph data model.
 *
 * The whole dataset is a single JSON document shaped as { nodes, edges }.
 * Node ids are stable slugs of the form `<type>:<slug>` so the dataset can be
 * migrated verbatim to a graph database later (nodes -> labeled vertices,
 * edges -> typed relationships, remaining fields -> properties).
 */

export type NodeType = 'genre' | 'artist' | 'label' | 'place' | 'track' | 'scene'

export type EdgeType =
  // genre lineage
  | 'influences'
  | 'derived_from'
  | 'subgenre_of'
  | 'fusion_of'
  | 'cross_pollination'
  | 'revival_of'
  // people
  | 'key_artist_of'
  | 'member_of'
  | 'collaborated_with'
  // industry & geography
  | 'signed_to'
  | 'founded'
  | 'originated_in'
  // tracks
  | 'anthem_of'
  | 'recorded_by'

export type Confidence = 'low' | 'medium' | 'high'

export type DatePrecision = 'year' | 'decade' | 'circa'

export interface Period {
  /** Start year. */
  start: number
  /** End year; null/absent means "still active". */
  end?: number | null
  precision?: DatePrecision
}

export type GenreFamily =
  | 'roots'
  | 'electronic-pioneers'
  | 'house'
  | 'techno'
  | 'uk-continuum'

export type ArtistKind = 'person' | 'group' | 'collective'

export type Prominence = 'emerging' | 'golden-age' | 'established' | 'niche'

export interface ProminencePhase {
  start: number
  prominence: Prominence
  /** Optional finer shade (0–1) than the prominence default; 0 hides the bar. */
  intensity?: number
}

export const PROMINENCE_LABELS: Record<Prominence, string> = {
  emerging: 'Emerging',
  'golden-age': 'Golden age',
  established: 'Continuing',
  niche: 'Niche scene',
}

const ARTIST_PROMINENCE_LABELS: Record<Prominence, string> = {
  emerging: 'Emerging',
  'golden-age': 'Peak years',
  established: 'Continuing',
  niche: 'Low profile / hiatus',
}

export function prominenceLabels(type: NodeType): Record<Prominence, string> {
  return type === 'artist' ? ARTIST_PROMINENCE_LABELS : PROMINENCE_LABELS
}

export interface GraphNode {
  id: string
  type: NodeType
  name: string
  period?: Period
  description?: string
  /** Lane grouping; artist lanes can also be inferred from their genre relationships. */
  family?: GenreFamily
  /** Only meaningful for artists. */
  kind?: ArtistKind
  sources?: string[]
  /** Editorial genre or career prominence, not measured popularity. */
  phases?: ProminencePhase[]
  phaseNote?: string
}

export interface GraphEdge {
  id: string
  type: EdgeType
  from: string
  to: string
  period?: Period
  confidence?: Confidence
  note?: string
  sources?: string[]
}

export interface MusicGraph {
  version: number
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/**
 * Lineage edges connect the family tree. Orientation says which side of the
 * edge is the ancestor: `forward` means `from` is the ancestor ("A influences
 * B"), `backward` means `from` is the descendant ("A derived_from B"), so the
 * JSON reads naturally in both directions.
 */
export type RelationOrientation = Partial<Record<EdgeType, 'forward' | 'backward'>>

export const LINEAGE_ORIENTATION: RelationOrientation = {
  influences: 'forward',
  cross_pollination: 'forward',
  derived_from: 'backward',
  subgenre_of: 'backward',
  fusion_of: 'backward',
  revival_of: 'backward',
}

export const LINEAGE_EDGE_TYPES: readonly EdgeType[] = Object.keys(
  LINEAGE_ORIENTATION,
) as EdgeType[]

export const FAMILY_LABELS: Record<GenreFamily, string> = {
  roots: 'Roots',
  'electronic-pioneers': 'Electronic pioneers',
  house: 'House',
  techno: 'Techno',
  'uk-continuum': 'UK continuum',
}

export const FAMILY_ORDER: readonly GenreFamily[] = [
  'roots',
  'electronic-pioneers',
  'house',
  'techno',
  'uk-continuum',
]

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  genre: 'Genre',
  artist: 'Artist',
  label: 'Label',
  place: 'Place',
  track: 'Track',
  scene: 'Scene',
}

/** Phrasing when the focused node is the edge's `from` side. */
export const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  influences: 'influences',
  derived_from: 'derived from',
  subgenre_of: 'subgenre of',
  fusion_of: 'fusion of',
  cross_pollination: 'cross-pollination with',
  revival_of: 'revival of',
  key_artist_of: 'key artist of',
  member_of: 'member of',
  collaborated_with: 'collaborated with',
  signed_to: 'signed to',
  founded: 'founded',
  originated_in: 'originated in',
  anthem_of: 'anthem of',
  recorded_by: 'recorded by',
}

/** Phrasing when the focused node is the edge's `to` side. */
export const EDGE_TYPE_INVERSE_LABELS: Record<EdgeType, string> = {
  influences: 'influenced by',
  derived_from: 'origin of',
  subgenre_of: 'parent of',
  fusion_of: 'fused into',
  cross_pollination: 'cross-pollination with',
  revival_of: 'revived as',
  key_artist_of: 'key artists',
  member_of: 'members',
  collaborated_with: 'collaborated with',
  signed_to: 'roster',
  founded: 'founded by',
  originated_in: 'birthplace of',
  anthem_of: 'anthems',
  recorded_by: 'recordings',
}
