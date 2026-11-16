import type { GraphIndex } from './graph.ts'
import { FAMILY_ORDER, isGenreFamily, type GenreFamily, type GraphNode } from './types.ts'

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
