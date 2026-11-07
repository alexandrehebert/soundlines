import { useEffect, useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { graphForLocale } from '../data/graphLocale.ts'
import { buildIndex } from '../graph/graph.ts'
import { DEFAULT_HISTORY_FILTERS, type HistoryFilters } from '../graph/history.ts'
import { createTimelineModel } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import type { Locale } from '../i18n/routing.ts'
import { renderWithIntl } from '../i18n/test-utils.tsx'
import { History } from './History.tsx'

vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>()
  return {
    ...react,
    useEffect: vi.fn(),
    useRef: vi.fn(react.useRef),
    useState: vi.fn(react.useState),
  }
})

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:example', type: 'genre', name: 'Example genre', family: 'jazz', period: { start: 1900 } },
    { id: 'event:later', type: 'event', name: 'Later event', category: 'media', significance: 'notable',
      period: { start: 1981, end: 1981 }, description: 'A broadcast.' },
    { id: 'event:early', type: 'event', name: 'Early event', category: 'publication', significance: 'landmark',
      period: { start: 1025, end: 1025, precision: 'circa' }, description: 'An early development.' },
  ],
  edges: [
    { id: 'link', type: 'shaped', from: 'event:early', to: 'genre:example' },
  ],
}

function renderHistory(
  selectedId: string | null = null,
  filters: HistoryFilters = DEFAULT_HISTORY_FILTERS,
  data: MusicGraph = graph,
  locale: Locale = 'en',
) {
  const index = buildIndex(data)
  return renderWithIntl(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, 'genre'), locale, view: 'history',
      selectedId, selectNode: vi.fn(), changeView: vi.fn(), order: 'family', changeOrder: vi.fn(),
      genreDisplay: 'bars', changeGenreDisplay: vi.fn(), goHome: vi.fn(), isHome: false,
      historyFilters: filters, changeHistoryFilters: vi.fn(),
      viewRange: [1948, 2026], setViewRange: vi.fn(),
    }}>
      <History />
    </ExplorerContext.Provider>,
    locale,
  )
}

describe('history view', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('keeps full descriptions by default and reserves the desktop footer for connections', () => {
    const markup = renderHistory()
    expect(markup).toContain('An early development.')
    expect(markup).toContain('history-event-description')
    expect(markup).toContain('md:mt-auto md:pt-4')
    expect(markup).not.toContain('Show more')
    expect(markup).not.toContain('data-overflowing')
  })

  it.each(['en', 'fr'] as const)('localizes the overflow action in %s', (locale) => {
    vi.mocked(useState)
      .mockReturnValueOnce([null, vi.fn()])
      .mockReturnValueOnce([true, vi.fn()])
    const markup = renderHistory(null, DEFAULT_HISTORY_FILTERS, graph, locale)
    expect(markup).toContain('data-overflowing="true"')
    expect(markup).toContain(locale === 'fr' ? 'Voir plus' : 'Show more')
    expect(markup).toContain('absolute bottom-0 right-0 hidden')
    expect(markup).toContain('md:inline-flex')
  })

  it('measures description overflow, rechecks on resize, and disconnects on unmount', () => {
    const paragraph = { scrollHeight: 120, clientHeight: 80 }
    const setOverflowing = vi.fn()
    let resize: ResizeObserverCallback | undefined
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { resize = callback }
      observe = observe
      disconnect = disconnect
    })
    vi.mocked(useRef)
      .mockReturnValueOnce({ current: new Map() })
      .mockReturnValueOnce({ current: new Map() })
      .mockReturnValueOnce({ current: null })
      .mockReturnValueOnce({ current: null })
      .mockReturnValueOnce({ current: null })
      .mockReturnValueOnce({ current: paragraph })
    vi.mocked(useState)
      .mockReturnValueOnce([null, vi.fn()])
      .mockReturnValueOnce([false, setOverflowing])
    renderHistory()
    const effect = vi.mocked(useEffect).mock.calls.find(([, dependencies]) =>
      dependencies?.[0] === 'An early development.')
    expect(effect).toBeDefined()
    const cleanup = effect?.[0]()
    expect(observe).toHaveBeenCalledWith(paragraph)
    expect(setOverflowing).toHaveBeenLastCalledWith(true)
    paragraph.clientHeight = 120
    resize?.([], {} as ResizeObserver)
    expect(setOverflowing).toHaveBeenLastCalledWith(false)
    paragraph.scrollHeight = 160
    resize?.([], {} as ResizeObserver)
    expect(setOverflowing).toHaveBeenLastCalledWith(true)
    cleanup?.()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  it('localizes history filters, categories, eras, and dates in French', () => {
    const markup = renderHistory(null, DEFAULT_HISTORY_FILTERS, graph, 'fr')
    expect(markup).toContain('aria-label="Chronologie de l’histoire musicale"')
    expect(markup).toContain('Tous les événements')
    expect(markup).toContain('Tous les thèmes')
    expect(markup).toContain('Théorie, notation et édition')
    expect(markup).toContain('vers 1025')
    expect(markup).not.toContain('All events')
    expect(markup).not.toContain('Jump to an era')
  })

  it.each([
    ['en', 'c. 586 BCE – 582 BCE'],
    ['fr', 'vers 586 AEC – 582 AEC'],
  ] as const)('shows the Pythian event’s estimated date range in %s', (locale, date) => {
    const source = graphForLocale(locale)
    const data: MusicGraph = {
      ...source,
      nodes: source.nodes.filter((node) => node.id === 'event:pythian-games-panhellenic-reorganisation'),
      edges: [],
    }
    expect(data.nodes).toHaveLength(1)
    expect(renderHistory(null, DEFAULT_HISTORY_FILTERS, data, locale)).toContain(date)
  })

  it('shows undated events separately and applies the same filters and selection', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: [
        ...graph.nodes,
        { id: 'event:undated', type: 'event', name: 'Undated event', category: 'society', significance: 'landmark' },
        { id: 'event:other', type: 'event', name: 'Other undated', category: 'media', period: null },
      ],
    }
    const markup = renderHistory('event:undated', { category: 'society', landmarksOnly: true }, data)
    expect(markup).toContain('Showing 1 event (1 undated; dated events by start year)')
    expect(markup).toContain('aria-label="Undated events"')
    expect(markup).toMatch(/data-undated-node="event:undated" aria-pressed="true"/)
    expect(markup).not.toContain('data-undated-node="event:other"')
    expect(markup).toContain('No dated events match these filters.')
    expect(markup).not.toContain('No events match these filters.')
  })

  it('renders events in chronological eras with dates, significance, and connections', () => {
    const markup = renderHistory()
    expect(markup).toContain('aria-label="Music history timeline"')
    expect(markup).not.toContain('A journey through music')
    expect(markup).not.toContain('Music through time')
    expect(markup).not.toContain('Explore the moments')
    expect(markup).not.toContain('<header')
    expect(markup).toContain('Showing 2 events by start year')
    expect(markup).toContain('c. 1025')
    expect(markup).toContain('Theory, notation &amp; print')
    expect(markup).toContain('Example genre')
    expect(markup.indexOf('data-history-event="event:early"'))
      .toBeLessThan(markup.indexOf('data-history-event="event:later"'))
    expect(markup).toContain('aria-label="Jump to an era"')
    expect(markup).toContain('aria-label="Event importance"')
    expect(markup).toContain('All topics')
  })

  describe('history current era tracking', () => {
    let cleanup: ReturnType<Parameters<typeof useEffect>[0]>

    afterEach(() => {
      cleanup?.()
      cleanup = undefined
      vi.unstubAllGlobals()
      vi.clearAllMocks()
    })

    function setup(horizontal: boolean) {
      vi.clearAllMocks()
      const viewport = Object.assign(new EventTarget(), {
        scrollLeft: 0, scrollTop: 0,
        scrollWidth: horizontal ? 1500 : 500, clientWidth: 500,
        scrollHeight: horizontal ? 500 : 1500, clientHeight: 500,
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
      })
      const eras = new Map([
        ['before-1400', { getBoundingClientRect: () => ({
          left: 32 - viewport.scrollLeft, top: 24 - viewport.scrollTop,
        }) }],
        ['1950-1999', { getBoundingClientRect: () => ({
          left: 832 - viewport.scrollLeft, top: 824 - viewport.scrollTop,
        }) }],
      ])
      let resize: ResizeObserverCallback | undefined
      const disconnect = vi.fn()
      vi.stubGlobal('matchMedia', () => ({ matches: horizontal }))
      vi.stubGlobal('ResizeObserver', class {
        constructor(callback: ResizeObserverCallback) { resize = callback }
        observe = vi.fn()
        disconnect = disconnect
      })
      const setCurrent = vi.fn()
      vi.mocked(useRef)
        .mockReturnValueOnce({ current: new Map() })
        .mockReturnValueOnce({ current: eras })
        .mockReturnValueOnce({ current: viewport })
      vi.mocked(useState).mockReturnValueOnce([null, setCurrent])
      renderHistory()
      cleanup = vi.mocked(useEffect).mock.calls[0][0]()
      return { viewport, setCurrent, disconnect, resize: () => resize?.([], {} as ResizeObserver) }
    }

    it.each([true, false])('tracks scrolling in both directions (horizontal: %s)', (horizontal) => {
      const { viewport, setCurrent } = setup(horizontal)
      expect(setCurrent).toHaveBeenLastCalledWith('before-1400')
      if (horizontal) viewport.scrollLeft = 800
      else viewport.scrollTop = 800
      viewport.dispatchEvent(new Event('scroll'))
      expect(setCurrent).toHaveBeenLastCalledWith('1950-1999')
      viewport.scrollLeft = 0
      viewport.scrollTop = 0
      viewport.dispatchEvent(new Event('scroll'))
      expect(setCurrent).toHaveBeenLastCalledWith('before-1400')
    })

    it('activates the final era at the scroll limit even if it cannot align to the start', () => {
      const { viewport, setCurrent } = setup(true)
      viewport.scrollWidth = 1100
      viewport.scrollLeft = 600
      viewport.dispatchEvent(new Event('scroll'))
      expect(setCurrent).toHaveBeenLastCalledWith('1950-1999')
    })

    it('recalculates after layout changes and removes observers and listeners on unmount', () => {
      const { viewport, setCurrent, disconnect, resize } = setup(true)
      viewport.scrollLeft = 800
      resize()
      expect(setCurrent).toHaveBeenLastCalledWith('1950-1999')
      cleanup?.()
      cleanup = undefined
      expect(disconnect).toHaveBeenCalledOnce()
      setCurrent.mockClear()
      viewport.dispatchEvent(new Event('scroll'))
      expect(setCurrent).not.toHaveBeenCalled()
    })
  })

  it('uses a full-width scrollable timeline with a horizontal desktop layout', () => {
    const markup = renderHistory()
    expect(markup).toContain('data-history-scroll')
    expect(markup).toContain('overflow-auto')
    expect(markup).toContain('md:flex md:w-max md:min-w-full')
    expect(markup).not.toContain('max-w-5xl')
  })

  it('alternates events above and below the desktop rail across era boundaries', () => {
    const markup = renderHistory()
    expect(markup).toContain('data-history-event="event:early" data-history-side="above"')
    expect(markup).toContain('data-history-event="event:later" data-history-side="below"')
    expect(markup).toContain('history-track')
    expect(markup).toContain('history-event-card')
  })

  it('restarts alternation with the first visible event after filtering', () => {
    const markup = renderHistory(null, { category: 'media', landmarksOnly: false })
    expect(markup).toContain('data-history-event="event:later" data-history-side="above"')
  })

  it('centers era labels inside fixed-height navigation buttons', () => {
    const markup = renderHistory()
    const navigation = markup.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)?.[0]
    expect(navigation).toBeDefined()
    expect(navigation).toContain('flex h-7 shrink-0 items-center justify-center')
    expect(navigation).toContain('px-1.5')
    expect(navigation).toContain('<span>Before 1400</span>')
    expect(navigation).toContain('<span>1950–1999</span>')
  })

  it('highlights only the first available era initially, including after filtering', () => {
    for (const filters of [DEFAULT_HISTORY_FILTERS, { category: 'media', landmarksOnly: false } as const]) {
      const markup = renderHistory(null, filters)
      const navigation = markup.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/)?.[0]
      expect(navigation?.match(/aria-current="true"/g)).toHaveLength(1)
      expect(navigation).toMatch(/<button[^>]*aria-current="true"[^>]*bg-violet-500\/20[^>]*><span>/)
      expect(navigation).toContain(filters.category === 'media'
        ? '<span>1950–1999</span>' : '<span>Before 1400</span>')
    }
  })

  it('keeps an accessible topic label and styles the selector like the importance group', () => {
    const markup = renderHistory()
    const selector = markup.match(/<label\b[^>]*>[\s\S]*?<\/label>/)?.[0]

    expect(selector).toBeDefined()
    expect(selector).toContain('<span class="sr-only">Topic</span>')
    expect(selector).toMatch(/^<label[^>]*class="[^"]*rounded-full border border-slate-700 bg-slate-900 p-1"/)
    expect(selector).toMatch(/<select[^>]*class="[^"]*appearance-none rounded-full bg-violet-500\/20 py-1.5/)
    expect(selector).toContain('All topics')
    expect(selector).toContain('aria-hidden="true"')
  })

  it('marks the selected event and retains the other events', () => {
    const markup = renderHistory('event:early')
    expect(markup).toMatch(/aria-pressed="true"[^>]*>Early event/)
    expect(markup).toContain('data-history-event="event:later"')
  })

  it('shows only events matching both filters', () => {
    const markup = renderHistory(null, { category: 'publication', landmarksOnly: true })
    expect(markup).toContain('Showing 1 event by start year')
    expect(markup).toContain('data-history-event="event:early"')
    expect(markup).not.toContain('data-history-event="event:later"')
  })

  it('offers to clear filters when there are no matching events', () => {
    const markup = renderHistory(null, { category: 'technology', landmarksOnly: true })
    expect(markup).toContain('Showing 0 events by start year')
    expect(markup).toContain('No events match these filters.')
    expect(markup).toContain('Clear filters')
    expect(markup).not.toContain('aria-label="Jump to an era"')
  })
})
