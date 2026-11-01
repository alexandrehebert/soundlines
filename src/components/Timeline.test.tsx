import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import { TIMELINE_PADDING, timeTicks, yearToX, type GenreOrder } from '../graph/layout.ts'
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
  ],
  edges: [],
}

function renderTimeline(view: TimelineView, genreOrder: GenreOrder, viewRange: [number, number]) {
  const index = buildIndex(graph)
  return renderToStaticMarkup(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, view), view,
      selectedId: null, selectNode: vi.fn(), changeView: vi.fn(),
      genreOrder, changeGenreOrder: vi.fn(), genreDisplay: 'bars', changeGenreDisplay: vi.fn(),
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
