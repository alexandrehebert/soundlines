import { describe, expect, it } from 'vitest'
import {
  buildIndex,
  groupedRelations,
  lineage,
  lineageHighlight,
  lineageSource,
  lineageTarget,
  neighbors,
  nodesInPeriod,
  searchNodes,
} from './graph.ts'
import type { MusicGraph } from './types.ts'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:disco', type: 'genre', name: 'Disco', family: 'house', period: { start: 1972, end: 1982 } },
    { id: 'genre:house', type: 'genre', name: 'House', family: 'house', period: { start: 1984 } },
    { id: 'genre:acid', type: 'genre', name: 'Acid house', family: 'house', period: { start: 1986 } },
    { id: 'genre:techno', type: 'genre', name: 'Techno', family: 'techno', period: { start: 1985 } },
    { id: 'artist:dj', type: 'artist', name: 'Some DJ', kind: 'person', period: { start: 1980 } },
    { id: 'place:chicago', type: 'place', name: 'Chicago' },
  ],
  edges: [
    { id: 'e1', type: 'derived_from', from: 'genre:house', to: 'genre:disco' },
    { id: 'e2', type: 'subgenre_of', from: 'genre:acid', to: 'genre:house' },
    { id: 'e3', type: 'cross_pollination', from: 'genre:house', to: 'genre:techno' },
    { id: 'e4', type: 'key_artist_of', from: 'artist:dj', to: 'genre:house' },
    { id: 'e5', type: 'originated_in', from: 'genre:house', to: 'place:chicago' },
  ],
}

const index = buildIndex(graph)

describe('buildIndex', () => {
  it('indexes nodes and edges by id', () => {
    expect(index.nodeById.get('genre:house')?.name).toBe('House')
    expect(index.outEdges.get('genre:house')).toHaveLength(3)
    expect(index.inEdges.get('genre:house')).toHaveLength(2)
  })
})

describe('neighbors', () => {
  it('resolves nodes on both edge directions', () => {
    const entries = neighbors(index, 'genre:house')
    const names = entries.map((entry) => entry.node.name).sort()
    expect(names).toEqual(['Acid house', 'Chicago', 'Disco', 'Some DJ', 'Techno'])
  })
})

describe('lineage orientation', () => {
  it('treats derived_from as descendant -> ancestor', () => {
    const edge = graph.edges[0]
    expect(lineageSource(edge)).toBe('genre:disco')
    expect(lineageTarget(edge)).toBe('genre:house')
  })

  it('returns null for non-lineage edges', () => {
    expect(lineageSource(graph.edges[4])).toBeNull()
  })
})

describe('lineage', () => {
  it('finds transitive ancestors across mixed edge orientations', () => {
    const result = lineage(index, 'genre:acid')
    expect(result.ancestors).toEqual(new Set(['genre:house', 'genre:disco']))
  })

  it('finds descendants, following forward edges', () => {
    const result = lineage(index, 'genre:disco')
    expect(result.descendants).toEqual(new Set(['genre:house', 'genre:acid', 'genre:techno']))
  })

  it('ignores non-lineage edges entirely', () => {
    const result = lineage(index, 'genre:house')
    expect(result.ancestors.has('artist:dj')).toBe(false)
    expect(result.descendants.has('place:chicago')).toBe(false)
  })

  it('collects the edge ids along the paths', () => {
    const result = lineage(index, 'genre:acid')
    expect(result.edges).toContain('e1')
    expect(result.edges).toContain('e2')
    expect(result.edges).not.toContain('e4')
  })
})

describe('lineageHighlight', () => {
  it('includes the focus, ancestors, descendants, and only their lineage edges', () => {
    const result = lineageHighlight(index, 'genre:house')
    expect(result?.nodes).toEqual(new Set(['genre:house', 'genre:disco', 'genre:acid', 'genre:techno']))
    expect(result?.edges).toEqual(new Set(['e1', 'e2', 'e3']))
  })

  it('does not highlight sibling branches reached through a shared ancestor', () => {
    const result = lineageHighlight(index, 'genre:acid')
    expect(result?.nodes).toEqual(new Set(['genre:acid', 'genre:house', 'genre:disco']))
    expect(result?.edges).toEqual(new Set(['e1', 'e2']))
  })

  it('clears highlighting without a valid focus and keeps isolated nodes visible', () => {
    expect(lineageHighlight(index, null)).toBeNull()
    expect(lineageHighlight(index, 'genre:missing')).toBeNull()
    expect(lineageHighlight(index, 'artist:dj')).toEqual({
      nodes: new Set(['artist:dj']), edges: new Set(),
    })
  })

  it('preserves the active model orientation', () => {
    expect(lineageHighlight(index, 'artist:dj', { key_artist_of: 'forward' })).toEqual({
      nodes: new Set(['artist:dj', 'genre:house']), edges: new Set(['e4']),
    })
  })
})

describe('nodesInPeriod', () => {
  it('includes ongoing nodes and excludes ended ones', () => {
    const names = nodesInPeriod(graph, 1990, 2000, 2026).map((node) => node.name)
    expect(names).toContain('House')
    expect(names).not.toContain('Disco')
  })

  it('skips nodes without a period', () => {
    const names = nodesInPeriod(graph, 1900, 2100, 2026).map((node) => node.name)
    expect(names).not.toContain('Chicago')
  })
})

describe('searchNodes', () => {
  it('ranks exact and prefix matches first', () => {
    const results = searchNodes(graph, 'house')
    expect(results[0].node.name).toBe('House')
  })

  it('matches subsequences', () => {
    const results = searchNodes(graph, 'acdhs')
    expect(results.map((result) => result.node.name)).toContain('Acid house')
  })

  it('matches Latin accents in composed, decomposed, and unaccented queries', () => {
    const accented: MusicGraph = {
      ...graph,
      nodes: [
        ...graph.nodes,
        { id: 'genre:rai', type: 'genre', name: 'Raï', family: 'african', period: { start: 1920 } },
        { id: 'genre:chaabi', type: 'genre', name: 'Algerian chaâbi', family: 'african', period: { start: 1930 } },
        { id: 'artist:youssou', type: 'artist', name: 'Youssou N’Dour' },
      ],
    }
    for (const query of ['rai', 'RAÏ', 'Rai\u0308']) {
      expect(searchNodes(accented, query)[0].node.id).toBe('genre:rai')
    }
    expect(searchNodes(accented, 'chaabi')[0].node.id).toBe('genre:chaabi')
    expect(searchNodes(accented, "Youssou N'Dour")[0].node.id).toBe('artist:youssou')
    expect(searchNodes(accented, 'youssou n’dour')[0].node.id).toBe('artist:youssou')
  })

  it('preserves meaningful marks in non-Latin scripts', () => {
    const japanese: MusicGraph = {
      ...graph,
      nodes: [...graph.nodes, { id: 'artist:kana', type: 'artist', name: 'ガ' }],
    }
    expect(searchNodes(japanese, 'カ').map((result) => result.node.id)).not.toContain('artist:kana')
    expect(searchNodes(japanese, 'カ\u3099')[0].node.id).toBe('artist:kana')
  })

  it('returns nothing for empty queries', () => {
    expect(searchNodes(graph, '  ')).toEqual([])
  })
})

describe('groupedRelations', () => {
  it('groups by direction and type, outgoing first', () => {
    const groups = groupedRelations(index, 'genre:house')
    expect(groups[0].direction).toBe('out')
    const incoming = groups.filter((group) => group.direction === 'in')
    expect(incoming.map((group) => group.type)).toEqual(['key_artist_of', 'subgenre_of'])
  })
})
