import { describe, expect, it } from 'vitest'
import { layoutFamilies } from '../../graph/layout.ts'
import type { MusicGraph } from '../../graph/types.ts'
import { AXIS_H, BAR_H, barLabel, barShape, offscreenIndicators, positionTimeline, revealBarScrollTop, snapToSpans, tailFadeOffset, type BarPosition } from './geometry.ts'

const bar: BarPosition = {
  node: { id: 'artist:a', type: 'artist', name: 'A', period: { start: 1960 } },
  start: 1960, end: 1990,
  x1: 0, x2: 300, yCenter: 50, color: '#fff', ended: false,
  visibleSpans: [[0, 80], [150, 300]],
}

describe('shared bar geometry', () => {
  describe('revealing a selected bar', () => {
    it('does not move the timeline when the whole row is visible below the axis', () => {
      expect(revealBarScrollTop(108, 50, 300)).toBe(50)
    })

    it('reveals rows hidden behind the axis or below the viewport', () => {
      expect(revealBarScrollTop(83, 50, 300)).toBe(0)
      expect(revealBarScrollTop(418, 50, 300)).toBe(300)
    })

    it('keeps the bar and its focus outline below the axis in short viewports', () => {
      expect(revealBarScrollTop(83, 40, 90)).toBe(65 - AXIS_H)
    })
  })

  it('snaps relation endpoints out of hidden gaps and inside short revival spans', () => {
    expect(snapToSpans(110, bar.visibleSpans, 10)).toBe(70)
    expect(snapToSpans(140, bar.visibleSpans, 10)).toBe(160)
    expect(snapToSpans(1, [[0, 8]], 10)).toBe(4)
  })

  describe('genre ordering', () => {
    const graph: MusicGraph = {
      version: 1,
      nodes: [
        { id: 'genre:late', type: 'genre', name: 'Late', family: 'blues-soul',
          period: { start: 2000, end: 2020 }, phases: [
            { start: 2000, prominence: 'golden-age' },
            { start: 2005, prominence: 'niche' },
            { start: 2010, prominence: 'established' },
          ] },
        { id: 'genre:early', type: 'genre', name: 'Early', family: 'classical',
          period: { start: 1700, end: 1750 } },
        { id: 'genre:alpha-b', type: 'genre', name: 'Alpha', family: 'rock',
          period: { start: 1950, end: 1960 } },
        { id: 'genre:alpha-a', type: 'genre', name: 'Alpha', family: 'rock',
          period: { start: 1950, end: 1960 } },
        { id: 'genre:beta', type: 'genre', name: 'Beta', family: 'jazz',
          period: { start: 1950, end: 1960 } },
        { id: 'genre:middle', type: 'genre', name: 'Middle', family: 'rock',
          period: { start: 1980 } },
      ],
      edges: [],
    }
    const lanes = layoutFamilies(graph, 2026)
    const scale = { start: 1700, end: 2026, width: 1000 }

    it('keeps the existing family layout as the default', () => {
      const result = positionTimeline(lanes, scale)
      expect(result).toEqual(positionTimeline(lanes, scale, 'family'))
      expect(result.bands.map((band) => band.family)).toEqual(['classical', 'blues-soul', 'jazz', 'rock'])
    })

    it('orders across families by start year, then name and id for ties', () => {
      const result = positionTimeline(lanes, scale, 'oldest-first')
      expect(result.bars.map((bar) => bar.node.id)).toEqual([
        'genre:early', 'genre:alpha-a', 'genre:alpha-b', 'genre:beta', 'genre:middle', 'genre:late',
      ])
      expect(result.bands).toEqual([])
    })

    it('gives each genre its own row, without reusing rows from ended genres', () => {
      const result = positionTimeline(lanes, scale, 'oldest-first')
      expect(new Set(result.bars.map((bar) => bar.yCenter)).size).toBe(graph.nodes.length)
      for (let i = 1; i < result.bars.length; i++) {
        expect(result.bars[i].yCenter - result.bars[i - 1].yCenter).toBe(36)
      }
      expect(result.height).toBeGreaterThan(result.bars.at(-1)!.yCenter + BAR_H / 2)
    })

    it('preserves family colors, dates, and revival geometry without mutating lanes', () => {
      const before = structuredClone(lanes)
      const grouped = positionTimeline(lanes, scale)
      const result = positionTimeline(lanes, scale, 'oldest-first')
      for (const positioned of result.bars) {
        const original = grouped.bars.find((bar) => bar.node.id === positioned.node.id)!
        expect(positioned).toEqual({ ...original, yCenter: positioned.yCenter })
      }
      expect(lanes).toEqual(before)
    })

    it('handles an empty timeline without a family band or bars', () => {
      const result = positionTimeline([], scale, 'oldest-first')
      expect(result.bars).toEqual([])
      expect(result.bands).toEqual([])
      expect(result.height).toBeGreaterThan(0)
    })
  })

  it('labels the first visible stretch in the viewport, including a revival', () => {
    expect(barLabel(bar, 300)).toEqual({ x: 10, textAnchor: 'start', outside: false })
    expect(barLabel({ ...bar, visibleSpans: [[-200, -120], [20, 170]] }, 300))
      .toEqual({ x: 30, textAnchor: 'start', outside: false })
    expect(barLabel({ ...bar, visibleSpans: [] }, 300)).toBeNull()
  })

  it('places short-bar labels outside, on the side with more viewport space', () => {
    const short = { ...bar, x1: 20, x2: 50, visibleSpans: [[20, 50]] as [number, number][] }
    expect(barLabel(short, 300)).toEqual({ x: 60, textAnchor: 'start', outside: true })
    expect(barLabel({ ...short, x1: 250, x2: 280, visibleSpans: [[250, 280]] }, 300))
      .toEqual({ x: 240, textAnchor: 'end', outside: true })
  })

  it('labels viewport slivers but not wholly off-screen bars or hidden phases', () => {
    expect(barLabel({ ...bar, x1: -100, x2: 1, visibleSpans: [[-100, 1]] }, 300))
      .toEqual({ x: 11, textAnchor: 'start', outside: true })
    expect(barLabel({ ...bar, visibleSpans: [[299, 400]] }, 300))
      .toEqual({ x: 289, textAnchor: 'end', outside: true })
    expect(barLabel({ ...bar, visibleSpans: [[-100, 0], [300, 400]] }, 300)).toBeNull()
  })

  it('keeps labels outside minimum-width shapes and uses the existing cutoff', () => {
    expect(barLabel({ ...bar, x1: 20, x2: 21, visibleSpans: [[20, 21]] }, 300))
      .toEqual({ x: 52, textAnchor: 'start', outside: true })
    expect(barLabel({ ...bar, x1: 20, x2: 74, visibleSpans: [[20, 74]] }, 300)?.outside).toBe(true)
    expect(barLabel({ ...bar, visibleSpans: [[20, 75]] }, 300)?.outside).toBe(false)
  })

  it('uses the free side on shared rows and falls back above crowded bars', () => {
    const short = { ...bar, x1: 100, x2: 130, visibleSpans: [[100, 130]] as [number, number][] }
    const neighbor = { ...bar, node: { ...bar.node, id: 'artist:b' }, x1: 140 }
    expect(barLabel(short, 300, [short, neighbor]))
      .toEqual({ x: 90, textAnchor: 'end', outside: true })
    expect(barLabel({
      ...short, node: { ...short.node, name: 'Short-lived genre' },
    }, 300, [neighbor])).toEqual({ x: 100, textAnchor: 'start', outside: true, above: true })
    expect(barLabel(short, 300, [{ ...neighbor, yCenter: 86 }]))
      .toEqual({ x: 140, textAnchor: 'start', outside: true })
  })

  it('uses a wide revival when available and labels short revivals without crossing a hidden gap', () => {
    expect(barLabel({ ...bar, visibleSpans: [[20, 40], [80, 200]] }, 300))
      .toEqual({ x: 90, textAnchor: 'start', outside: false })
    expect(barLabel({ ...bar, x1: -100, x2: 50, visibleSpans: [[-100, -20], [20, 50]] }, 300))
      .toEqual({ x: 60, textAnchor: 'start', outside: true })
  })

  describe('off-screen genre indicators', () => {
    function genre(id: string, spans: [number, number][], yCenter = 50): BarPosition {
      return {
        ...bar, node: { id, type: 'genre', name: id },
        x1: spans[0]?.[0] ?? 0, x2: spans.at(-1)?.[1] ?? 0,
        visibleSpans: spans, yCenter,
      }
    }

    it('places labeled-bar geometry at the corresponding viewport edge', () => {
      const indicators = offscreenIndicators([
        genre('left', [[-200, -50]]),
        genre('right', [[1100, 1300]], 86),
      ], 1000)
      expect(indicators.get('left')).toEqual({ x: 8, width: 220, direction: 'left', targetX: -50 })
      expect(indicators.get('right')).toEqual({ x: 772, width: 220, direction: 'right', targetX: 1100 })
    })

    it('does not replace even a narrow visible bar, or invent an entirely hidden phase', () => {
      const bars = [
        genre('visible', [[200, 400]]),
        genre('left-sliver', [[-100, 1]], 86),
        genre('right-sliver', [[999, 1100]], 122),
        genre('hidden', [], 158),
      ]
      expect(offscreenIndicators(bars, 1000).size).toBe(0)
    })

    it('treats bars touching but not entering the viewport as off-screen', () => {
      const indicators = offscreenIndicators([
        genre('left', [[-100, 0]]),
        genre('right', [[1000, 1100]], 86),
      ], 1000)
      expect(indicators.get('left')?.direction).toBe('left')
      expect(indicators.get('right')?.direction).toBe('right')
    })

    it('points to the nearest visible period across a hidden gap', () => {
      expect(offscreenIndicators([genre('revival', [[-200, -20], [1200, 1400]])], 1000)
        .get('revival')).toMatchObject({ direction: 'left', targetX: -20 })
      expect(offscreenIndicators([genre('revival', [[-200, -120], [1020, 1400]])], 1000)
        .get('revival')).toMatchObject({ direction: 'right', targetX: 1020 })
      expect(offscreenIndicators([genre('revival', [[-200, -120], [500, 1400]])], 1000).size).toBe(0)
    })

    it('avoids on-screen bars in shared family rows, including their phase envelopes', () => {
      expect(offscreenIndicators([
        genre('left', [[-100, -20]]),
        genre('visible', [[100, 400]]),
      ], 1000).size).toBe(0)
      expect(offscreenIndicators([
        genre('right', [[1100, 1200]]),
        genre('visible', [[700, 900]]),
      ], 1000).size).toBe(0)
      expect(offscreenIndicators([
        genre('left', [[-100, -20]]),
        genre('visible', [[-200, -100], [500, 600]]),
      ], 1000).size).toBe(0)
      expect(offscreenIndicators([
        genre('left', [[-100, -20]]),
        genre('visible', [[400, 600]]),
        genre('right', [[1100, 1200]]),
      ], 1000).size).toBe(2)
    })

    it('prioritizes the nearest genre per edge, deterministically, without mutating bars', () => {
      const bars = [
        genre('far', [[-400, -300]]),
        genre('near-b', [[-200, -100]]),
        genre('near-a', [[-200, -100]]),
        genre('right', [[1100, 1200]]),
      ]
      const before = structuredClone(bars)
      expect([...offscreenIndicators(bars, 1000).keys()]).toEqual(['near-a', 'right'])
      expect(bars).toEqual(before)
    })

    it('recomputes when panning brings a bar into the viewport or resizing hides it', () => {
      expect(offscreenIndicators([genre('a', [[1100, 1200]])], 1000).has('a')).toBe(true)
      expect(offscreenIndicators([genre('a', [[900, 1000]])], 1000).has('a')).toBe(false)
      expect(offscreenIndicators([genre('a', [[900, 1000]])], 800).has('a')).toBe(true)
    })

    it('keeps both directions separate on narrow screens and skips unusable widths', () => {
      const bars = [genre('left', [[-100, -20]]), genre('right', [[400, 500]])]
      const indicators = offscreenIndicators(bars, 320)
      const left = indicators.get('left')!
      const right = indicators.get('right')!
      expect(left.x).toBeGreaterThanOrEqual(0)
      expect(left.x + left.width + 8).toBeLessThanOrEqual(right.x)
      expect(right.x + right.width).toBeLessThanOrEqual(320)
      expect(offscreenIndicators(bars, 100).size).toBe(0)
    })

    it('leaves artist timelines unchanged', () => {
      expect(offscreenIndicators([{ ...bar, x1: -200, x2: -100, visibleSpans: [[-200, -100]] }], 1000)
        .size).toBe(0)
    })
  })

  it('keeps the same bar height and removes the rounded tail when a career ends', () => {
    expect(BAR_H).toBe(22)
    expect(barShape(bar)).toContain('A 11 11')
    expect(barShape({ ...bar, ended: true })).toContain('H 300 V 61')
  })

  it('fades only the final two years, without dimming the latter half of a career', () => {
    expect(tailFadeOffset({ ...bar, start: 1960, end: 2000 })).toBe(0.95)
    expect(tailFadeOffset({ ...bar, start: 1960, end: 1961 })).toBe(0)
  })

  it('positions artist phases with repeated gaps and no genre-specific assumptions', () => {
    const result = positionTimeline([{
      family: 'blues-soul', rowCount: 1,
      bars: [{
        node: { ...bar.node, phases: [
          { start: 1960, prominence: 'golden-age' },
          { start: 1970, prominence: 'niche' },
          { start: 1980, prominence: 'established' },
        ] },
        family: 'blues-soul', row: 0, start: 1960, end: 1990, ongoing: true,
      }],
    }], { start: 1960, end: 1990, width: 300 })
    expect(result.bars[0].visibleSpans).toEqual([[0, 100], [200, 300]])
  })
})
