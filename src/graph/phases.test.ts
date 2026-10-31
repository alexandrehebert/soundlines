import { describe, expect, it } from 'vitest'
import { GENRE_BAR_HEIGHT, genreOpacityStops, genrePhases, PHASE_STYLE } from './phases.ts'
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

  it('uses one height and declining intensity instead of thinner or dashed phases', () => {
    expect(GENRE_BAR_HEIGHT).toBe(22)
    expect(PHASE_STYLE['golden-age'].opacity).toBeGreaterThan(PHASE_STYLE.established.opacity)
    expect(PHASE_STYLE.established.opacity).toBeGreaterThan(PHASE_STYLE.niche.opacity)
    expect(PHASE_STYLE.niche.opacity).toBeGreaterThan(0)
    for (const style of Object.values(PHASE_STYLE)) {
      expect(style).not.toHaveProperty('height')
      expect(style).not.toHaveProperty('dashed')
    }
  })

  it('blends smoothly on either side of a boundary with eased intermediate stops', () => {
    const stops = genreOpacityStops(node, 2026)
    const transition = stops.slice(6, 11)
    expect(transition.map((stop) => 1955 + stop.offset * 71)).toEqual([1978, 1979, 1980, 1981, 1982])
    expect(transition[0].opacity).toBe(0.75)
    expect(transition[2].opacity).toBeCloseTo(0.575)
    expect(transition[4].opacity).toBeCloseTo(0.4)
    expect(transition[1].opacity).toBeCloseTo(0.75 - 0.35 * 0.15625)
    expect(stops[0]).toEqual({ offset: 0, opacity: 0.3 })
    expect(stops.at(-1)).toEqual({ offset: 1, opacity: 0.16 })
  })

  it('keeps gradients ordered and bounded even with short phases and revivals', () => {
    const stops = genreOpacityStops({
      ...node, period: { start: 2000, end: 2004 },
      phases: [
        { start: 2000, prominence: 'golden-age' },
        { start: 2001, prominence: 'niche' },
        { start: 2002, prominence: 'golden-age' },
      ],
    }, 2026)
    expect(stops.at(-1)).toEqual({ offset: 1, opacity: 0.75 })
    stops.forEach((stop, i) => {
      expect(stop.offset).toBeGreaterThanOrEqual(0)
      expect(stop.offset).toBeLessThanOrEqual(1)
      if (i > 0) expect(stop.offset).toBeGreaterThan(stops[i - 1].offset)
    })
  })

  it('does not add a gradient to unannotated or future genres', () => {
    expect(genreOpacityStops({ ...node, phases: undefined }, 2026)).toEqual([])
    expect(genreOpacityStops(node, 1950)).toEqual([])
  })

  it('uses a flat gradient for a single phase', () => {
    expect(genreOpacityStops({ ...node, phases: [{ start: 1955, prominence: 'golden-age' }] }, 2026))
      .toEqual([{ offset: 0, opacity: 0.75 }, { offset: 1, opacity: 0.75 }])
  })

  it('keeps soul alive after its peak and does not call it niche', () => {
    const soul = rawGraph.nodes.find((candidate) => candidate.id === 'genre:soul')!
    expect(soul.period).not.toHaveProperty('end')
    expect(soul.phases?.at(-1)?.prominence).toBe('established')
  })
})
