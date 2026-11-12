import { readdirSync } from 'node:fs'
import { expect, it } from 'vitest'
import graph from './graph.json'
import { PENDING_GENRE_PREVIEWS, hasGenrePreview } from './genrePreviews.ts'

const genreIds = graph.nodes.filter(({ type }) => type === 'genre').map(({ id }) => id)

it('ships exactly one ACE-Step preview for every genre not pending a preview', () => {
  const files = readdirSync(new URL('../../public/genre-previews/', import.meta.url))
  const expected = genreIds
    .filter(hasGenrePreview)
    .map((id) => `${id.slice('genre:'.length)}.m4a`)
  expect(files.sort()).toEqual(expected.sort())
})

it('only lists existing genres as pending previews', () => {
  expect([...PENDING_GENRE_PREVIEWS].filter((id) => !genreIds.includes(id))).toEqual([])
})
