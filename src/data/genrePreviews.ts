/**
 * Genre ids that are in the graph but do not have a rendered ACE-Step preview yet.
 * Graph contributions (including the cloud agent, which cannot run ACE-Step) add new genres here;
 * the preview pipeline removes them once `public/genre-previews/<slug>.m4a` is reviewed and shipped.
 */
export const PENDING_GENRE_PREVIEWS: ReadonlySet<string> = new Set<string>([
  'genre:acid-techno',
  'genre:afro-house',
  'genre:ambient-house',
  'genre:brazilian-funk',
  'genre:chicago-blues',
  'genre:city-pop',
  'genre:country-pop',
  'genre:dance-pop',
  'genre:delta-blues',
  'genre:emo-rap',
  'genre:go-go',
  'genre:hardcore-punk',
  'genre:hyperpop',
  'genre:jazz-funk',
  'genre:latin-trap',
  'genre:liquid-drum-and-bass',
  'genre:mambo',
  'genre:melodic-death-metal',
  'genre:morna',
  'genre:neoclassicism',
  'genre:new-orleans-jazz',
  'genre:outlaw-country',
  'genre:power-metal',
  'genre:progressive-house',
  'genre:progressive-metal',
  'genre:roots-reggae',
  'genre:soca',
  'genre:soul-jazz',
  'genre:southern-rock',
  'genre:uk-funky',
])

export function hasGenrePreview(id: string) {
  return id.startsWith('genre:') && !PENDING_GENRE_PREVIEWS.has(id)
}
