/**
 * Genre ids that are in the graph but do not have a rendered ACE-Step preview yet.
 * Graph contributions (including the cloud agent, which cannot run ACE-Step) add new genres here;
 * the preview pipeline removes them once `public/genre-previews/<slug>.m4a` is reviewed and shipped.
 */
export const PENDING_GENRE_PREVIEWS: ReadonlySet<string> = new Set<string>([
  'genre:arabesk',
  'genre:banda-sinaloense',
  'genre:benga',
  'genre:cantopop',
  'genre:chicha',
  'genre:corrido-tumbado',
  'genre:cuarteto',
  'genre:dabke-music',
  'genre:dangdut',
  'genre:egyptian-shaabi',
  'genre:ethio-jazz',
  'genre:fado',
  'genre:filmi',
  'genre:flamenco',
  'genre:funana',
  'genre:khaliji',
  'genre:mahraganat',
  'genre:maloya',
  'genre:mento',
  'genre:musica-criolla',
  'genre:norteno',
  'genre:opm',
  'genre:punjabi-bhangra',
  'genre:rebetiko',
  'genre:schlager',
  'genre:sega',
  'genre:sertanejo',
  'genre:trot',
  'genre:vallenato',
  'genre:varietes-francaises',
  'genre:waiata-a-ringa',
  'genre:zouk',
])

export function hasGenrePreview(id: string) {
  return id.startsWith('genre:') && !PENDING_GENRE_PREVIEWS.has(id)
}
