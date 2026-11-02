import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import { TIMELINE_PADDING, timeTicks, yearToX, type TimelineOrder } from '../graph/layout.ts'
import { createTimelineModel, type TimelineView } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import { Timeline } from './Timeline.tsx'
import { AXIS_H } from './timeline/geometry.ts'

const viewport = vi.hoisted(() => ({ width: 800 }))
vi.mock('./timeline/useTimelineViewport.ts', () => ({
  useTimelineViewport: () => ({
    containerRef: { current: null }, width: viewport.width, select: vi.fn(), handlers: {},
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
  edges: [],
}

function renderTimeline(view: TimelineView, order: TimelineOrder, viewRange: [number, number]) {
  const index = buildIndex(graph)
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, view), view,
      selectedId: null, selectNode: vi.fn(), changeView: vi.fn(),
      order, changeOrder: vi.fn(), genreDisplay: 'bars', changeGenreDisplay: vi.fn(),
      viewRange, setViewRange: vi.fn(),
    }}>
      <Timeline />
    </ExplorerContext.Provider>,
  )
}

describe('timeline year axis', () => {
  beforeEach(() => { viewport.width = 800 })

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
