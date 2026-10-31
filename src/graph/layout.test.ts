import { describe, expect, it } from 'vitest'
import {
  decadeTicks,
  layoutFamilies,
  panRange,
  xToYear,
  yearToX,
  zoomRange,
} from './layout.ts'
import type { MusicGraph } from './types.ts'

describe('time scale', () => {
  const scale = { start: 1950, end: 2050, width: 1000 }

  it('maps years to pixels linearly', () => {
    expect(yearToX(scale, 1950)).toBe(0)
    expect(yearToX(scale, 2000)).toBe(500)
    expect(yearToX(scale, 2050)).toBe(1000)
  })

  it('inverts pixels back to years', () => {
    expect(xToYear(scale, 500)).toBe(2000)
  })

  it('produces decade ticks within range', () => {
    expect(decadeTicks({ start: 1973, end: 2004, width: 100 })).toEqual([1980, 1990, 2000])
  })
})

describe('layoutFamilies', () => {
  const graph: MusicGraph = {
    version: 1,
    nodes: [
      { id: 'genre:a', type: 'genre', name: 'A', family: 'house', period: { start: 1980, end: 1990 } },
      { id: 'genre:b', type: 'genre', name: 'B', family: 'house', period: { start: 1985, end: 1995 } },
      { id: 'genre:c', type: 'genre', name: 'C', family: 'house', period: { start: 1992 } },
      { id: 'genre:d', type: 'genre', name: 'D', family: 'techno', period: { start: 1985 } },
      { id: 'artist:x', type: 'artist', name: 'X', kind: 'person', period: { start: 1980 } },
    ],
    edges: [],
  }

  it('stacks overlapping genres onto separate rows within a family', () => {
    const lanes = layoutFamilies(graph, 2026)
    const house = lanes.find((lane) => lane.family === 'house')!
    const rows = Object.fromEntries(house.bars.map((bar) => [bar.node.name, bar.row]))
    expect(rows.A).toBe(0)
    expect(rows.B).toBe(1)
    expect(rows.C).toBe(0)
    expect(house.rowCount).toBe(2)
  })

  it('orders lanes by family order and skips empty families', () => {
    const lanes = layoutFamilies(graph, 2026)
    expect(lanes.map((lane) => lane.family)).toEqual(['house', 'techno'])
  })

  it('resolves ongoing periods to the provided current year', () => {
    const lanes = layoutFamilies(graph, 2026)
    const techno = lanes.find((lane) => lane.family === 'techno')!
    expect(techno.bars[0].end).toBe(2026)
    expect(techno.bars[0].ongoing).toBe(true)
  })

  it('only lays out genres', () => {
    const lanes = layoutFamilies(graph, 2026)
    const names = lanes.flatMap((lane) => lane.bars.map((bar) => bar.node.name))
    expect(names).not.toContain('X')
  })
})

describe('zoomRange', () => {
  it('zooms in around the focal year', () => {
    const [start, end] = zoomRange(1950, 2050, 2000, 0.5, 1900, 2100)
    expect(end - start).toBe(50)
    expect(start).toBeLessThan(2000)
    expect(end).toBeGreaterThan(2000)
  })

  it('clamps to the min/max bounds', () => {
    const [start, end] = zoomRange(1950, 2050, 1950, 2, 1940, 2060)
    expect(start).toBeGreaterThanOrEqual(1940)
    expect(end).toBeLessThanOrEqual(2060)
  })

  it('never zooms below a 10 year span', () => {
    const [start, end] = zoomRange(1990, 2000, 1995, 0.1, 1900, 2100)
    expect(end - start).toBe(10)
  })
})

describe('panRange', () => {
  it('shifts the range and clamps at the edges', () => {
    expect(panRange(1950, 2000, 10, 1900, 2100)).toEqual([1960, 2010])
    expect(panRange(1950, 2000, -100, 1940, 2100)).toEqual([1940, 1990])
    expect(panRange(1950, 2000, 500, 1900, 2050)).toEqual([2000, 2050])
  })
})
