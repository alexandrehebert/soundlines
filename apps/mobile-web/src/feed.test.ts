import { describe, expect, it } from 'vitest'
import graph from '@soundlines/catalogue/data/graph.json'
import type { MusicGraph } from '@soundlines/catalogue/types'
import { cardAt, createFeed } from './feed.ts'

const catalogue = createFeed(graph as MusicGraph)

describe('mobile catalogue feed', () => {
  it('orders regular entries by addition date and represents every node type', () => {
    const dates = catalogue.entries.map(({ node }) => node.addedOn ?? '')
    expect(dates).toEqual([...dates].sort().reverse())
    const latestKinds = new Set(catalogue.entries.filter(({ node }) => node.addedOn === dates[0]).map(({ node }) => node.type))
    expect(new Set(catalogue.entries.slice(0, latestKinds.size).map(({ node }) => node.type))).toEqual(latestKinds)
    expect(new Set(catalogue.entries.map(({ node }) => node.type)).size).toBe(9)
  })

  it('mixes in familiar nodes and trails and keeps serving cards beyond the full catalogue', () => {
    const cards = Array.from({ length: Math.ceil((catalogue.entries.length + 2) / 8) * 10 }, (_, index) =>
      cardAt(catalogue, index))
    expect(cards[4]).toMatchObject({ kind: 'node', id: 'genre:disco', spotlight: true })
    expect(cards[9]).toMatchObject({ kind: 'trail', id: 'soul-to-techno' })
    expect(cards.some((card) => card.kind === 'node' && card.spotlight && card.node.type === 'track')).toBe(true)
    const regular = cards.filter((card) => card.kind === 'node' && !card.spotlight)
    expect(new Set(regular.slice(0, catalogue.entries.length).map(({ id }) => id)).size).toBe(catalogue.entries.length)
    expect(regular[catalogue.entries.length].id).toBe(regular[0].id)
  })
})
