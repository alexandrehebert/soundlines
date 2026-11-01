import { useEffect, useRef, useState, type SetStateAction } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { panYearRange, TIMELINE_PADDING, xToYear, zoomYearRange } from '../../graph/layout.ts'
import { useTimelineViewport } from './useTimelineViewport.ts'

type YearRange = [number, number]
const explorer = vi.hoisted(() => ({
  range: [1800, 2000] as YearRange,
  pending: [] as SetStateAction<YearRange>[],
  setViewRange: vi.fn((update: SetStateAction<YearRange>) => { explorer.pending.push(update) }),
  selectNode: vi.fn(),
}))

vi.mock('../../ExplorerContext.ts', () => ({
  useExplorer: () => ({
    viewRange: explorer.range,
    setViewRange: explorer.setViewRange,
    selectNode: explorer.selectNode,
  }),
}))

vi.mock('react', () => ({
  useEffect: vi.fn(),
  useRef: vi.fn(),
  useState: vi.fn(),
}))

describe('timeline wheel input', () => {
  const width = 800
  let surface: EventTarget
  let cleanup: ReturnType<Parameters<typeof useEffect>[0]>

  const wheel = (deltaX: number, deltaY = 0, ctrlKey = false) => {
    const event = new Event('wheel', { cancelable: true })
    Object.defineProperties(event, {
      deltaX: { value: deltaX }, deltaY: { value: deltaY },
      ctrlKey: { value: ctrlKey }, metaKey: { value: false },
      clientX: { value: width / 2 },
    })
    surface.dispatchEvent(event)
    return event
  }

  const flush = () => {
    for (const update of explorer.pending.splice(0)) {
      explorer.range = typeof update === 'function' ? update(explorer.range) : update
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    explorer.range = [1800, 2000]
    explorer.pending = []
    surface = Object.assign(new EventTarget(), {
      querySelector: () => ({ getBoundingClientRect: () => ({ width, left: 0 }) }),
    })
    vi.mocked(useRef).mockImplementation((initial) => ({ current: initial }))
      .mockReturnValueOnce({ current: surface })
    vi.mocked(useState).mockReturnValue([width, vi.fn()])
    useTimelineViewport()
    cleanup = vi.mocked(useEffect).mock.calls[1][0]()
  })

  afterEach(() => { cleanup?.() })

  it('accumulates a rapid horizontal burst before React commits', () => {
    const expected = panYearRange(explorer.range, -100 / (width - 2 * TIMELINE_PADDING))
    for (let i = 0; i < 20; i++) expect(wheel(-5).defaultPrevented).toBe(true)
    flush()
    expect(explorer.range[0]).toBeCloseTo(expected[0])
    expect(explorer.range[1]).toBeCloseTo(expected[1])
  })

  it('keeps using the latest range without replacing the wheel listener', () => {
    wheel(-80)
    flush()
    const previous = explorer.range
    wheel(-40)
    flush()
    expect(explorer.range).toEqual(panYearRange(previous, -40 / (width - 2 * TIMELINE_PADDING)))
    expect(vi.mocked(useEffect).mock.calls[1][1]).toEqual([explorer.setViewRange])
  })

  it('composes zoom with pending horizontal input', () => {
    const panned = panYearRange(explorer.range, -40 / (width - 2 * TIMELINE_PADDING))
    const focus = xToYear({
      start: panned[0], end: panned[1], width, padding: TIMELINE_PADDING,
    }, width / 2)
    wheel(-40)
    expect(wheel(0, -10, true).defaultPrevented).toBe(true)
    flush()
    expect(explorer.range).toEqual(zoomYearRange(panned, focus, 0.89))
  })

  it('preserves native vertical scrolling and removes the listener on cleanup', () => {
    expect(wheel(1, 40).defaultPrevented).toBe(false)
    expect(explorer.pending).toHaveLength(0)
    cleanup?.()
    expect(wheel(-40).defaultPrevented).toBe(false)
    expect(explorer.pending).toHaveLength(0)
  })
})

describe('timeline pointer input', () => {
  class PointerTarget extends EventTarget {
    setPointerCapture = vi.fn()
    getBoundingClientRect() { return { left: 0, width: 800 } }
  }

  let viewport: ReturnType<typeof useTimelineViewport>
  let svg: SVGSVGElement
  let bar: Element

  const pointer = (
    target: Element,
    pointerType: 'mouse' | 'touch',
    pointerId = 1,
    clientX = 100,
    clientY = 100,
  ): Parameters<typeof viewport.handlers.onPointerDown>[0] => ({
    target, currentTarget: svg, pointerType, pointerId, clientX, clientY, button: 0,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('Element', PointerTarget)
    vi.stubGlobal('SVGSVGElement', PointerTarget)
    explorer.range = [1800, 2000]
    explorer.pending = []
    const surface = Object.assign(new EventTarget(), { scrollTop: 0 })
    vi.mocked(useRef).mockImplementation((initial) => ({ current: initial }))
      .mockReturnValueOnce({ current: surface })
    vi.mocked(useState).mockReturnValue([800, vi.fn()])
    viewport = useTimelineViewport()
    svg = new SVGSVGElement()
    bar = new Element()
  })

  afterEach(() => { vi.unstubAllGlobals() })

  it.each(['mouse', 'touch'] as const)('preserves the bar as the %s click target', (pointerType) => {
    viewport.handlers.onPointerDown(pointer(bar, pointerType))
    expect(bar.setPointerCapture).toHaveBeenCalledWith(1)
    expect(svg.setPointerCapture).not.toHaveBeenCalled()

    viewport.handlers.onPointerUp(pointer(bar, pointerType))
    viewport.select('genre:minimalism')
    expect(explorer.selectNode).toHaveBeenCalledWith('genre:minimalism')
  })

  it.each(['mouse', 'touch'] as const)('captures a %s drag on the timeline and suppresses its click', (pointerType) => {
    viewport.handlers.onPointerDown(pointer(bar, pointerType))
    viewport.handlers.onPointerMove(pointer(bar, pointerType, 1, 106))
    expect(svg.setPointerCapture).not.toHaveBeenCalled()

    viewport.handlers.onPointerMove(pointer(bar, pointerType, 1, 120))
    expect(svg.setPointerCapture).toHaveBeenCalledWith(1)
    expect(explorer.setViewRange).toHaveBeenCalled()
    viewport.handlers.onPointerUp(pointer(svg, pointerType, 1, 120))
    viewport.handlers.onClick()
    expect(explorer.selectNode).not.toHaveBeenCalled()

    viewport.handlers.onPointerDown(pointer(bar, pointerType))
    viewport.handlers.onPointerUp(pointer(bar, pointerType))
    viewport.select('genre:minimalism')
    expect(explorer.selectNode).toHaveBeenCalledWith('genre:minimalism')
  })

  it('keeps touch vertical scrolling separate from horizontal panning', () => {
    viewport.handlers.onPointerDown(pointer(bar, 'touch'))
    viewport.handlers.onPointerMove(pointer(bar, 'touch', 1, 102, 125))
    expect(explorer.setViewRange).not.toHaveBeenCalled()
    viewport.handlers.onPointerCancel(pointer(svg, 'touch', 1, 102, 125))
    viewport.handlers.onClick()
    expect(explorer.selectNode).not.toHaveBeenCalled()

    viewport.handlers.onPointerDown(pointer(bar, 'touch'))
    viewport.handlers.onPointerUp(pointer(bar, 'touch'))
    viewport.select('genre:minimalism')
    expect(explorer.selectNode).toHaveBeenCalledWith('genre:minimalism')
  })

  it('captures both pointers during a pinch and suppresses its click', () => {
    const otherBar = new Element()
    viewport.handlers.onPointerDown(pointer(bar, 'touch', 1, 100))
    viewport.handlers.onPointerDown(pointer(otherBar, 'touch', 2, 200))
    expect(svg.setPointerCapture).toHaveBeenCalledWith(1)
    expect(svg.setPointerCapture).toHaveBeenCalledWith(2)

    viewport.handlers.onPointerMove(pointer(svg, 'touch', 2, 240))
    expect(explorer.setViewRange).toHaveBeenCalled()
    viewport.handlers.onPointerUp(pointer(svg, 'touch', 1, 100))
    viewport.handlers.onClick()
    expect(explorer.selectNode).not.toHaveBeenCalled()
    viewport.handlers.onPointerUp(pointer(svg, 'touch', 2, 240))
  })

  it('still clears the selection when the timeline background is clicked', () => {
    viewport.handlers.onPointerDown(pointer(svg, 'mouse'))
    viewport.handlers.onPointerUp(pointer(svg, 'mouse'))
    viewport.handlers.onClick()
    expect(explorer.selectNode).toHaveBeenCalledWith(null)
  })
})
