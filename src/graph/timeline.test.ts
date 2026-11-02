import { describe, expect, it } from 'vitest'
import rawGraph from '../data/graph.json'
import { buildIndex, lineage } from './graph.ts'
import { artistFamily, createTimelineModel, defaultViewRange, isTimelineView, viewFromParam, VIEW_PARAMS } from './timeline.ts'
import type { MusicGraph } from './types.ts'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:blues', type: 'genre', name: 'Blues', family: 'blues-soul', period: { start: 1950 } },
    { id: 'genre:house', type: 'genre', name: 'House', family: 'house', period: { start: 1980 } },
    { id: 'artist:a', type: 'artist', name: 'A', period: { start: 1960 } },
    { id: 'artist:b', type: 'artist', name: 'B', period: { start: 1980 } },
    { id: 'artist:group', type: 'artist', name: 'Group', kind: 'group', period: { start: 1985 } },
    { id: 'instrument:guitar', type: 'instrument', name: 'Guitar', family: 'strings', period: { start: 1500 } },
    { id: 'instrument:electric-guitar', type: 'instrument', name: 'Electric guitar', family: 'strings',
      period: { start: 1932 } },
    { id: 'instrument:tr-808', type: 'instrument', name: 'TR-808', family: 'electronic', period: { start: 1980 } },
  ],
  edges: [
    { id: 'g', type: 'influences', from: 'genre:blues', to: 'genre:house' },
    { id: 'a', type: 'key_artist_of', from: 'artist:a', to: 'genre:blues' },
    { id: 'b', type: 'key_artist_of', from: 'artist:b', to: 'genre:house' },
    { id: 'group', type: 'key_artist_of', from: 'artist:group', to: 'genre:house' },
    { id: 'influence', type: 'influences', from: 'artist:a', to: 'artist:b' },
    { id: 'member', type: 'member_of', from: 'artist:b', to: 'artist:group' },
    { id: 'collaboration', type: 'collaborated_with', from: 'artist:a', to: 'artist:group',
      period: { start: 1990 } },
    { id: 'cross-type', type: 'influences', from: 'artist:a', to: 'genre:house' },
    { id: 'derived', type: 'derived_from', from: 'instrument:electric-guitar', to: 'instrument:guitar' },
    { id: 'featured', type: 'featured_in', from: 'instrument:tr-808', to: 'genre:house' },
    { id: 'plays', type: 'plays', from: 'artist:b', to: 'instrument:tr-808' },
  ],
}

describe('timeline projections', () => {
  const index = buildIndex(graph)

  it('keeps genre bars and links separate from artists', () => {
    const model = createTimelineModel(index, 'genre', 2026)
    expect(model.index.graph.nodes.map((node) => node.type)).toEqual(['genre', 'genre'])
    expect(model.index.graph.edges.map((edge) => edge.id)).toEqual(['g'])
    const focus = lineage(model.index, 'genre:house', model.orientation)
    expect([...focus.ancestors]).toEqual(['genre:blues'])
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
    expect(artistFamily(withTie, artist)).toBe('blues-soul')
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

  it('lays out instruments in instrument-family lanes with only instrument lineage links', () => {
    const model = createTimelineModel(index, 'instrument', 2026)
    expect(model.lanes.map((lane) => lane.family)).toEqual(['strings', 'electronic'])
    expect(model.index.graph.edges.map((edge) => edge.id)).toEqual(['derived'])
    const result = lineage(model.index, 'instrument:electric-guitar', model.orientation)
    expect([...result.ancestors]).toEqual(['instrument:guitar'])
    expect(createTimelineModel(index, 'genre').index.graph.edges.map((edge) => edge.id)).toEqual(['g'])
  })

  it('reports instruments without an instrument family', () => {
    const incomplete = buildIndex({
      ...graph,
      nodes: [...graph.nodes, { id: 'instrument:odd', type: 'instrument', name: 'Odd', family: 'jazz',
        period: { start: 1900 } }],
    })
    expect(() => createTimelineModel(incomplete, 'instrument')).toThrow('instrument:odd')
  })

  it('maps views to URL params and default ranges', () => {
    for (const view of ['genre', 'artist', 'instrument'] as const) {
      expect(isTimelineView(view)).toBe(true)
      expect(viewFromParam(VIEW_PARAMS[view])).toBe(view)
    }
    expect(viewFromParam('instruments')).toBe('instrument')
    expect(viewFromParam('bogus')).toBe('genre')
    expect(defaultViewRange('instrument')[0]).toBeLessThan(defaultViewRange('genre')[0])
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
