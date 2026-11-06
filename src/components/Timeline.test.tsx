import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import { MAX_YEAR, MIN_YEAR, TIMELINE_PADDING, timeTicks, yearToX, type TimelineOrder } from '../graph/layout.ts'
import { createTimelineModel, type TimelineView } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import { Timeline } from './Timeline.tsx'
import { AXIS_H } from './timeline/geometry.ts'

const viewport = vi.hoisted(() => ({
  width: 800,
  verticalViewport: null as { top: number; bottom: number } | null,
}))
vi.mock('./timeline/useTimelineViewport.ts', () => ({
  useTimelineViewport: () => ({
    containerRef: { current: null }, width: viewport.width, verticalViewport: viewport.verticalViewport,
    select: vi.fn(), handlers: {},
  }),
}))

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:jazz', type: 'genre', name: 'Jazz', family: 'jazz', period: { start: 1900 } },
    { id: 'artist:a', type: 'artist', name: 'Artist', family: 'jazz', period: { start: 1950 } },
    { id: 'artist:later', type: 'artist', name: 'Later', family: 'classical', period: { start: 1980 } },
    { id: 'artist:earlier', type: 'artist', name: 'Earlier', family: 'rock', period: { start: 1900 } },
    { id: 'artist:historical', type: 'artist', name: 'Historical', family: 'classical',
      period: { start: 1700, end: 1750 } },
    { id: 'instrument:guitar', type: 'instrument', name: 'Guitar', family: 'strings', period: { start: 1500 } },
    { id: 'instrument:piano', type: 'instrument', name: 'Piano', family: 'keyboards', period: { start: 1700 } },
    { id: 'instrument:flute', type: 'instrument', name: 'Flute', family: 'winds', period: { start: 1000 } },
  ],
  edges: [
    { id: 'early-link', from: 'artist:historical', to: 'artist:earlier', type: 'influences' },
    { id: 'middle-link', from: 'artist:earlier', to: 'artist:a', type: 'influences' },
    { id: 'late-link', from: 'artist:a', to: 'artist:later', type: 'influences' },
    { id: 'crossing-link', from: 'artist:historical', to: 'artist:later', type: 'influences' },
  ],
}

function renderTimeline(
  view: TimelineView, order: TimelineOrder, viewRange: [number, number], selectedId: string | null = null,
  data: MusicGraph = graph,
) {
  const index = buildIndex(data)
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, view), view,
      selectedId, selectNode: vi.fn(), changeView: vi.fn(),
      order, changeOrder: vi.fn(), genreDisplay: 'bars', changeGenreDisplay: vi.fn(), goHome: vi.fn(), isHome: false,
      historyFilters: { category: 'all', landmarksOnly: false }, changeHistoryFilters: vi.fn(),
      viewRange, setViewRange: vi.fn(),
    }}>
      <Timeline />
    </ExplorerContext.Provider>,
  )
}

beforeEach(() => {
  viewport.width = 800
  viewport.verticalViewport = null
})

describe('timeline viewport rendering', () => {
  it.each([
    ['genre', 'jazz', 'genres'],
    ['artist', 'jazz', 'artists'],
    ['instrument', 'strings', 'instruments'],
  ] as const)('shows selectable undated %s entries outside the plotted bars', (view, family, label) => {
    const id = `${view}:undated`
    const data: MusicGraph = {
      ...graph,
      nodes: [...graph.nodes, { id, type: view, name: 'Undated example', family, period: null }],
    }
    const markup = renderTimeline(view, 'family', [1700, 2026], id, data)
    expect(markup).toContain(`aria-label="Undated ${label}"`)
    expect(markup).toContain(`data-undated-node="${id}"`)
    expect(markup).toMatch(new RegExp(`data-undated-node="${id}" aria-pressed="true"`))
    expect(markup).not.toContain(`data-timeline-bar="${id}"`)
    expect(markup).toContain('Undated example')
  })

  it('does not add an undated section when every entry has a period', () => {
    expect(renderTimeline('genre', 'family', [1700, 2026])).not.toContain('aria-label="Undated genres"')
  })

  it.each(['family', 'oldest-first'] as const)('shows instrument icons in %s order only', (order) => {
    const instruments = renderTimeline('instrument', order, [500, 2026])
    expect(instruments.match(/data-instrument-icon=/g)).toHaveLength(3)
    expect(instruments).toContain('instrument-icons/guitar.svg')
    expect(instruments).toContain('instrument-icons/piano.svg')
    expect(instruments).toContain('instrument-icons/flute.svg')
    expect(renderTimeline('genre', order, [500, 2026])).not.toContain('data-instrument-icon=')
    expect(renderTimeline('artist', order, [500, 2026])).not.toContain('data-instrument-icon=')
  })

  it('plots estimated entries normally and explains the soft edges', () => {
    const data: MusicGraph = {
      ...graph,
      nodes: graph.nodes.map((node) => node.id === 'genre:jazz'
        ? { ...node, period: { start: 1900, estimated: true } } : node),
    }
    const markup = renderTimeline('genre', 'oldest-first', [1700, 2026], 'genre:jazz', data)
    expect(markup).toContain('data-timeline-bar="genre:jazz"')
    expect(markup).toContain('data-estimated-period="true"')
    expect(markup).not.toContain('Soft edges indicate estimated dates')
    expect(markup).not.toContain('data-undated-node')
  })

  it('only renders nearby row details while retaining every keyboard target', () => {
    viewport.verticalViewport = { top: 50, bottom: 80 }
    const markup = renderTimeline('artist', 'oldest-first', [1700, 2026])
    expect(markup.match(/data-timeline-bar=/g)).toHaveLength(4)
    expect(markup.match(/role="button" tabindex="0"/g)).toHaveLength(4)
    expect([...markup.matchAll(/data-label-measure="([^"]+)"/g)].map((match) => match[1]))
      .toEqual(['artist:historical'])

    const selected = renderTimeline('artist', 'oldest-first', [1700, 2026], 'artist:later')
    expect(selected).toContain('data-label-measure="artist:later"')
  })

  it('retains links crossing the viewport even when both endpoint rows are outside', () => {
    viewport.verticalViewport = { top: 132, bottom: 145 }
    const markup = renderTimeline('artist', 'oldest-first', [1700, 2026])
    expect(markup).not.toContain('data-timeline-link="early-link"')
    expect(markup).toContain('data-timeline-link="middle-link"')
    expect(markup).toContain('data-timeline-link="late-link"')
    expect(markup).toContain('data-timeline-link="crossing-link"')

    viewport.verticalViewport = { top: -100, bottom: -50 }
    expect(renderTimeline('artist', 'oldest-first', [1700, 2026])).not.toContain('data-timeline-link=')
  })
})

describe('timeline year axis', () => {
  it.each([
    ['genre', 'family'],
    ['genre', 'oldest-first'],
    ['artist', 'family'],
    ['artist', 'oldest-first'],
    ['instrument', 'family'],
    ['instrument', 'oldest-first'],
  ] as const)('keeps the %s %s axis aligned with the grid', (view, order) => {
    const viewRange: [number, number] = [1700, 2026]
    const markup = renderTimeline(view, order, viewRange)
    const axisStart = markup.indexOf('data-timeline-axis=')
    const plotStart = markup.indexOf('data-timeline-plot=')
    const axis = markup.slice(axisStart, plotStart)
    const plot = markup.slice(plotStart)
    const axisTicks = [...axis.matchAll(/data-year-tick="(\d+)"><line x1="([^"]+)"/g)]
      .map((match) => [Number(match[1]), Number(match[2])])
    const gridTicks = [...plot.matchAll(/data-year-grid="(\d+)" x1="([^"]+)"/g)]
      .map((match) => [Number(match[1]), Number(match[2])])
    const scale = { start: viewRange[0], end: viewRange[1], width: viewport.width, padding: TIMELINE_PADDING }

    expect(markup).toContain(`scroll-padding-top:${AXIS_H}px`)
    expect(markup).toContain('class="timeline-axis sticky top-0 z-10"')
    expect(axis).toContain(`margin-bottom:-${AXIS_H}px`)
    expect(axisTicks).toEqual(timeTicks(scale, 56).map((year) => [year, yearToX(scale, year)]))
    expect(gridTicks).toEqual(axisTicks)
    expect(axis).toContain('time ×2 compressed')
    expect(plot).not.toContain('time ×2 compressed')
  })

  it('spaces BCE axis labels and keeps their grid lines aligned when zoomed out', () => {
    viewport.width = 900
    const markup = renderTimeline('instrument', 'family', [MIN_YEAR, MAX_YEAR])
    const axisStart = markup.indexOf('data-timeline-axis=')
    const plotStart = markup.indexOf('data-timeline-plot=')
    const axisTicks = [...markup.slice(axisStart, plotStart).matchAll(/data-year-tick="(-?\d+)"><line x1="([^"]+)"/g)]
      .map((match) => [Number(match[1]), Number(match[2])])
    const gridTicks = [...markup.slice(plotStart).matchAll(/data-year-grid="(-?\d+)" x1="([^"]+)"/g)]
      .map((match) => [Number(match[1]), Number(match[2])])

    expect(markup).toContain('3000 BCE')
    expect(axisTicks.some(([year]) => year < 0)).toBe(true)
    expect(gridTicks).toEqual(axisTicks)
    for (let i = 1; i < axisTicks.length; i++) {
      expect(axisTicks[i][1] - axisTicks[i - 1][1]).toBeGreaterThanOrEqual(64 - 1e-6)
    }
  })

  it('updates the shared ticks for narrow viewports and different time ranges', () => {
    viewport.width = 360
    const viewRange: [number, number] = [1948, 2026]
    const markup = renderTimeline('genre', 'family', viewRange)
    const axisStart = markup.indexOf('data-timeline-axis=')
    const plotStart = markup.indexOf('data-timeline-plot=')
    const axis = markup.slice(axisStart, plotStart)
    const plot = markup.slice(plotStart)
    const axisTicks = [...axis.matchAll(/data-year-tick="(\d+)"><line x1="([^"]+)"/g)]
      .map((match) => [Number(match[1]), Number(match[2])])
    const gridTicks = [...plot.matchAll(/data-year-grid="(\d+)" x1="([^"]+)"/g)]
      .map((match) => [Number(match[1]), Number(match[2])])
    const scale = { start: viewRange[0], end: viewRange[1], width: viewport.width, padding: TIMELINE_PADDING }

    expect(axisTicks).toEqual(timeTicks(scale, 96).map((year) => [year, yearToX(scale, year)]))
    expect(gridTicks).toEqual(axisTicks)
    expect(axis).not.toContain('compressed')
  })
})

describe('timeline ordering', () => {
  it.each([
    ['artist', ['artist:historical', 'artist:later', 'artist:a', 'artist:earlier'],
      ['artist:historical', 'artist:earlier', 'artist:a', 'artist:later']],
    ['instrument', ['instrument:guitar', 'instrument:piano', 'instrument:flute'],
      ['instrument:flute', 'instrument:guitar', 'instrument:piano']],
  ] as const)('renders %s family and chronological layouts', (view, groupedIds, sortedIds) => {
    const ids = (markup: string) => [...markup.matchAll(/data-timeline-bar="([^"]+)"/g)].map((match) => match[1])
    const grouped = renderTimeline(view, 'family', [500, 2026])
    const sorted = renderTimeline(view, 'oldest-first', [500, 2026])
    expect(grouped).toContain('data-timeline-order="family"')
    expect(sorted).toContain('data-timeline-order="oldest-first"')
    expect(ids(grouped)).toEqual(groupedIds)
    expect(ids(sorted)).toEqual(sortedIds)
  })

  it('shows off-screen artist navigation only in chronological order', () => {
    const grouped = renderTimeline('artist', 'family', [1948, 2026])
    const sorted = renderTimeline('artist', 'oldest-first', [1948, 2026])
    expect(grouped).not.toContain('data-offscreen-indicator="artist:historical"')
    expect(sorted).toContain('data-offscreen-indicator="artist:historical"')
    expect(sorted).toContain('Historical · off-screen to the left; activate to reveal')
  })
})
