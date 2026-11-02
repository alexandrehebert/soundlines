import { describe, expect, it } from 'vitest'
import { MAX_BUBBLE_ZOOM, MIN_BUBBLE_ZOOM, bubbleScrollOffset, zoomBubbleViewport } from './bubbleViewport.ts'

describe('bubble focal-point zoom', () => {
  const map = { width: 2000, height: 2400 }
  const surface = { width: 400, height: 300 }
  const current = { zoom: 0.75, left: 600, top: 700 }
  const anchor = { x: 100, y: 80 }

  it('keeps the map point beneath the zoom anchor stationary', () => {
    const next = zoomBubbleViewport(map, surface, current, 1.2, anchor)
    expect(next.zoom).toBe(1.2)
    expect(next.left).toBeCloseTo(1020)
    expect(next.top).toBeCloseTo(1168)
    expect((next.left + anchor.x) / next.zoom).toBeCloseTo((current.left + anchor.x) / current.zoom)
    expect((next.top + anchor.y) / next.zoom).toBeCloseTo((current.top + anchor.y) / current.zoom)
    const restored = zoomBubbleViewport(map, surface, next, current.zoom, anchor)
    expect(restored.left).toBeCloseTo(current.left)
    expect(restored.top).toBeCloseTo(current.top)
  })

  it('pans along with a moving pinch midpoint, even at a zoom limit', () => {
    const next = zoomBubbleViewport(map, surface, current, 1.2, anchor, { x: 140, y: 100 })
    expect(next.left).toBeCloseTo(980)
    expect(next.top).toBeCloseTo(1148)
    const capped = { zoom: MAX_BUBBLE_ZOOM, left: 600, top: 700 }
    expect(zoomBubbleViewport(map, surface, capped, 3, anchor, { x: 140, y: 100 }))
      .toEqual({ zoom: MAX_BUBBLE_ZOOM, left: 560, top: 680 })
  })

  it('accounts for a centered map that starts smaller than its viewport', () => {
    expect(zoomBubbleViewport(
      { width: 1000, height: 800 }, { width: 800, height: 600 },
      { zoom: 0.5, left: 0, top: 0 }, 1, { x: 350, y: 250 },
    )).toEqual({ zoom: 1, left: 50, top: 50 })
  })

  it('clamps zoom and scrolling at both map edges', () => {
    expect(zoomBubbleViewport(map, surface, current, 100, anchor).zoom).toBe(MAX_BUBBLE_ZOOM)
    expect(zoomBubbleViewport(map, surface, current, 0, anchor).zoom).toBe(MIN_BUBBLE_ZOOM)
    expect(zoomBubbleViewport(map, surface,
      { zoom: 1.5, left: 2600, top: 3300 }, 0.25, { x: 400, y: 300 }))
      .toEqual({ zoom: 0.25, left: 100, top: 300 })
    expect(zoomBubbleViewport(
      { width: 500, height: 400 }, surface, { zoom: 0.75, left: 0, top: 0 }, 0.25, anchor,
    )).toEqual({ zoom: 0.25, left: 0, top: 0 })
  })
})

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

  it('reveals a selected bubble below floating controls only when they overlap', () => {
    const viewport = { left: 0, right: 400, top: 0, bottom: 500 }
    const controls = { left: 240, right: 388, top: 12, bottom: 66 }
    expect(bubbleScrollOffset(viewport, { left: 250, right: 330, top: 20, bottom: 100 }, 600, false, controls))
      .toEqual({ x: 0, y: -54 })
    expect(bubbleScrollOffset(viewport, { left: 30, right: 110, top: 20, bottom: 100 }, 600, false, controls))
      .toEqual({ x: 0, y: 0 })
    expect(bubbleScrollOffset(viewport, { left: 420, right: 500, top: 20, bottom: 100 }, 600, false, controls))
      .toEqual({ x: 100, y: -54 })
  })
})
