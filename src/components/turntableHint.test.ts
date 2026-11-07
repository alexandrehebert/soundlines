import { describe, expect, it } from 'vitest'
import { turntableHintFrame, turntableHintPosition } from './turntableHint.ts'

const targets = { centerX: 300, centerY: 180, diameter: 240, playX: 500, playY: 350 }

describe('turntable hint', () => {
  it('holds position and rotation while crossfading hand poses in either direction', () => {
    for (const [start, end] of [[.2, .24], [.56, .6]]) {
      const position = turntableHintPosition(turntableHintFrame(start), targets)
      for (let step = 0; step <= 10; step++) {
        const frame = turntableHintFrame(start + (end - start) * step / 10)
        expect(frame.angle).toBe(0)
        expect(turntableHintPosition(frame, targets)).toEqual(position)
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
})
