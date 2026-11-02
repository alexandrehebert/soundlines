import { describe, expect, it } from 'vitest'
import { layoutFamilies, yearToX, type TimeScale } from '../../graph/layout.ts'
import type { MusicGraph } from '../../graph/types.ts'
import { AXIS_H, BAR_H, barBounds, barLabel, barShape, fitBarLabel, offscreenIndicators, positionRowLabels, positionTimeline, revealBarScrollTop, snapToSpans, tailFadeOffset, type BarPosition } from './geometry.ts'

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

    it('leaves room above first-row labels below the axis and family headings', () => {
      const ordered = positionTimeline(lanes, scale, 'oldest-first')
      expect(ordered.bars[0].yCenter - 14.5 - 10.5 - 1.5).toBeGreaterThanOrEqual(AXIS_H)
      const grouped = positionTimeline(lanes, scale)
      for (const band of grouped.bands) {
        const first = grouped.bars.find((positioned) =>
          positioned.yCenter >= band.top && positioned.yCenter < band.top + band.height)!
        expect(first.yCenter - 14.5 - 10.5 - 1.5).toBeGreaterThanOrEqual(band.top + 19)
      }
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
    expect(barLabel(bar, 300)).toEqual({ x: 10, maxWidth: 64, textAnchor: 'start', outside: false })
    expect(barLabel({ ...bar, visibleSpans: [[-200, -120], [20, 170]] }, 300))
      .toEqual({ x: 30, maxWidth: 134, textAnchor: 'start', outside: false })
    expect(barLabel({ ...bar, visibleSpans: [] }, 300)).toBeNull()
  })

  it('places short-bar labels outside, on the side with more viewport space', () => {
    const short = { ...bar, x1: 20, x2: 50, visibleSpans: [[20, 50]] as [number, number][] }
    expect(barLabel(short, 300)).toEqual({ x: 60, maxWidth: 236, textAnchor: 'start', outside: true })
    expect(barLabel({ ...short, x1: 250, x2: 280, visibleSpans: [[250, 280]] }, 300))
      .toEqual({ x: 240, maxWidth: 236, textAnchor: 'end', outside: true })
  })

  it('labels viewport slivers but not wholly off-screen bars or hidden phases', () => {
    expect(barLabel({ ...bar, x1: -100, x2: 1, visibleSpans: [[-100, 1]] }, 300))
      .toEqual({ x: 11, maxWidth: 285, textAnchor: 'start', outside: true })
    expect(barLabel({ ...bar, visibleSpans: [[299, 400]] }, 300))
      .toEqual({ x: 289, maxWidth: 285, textAnchor: 'end', outside: true })
    expect(barLabel({ ...bar, visibleSpans: [[-100, 0], [300, 400]] }, 300)).toBeNull()
  })

  it('keeps labels outside minimum-width shapes and uses the existing cutoff', () => {
    expect(barLabel({ ...bar, x1: 20, x2: 21, visibleSpans: [[20, 21]] }, 300))
      .toEqual({ x: 52, maxWidth: 244, textAnchor: 'start', outside: true })
    expect(barLabel({ ...bar, x1: 20, x2: 74, visibleSpans: [[20, 74]] }, 300)?.outside).toBe(true)
    expect(barLabel({ ...bar, visibleSpans: [[20, 75]] }, 300)?.outside).toBe(false)
  })

  it('uses the free side on shared rows and falls back above crowded bars', () => {
    const short = { ...bar, x1: 100, x2: 130, visibleSpans: [[100, 130]] as [number, number][] }
    const neighbor = { ...bar, node: { ...bar.node, id: 'artist:b' }, x1: 140 }
    expect(barLabel(short, 300, [short, neighbor]))
      .toEqual({ x: 90, maxWidth: 86, textAnchor: 'end', outside: true })
    expect(barLabel({
      ...short, node: { ...short.node, name: 'Short-lived genre' },
    }, 300, [neighbor], 120)).toEqual({ x: 6, maxWidth: 122, textAnchor: 'start', outside: true })
    expect(barLabel(short, 300, [neighbor], 150))
      .toEqual({ x: 110, maxWidth: 186, textAnchor: 'start', outside: true, above: true })
    expect(barLabel(short, 300, [{ ...neighbor, yCenter: 86 }]))
      .toEqual({ x: 140, maxWidth: 156, textAnchor: 'start', outside: true })
  })

  it('uses a later visible stretch or a free side before shortening a label', () => {
    const long = { ...bar, node: { ...bar.node, name: 'Minimal techno' } }
    expect(barLabel({ ...long, visibleSpans: [[20, 90], [110, 250]] }, 300, [], 90))
      .toEqual({ x: 120, maxWidth: 124, textAnchor: 'start', outside: false })
    expect(barLabel({ ...long, x1: 20, x2: 90, visibleSpans: [[20, 90]] }, 300, [], 85))
      .toEqual({ x: 100, maxWidth: 196, textAnchor: 'start', outside: true })
  })

  it('shifts a label across the bar to keep it fully inside the viewport', () => {
    const nearEdge = { ...bar, x1: 90, x2: 400, visibleSpans: [[90, 400]] as [number, number][] }
    expect(barLabel(nearEdge, 160, [], 80))
      .toEqual({ x: 74, maxWidth: 82, textAnchor: 'start', outside: true })
  })

  it('keeps shifted labels on shared rows out of neighboring bars and their half of the gap', () => {
    const first = { ...bar, x1: 30, x2: 60, visibleSpans: [[30, 60]] as [number, number][] }
    const second = {
      ...bar, node: { ...bar.node, id: 'artist:b' }, x1: 120, x2: 150,
      visibleSpans: [[120, 150]] as [number, number][],
    }
    const firstLabel = barLabel(first, 220, [first, second], 70)!
    const secondLabel = barLabel(second, 220, [first, second], 70)!
    expect(firstLabel.x + 70).toBeLessThan(90)
    expect(secondLabel.x).toBeGreaterThan(90)
    expect(firstLabel.above).toBeUndefined()
    expect(secondLabel.above).toBeUndefined()
  })

  it('packs full labels above crowded shared rows without overlapping', () => {
    const first = {
      ...bar, node: { ...bar.node, name: 'Robert Johnson' }, x1: -12, x2: 5,
      visibleSpans: [[-12, 5]] as [number, number][],
    }
    const second = {
      ...bar, node: { ...bar.node, id: 'artist:b', name: 'Muddy Waters' }, x1: 11, x2: 89,
      visibleSpans: [[11, 89]] as [number, number][],
    }
    const third = {
      ...bar, node: { ...bar.node, id: 'artist:c', name: 'New Edition' }, x1: 91, x2: 172,
      visibleSpans: [[91, 172]] as [number, number][],
    }
    const labels = positionRowLabels([first, second, third], 200, new Map([
      [first.node.id, 88], [second.node.id, 81], [third.node.id, 69],
    ]))
    const firstLabel = labels.get(first.node.id)!
    const secondLabel = labels.get(second.node.id)!
    expect(firstLabel.above).toBe(true)
    expect(secondLabel.above).toBe(true)
    expect(firstLabel.x + firstLabel.maxWidth + 4).toBeLessThanOrEqual(secondLabel.x)
    expect(firstLabel.maxWidth).toBeGreaterThan(88 * 10.5 / 11.5 + 1)
    expect(secondLabel.maxWidth).toBeGreaterThan(81 * 10.5 / 11.5 + 1)
  })

  it('prioritizes complete shorter labels when crowded above-bar labels cannot all fit', () => {
    const first = { ...bar, x1: 0, x2: 20, visibleSpans: [[0, 20]] as [number, number][] }
    const second = {
      ...bar, node: { ...bar.node, id: 'artist:b' }, x1: 22, x2: 100,
      visibleSpans: [[22, 100]] as [number, number][],
    }
    const third = {
      ...bar, node: { ...bar.node, id: 'artist:c' }, x1: 105, x2: 195,
      visibleSpans: [[105, 195]] as [number, number][],
    }
    const labels = positionRowLabels([first, second, third], 200, new Map([
      [first.node.id, 84], [second.node.id, 170], [third.node.id, 8],
    ]))
    const firstLabel = labels.get(first.node.id)!
    const secondLabel = labels.get(second.node.id)!
    expect(firstLabel.above).toBe(true)
    expect(secondLabel.above).toBe(true)
    expect(firstLabel.x + firstLabel.maxWidth + 4).toBeLessThanOrEqual(secondLabel.x + 0.0001)
    expect(firstLabel.maxWidth).toBeGreaterThan(84 * 10.5 / 11.5 + 1)
    expect(secondLabel.maxWidth).toBeLessThan(170 * 10.5 / 11.5 + 1)
  })

  it('uses a wide revival when available and labels short revivals without crossing a hidden gap', () => {
    expect(barLabel({ ...bar, visibleSpans: [[20, 40], [80, 200]] }, 300))
      .toEqual({ x: 90, maxWidth: 104, textAnchor: 'start', outside: false })
    expect(barLabel({ ...bar, x1: -100, x2: 50, visibleSpans: [[-100, -20], [20, 50]] }, 300))
      .toEqual({ x: 60, maxWidth: 236, textAnchor: 'start', outside: true })
  })

  it('fits labels to their visible width and adds an ellipsis when needed', () => {
    expect(fitBarLabel('Minimal techno', 120, 11.5)).toBe('Minimal techno')
    expect(fitBarLabel('Minimal techno', 48, 11.5)).toMatch(/…$/u)
    expect(fitBarLabel('Minimal techno', 4, 11.5)).toBe('')
    expect(fitBarLabel('Minimal techno', 52, 11.5, { width: 50, ellipsisWidth: 8 }))
      .toBe('Minimal techno')
    expect(fitBarLabel('test', 28, 11.5, {
      width: 32, ellipsisWidth: 8, prefixWidths: [8, 16, 24, 32],
    })).toBe('te…')
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

    it('widens an isolated indicator enough to show its complete label', () => {
      const historical = genre('historical', [[-100, -20]])
      const indicators = offscreenIndicators([historical], 200, {
        indicatorLabelWidths: new Map([[historical.node.id, 99]]),
      })
      expect(indicators.get(historical.node.id))
        .toEqual({ x: 8, width: 143, direction: 'left', targetX: -20 })
    })

    it('shares available width between opposite indicators without hiding either one', () => {
      const left = genre('left', [[-100, -20]])
      const right = genre('right', [[400, 500]])
      const indicators = offscreenIndicators([left, right], 320, {
        indicatorLabelWidths: new Map([[left.node.id, 60], [right.node.id, 160]]),
      })
      expect(indicators.get(left.node.id)).toEqual({ x: 8, width: 104, direction: 'left', targetX: -20 })
      expect(indicators.get(right.node.id)).toEqual({ x: 120, width: 192, direction: 'right', targetX: 400 })
    })

    it('does not expand an indicator across a visible bar label', () => {
      const left = genre('left', [[-100, -20]])
      const visible = genre('visible', [[300, 350]])
      expect(offscreenIndicators([left, visible], 600).has(left.node.id)).toBe(true)
      expect(offscreenIndicators([left, visible], 600, {
        visibleLabels: new Map([[visible.node.id, { x: 100, maxWidth: 100, textAnchor: 'start', outside: true }]]),
        visibleLabelWidths: new Map([[visible.node.id, 80]]),
      }).has(left.node.id)).toBe(false)
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

  describe('ended bar fades', () => {
    function endedBar(start: number, end: number, scale: TimeScale): BarPosition {
      return { ...bar, start, end, ended: true, x1: yearToX(scale, start), x2: yearToX(scale, end) }
    }

    it('fades only the final two years when they are already wide enough', () => {
      const scale = { start: 1960, end: 2000, width: 800 }
      expect(tailFadeOffset(endedBar(1960, 2000, scale), scale)).toBe(0.95)
    })

    it.each([[500, 1400], [1400, 1750], [1750, 1900], [1960, 2000]])(
      'keeps a 22px fade for compressed bars from %i to %i',
      (start, end) => {
        const scale = { start: 500, end: 2028, width: 800, padding: 24 }
        const positioned = endedBar(start, end, scale)
        const width = barBounds(positioned).width
        expect((1 - tailFadeOffset(positioned, scale)) * width).toBeCloseTo(BAR_H)
      },
    )

    it('maps the final years correctly across an era boundary', () => {
      const scale = { start: 1740, end: 1752, width: 800 }
      const positioned = endedBar(1740, 1751, scale)
      expect(tailFadeOffset(positioned, scale)).toBeCloseTo(
        (yearToX(scale, 1749) - positioned.x1) / barBounds(positioned).width,
      )
    })

    it('caps the fade at the rendered width for short and zero-duration bars', () => {
      const scale = { start: 500, end: 2028, width: 800 }
      for (const end of [501, 500]) {
        expect(tailFadeOffset(endedBar(500, end, scale), scale)).toBe(0)
      }
    })

    it('keeps the fade width stable when panning without changing zoom', () => {
      const scale = { start: 500, end: 2028, width: 800 }
      const shifted = { ...scale, start: 600, end: 2036 }
      expect(tailFadeOffset(endedBar(1400, 1750, scale), scale)).toBeCloseTo(
        tailFadeOffset(endedBar(1400, 1750, shifted), shifted),
      )
    })
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
