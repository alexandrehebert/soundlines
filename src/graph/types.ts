/**
 * Property-graph data model.
 *
 * The whole dataset is a single JSON document shaped as { nodes, edges }.
 * Node ids are stable slugs of the form `<type>:<slug>` so the dataset can be
 * migrated verbatim to a graph database later (nodes -> labeled vertices,
 * edges -> typed relationships, remaining fields -> properties).
 */

export type NodeType =
  | 'genre'
  | 'artist'
  | 'instrument'
  | 'label'
  | 'place'
  | 'track'
  | 'scene'
  | 'event'

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
  // instruments
  | 'featured_in'
  | 'plays'
  // industry & geography
  | 'signed_to'
  | 'founded'
  | 'originated_in'
  // tracks
  | 'anthem_of'
  | 'recorded_by'
  | 'composed_by'
  // events
  | 'shaped'
  | 'context_for'
  | 'recognized'
  | 'involved'
  | 'occurred_in'

export type Confidence = 'low' | 'medium' | 'high'

export const DATE_PRECISIONS = ['year', 'decade', 'century', 'circa'] as const
export type DatePrecision = (typeof DATE_PRECISIONS)[number]

export interface Period {
  /** Start year. */
  start: number
  /** End year; null/absent means "still active". */
  end?: number | null
  precision?: DatePrecision
  /** Editorial timeline placement rather than verified date boundaries. */
  estimated?: boolean
  /** Evidence and limitations of an estimated placement. */
  estimateNote?: string
}

export type GenreFamily =
  | 'classical'
  | 'blues-soul'
  | 'jazz'
  | 'country-folk'
  | 'rock'
  | 'alternative-punk'
  | 'metal'
  | 'pop'
  | 'hip-hop'
  | 'reggae'
  | 'latin'
  | 'african'
  | 'electronica'
  | 'house'
  | 'techno'
  | 'breakbeat-bass'

export type InstrumentFamily =
  | 'strings'
  | 'keyboards'
  | 'winds'
  | 'brass'
  | 'percussion'
  | 'electronic'

/** Timeline lane: genre families for genres and artists, instrument families for instruments. */
export type LaneFamily = GenreFamily | InstrumentFamily

export type ArtistKind = 'person' | 'group' | 'collective'

export type EventCategory =
  | 'technology'
  | 'media'
  | 'industry'
  | 'performance'
  | 'publication'
  | 'society'

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  technology: 'Technology & formats',
  media: 'Broadcast & media',
  industry: 'Industry & law',
  performance: 'Performances & festivals',
  publication: 'Theory, notation & print',
  society: 'Society & migration',
}

/** Editorial weight of an event in the chronology, not a measured ranking. */
export type EventSignificance = 'landmark' | 'notable'

export type Prominence = 'emerging' | 'golden-age' | 'established' | 'niche'

export interface ProminencePhase {
  start: number
  prominence: Prominence
  /** Evidence strength for this phase interpretation. */
  confidence?: Confidence
  /** Phase-specific rationale or historical context. */
  note?: string
  /** Sources supporting the phase-specific note or boundary. */
  sources?: string[]
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

const INSTRUMENT_PROMINENCE_LABELS: Record<Prominence, string> = {
  emerging: 'Emerging',
  'golden-age': 'Peak use',
  established: 'Continuing',
  niche: 'Rare / eclipsed',
}

export function prominenceLabels(type: NodeType): Record<Prominence, string> {
  if (type === 'artist') return ARTIST_PROMINENCE_LABELS
  if (type === 'instrument') return INSTRUMENT_PROMINENCE_LABELS
  return PROMINENCE_LABELS
}

export interface GraphNode {
  id: string
  type: NodeType
  name: string
  period?: Period | null
  description?: string
  /**
   * Lane grouping: a genre family for genres (and artist overrides), an
   * instrument family for instruments. Artist lanes are usually inferred.
   */
  family?: LaneFamily
  /** Only meaningful for artists. */
  kind?: ArtistKind
  /** Events only. */
  category?: EventCategory
  /** Events only. */
  significance?: EventSignificance
  /** Editorial confidence in the entry's overall account, not each individual claim. */
  confidence?: Confidence
  sources?: string[]
  /** Editorial genre, career, or instrument-use prominence, not measured popularity. */
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

export const FAMILY_LABELS: Record<LaneFamily, string> = {
  classical: 'Classical',
  'blues-soul': 'Blues, R&B & Soul',
  jazz: 'Jazz',
  'country-folk': 'Country & Folk',
  rock: 'Rock',
  'alternative-punk': 'Alternative & Punk',
  metal: 'Metal',
  pop: 'Pop',
  'hip-hop': 'Hip-hop',
  reggae: 'Reggae & Ska',
  latin: 'Latin',
  african: 'African',
  electronica: 'Electronica & Ambient',
  house: 'Disco & House',
  techno: 'Techno & Trance',
  'breakbeat-bass': 'Breakbeat & Bass',
  strings: 'Strings',
  keyboards: 'Keyboards & Organs',
  winds: 'Woodwinds & Reeds',
  brass: 'Brass',
  percussion: 'Percussion',
  electronic: 'Electronic & Studio',
}

export const FAMILY_ORDER: readonly GenreFamily[] = [
  'classical',
  'blues-soul',
  'jazz',
  'country-folk',
  'rock',
  'alternative-punk',
  'metal',
  'pop',
  'hip-hop',
  'reggae',
  'latin',
  'african',
  'electronica',
  'house',
  'techno',
  'breakbeat-bass',
]

export const INSTRUMENT_FAMILY_ORDER: readonly InstrumentFamily[] = [
  'strings',
  'keyboards',
  'winds',
  'brass',
  'percussion',
  'electronic',
]

export function isGenreFamily(family: LaneFamily | undefined): family is GenreFamily {
  return (FAMILY_ORDER as readonly string[]).includes(family as string)
}

export function isInstrumentFamily(family: LaneFamily | undefined): family is InstrumentFamily {
  return (INSTRUMENT_FAMILY_ORDER as readonly string[]).includes(family as string)
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  genre: 'Genre',
  artist: 'Artist',
  instrument: 'Instrument',
  label: 'Label',
  place: 'Place',
  track: 'Track',
  scene: 'Scene',
  event: 'Event',
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
  featured_in: 'featured in',
  plays: 'plays',
  signed_to: 'signed to',
  founded: 'founded',
  originated_in: 'originated in',
  anthem_of: 'anthem of',
  recorded_by: 'recorded by',
  composed_by: 'composed by',
  shaped: 'shaped',
  context_for: 'provides historical context for',
  recognized: 'recognizes',
  involved: 'involved',
  occurred_in: 'took place in',
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
  featured_in: 'instruments',
  plays: 'notable players',
  signed_to: 'roster',
  founded: 'founded by',
  originated_in: 'birthplace of',
  anthem_of: 'anthems',
  recorded_by: 'recordings',
  composed_by: 'compositions',
  shaped: 'shaped by',
  context_for: 'historical context from',
  recognized: 'recognized in',
  involved: 'involved in',
  occurred_in: 'events here',
}
