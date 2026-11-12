import { afterEach, describe, expect, it, vi } from 'vitest'
import rawGraph from '../data/graph.json'
import { graphForLocale } from '../data/graphLocale.ts'
import type { GraphNode, MusicGraph } from '../graph/types.ts'
import { LOCALES } from '../i18n/routing.ts'
import { currentUtcDay, dailySpotlights, subscribeToUtcDay, utcDay } from './dailySpotlights.ts'

const graph = rawGraph as MusicGraph
const ids = (nodes: readonly GraphNode[]) => nodes.map((node) => node.id)

describe('daily spotlights', () => {
  it('uses UTC calendar days, including the midnight boundary', () => {
    const day = utcDay(Date.parse('2026-11-11T00:00:00.000Z'))
    expect(utcDay(Date.parse('2026-11-11T23:59:59.999Z'))).toBe(day)
    expect(utcDay(Date.parse('2026-11-12T00:00:00.000Z'))).toBe(day + 1)
  })

  it.each(['artist', 'instrument'] as const)('shows five distinct %s entries with no repeats on consecutive days', (type) => {
    const count = graph.nodes.filter((node) => node.type === type).length
    const covered = new Set<string>()
    const start = utcDay(Date.parse('2026-11-11T12:00:00Z'))
    expect(count).toBeGreaterThanOrEqual(10)

    for (let day = start; day < start + Math.ceil(count / 5); day++) {
      const today = ids(dailySpotlights(graph.nodes, type, day))
      const tomorrow = new Set(ids(dailySpotlights(graph.nodes, type, day + 1)))
      expect(today).toHaveLength(5)
      expect(new Set(today).size).toBe(5)
      expect(today.every((id) => !tomorrow.has(id))).toBe(true)
      today.forEach((id) => covered.add(id))
    }

    expect(covered.size).toBe(count)
  })

  it.each(['artist', 'instrument'] as const)('keeps %s picks stable across ordering and languages', (type) => {
    const day = utcDay(Date.parse('2026-11-11T12:00:00Z'))
    const expected = ids(dailySpotlights(graph.nodes, type, day))
    expect(ids(dailySpotlights([...graph.nodes].reverse(), type, day))).toEqual(expected)
    for (const locale of LOCALES) {
      expect(ids(dailySpotlights(graphForLocale(locale).nodes, type, day))).toEqual(expected)
    }
  })

  it('uses only available entries and minimizes unavoidable overlap in small catalogues', () => {
    const nodes: GraphNode[] = Array.from({ length: 9 }, (_, i) => ({
      id: `artist:test-${i}`, type: 'artist', name: `Artist ${i}`,
    }))
    expect(dailySpotlights(nodes, 'instrument', 1)).toEqual([])

    for (let size = 1; size <= nodes.length; size++) {
      const candidates = nodes.slice(0, size)
      const today = ids(dailySpotlights(candidates, 'artist', -1))
      const tomorrow = new Set(ids(dailySpotlights(candidates, 'artist', 0)))
      expect(today).toHaveLength(Math.min(size, 5))
      expect(new Set(today).size).toBe(today.length)
      expect(today.filter((id) => tomorrow.has(id))).toHaveLength(2 * today.length - size)
    }
  })
})

describe('UTC day subscription', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('notifies at midnight, catches up on visibility, and cleans up', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-11T23:59:58.000Z'))
    class TestDocument extends EventTarget {
      visibilityState: DocumentVisibilityState = 'visible'
    }
    const doc = new TestDocument()
    vi.stubGlobal('document', doc)
    const notify = vi.fn()
    const stop = subscribeToUtcDay(notify)
    const firstDay = currentUtcDay()

    vi.advanceTimersByTime(1999)
    expect(notify).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(notify).toHaveBeenCalledOnce()
    expect(currentUtcDay()).toBe(firstDay + 1)

    doc.visibilityState = 'hidden'
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(notify).toHaveBeenCalledOnce()
    vi.setSystemTime(new Date('2026-11-14T09:00:00.000Z'))
    doc.visibilityState = 'visible'
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(notify).toHaveBeenCalledTimes(2)
    expect(currentUtcDay()).toBe(firstDay + 3)

    vi.advanceTimersByTime(15 * 60 * 60 * 1000 - 1)
    expect(notify).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(1)
    expect(notify).toHaveBeenCalledTimes(3)
    stop()
    expect(vi.getTimerCount()).toBe(0)
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(notify).toHaveBeenCalledTimes(3)
  })
})
