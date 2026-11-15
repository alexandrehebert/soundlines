import { useEffect, useLayoutEffect, useRef, useState, type SetStateAction } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { zoomBubbleViewport, type BubbleViewportState } from './bubbleViewport.ts'
import { useBubbleViewport } from './useBubbleViewport.ts'

vi.mock('react', () => ({
  useCallback: (callback: unknown) => callback,
  useEffect: vi.fn(),
  useLayoutEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}))

class PointerTarget extends EventTarget {
  setPointerCapture = vi.fn()
  closest = vi.fn()
  scrollLeft = 600
  scrollTop = 700
  clientWidth = 400
  clientHeight = 300
  getBoundingClientRect() { return { left: 10, top: 20 } }
}

describe('bubble viewport input', () => {
  let surface: HTMLDivElement
  let bubble: Element
  let viewport: ReturnType<typeof useBubbleViewport>
  let cleanup: ReturnType<Parameters<typeof useEffect>[0]>
  const updates: BubbleViewportState[] = []
  const setViewport = vi.fn((update: SetStateAction<BubbleViewportState | null | undefined>) => {
    const state = typeof update === 'function' ? update(updates.at(-1) ?? null) : update
    if (state) updates.push(state)
  })
  const initial = { zoom: 0.75, left: 600, top: 700 }

  const pointer = (
    target: Element, pointerType: 'mouse' | 'touch', pointerId = 1, x = 100, y = 100, button = 0,
  ): Parameters<typeof viewport.handlers.onPointerDown>[0] => ({
    target, pointerType, pointerId, clientX: x + 10, clientY: y + 20, button, currentTarget: surface,
  })

  const click = (detail = 1) => {
    const event = { detail, preventDefault: vi.fn(), stopPropagation: vi.fn() }
    viewport.handlers.onClickCapture(event)
    return event
  }

  const wheel = (deltaY: number, ctrlKey = true, metaKey = false, deltaMode = 0) => {
    const event = new Event('wheel', { cancelable: true })
    Object.defineProperties(event, {
      deltaY: { value: deltaY }, deltaMode: { value: deltaMode },
      ctrlKey: { value: ctrlKey }, metaKey: { value: metaKey },
      clientX: { value: 110 }, clientY: { value: 100 },
    })
    surface.dispatchEvent(event)
    return event
  }

  const gesture = (type: string, scale: number) => {
    const event = new Event(type, { cancelable: true })
    Object.defineProperties(event, {
      scale: { value: scale }, clientX: { value: 110 }, clientY: { value: 100 },
    })
    surface.dispatchEvent(event)
    return event
  }

  beforeEach(() => {
    vi.clearAllMocks()
    updates.length = 0
    vi.stubGlobal('Element', PointerTarget)
    vi.stubGlobal('HTMLDivElement', PointerTarget)
    surface = new HTMLDivElement()
    bubble = new Element()
    vi.mocked(useRef).mockReset().mockImplementation((value) => ({ current: value }))
      .mockReturnValueOnce({ current: surface })
    vi.mocked(useState<BubbleViewportState | null>).mockReturnValue([null, setViewport])
    viewport = useBubbleViewport(2000, 2400)
    cleanup = vi.mocked(useEffect).mock.calls[0][0]()
  })

  afterEach(() => {
    cleanup?.()
    vi.unstubAllGlobals()
  })

  it('centers the initial map, including a StrictMode effect replay', () => {
    const position = vi.mocked(useLayoutEffect).mock.calls[0][0]
    position()
    expect([surface.scrollLeft, surface.scrollTop]).toEqual([550, 750])
    position()
    expect([surface.scrollLeft, surface.scrollTop]).toEqual([550, 750])
  })

  it('accumulates a trackpad pinch burst before React commits', () => {
    for (let i = 0; i < 20; i++) expect(wheel(-5).defaultPrevented).toBe(true)
    const expected = zoomBubbleViewport(
      { width: 2000, height: 2400 }, { width: 400, height: 300 },
      initial, initial.zoom * Math.exp(0.5), { x: 100, y: 80 },
    )
    expect(updates.at(-1)?.zoom).toBeCloseTo(expected.zoom)
    expect(updates.at(-1)?.left).toBeCloseTo(expected.left)
    expect(updates.at(-1)?.top).toBeCloseTo(expected.top)
  })

  it('applies committed zoom before scrolling and uses the latest native scroll for button zoom', () => {
    wheel(-10)
    const next = updates.at(-1)!
    const refs = vi.mocked(useRef).mock.results.map((result) => result.value)
    vi.mocked(useRef).mockReset()
    for (const ref of refs) vi.mocked(useRef).mockReturnValueOnce(ref)
    vi.mocked(useState<BubbleViewportState | null>).mockReturnValue([next, setViewport])
    vi.mocked(useLayoutEffect).mockClear()
    viewport = useBubbleViewport(2000, 2400)
    vi.mocked(useLayoutEffect).mock.calls[0][0]()
    expect(viewport.zoom).toBe(next.zoom)
    expect(surface.scrollLeft).toBeCloseTo(next.left)
    expect(surface.scrollTop).toBeCloseTo(next.top)
    surface.scrollLeft += 40
    surface.scrollTop += 30
    const current = { zoom: next.zoom, left: surface.scrollLeft, top: surface.scrollTop }
    viewport.zoomBy(0.1)
    expect(updates.at(-1)).toEqual(zoomBubbleViewport(
      { width: 2000, height: 2400 }, { width: 400, height: 300 },
      current, next.zoom + 0.1, { x: 200, y: 150 },
    ))
  })

  it.each([[true, false, 1, 16], [false, true, 0, 1], [true, false, 2, 300]])(
    'supports wheel modifiers and delta units (%s, %s, %s)',
    (ctrlKey, metaKey, mode, unit) => {
      expect(wheel(-0.1, ctrlKey, metaKey, mode).defaultPrevented).toBe(true)
      expect(updates.at(-1)?.zoom).toBeCloseTo(0.75 * Math.exp(0.1 * unit * 0.005))
    },
  )

  it('leaves ordinary wheel scrolling native and removes listeners on cleanup', () => {
    expect(wheel(80, false).defaultPrevented).toBe(false)
    expect(updates).toHaveLength(0)
    cleanup?.()
    expect(wheel(-5).defaultPrevented).toBe(false)
    expect(gesture('gesturestart', 1).defaultPrevented).toBe(false)
    expect(updates).toHaveLength(0)
  })

  it('handles Safari trackpad gestures without also applying wheel zoom', () => {
    expect(gesture('gesturestart', 1).defaultPrevented).toBe(true)
    expect(gesture('gesturechange', 1.2).defaultPrevented).toBe(true)
    expect(updates.at(-1)?.zoom).toBeCloseTo(0.9)
    const count = updates.length
    expect(wheel(-5).defaultPrevented).toBe(true)
    expect(updates).toHaveLength(count)
    gesture('gestureend', 1.2)
    wheel(-5)
    expect(updates.at(-1)?.zoom).toBeGreaterThan(0.9)
  })

  it('preserves taps and does not intercept keyboard activation after a pan', () => {
    viewport.handlers.onPointerDown(pointer(bubble, 'touch'))
    viewport.handlers.onPointerUp(pointer(bubble, 'touch'))
    expect(click().preventDefault).not.toHaveBeenCalled()
    viewport.handlers.onPointerDown(pointer(surface, 'touch'))
    viewport.handlers.onPointerMove(pointer(surface, 'touch', 1, 140, 160))
    viewport.handlers.onPointerUp(pointer(surface, 'touch', 1, 140, 160))
    expect([surface.scrollLeft, surface.scrollTop]).toEqual([560, 640])
    expect(click().preventDefault).toHaveBeenCalledOnce()
    expect(click(0).preventDefault).not.toHaveBeenCalled()
  })

  it('allows a bubble click after a mouse background drag', () => {
    viewport.handlers.onPointerDown(pointer(surface, 'mouse'))
    viewport.handlers.onPointerMove(pointer(surface, 'mouse', 1, 140, 160))
    viewport.handlers.onPointerUp(pointer(surface, 'mouse', 1, 140, 160))
    expect(click().stopPropagation).toHaveBeenCalledOnce()
    vi.mocked(bubble.closest).mockReturnValue(bubble)
    viewport.handlers.onPointerDown(pointer(bubble, 'mouse'))
    viewport.handlers.onPointerUp(pointer(bubble, 'mouse'))
    expect(click().preventDefault).not.toHaveBeenCalled()
  })

  it('ignores nonprimary mouse buttons and tiny touch movements', () => {
    viewport.handlers.onPointerDown(pointer(surface, 'mouse', 1, 100, 100, 2))
    viewport.handlers.onPointerMove(pointer(surface, 'mouse', 1, 140, 160))
    expect([surface.scrollLeft, surface.scrollTop]).toEqual([600, 700])
    viewport.handlers.onPointerDown(pointer(bubble, 'touch'))
    viewport.handlers.onPointerMove(pointer(bubble, 'touch', 1, 103, 102))
    viewport.handlers.onPointerUp(pointer(bubble, 'touch', 1, 103, 102))
    expect(click().preventDefault).not.toHaveBeenCalled()
  })

  it('pinches around the midpoint and resumes panning with the remaining finger', () => {
    viewport.handlers.onPointerDown(pointer(bubble, 'touch', 1, 100, 100))
    viewport.handlers.onPointerDown(pointer(bubble, 'touch', 2, 200, 100))
    viewport.handlers.onPointerMove(pointer(surface, 'touch', 1, 80, 100))
    viewport.handlers.onPointerMove(pointer(surface, 'touch', 2, 220, 100))
    expect(updates.at(-1)?.zoom).toBeCloseTo(1.05)
    expect(updates.at(-1)?.left).toBeCloseTo(900)
    expect(updates.at(-1)?.top).toBeCloseTo(1020)
    viewport.handlers.onPointerUp(pointer(surface, 'touch', 2, 220, 100))
    viewport.handlers.onPointerMove(pointer(surface, 'touch', 1, 100, 110))
    expect(updates.at(-1)?.left).toBeCloseTo(880)
    expect(updates.at(-1)?.top).toBeCloseTo(1010)
    viewport.handlers.onPointerCancel(pointer(surface, 'touch', 1, 100, 110))
    expect(click().preventDefault).toHaveBeenCalledOnce()
    viewport.handlers.onPointerDown(pointer(bubble, 'touch', 3))
    viewport.handlers.onPointerUp(pointer(bubble, 'touch', 3))
    expect(click().preventDefault).not.toHaveBeenCalled()
  })

  it('does not double-zoom from Safari touch gesture events during a pointer pinch', () => {
    viewport.handlers.onPointerDown(pointer(bubble, 'touch', 1, 100, 100))
    viewport.handlers.onPointerDown(pointer(bubble, 'touch', 2, 200, 100))
    gesture('gesturestart', 1)
    gesture('gesturechange', 1.2)
    expect(updates).toHaveLength(0)
    viewport.handlers.onPointerMove(pointer(surface, 'touch', 2, 240, 100))
    expect(updates.at(-1)?.zoom).toBeCloseTo(1.05)
  })
})
