import { afterEach, describe, expect, it, vi } from 'vitest'
import { scheduleTurntableHints, TURNTABLE_HINTS, turntableHintFrame, turntableHintPosition } from './turntableHint.ts'

const targets = { centerX: 300, centerY: 180, diameter: 240, playX: 500, playY: 350 }

describe('turntable hint', () => {
  it('holds position and rotation while crossfading hand poses in every scenario', () => {
    for (const scenario of TURNTABLE_HINTS) {
      const transitions = scenario.startsWith('play-') ? [[.44, .48], [.84, .88]] : [[.2, .24], [.56, .6]]
      for (const [start, end] of transitions) {
        const position = turntableHintPosition(turntableHintFrame(start, scenario), targets)
        for (let step = 0; step <= 10; step++) {
          const frame = turntableHintFrame(start + (end - start) * step / 10, scenario)
          expect(frame.angle).toBe(0)
          expect(turntableHintPosition(frame, targets)).toEqual(position)
        }
      }
    }
  })

  it('grips throughout the scratch and points for the play tap', () => {
    for (const progress of [.24, .28, .32, .36, .4, .44, .48, .52, .56]) {
      expect(turntableHintFrame(progress).grip).toBe(1)
    }
    expect(turntableHintFrame(.83).grip).toBe(0)
    expect(turntableHintFrame(.83).scale).toBe(.82)
    expect(turntableHintPosition(turntableHintFrame(.83), targets)).toEqual({ x: 500, y: 350 })
  })

  it('moves on a constant-radius arc at the same angle as the vinyl', () => {
    const radius = targets.diameter * Math.hypot(.22, .05)
    const baseAngle = Math.atan2(-.05, -.22)
    for (let progress = .24; progress <= .56; progress += .01) {
      const frame = turntableHintFrame(progress)
      const point = turntableHintPosition(frame, targets)
      const dx = point.x - targets.centerX
      const dy = point.y - targets.centerY
      expect(Math.hypot(dx, dy)).toBeCloseTo(radius, 8)
      expect(dx).toBeCloseTo(radius * Math.cos(baseAngle + frame.angle * Math.PI / 180), 8)
      expect(dy).toBeCloseTo(radius * Math.sin(baseAngle + frame.angle * Math.PI / 180), 8)
    }
    expect(turntableHintFrame(.32).angle).toBe(-20)
    expect(turntableHintFrame(.4).angle).toBe(20)
    expect(turntableHintFrame(.48).angle).toBe(-20)
  })

  it('returns the vinyl to its original angle before moving to Play and fading out', () => {
    for (const progress of [0, .2, .56, .6, .76, .83, 1]) {
      expect(turntableHintFrame(progress).angle).toBe(0)
    }
    expect(turntableHintFrame(0).opacity).toBe(0)
    expect(turntableHintFrame(1).opacity).toBe(0)
  })

  it.each(TURNTABLE_HINTS)('demonstrates a complete scratch and Play tap in %s', (scenario) => {
    const radius = targets.diameter * Math.hypot(.22, .05)
    const baseAngle = Math.atan2(-.05, -.22)
    let firstScratch = -1
    let firstTap = -1
    let peakPulse = 0
    for (let step = 0; step <= 1000; step++) {
      const frame = turntableHintFrame(step / 1000, scenario)
      const position = turntableHintPosition(frame, targets)
      if (Math.abs(frame.angle) > 1e-8) {
        if (firstScratch < 0) firstScratch = step
        expect(frame.grip).toBe(1)
        expect(frame.toPlay).toBe(0)
        expect(frame.opacity).toBe(1)
        expect(Math.hypot(position.x - targets.centerX, position.y - targets.centerY)).toBeCloseTo(radius, 8)
        const angle = baseAngle + frame.angle * Math.PI / 180
        expect(position.x - targets.centerX).toBeCloseTo(radius * Math.cos(angle), 8)
        expect(position.y - targets.centerY).toBeCloseTo(radius * Math.sin(angle), 8)
      }
      if (frame.playPulse > 1e-8) {
        if (firstTap < 0) firstTap = step
        peakPulse = Math.max(peakPulse, frame.playPulse)
        expect(frame.grip).toBe(0)
        expect(frame.angle).toBe(0)
        expect(frame.toPlay).toBe(1)
        expect(frame.opacity).toBe(1)
        expect(position.x).toBeCloseTo(targets.playX, 8)
        expect(position.y).toBeCloseTo(targets.playY, 8)
      }
    }
    expect(firstScratch).toBeGreaterThan(0)
    expect(firstTap).toBeGreaterThan(0)
    expect(peakPulse).toBe(1)
    if (scenario.startsWith('play-')) expect(firstTap).toBeLessThan(firstScratch)
    else expect(firstScratch).toBeLessThan(firstTap)

    const tap = turntableHintFrame(scenario.startsWith('play-') ? .2 : .83, scenario)
    expect(tap.scale).toBe(.82)
    expect(tap.playPulse).toBe(1)
  })

  it('varies the direction and amplitude of the scratch gestures', () => {
    expect(turntableHintFrame(.304, 'baby-scratch-play').angle).toBeCloseTo(-12)
    expect(turntableHintFrame(.368, 'baby-scratch-play').angle).toBeCloseTo(12)
    expect(turntableHintFrame(.66, 'play-backspin').angle).toBeCloseTo(-105)
    expect(turntableHintFrame(.57, 'play-scratch').angle).toBeCloseTo(28)
    expect(turntableHintFrame(.66, 'play-scratch').angle).toBeCloseTo(-28)
  })

  it('starts and ends every scenario invisibly with no rotation or button pulse', () => {
    for (const scenario of TURNTABLE_HINTS) {
      for (const progress of [0, 1]) {
        const frame = turntableHintFrame(progress, scenario)
        expect(frame.opacity).toBe(0)
        expect(frame.angle).toBe(0)
        expect(frame.playPulse).toBe(0)
      }
    }
  })
})

describe('turntable hint scheduling', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('waits two seconds, runs seven seconds, then waits at least 10 seconds without repeating', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const stop = vi.fn()
    const start = vi.fn(() => stop)
    const schedule = scheduleTurntableHints(start)
    expect(start).not.toHaveBeenCalled()
    schedule.resume()
    vi.advanceTimersByTime(1999)
    expect(start).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(start).toHaveBeenLastCalledWith('scratch-play')
    vi.advanceTimersByTime(6999)
    expect(stop).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(stop).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(9999)
    expect(start).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1)
    expect(start).toHaveBeenLastCalledWith('baby-scratch-play')
    schedule.dispose()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('caps the random pause at 16 seconds and selects other scenarios', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(.999999)
    const start = vi.fn(() => vi.fn())
    const schedule = scheduleTurntableHints(start)
    schedule.resume()
    vi.advanceTimersByTime(2000)
    expect(start).toHaveBeenLastCalledWith('play-scratch')
    vi.advanceTimersByTime(7000 + 15998)
    expect(start).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(2)
    expect(start).toHaveBeenLastCalledWith('play-backspin')
    schedule.dispose()
  })

  it('cancels and postpones on activity, pauses offscreen, and cleans up permanently', () => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const stop = vi.fn()
    const start = vi.fn(() => stop)
    const schedule = scheduleTurntableHints(start)
    schedule.resume()
    vi.advanceTimersByTime(2000)
    schedule.restart()
    expect(stop).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(9999)
    expect(start).toHaveBeenCalledOnce()
    schedule.pause()
    vi.advanceTimersByTime(100000)
    expect(start).toHaveBeenCalledOnce()
    schedule.resume()
    vi.advanceTimersByTime(10000)
    expect(start).toHaveBeenCalledTimes(2)
    schedule.dispose()
    schedule.resume()
    schedule.restart()
    vi.advanceTimersByTime(100000)
    expect(start).toHaveBeenCalledTimes(2)
    expect(vi.getTimerCount()).toBe(0)
  })
})
