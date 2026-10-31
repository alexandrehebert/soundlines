import { describe, expect, it } from 'vitest'
import { BAR_H, barShape, labelX, positionTimeline, snapToSpans, tailFadeOffset, type BarPosition } from './geometry.ts'

const bar: BarPosition = {
  node: { id: 'artist:a', type: 'artist', name: 'A', period: { start: 1960 } },
  start: 1960, end: 1990,
  x1: 0, x2: 300, yCenter: 50, color: '#fff', ended: false,
  visibleSpans: [[0, 80], [150, 300]],
}

describe('shared bar geometry', () => {
  it('snaps relation endpoints out of hidden gaps and inside short revival spans', () => {
    expect(snapToSpans(110, bar.visibleSpans, 10)).toBe(70)
    expect(snapToSpans(140, bar.visibleSpans, 10)).toBe(160)
    expect(snapToSpans(1, [[0, 8]], 10)).toBe(4)
  })

  it('labels the first visible stretch in the viewport, including a revival', () => {
    expect(labelX(bar, 300)).toBe(10)
    expect(labelX({ ...bar, visibleSpans: [[-200, -120], [20, 170]] }, 300)).toBe(30)
    expect(labelX({ ...bar, visibleSpans: [] }, 300)).toBeNull()
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
      family: 'roots', rowCount: 1,
      bars: [{
        node: { ...bar.node, phases: [
          { start: 1960, prominence: 'golden-age' },
          { start: 1970, prominence: 'niche' },
          { start: 1980, prominence: 'established' },
        ] },
        family: 'roots', row: 0, start: 1960, end: 1990, ongoing: true,
      }],
    }], { start: 1960, end: 1990, width: 300 })
    expect(result.bars[0].visibleSpans).toEqual([[0, 100], [200, 300]])
  })
})
