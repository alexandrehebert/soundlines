import { describe, expect, it } from 'vitest'
import { genreHeightAt, genrePhases, PHASE_STYLE } from './phases.ts'
import type { GraphNode } from './types.ts'
import rawGraph from '../data/graph.json'

const node: GraphNode = {
  id: 'genre:test', type: 'genre', name: 'Test', period: { start: 1955 },
  phases: [
    { start: 1955, prominence: 'emerging' },
    { start: 1960, prominence: 'golden-age' },
    { start: 1980, prominence: 'established' },
    { start: 2000, prominence: 'niche' },
  ],
}

describe('historical prominence', () => {
  it('continues after the golden age instead of ending the lifespan', () => {
    expect(genrePhases(node, 2026)).toEqual([
      { start: 1955, end: 1960, prominence: 'emerging' },
      { start: 1960, end: 1980, prominence: 'golden-age' },
      { start: 1980, end: 2000, prominence: 'established' },
      { start: 2000, end: 2026, prominence: 'niche' },
    ])
  })

  it('does not infer prominence for unannotated genres', () => {
    expect(genrePhases({ ...node, phases: undefined }, 2026)).toEqual([])
  })

  it('clips to lifespan and skips future phases', () => {
    expect(genrePhases({ ...node, period: { start: 1955, end: 1990 } }, 2026).at(-1))
      .toEqual({ start: 1980, end: 1990, prominence: 'established' })
    expect(genrePhases(node, 1970).at(-1))
      .toEqual({ start: 1960, end: 1970, prominence: 'golden-age' })
  })

  it('permits a revival without forcing permanent decline', () => {
    expect(genrePhases({
      ...node, phases: [...node.phases!, { start: 2010, prominence: 'golden-age' }],
    }, 2026).at(-1)?.prominence).toBe('golden-age')
  })

  it('uses progressively thinner bars and dashes for niche scenes', () => {
    expect(PHASE_STYLE['golden-age'].height).toBeGreaterThan(PHASE_STYLE.established.height)
    expect(PHASE_STYLE.established.height).toBeGreaterThan(PHASE_STYLE.niche.height)
    expect(PHASE_STYLE.niche.dashed).toBe(true)
  })

  it('anchors edges and artist markers to the height of the historical phase', () => {
    expect(genreHeightAt(node, 1970)).toBe(22)
    expect(genreHeightAt(node, 1980)).toBe(12)
    expect(genreHeightAt(node, 2020)).toBe(5)
    expect(genreHeightAt({ ...node, phases: undefined }, 2020)).toBe(22)
  })

  it('keeps soul alive after its peak and does not call it niche', () => {
    const soul = rawGraph.nodes.find((candidate) => candidate.id === 'genre:soul')!
    expect(soul.period).not.toHaveProperty('end')
    expect(soul.phases?.at(-1)?.prominence).toBe('established')
  })
})
