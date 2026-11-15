import type { GraphIndex } from './graph.ts'
import { LINEAGE_ORIENTATION, type GraphEdge, type GraphNode } from './types.ts'

/**
 * Curated Soundtrails: short, chronological walks through genre lineages.
 * Each consecutive pair must be joined by a lineage edge oriented from the
 * earlier stop to the later one, so the final stop's timeline highlight
 * contains the whole trail.
 */
export const SOUNDTRAILS = [
  { id: 'soul-to-techno', stops: ['genre:soul', 'genre:funk', 'genre:disco', 'genre:chicago-house', 'genre:detroit-techno'] },
  { id: 'breakbeat-science', stops: ['genre:funk', 'genre:hip-hop', 'genre:breakbeat-hardcore', 'genre:jungle', 'genre:uk-garage', 'genre:dubstep'] },
  { id: 'island-bass', stops: ['genre:calypso', 'genre:ska', 'genre:rocksteady', 'genre:reggae', 'genre:dub'] },
  { id: 'blues-to-grunge', stops: ['genre:blues', 'genre:rock-and-roll', 'genre:rock', 'genre:hard-rock', 'genre:heavy-metal', 'genre:grunge'] },
  { id: 'birth-of-cool', stops: ['genre:blues', 'genre:jazz', 'genre:swing', 'genre:bebop', 'genre:cool-jazz'] },
  { id: 'gamelan-to-synthwave', stops: ['genre:gamelan', 'genre:minimalism', 'genre:krautrock', 'genre:synth-pop', 'genre:synthwave'] },
] as const satisfies readonly { id: string; stops: readonly string[] }[]

export type Soundtrail = (typeof SOUNDTRAILS)[number]
export type SoundtrailId = Soundtrail['id']

export interface SoundtrailLink {
  edge: GraphEdge
  /** True when the edge is stored from the earlier stop to the later one. */
  forward: boolean
}

export interface SoundtrailStop {
  node: GraphNode
  /** How the previous stop leads here; null for the first stop. */
  link: SoundtrailLink | null
  keyArtists: GraphNode[]
  anthem: { track: GraphNode; artist: GraphNode | null } | null
}

const MAX_KEY_ARTISTS = 3

function linkBetween(index: GraphIndex, earlier: string, later: string): SoundtrailLink | null {
  for (const edge of index.outEdges.get(earlier) ?? []) {
    if (edge.to === later && LINEAGE_ORIENTATION[edge.type] === 'forward') return { edge, forward: true }
  }
  for (const edge of index.outEdges.get(later) ?? []) {
    if (edge.to === earlier && LINEAGE_ORIENTATION[edge.type] === 'backward') return { edge, forward: false }
  }
  return null
}

function incoming(index: GraphIndex, id: string, type: GraphEdge['type'], nodeType: GraphNode['type']) {
  return (index.inEdges.get(id) ?? [])
    .filter((edge) => edge.type === type)
    .map((edge) => index.nodeById.get(edge.from))
    .filter((node): node is GraphNode => node?.type === nodeType)
}

/** Resolve a trail against the graph; throws if the graph no longer supports it. */
export function resolveSoundtrail(index: GraphIndex, trail: Soundtrail): SoundtrailStop[] {
  return trail.stops.map((id, position) => {
    const node = index.nodeById.get(id)
    if (node?.type !== 'genre') throw new Error(`Soundtrail ${trail.id} references unknown genre ${id}`)
    const previous = position > 0 ? trail.stops[position - 1] : null
    const link = previous ? linkBetween(index, previous, id) : null
    if (previous && !link) throw new Error(`Soundtrail ${trail.id} has no lineage edge from ${previous} to ${id}`)
    const track = incoming(index, id, 'anthem_of', 'track')[0]
    const artistId = track && index.outEdges.get(track.id)?.find((edge) => edge.type === 'recorded_by')?.to
    return {
      node,
      link,
      keyArtists: incoming(index, id, 'key_artist_of', 'artist').slice(0, MAX_KEY_ARTISTS),
      anthem: track ? { track, artist: (artistId && index.nodeById.get(artistId)) || null } : null,
    }
  })
}

export interface AvailableSoundtrail {
  trail: Soundtrail
  stops: SoundtrailStop[]
}

/** Trails the graph currently supports, resolved; broken trails are left out (the graph tests flag them). */
export function availableSoundtrails(index: GraphIndex): AvailableSoundtrail[] {
  return SOUNDTRAILS.flatMap((trail) => {
    try {
      return [{ trail, stops: resolveSoundtrail(index, trail) }]
    } catch {
      return []
    }
  })
}
