import { describe, expect, it } from 'vitest'
import {
  DEFAULT_START_YEAR,
  fromEraTime,
  layoutFamilies,
  MAX_YEAR,
  MIN_YEAR,
  panRange,
  panYearRange,
  revealEraRange,
  revealYearRange,
  timeTicks,
  TIMELINE_PADDING,
  toEraTime,
  xToYear,
  yearToX,
  zoomRange,
  zoomYearRange,
} from './layout.ts'
import type { MusicGraph } from './types.ts'

describe('time scale', () => {
  const scale = { start: 1950, end: 2050, width: 1000 }

  it('maps modern years to pixels linearly', () => {
    expect(yearToX(scale, 1950)).toBeCloseTo(0)
    expect(yearToX(scale, 2000)).toBeCloseTo(500)
    expect(yearToX(scale, 2050)).toBeCloseTo(1000)
  })

  it('inverts pixels back to years', () => {
    expect(xToYear(scale, 500)).toBeCloseTo(2000)
  })

  it('pads time coordinates without shrinking the drawing surface or clipping earlier years', () => {
    const padded = { ...scale, padding: TIMELINE_PADDING }
    expect(yearToX(padded, padded.start)).toBeCloseTo(24)
    expect(yearToX(padded, padded.end)).toBeCloseTo(976)
    expect(yearToX(padded, 1940)).toBeLessThan(0)
    expect(xToYear(padded, 0)).toBeLessThan(padded.start)
    expect(xToYear(padded, padded.width)).toBeGreaterThan(padded.end)
    for (const year of [1940, 1950, 1985, 2000, 2050]) {
      expect(xToYear(padded, yearToX(padded, year))).toBeCloseTo(year)
    }
  })

  it('preserves padded coordinate round trips across compressed eras', () => {
    const padded = { start: MIN_YEAR, end: MAX_YEAR, width: 640, padding: TIMELINE_PADDING }
    for (const year of [MIN_YEAR, 1100, 1400, 1750, 1900, MAX_YEAR]) {
      expect(xToYear(padded, yearToX(padded, year))).toBeCloseTo(year)
    }
    expect(timeTicks(padded)).toEqual(timeTicks({ ...padded, width: 592, padding: 0 }))
  })

  it('compresses older eras so the modern era keeps its width', () => {
    const full = { start: MIN_YEAR, end: MAX_YEAR, width: 1000 }
    const medieval = yearToX(full, 1400) - yearToX(full, 1000)
    const modern = yearToX(full, 2000) - yearToX(full, 1950)
    expect(modern).toBeGreaterThan(medieval)
    expect(full.width - yearToX(full, 1900)).toBeGreaterThan(full.width / 3)
  })

  it('round-trips era time', () => {
    for (const year of [500, 1100, 1400, 1600, 1750, 1820, 1900, 1985, 2028]) {
      expect(fromEraTime(toEraTime(year))).toBeCloseTo(year)
    }
  })

  it('produces decade ticks when space allows', () => {
    expect(timeTicks({ start: 1973, end: 2004, width: 1000 })).toEqual([1980, 1990, 2000])
  })

  it('thins ticks in compressed eras', () => {
    const ticks = timeTicks({ start: MIN_YEAR, end: MAX_YEAR, width: 1200 })
    const medieval = ticks.filter((year) => year < 1400)
    expect(medieval.length).toBeLessThan(10)
    expect(ticks.filter((year) => year >= 1950).length).toBeGreaterThan(1)
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

  it('lets later genres reuse the row of a hidden trailing niche period', () => {
    const lanes = layoutFamilies({
      version: 1,
      nodes: [
        { id: 'genre:old', type: 'genre', name: 'Old', family: 'house', period: { start: 1970 },
          phases: [{ start: 1970, prominence: 'golden-age' }, { start: 1980, prominence: 'niche' }] },
        { id: 'genre:new', type: 'genre', name: 'New', family: 'house', period: { start: 1985 } },
      ],
      edges: [],
    }, 2026)
    expect(lanes[0].rowCount).toBe(1)
    expect(lanes[0].bars.find((bar) => bar.node.name === 'Old')!.end).toBe(2026)
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
  it('reaches historical centuries without changing the modern default range', () => {
    expect(DEFAULT_START_YEAR).toBe(1948)
    const span = MAX_YEAR - DEFAULT_START_YEAR
    expect(panRange(DEFAULT_START_YEAR, MAX_YEAR, -10000, MIN_YEAR, MAX_YEAR))
      .toEqual([500, 500 + span])
    const [start, end] = zoomRange(1700, 1800, 1750, 100, MIN_YEAR, MAX_YEAR)
    expect([start, end]).toEqual([MIN_YEAR, MAX_YEAR])
  })

  describe('revealYearRange', () => {
    it('reveals historical selections at the existing zoom level', () => {
      expect(revealYearRange(1948, 2028, 1600, MIN_YEAR, 2028)).toEqual([1580, 1660])
      expect(revealYearRange(1948, 2028, 500, MIN_YEAR, 2028)).toEqual([500, 580])
    })

    it('keeps an already visible year and clamps a recent selection to the upper bound', () => {
      expect(revealYearRange(1948, 2028, 1967, MIN_YEAR, 2028)).toEqual([1948, 2028])
      expect(revealYearRange(1580, 1660, 2026, MIN_YEAR, 2028)).toEqual([1948, 2028])
    })
  })

  it('pans and zooms in era time', () => {
    const [start, end] = panYearRange([DEFAULT_START_YEAR, MAX_YEAR], -1000)
    expect(start).toBeCloseTo(MIN_YEAR)
    expect(end).toBeCloseTo(1440)
    const [zStart, zEnd] = zoomYearRange([1950, 2000], 1975, 100)
    expect(zStart).toBeCloseTo(MIN_YEAR)
    expect(zEnd).toBeCloseTo(MAX_YEAR)
  })

  it('reveals in era time keeping the on-screen span', () => {
    const span = toEraTime(MAX_YEAR) - toEraTime(DEFAULT_START_YEAR)
    const [start, end] = revealEraRange([DEFAULT_START_YEAR, MAX_YEAR], 1600)
    expect(start).toBeLessThan(1600)
    expect(end).toBeGreaterThan(1600)
    expect(toEraTime(end) - toEraTime(start)).toBeCloseTo(span)
    expect(revealEraRange([1948, 2028], 1967)).toEqual([1948, 2028])
  })

  it('shifts the range and clamps at the edges', () => {
    expect(panRange(1950, 2000, 10, 1900, 2100)).toEqual([1960, 2010])
    expect(panRange(1950, 2000, -100, 1940, 2100)).toEqual([1940, 1990])
    expect(panRange(1950, 2000, 500, 1900, 2050)).toEqual([2000, 2050])
  })
})
