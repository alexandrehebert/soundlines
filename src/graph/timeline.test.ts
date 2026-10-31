import { describe, expect, it } from 'vitest'
import rawGraph from '../data/graph.json'
import { buildIndex, lineage } from './graph.ts'
import { artistFamily, createTimelineModel } from './timeline.ts'
import type { MusicGraph } from './types.ts'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:root', type: 'genre', name: 'Root', family: 'roots', period: { start: 1950 } },
    { id: 'genre:house', type: 'genre', name: 'House', family: 'house', period: { start: 1980 } },
    { id: 'artist:a', type: 'artist', name: 'A', period: { start: 1960 } },
    { id: 'artist:b', type: 'artist', name: 'B', period: { start: 1980 } },
    { id: 'artist:group', type: 'artist', name: 'Group', kind: 'group', period: { start: 1985 } },
  ],
  edges: [
    { id: 'g', type: 'influences', from: 'genre:root', to: 'genre:house' },
    { id: 'a', type: 'key_artist_of', from: 'artist:a', to: 'genre:root' },
    { id: 'b', type: 'key_artist_of', from: 'artist:b', to: 'genre:house' },
    { id: 'group', type: 'key_artist_of', from: 'artist:group', to: 'genre:house' },
    { id: 'influence', type: 'influences', from: 'artist:a', to: 'artist:b' },
    { id: 'member', type: 'member_of', from: 'artist:b', to: 'artist:group' },
    { id: 'collaboration', type: 'collaborated_with', from: 'artist:a', to: 'artist:group',
      period: { start: 1990 } },
    { id: 'cross-type', type: 'influences', from: 'artist:a', to: 'genre:house' },
  ],
}

describe('timeline projections', () => {
  const index = buildIndex(graph)

  it('keeps genre bars and links separate from artists', () => {
    const model = createTimelineModel(index, 'genre', 2026)
    expect(model.index.graph.nodes.map((node) => node.type)).toEqual(['genre', 'genre'])
    expect(model.index.graph.edges.map((edge) => edge.id)).toEqual(['g'])
    const focus = lineage(model.index, 'genre:house', model.orientation)
    expect([...focus.ancestors]).toEqual(['genre:root'])
  })

  it('replaces genres with one bar per artist and only artist-to-artist links', () => {
    const model = createTimelineModel(index, 'artist', 2026)
    expect(model.lanes.flatMap((lane) => lane.bars.map((bar) => bar.node.id)).sort())
      .toEqual(['artist:a', 'artist:b', 'artist:group'])
    expect(model.index.graph.edges.map((edge) => edge.id))
      .toEqual(['influence', 'member', 'collaboration'])
    expect(model.index.graph.edges.at(-1)?.period?.start).toBe(1990)
  })

  it('highlights artist influence and membership without following genre associations', () => {
    const model = createTimelineModel(index, 'artist', 2026)
    const result = lineage(model.index, 'artist:b', model.orientation)
    expect([...result.ancestors]).toEqual(['artist:a'])
    expect([...result.descendants]).toEqual(['artist:group'])
    expect([...result.edges]).toEqual(['influence', 'member'])
  })

  it('chooses the most represented family, with stable family-order ties and overrides', () => {
    const artist = index.nodeById.get('artist:a')!
    const withTie = buildIndex({
      ...graph,
      edges: [...graph.edges, { id: 'tie', type: 'key_artist_of', from: artist.id, to: 'genre:house' }],
    })
    expect(artistFamily(withTie, artist)).toBe('roots')
    expect(artistFamily(withTie, { ...artist, family: 'techno' })).toBe('techno')
    expect(artist.family).toBeUndefined()
  })

  it('does not infer prominence from genre phases or artist age', () => {
    const model = createTimelineModel(index, 'artist', 2026)
    expect(model.index.graph.nodes.every((node) => node.phases === undefined)).toBe(true)
  })

  it('reports incomplete timeline data rather than silently dropping an artist', () => {
    const incomplete = buildIndex({
      ...graph, nodes: [...graph.nodes, { id: 'artist:missing', type: 'artist', name: 'Missing' }],
    })
    expect(() => createTimelineModel(incomplete, 'artist')).toThrow('artist:missing')
  })

  it('can lay out every artist in the actual dataset once', () => {
    const data = rawGraph as MusicGraph
    const model = createTimelineModel(buildIndex(data), 'artist')
    const ids = model.lanes.flatMap((lane) => lane.bars.map((bar) => bar.node.id))
    expect(ids.length).toBe(data.nodes.filter((node) => node.type === 'artist').length)
    expect(new Set(ids).size).toBe(ids.length)
    expect(model.index.graph.edges.some((edge) => edge.type === 'member_of')).toBe(true)
  })
})
