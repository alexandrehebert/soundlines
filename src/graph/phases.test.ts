import { describe, expect, it } from 'vitest'
import {
  GENRE_BAR_HEIGHT, genreIntensityStops, genrePhases, genreVisibilityStops, genreVisibleEnd, genreVisibleSpans,
  intensityColor, intensityOpacity, PHASE_STYLE, phaseIntensity,
} from './phases.ts'
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

  it('uses one height and declining default intensity, hiding niche periods', () => {
    expect(GENRE_BAR_HEIGHT).toBe(22)
    expect(PHASE_STYLE['golden-age'].intensity).toBe(1)
    expect(PHASE_STYLE.established.intensity).toBeGreaterThan(PHASE_STYLE.niche.intensity)
    expect(PHASE_STYLE.niche.intensity).toBe(0)
    expect(intensityOpacity(0)).toBe(0)
    expect(intensityOpacity(0.2)).toBeLessThan(intensityOpacity(0.6))
    expect(intensityOpacity(1)).toBeCloseTo(0.84)
  })

  it('lets a phase override its shade within the same label', () => {
    expect(phaseIntensity({ start: 1960, prominence: 'golden-age' })).toBe(1)
    expect(phaseIntensity({ start: 1960, prominence: 'golden-age', intensity: 0.8 })).toBe(0.8)
    expect(phaseIntensity({ start: 1960, prominence: 'established', intensity: 0 })).toBe(0)
  })

  it('brightens only the peak shades', () => {
    expect(intensityColor('#f00', 0.5)).toBe('#f00')
    expect(intensityColor('#f00', 1)).toBe('color-mix(in srgb, #f00, #fff 21.0%)')
  })

  it('fades the whole bar out into a niche period and reports the visible end', () => {
    const visibility = genreVisibilityStops(node, 2026)
    expect(visibility[0]).toEqual({ offset: 0, level: 1 })
    expect(visibility.at(-1)).toEqual({ offset: 1, level: 0 })
    expect(genreVisibleEnd(node, 2026)).toBe(2000)
    expect(genreVisibleEnd({ ...node, phases: [...node.phases!, { start: 2010, prominence: 'golden-age' }] }, 2026))
      .toBe(2026)
    expect(genreVisibleEnd({ ...node, phases: undefined }, 2026)).toBeUndefined()
  })

  it('reappears and disappears as many times as the genre comes back', () => {
    const revivals: GraphNode = {
      ...node, period: { start: 1970 },
      phases: [
        { start: 1970, prominence: 'golden-age' },
        { start: 1980, prominence: 'niche' },
        { start: 1990, prominence: 'golden-age', intensity: 0.7 },
        { start: 1995, prominence: 'established' },
        { start: 2000, prominence: 'niche' },
        { start: 2010, prominence: 'established', intensity: 0.3 },
        { start: 2015, prominence: 'niche' },
      ],
    }
    expect(genreVisibleSpans(revivals, 2026)).toEqual([[1970, 1980], [1990, 2000], [2010, 2015]])
    expect(genreVisibleEnd(revivals, 2026)).toBe(2015)
    const levels = genreVisibilityStops(revivals, 2026).map((stop) => stop.level)
    expect(levels.filter((level, i) => i > 0 && level === 1 && levels[i - 1] < 1)).toHaveLength(2)
  })

  it('blends smoothly on either side of a boundary with eased intermediate stops', () => {
    const stops = genreIntensityStops(node, 2026)
    const transition = stops.slice(6, 11)
    expect(transition.map((stop) => 1955 + stop.offset * 71)).toEqual([1978, 1979, 1980, 1981, 1982])
    expect(transition[0].level).toBe(1)
    expect(transition[2].level).toBeCloseTo(0.725)
    expect(transition[4].level).toBeCloseTo(0.45)
    expect(transition[1].level).toBeCloseTo(1 - 0.55 * 0.15625)
    expect(stops[0]).toEqual({ offset: 0, level: 0.35 })
    expect(stops.at(-1)).toEqual({ offset: 1, level: 0 })
  })

  it('keeps gradients ordered and bounded even with short phases and revivals', () => {
    const stops = genreIntensityStops({
      ...node, period: { start: 2000, end: 2004 },
      phases: [
        { start: 2000, prominence: 'golden-age' },
        { start: 2001, prominence: 'niche' },
        { start: 2002, prominence: 'golden-age', intensity: 0.9 },
      ],
    }, 2026)
    expect(stops.at(-1)).toEqual({ offset: 1, level: 0.9 })
    stops.forEach((stop, i) => {
      expect(stop.offset).toBeGreaterThanOrEqual(0)
      expect(stop.offset).toBeLessThanOrEqual(1)
      if (i > 0) expect(stop.offset).toBeGreaterThan(stops[i - 1].offset)
    })
  })

  it('does not add a gradient to unannotated or future genres', () => {
    expect(genreIntensityStops({ ...node, phases: undefined }, 2026)).toEqual([])
    expect(genreIntensityStops(node, 1950)).toEqual([])
  })

  it('uses a flat gradient for a single phase', () => {
    expect(genreIntensityStops({ ...node, phases: [{ start: 1955, prominence: 'golden-age' }] }, 2026))
      .toEqual([{ offset: 0, level: 1 }, { offset: 1, level: 1 }])
  })

  it('shows disco coming back more than once', () => {
    const disco = rawGraph.nodes.find((candidate) => candidate.id === 'genre:disco') as GraphNode
    expect(genreVisibleSpans(disco, 2026).length).toBeGreaterThanOrEqual(3)
  })

  it('keeps soul alive after its peak and does not call it niche', () => {
    const soul = rawGraph.nodes.find((candidate) => candidate.id === 'genre:soul')!
    expect(soul.period).not.toHaveProperty('end')
    expect(soul.phases?.at(-1)?.prominence).toBe('established')
  })
})
