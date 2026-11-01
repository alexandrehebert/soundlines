import { useEffect, useRef, useState, type SetStateAction } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { panYearRange, TIMELINE_PADDING, xToYear, zoomYearRange } from '../../graph/layout.ts'
import { useTimelineViewport } from './useTimelineViewport.ts'

type YearRange = [number, number]
const explorer = vi.hoisted(() => ({
  range: [1800, 2000] as YearRange,
  pending: [] as SetStateAction<YearRange>[],
  setViewRange: vi.fn((update: SetStateAction<YearRange>) => { explorer.pending.push(update) }),
}))

vi.mock('../../ExplorerContext.ts', () => ({
  useExplorer: () => ({
    viewRange: explorer.range,
    setViewRange: explorer.setViewRange,
    selectNode: vi.fn(),
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
