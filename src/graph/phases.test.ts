import { describe, expect, it } from 'vitest'
import {
  TIMELINE_BAR_HEIGHT, intensityStops, prominencePhases, visibilityStops, visibleEnd, visibleSpans,
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
  it('uses identical intensity and revival logic for artists and genres', () => {
    const artist: GraphNode = { ...node, id: 'artist:test', type: 'artist' }
    expect(intensityStops(artist, 2026)).toEqual(intensityStops(node, 2026))
    expect(visibilityStops(artist, 2026)).toEqual(visibilityStops(node, 2026))
    expect(visibleSpans(artist, 2026)).toEqual(visibleSpans(node, 2026))
  })

  it('continues after the golden age instead of ending the lifespan', () => {
    expect(prominencePhases(node, 2026)).toEqual([
      { start: 1955, end: 1960, prominence: 'emerging' },
      { start: 1960, end: 1980, prominence: 'golden-age' },
      { start: 1980, end: 2000, prominence: 'established' },
      { start: 2000, end: 2026, prominence: 'niche' },
    ])
  })

  it('preserves phase-level evidence when calculating intervals', () => {
    const annotated: GraphNode = {
      ...node,
      phases: [{
        start: 1955,
        prominence: 'emerging',
        confidence: 'medium',
        note: 'An approximate transition.',
        sources: ['https://example.com/phase'],
      }],
    }
    expect(prominencePhases(annotated, 2026)).toEqual([{
      start: 1955,
      end: 2026,
      prominence: 'emerging',
      confidence: 'medium',
      note: 'An approximate transition.',
      sources: ['https://example.com/phase'],
    }])
  })

  it('does not infer prominence for unannotated genres', () => {
    expect(prominencePhases({ ...node, phases: undefined }, 2026)).toEqual([])
  })

  it('clips to lifespan and skips future phases', () => {
    expect(prominencePhases({ ...node, period: { start: 1955, end: 1990 } }, 2026).at(-1))
      .toEqual({ start: 1980, end: 1990, prominence: 'established' })
    expect(prominencePhases(node, 1970).at(-1))
      .toEqual({ start: 1960, end: 1970, prominence: 'golden-age' })
  })

  it('permits a revival without forcing permanent decline', () => {
    expect(prominencePhases({
      ...node, phases: [...node.phases!, { start: 2010, prominence: 'golden-age' }],
    }, 2026).at(-1)?.prominence).toBe('golden-age')
  })

  it('uses one height and declining default intensity, hiding niche periods', () => {
    expect(TIMELINE_BAR_HEIGHT).toBe(22)
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
    const visibility = visibilityStops(node, 2026)
    expect(visibility[0]).toEqual({ offset: 0, level: 1 })
    expect(visibility.at(-1)).toEqual({ offset: 1, level: 0 })
    expect(visibleEnd(node, 2026)).toBe(2000)
    expect(visibleEnd({ ...node, phases: [...node.phases!, { start: 2010, prominence: 'golden-age' }] }, 2026))
      .toBe(2026)
    expect(visibleEnd({ ...node, phases: undefined }, 2026)).toBeUndefined()
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
    expect(visibleSpans(revivals, 2026)).toEqual([[1970, 1980], [1990, 2000], [2010, 2015]])
    expect(visibleEnd(revivals, 2026)).toBe(2015)
    const levels = visibilityStops(revivals, 2026).map((stop) => stop.level)
    expect(levels.filter((level, i) => i > 0 && level === 1 && levels[i - 1] < 1)).toHaveLength(2)
  })

  it('blends smoothly on either side of a boundary with eased intermediate stops', () => {
    const stops = intensityStops(node, 2026)
    const transition = stops.slice(6, 11)
    expect(transition.map((stop) => 1955 + stop.offset * 71)).toEqual([1977, 1978.5, 1980, 1981.5, 1983])
    expect(transition[0].level).toBe(1)
    expect(transition[2].level).toBeCloseTo(0.725)
    expect(transition[4].level).toBeCloseTo(0.45)
    expect(transition[1].level).toBeCloseTo(1 - 0.55 * 0.15625)
    expect(stops[0]).toEqual({ offset: 0, level: 0.35 })
    expect(stops.at(-1)).toEqual({ offset: 1, level: 0 })
  })

  it('widens blends with long eras instead of snapping at century-scale boundaries', () => {
    const lute: GraphNode = {
      id: 'instrument:test', type: 'instrument', name: 'Test', period: { start: 1250 },
      phases: [
        { start: 1250, prominence: 'emerging' },
        { start: 1500, prominence: 'golden-age' },
        { start: 1650, prominence: 'established' },
      ],
    }
    const years = intensityStops(lute, 2026).map((stop) => 1250 + stop.offset * 776)
    expect(years[1]).toBeCloseTo(1477.5)
    expect(years[5]).toBeCloseTo(1522.5)
    const short = intensityStops({ ...lute, phases: [
      { start: 1250, prominence: 'emerging' }, { start: 1253, prominence: 'golden-age' },
    ] }, 2026).map((stop) => 1250 + stop.offset * 776)
    expect(short[5] - short[1]).toBeCloseTo(2)
  })

  it('keeps gradients ordered and bounded even with short phases and revivals', () => {
    const stops = intensityStops({
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
    expect(intensityStops({ ...node, phases: undefined }, 2026)).toEqual([])
    expect(intensityStops(node, 1950)).toEqual([])
  })

  it('uses a flat gradient for a single phase', () => {
    expect(intensityStops({ ...node, phases: [{ start: 1955, prominence: 'golden-age' }] }, 2026))
      .toEqual([{ offset: 0, level: 1 }, { offset: 1, level: 1 }])
  })

  it('does not extrapolate disco milestones into an unsupported full curve', () => {
    const disco = rawGraph.nodes.find((candidate) => candidate.id === 'genre:disco') as GraphNode
    expect(disco.period).toEqual({ start: 1970, end: null, precision: 'decade' })
    expect(prominencePhases(disco, 2026)).toEqual([])
    expect(disco.phaseNote).toContain('1979')
  })

  it('keeps soul alive after its peak and does not call it niche', () => {
    const soul = rawGraph.nodes.find((candidate) => candidate.id === 'genre:soul')!
    expect(soul.period).toBeDefined()
    expect(soul.period?.end ?? null).toBeNull()
    expect(soul.phases?.at(-1)?.prominence).toBe('established')
  })
})
