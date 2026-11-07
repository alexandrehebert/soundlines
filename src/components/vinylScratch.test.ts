import { describe, expect, it } from 'vitest'
import { MAX_SCRATCH_RATE, NORMAL_SPEED_DEG_PER_SEC, angleDelta, createScratchDeck, renderScratchSample, scratchRate } from './vinylScratch.ts'

describe('vinyl scratch', () => {
  it('measures the shortest signed rotation across the ±180° seam', () => {
    expect(angleDelta(10, 30)).toBe(20)
    expect(angleDelta(30, 10)).toBe(-20)
    expect(angleDelta(170, -170)).toBe(20)
    expect(angleDelta(-170, 170)).toBe(-20)
  })

  it('maps record speed to a signed, clamped playback rate', () => {
    expect(scratchRate(NORMAL_SPEED_DEG_PER_SEC)).toBe(1)
    expect(scratchRate(-NORMAL_SPEED_DEG_PER_SEC / 2)).toBe(-0.5)
    expect(scratchRate(1e6)).toBe(MAX_SCRATCH_RATE)
    expect(scratchRate(-1e6)).toBe(-MAX_SCRATCH_RATE)
  })

  it('renders an audible, unclipped sample', () => {
    const sample = renderScratchSample(8000, 0.5)
    expect(sample).toHaveLength(4000)
    const peak = sample.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
    expect(peak).toBeGreaterThan(0.1)
    expect(peak).toBeLessThanOrEqual(1)
  })

  it('degrades gracefully without Web Audio', () => {
    expect(createScratchDeck()).toBeNull()
  })
})
