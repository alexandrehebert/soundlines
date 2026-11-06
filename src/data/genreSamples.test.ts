import { readdirSync } from 'node:fs'
import { expect, it } from 'vitest'
import graph from './graph.json'

it('ships exactly one ACE-Step preview for every genre', () => {
  const files = readdirSync(new URL('../../public/genre-previews/', import.meta.url))
  const expected = graph.nodes
    .filter(({ type }) => type === 'genre')
    .map(({ id }) => `${id.slice('genre:'.length)}.m4a`)
  expect(files.sort()).toEqual(expected.sort())
})
