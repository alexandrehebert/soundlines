import { describe, expect, it } from 'vitest'
import { bubbleScrollOffset } from './bubbleViewport.ts'

describe('bubble viewport', () => {
  const surface = { left: 0, right: 320, top: 262, bottom: 505 }

  it('does not move a selection that is already visible', () => {
    const bubble = { left: 121, right: 199, top: 280, bottom: 358 }
    expect(bubbleScrollOffset(surface, bubble, 568, false)).toEqual({ x: 0, y: 0 })
    expect(bubbleScrollOffset(surface, bubble, 568, true)).toEqual({ x: 0, y: 0 })
  })

  it('reveals only the part hidden behind the collapsed mobile detail sheet', () => {
    const bubble = { left: 290, right: 350, top: 345, bottom: 423 }
    const offset = bubbleScrollOffset(surface, bubble, 568, true)
    expect(offset.x).toBe(30)
    expect(offset.y).toBeCloseTo(23.98)
    expect(bubble.bottom - offset.y).toBeCloseTo(568 * (1 - 0.85 * 0.35))
  })

  it('reveals a selection beyond the top or left edge', () => {
    const bubble = { left: -10, right: 68, top: 240, bottom: 318 }
    expect(bubbleScrollOffset(surface, bubble, 568, true)).toEqual({ x: -10, y: -22 })
  })

  it('shows as much as possible of an oversized selection', () => {
    const bubble = { left: 30, right: 200, top: 280, bottom: 450 }
    expect(bubbleScrollOffset(surface, bubble, 568, true)).toEqual({ x: 0, y: 18 })
    expect(bubbleScrollOffset(surface, { ...bubble, top: 240 }, 568, true)).toEqual({ x: 0, y: 0 })
  })

  it('does not scroll vertically when the sheet covers the whole map', () => {
    const bubble = { left: 121, right: 199, top: 345, bottom: 423 }
    expect(bubbleScrollOffset({ ...surface, top: 410 }, bubble, 568, true).y).toBe(0)
  })
})
