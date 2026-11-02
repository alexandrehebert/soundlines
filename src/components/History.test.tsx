import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import { DEFAULT_HISTORY_FILTERS, type HistoryFilters } from '../graph/history.ts'
import { createTimelineModel } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import { History } from './History.tsx'

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

function renderHistory(selectedId: string | null = null, filters: HistoryFilters = DEFAULT_HISTORY_FILTERS) {
  const index = buildIndex(graph)
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, 'genre'), view: 'history',
      selectedId, selectNode: vi.fn(), changeView: vi.fn(), order: 'family', changeOrder: vi.fn(),
      genreDisplay: 'bars', changeGenreDisplay: vi.fn(), goHome: vi.fn(),
      historyFilters: filters, changeHistoryFilters: vi.fn(),
      viewRange: [1948, 2026], setViewRange: vi.fn(),
    }}>
      <History />
    </ExplorerContext.Provider>,
  )
}

describe('history view', () => {
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
    expect(navigation).toContain('flex h-8 shrink-0 items-center justify-center')
    expect(navigation).toContain('<span>Before 1400</span>')
    expect(navigation).toContain('<span>1950–1999</span>')
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
