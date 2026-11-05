import { describe, expect, it } from 'vitest'
import rawGraph from '../data/graph.json'
import type { MusicGraph } from './types.ts'
import {
  DEFAULT_HISTORY_FILTERS,
  createHistoryModel,
  filtersForSelectedEvent,
  formatEventPeriod,
  groupHistoryEvents,
} from './history.ts'

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'event:later', type: 'event', name: 'Later', category: 'media',
      period: { start: 2008, end: 2008 }, significance: 'notable' },
    { id: 'event:early', type: 'event', name: 'Early', category: 'publication',
      period: { start: 1025, end: 1025, precision: 'circa' }, significance: 'landmark' },
    { id: 'event:a', type: 'event', name: 'A', category: 'technology',
      period: { start: 1900, end: 1900 }, significance: 'landmark' },
    { id: 'event:b', type: 'event', name: 'B', category: 'media',
      period: { start: 1900, end: 1900 }, significance: 'notable' },
    { id: 'genre:other', type: 'genre', name: 'Other', period: { start: 500 } },
  ],
  edges: [],
}

describe('history chronology', () => {
  it('orders all events by start year, then name and id, without changing the graph', () => {
    const events = createHistoryModel(graph).dated
    expect(events.map((event) => event.id)).toEqual([
      'event:early', 'event:a', 'event:b', 'event:later',
    ])
    expect(graph.nodes[0].id).toBe('event:later')
  })

  it('groups events into eras and filters by landmark and topic', () => {
    const events = createHistoryModel(graph).dated
    const all = groupHistoryEvents(events, DEFAULT_HISTORY_FILTERS)
    expect(all.map((group) => [group.id, group.events.map((event) => event.id)])).toEqual([
      ['before-1400', ['event:early']],
      ['1900-1949', ['event:a', 'event:b']],
      ['2000-onward', ['event:later']],
    ])
    expect(groupHistoryEvents(events, { category: 'media', landmarksOnly: false })
      .flatMap((group) => group.events.map((event) => event.id))).toEqual(['event:b', 'event:later'])
    expect(groupHistoryEvents(events, { category: 'technology', landmarksOnly: true })
      .flatMap((group) => group.events.map((event) => event.id))).toEqual(['event:a'])
    expect(groupHistoryEvents(events, { category: 'media', landmarksOnly: true })).toEqual([])
  })

  it('widens only the filters that would hide a selected event', () => {
    const events = createHistoryModel(graph).dated
    const early = events.find((event) => event.id === 'event:early')!
    const later = events.find((event) => event.id === 'event:later')!
    expect(filtersForSelectedEvent({ category: 'media', landmarksOnly: true }, early))
      .toEqual({ category: 'all', landmarksOnly: true })
    expect(filtersForSelectedEvent({ category: 'media', landmarksOnly: true }, later))
      .toEqual({ category: 'media', landmarksOnly: false })
    expect(filtersForSelectedEvent({ category: 'all', landmarksOnly: false }, later))
      .toEqual(DEFAULT_HISTORY_FILTERS)
  })

  it('represents single years, ranges, and approximate dates without implying false precision', () => {
    expect(formatEventPeriod({ start: 1981, end: 1981, precision: 'year' })).toBe('1981')
    expect(formatEventPeriod({ start: 1025, end: 1025, precision: 'circa' })).toBe('c. 1025')
    expect(formatEventPeriod({ start: 1940, end: 1949, precision: 'circa' })).toBe('c. 1940 – 1949')
    expect(formatEventPeriod({ start: 1910, end: 1970, precision: 'decade' })).toBe('1910 – 1970 (approx.)')
    expect(formatEventPeriod({ start: 2000 })).toBe('2000 – now')
    expect(formatEventPeriod({ start: 1800, end: 1850, precision: 'circa', estimated: true }))
      .toBe('c. 1800 – 1850 (estimated)')
  })

  it('keeps undated events separate without inventing dates or losing their filters', () => {
    const model = createHistoryModel({
      ...graph,
      nodes: [
        ...graph.nodes,
        { id: 'event:undated-b', type: 'event', name: 'Beta', category: 'media', period: null },
        { id: 'event:undated-a', type: 'event', name: 'Alpha', category: 'technology', significance: 'landmark' },
      ],
    })
    expect(model.dated).toHaveLength(4)
    expect(model.undated.map((event) => event.id)).toEqual(['event:undated-a', 'event:undated-b'])
    expect(filtersForSelectedEvent({ category: 'media', landmarksOnly: true }, model.undated[0]))
      .toEqual({ category: 'all', landmarksOnly: true })
    expect(groupHistoryEvents(model.dated, DEFAULT_HISTORY_FILTERS)
      .flatMap((group) => group.events.map((event) => event.id))).not.toContain('event:undated-a')
  })

  it('reports invalid event data instead of silently omitting it', () => {
    expect(() => createHistoryModel({ ...graph, nodes: [{ id: 'event:bad', type: 'event', name: 'Bad' }] }))
      .toThrow('event:bad')
    expect(() => createHistoryModel({
      ...graph,
      nodes: [{ id: 'event:bad', type: 'event', name: 'Bad', category: 'media', period: { start: 2000, end: 1999 } }],
    })).toThrow('event:bad')
    expect(() => createHistoryModel({
      ...graph,
      nodes: [{ id: 'event:bad', type: 'event', name: 'Bad', category: 'media', period: { start: NaN } }],
    })).toThrow('event:bad')
  })

  it('includes every event in the real graph exactly once, in chronological order', () => {
    const data = rawGraph as MusicGraph
    const model = createHistoryModel(data)
    const events = model.dated
    const grouped = groupHistoryEvents(events, DEFAULT_HISTORY_FILTERS).flatMap((group) => group.events)
    expect(events.length + model.undated.length).toBe(data.nodes.filter((node) => node.type === 'event').length)
    expect(grouped.map((event) => event.id)).toEqual(events.map((event) => event.id))
    expect(events[0].period.start).toBe(900)
    expect(events.at(-1)?.period.start).toBe(2022)
  })

  it.each([
    ['event:siti-binti-saad-recordings', 1928, 'genre:taarab', '1900-1949', 'shaped'],
    ['event:essaouira-gnawa-festival', 1998, 'genre:gnawa', '1950-1999', 'context_for'],
    ['event:gnawa-unesco-inscription', 2019, 'genre:gnawa', '2000-onward', 'recognized'],
    ['event:rai-unesco-inscription', 2022, 'genre:rai', '2000-onward', 'recognized'],
  ] as const)('shows %s in History and connects it to its genre', (id, year, genre, era, type) => {
    const data = rawGraph as MusicGraph
    const events = createHistoryModel(data).dated
    expect(events.find((event) => event.id === id)?.period.start).toBe(year)
    expect(groupHistoryEvents(events, DEFAULT_HISTORY_FILTERS).find((group) => group.id === era)
      ?.events.some((event) => event.id === id)).toBe(true)
    expect(data.edges.filter((edge) => edge.from === id && edge.to === genre))
      .toEqual([expect.objectContaining({ type })])
  })
})
