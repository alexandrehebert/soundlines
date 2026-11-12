/**
 * Genre ids that are in the graph but do not have a rendered ACE-Step preview yet.
 * Graph contributions (including the cloud agent, which cannot run ACE-Step) add new genres here;
 * the preview pipeline removes them once `public/genre-previews/<slug>.m4a` is reviewed and shipped.
 */
export const PENDING_GENRE_PREVIEWS: ReadonlySet<string> = new Set<string>([])

export function hasGenrePreview(id: string) {
  return id.startsWith('genre:') && !PENDING_GENRE_PREVIEWS.has(id)
}
