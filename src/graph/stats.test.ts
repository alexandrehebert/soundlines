import { describe, expect, it } from 'vitest'
import { buildIndex } from './graph.ts'
import { datasetStats, emergenceBinStart, emergenceBins, reviewStats } from './stats.ts'
import type { MusicGraph } from './types.ts'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:baroque', type: 'genre', name: 'Baroque', family: 'classical', period: { start: 1600, end: 1750 } },
    { id: 'genre:jazz', type: 'genre', name: 'Jazz', family: 'jazz', period: { start: 1910 }, sources: ['https://en.wikipedia.org/wiki/Jazz'] },
    { id: 'genre:bebop', type: 'genre', name: 'Bebop', family: 'jazz', period: { start: 1944 } },
    { id: 'artist:miles', type: 'artist', name: 'Miles Davis', kind: 'person', period: { start: 1944, end: 1991 } },
    { id: 'artist:band', type: 'artist', name: 'Band', kind: 'group' },
    { id: 'instrument:trumpet', type: 'instrument', name: 'Trumpet', family: 'brass', period: { start: 1500 } },
    { id: 'place:nola', type: 'place', name: 'New Orleans' },
  ],
  edges: [
    { id: 'e1', type: 'derived_from', from: 'genre:bebop', to: 'genre:jazz', confidence: 'high', sources: ['https://www.allmusic.com/x'] },
    { id: 'e2', type: 'key_artist_of', from: 'artist:miles', to: 'genre:bebop', confidence: 'medium' },
    { id: 'e3', type: 'plays', from: 'artist:miles', to: 'instrument:trumpet' },
    { id: 'e4', type: 'originated_in', from: 'genre:jazz', to: 'place:nola', sources: ['https://fr.wikipedia.org/wiki/Jazz'] },
  ],
}

describe('emergence bins', () => {
  it('uses centuries before 1900 and decades afterwards', () => {
    expect(emergenceBinStart(1642)).toBe(1600)
    expect(emergenceBinStart(1899)).toBe(1800)
    expect(emergenceBinStart(1944)).toBe(1940)
  })

  it('fills empty bins between the first and last year', () => {
    const bins = emergenceBins([1700, 1915, 1938])
    expect(bins.map((bin) => bin.start)).toEqual([1700, 1800, 1900, 1910, 1920, 1930])
    expect(bins.map((bin) => bin.count)).toEqual([1, 0, 0, 1, 0, 1])
    expect(bins.at(-1)?.label).toBe('’30')
  })

  it('returns nothing without dated entries', () => {
    expect(emergenceBins([])).toEqual([])
  })
})

describe('datasetStats', () => {
  const stats = datasetStats(buildIndex(graph), 2026)

  it('counts entries, links and degree', () => {
    expect(stats.totalNodes).toBe(7)
    expect(stats.totalEdges).toBe(4)
    expect(stats.nodeTypes[0]).toEqual({ type: 'genre', count: 3 })
    expect(stats.averageDegree).toBeCloseTo(8 / 7)
    expect(stats.isolated).toBe(2)
    expect(stats.span).toEqual({ start: 1500, end: 2026 })
  })

  it('ranks the most connected entries', () => {
    expect(stats.mostConnected.slice(0, 3).map(({ node, degree }) => [node.id, degree])).toEqual([
      ['genre:bebop', 2],
      ['genre:jazz', 2],
      ['artist:miles', 2],
    ])
  })

  it('summarizes link confidence and sources', () => {
    expect(stats.confidence).toEqual({ high: 1, medium: 1, low: 0, unrated: 2 })
    expect(stats.sourcedEdges).toBe(2)
    expect(stats.sourcedNodes).toBe(1)
    expect(stats.sourceDomains).toEqual([
      { domain: 'wikipedia.org', count: 2 },
      { domain: 'allmusic.com', count: 1 },
    ])
  })

  it('breaks entities down by timeline family and activity', () => {
    const genres = stats.entities.genre
    expect(genres.total).toBe(3)
    expect(genres.active).toBe(2)
    expect(genres.families).toEqual([{ family: 'jazz', count: 2 }, { family: 'classical', count: 1 }])
    expect(genres.oldest.map((node) => node.id)).toEqual(['genre:baroque', 'genre:jazz', 'genre:bebop'])
    expect(genres.newest[0].id).toBe('genre:bebop')
  })

  it('infers artist families and reports undated or unassigned artists', () => {
    const artists = stats.entities.artist
    expect(artists.families).toEqual([{ family: 'jazz', count: 1 }])
    expect(artists.unassigned).toBe(1)
    expect(artists.dated).toBe(1)
    expect(artists.active).toBe(0)
    expect(stats.artistKinds).toEqual([{ kind: 'group', count: 1 }, { kind: 'person', count: 1 }])
  })
})

describe('reviewStats', () => {
  const stats = reviewStats(buildIndex(graph), { reviewed: ['genre:jazz', 'artist:miles', 'e1', 'e4', 'unknown'], lastReviewed: '2026-11-03' })

  it('counts reviewed entries and links, ignoring unknown ids', () => {
    expect(stats).toMatchObject({ reviewed: 4, total: 11, reviewedNodes: 2, reviewedEdges: 2, lastReviewed: '2026-11-03' })
    expect(stats.nodeTypes[0]).toEqual({ key: 'genre', reviewed: 1, total: 3 })
  })

  it('groups links and genre/artist families', () => {
    expect(stats.linkGroups).toEqual([
      { key: 'industry', reviewed: 1, total: 1 },
      { key: 'instruments', reviewed: 0, total: 1 },
      { key: 'lineage', reviewed: 1, total: 1 },
      { key: 'people', reviewed: 0, total: 1 },
    ])
    expect(stats.families).toEqual([
      { key: 'jazz', reviewed: 2, total: 3 },
      { key: 'classical', reviewed: 0, total: 1 },
    ])
  })

  it('summarizes confidence and sources of reviewed items', () => {
    expect(stats.confidence).toEqual({ high: 1, medium: 0, low: 0, unrated: 1 })
    expect(stats.averageSources).toEqual({ reviewed: 0.75, pending: 0 })
    expect(stats.sourceDomains).toEqual([
      { domain: 'wikipedia.org', count: 2 },
      { domain: 'allmusic.com', count: 1 },
    ])
  })
})
