import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { ExplorerContext, useExplorer } from '../../ExplorerContext.ts'
import { DEFAULT_HISTORY_FILTERS } from '../../graph/history.ts'
import { createTimelineModel, defaultViewRange, type ExplorerView } from '../../graph/timeline.ts'
import { History } from '../timeline/History.tsx'
import { Timeline } from '../timeline/Timeline.tsx'

const WIDTH = 1000
const HEIGHT = 720
const PREVIEW_FAMILIES = {
  genre: 'jazz',
  artist: 'blues-soul',
  instrument: 'electronic',
} as const

export const ChronologyPreview = memo(function ChronologyPreview({ view }: { view: ExplorerView }) {
  const explorer = useExplorer()
  const canvasRef = useRef<HTMLDivElement>(null)
  const model = useMemo(
    () => view === 'history' ? explorer.model : createTimelineModel(explorer.index, view),
    [explorer.index, explorer.model, view],
  )
  const viewRange = useMemo(() => defaultViewRange(view === 'history' ? 'genre' : view), [view])
  const context = useMemo(() => ({
    ...explorer,
    view,
    model,
    viewRange,
    selectedId: null,
    order: 'family' as const,
    genreDisplay: 'bars' as const,
    historyFilters: DEFAULT_HISTORY_FILTERS,
  }), [explorer, model, view, viewRange])

  useLayoutEffect(() => {
    if (view !== 'history') return
    const canvas = canvasRef.current
    if (!canvas) return
    const viewport = canvas.querySelector<HTMLElement>('[data-history-scroll]')
    const first = canvas.querySelector<HTMLElement>('.history-era')
    const era = canvas.querySelector<HTMLElement>('[aria-labelledby="history-era-1950-1999"]')
    if (!viewport || !first || !era) return
    const positionPreview = () => {
      viewport.scrollLeft = era.offsetLeft - first.offsetLeft
      viewport.scrollTop = era.offsetTop - first.offsetTop
    }
    positionPreview()
    const observer = new ResizeObserver(positionPreview)
    observer.observe(viewport)
    observer.observe(era)
    return () => observer.disconnect()
  }, [explorer.index, view])

  return (
    <div className="discovery-chronology-window" data-chronology-preview={view} aria-hidden="true" inert>
      <svg className="discovery-chronology-thumbnail" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} focusable="false">
        <foreignObject width={WIDTH} height={HEIGHT}>
          <div ref={canvasRef} className="discovery-chronology-canvas" style={{ width: WIDTH, height: HEIGHT }}>
            <ExplorerContext.Provider value={context}>
              {view === 'history' ? <History /> : <Timeline initialFamily={PREVIEW_FAMILIES[view]} />}
            </ExplorerContext.Provider>
          </div>
        </foreignObject>
      </svg>
    </div>
  )
})
