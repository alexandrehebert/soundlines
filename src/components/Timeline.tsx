import { useEffect, useMemo, useRef, useState } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import { lineageHighlight } from '../graph/graph.ts'
import { ERA_SEGMENTS, MAX_YEAR, TIMELINE_PADDING, timeTicks, yearToX, type TimeScale } from '../graph/layout.ts'
import { AXIS_H, BAR_H, offscreenIndicators, positionTimeline } from './timeline/geometry.ts'
import { TimelineBar } from './timeline/TimelineBar.tsx'
import { TimelineLinks } from './timeline/TimelineLinks.tsx'
import { useTimelineViewport } from './timeline/useTimelineViewport.ts'

export function Timeline() {
  const { model, view, selectedId, viewRange, genreOrder } = useExplorer()
  const order = view === 'genre' ? genreOrder : 'family'
  const { containerRef, width, select, handlers } = useTimelineViewport()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const lastRevealedId = useRef<string | null>(null)
  const scale = useMemo<TimeScale>(() => ({
    start: viewRange[0], end: viewRange[1], width, padding: TIMELINE_PADDING,
  }), [viewRange, width])
  const tickSpacing = width < 360 ? 100 : width < 480 ? 96 : width < 768 ? 72 : 56
  const compressionLabelMinWidth = width < 480 ? 128 : 90
  const { bars, bands, height } = useMemo(
    () => positionTimeline(model.lanes, scale, order), [model, scale, order],
  )
  const barById = useMemo(() => new Map(bars.map((bar) => [bar.node.id, bar])), [bars])
  const barsByRow = useMemo(() => {
    const rows = new Map<number, typeof bars>()
    for (const bar of bars) {
      const row = rows.get(bar.yCenter) ?? []
      row.push(bar)
      rows.set(bar.yCenter, row)
    }
    return rows
  }, [bars])
  const indicators = useMemo(() => offscreenIndicators(bars, width), [bars, width])
  const focusId = hoveredId ?? selectedId
  const highlight = useMemo(
    () => lineageHighlight(model.index, focusId, model.orientation), [focusId, model],
  )

  useEffect(() => {
    if (!width || lastRevealedId.current === selectedId) return
    lastRevealedId.current = selectedId
    const element = containerRef.current
    const bar = selectedId ? barById.get(selectedId) : undefined
    if (!element || !bar) return
    const top = bar.yCenter - BAR_H / 2
    if (top < element.scrollTop || top + BAR_H > element.scrollTop + element.clientHeight) {
      element.scrollTop = Math.max(0, top - element.clientHeight / 3)
    }
  }, [selectedId, barById, containerRef, width])

  return (
    <div ref={containerRef} className="timeline-surface h-full w-full overflow-y-auto"
      role="region" aria-label={`${view === 'artist' ? 'Artist' : 'Genre'} timeline`}
      data-timeline-view={view} data-timeline-order={order}>
      {width > 0 && (
        <svg width={width} height={height} {...handlers}>
          {ERA_SEGMENTS.map((segment, i) => {
            if (segment.weight >= 1) return null
            const segmentEnd = ERA_SEGMENTS[i + 1]?.from ?? MAX_YEAR
            if (segmentEnd <= scale.start || segment.from >= scale.end) return null
            const x1 = segment.from <= scale.start ? 0 : Math.max(0, yearToX(scale, segment.from))
            const x2 = segmentEnd >= scale.end ? width : Math.min(width, yearToX(scale, segmentEnd))
            return (
              <g key={segment.from} pointerEvents="none">
                <rect x={x1} y={0} width={x2 - x1} height={height} fill="#94a3b8" opacity={0.025 + (1 - segment.weight) * 0.03} />
                <line x1={x2} y1={0} x2={x2} y2={height} stroke="#475569" strokeDasharray="2 4" />
                {x2 - x1 > compressionLabelMinWidth && (
                  <text x={x2 - 6} y={34} textAnchor="end" fill="#64748b" fontSize={9} fontStyle="italic">
                    time ×{Math.round(1 / segment.weight)} compressed
                  </text>
                )}
              </g>
            )
          })}
          {timeTicks(scale, tickSpacing).map((year) => {
            const x = yearToX(scale, year)
            return (
              <g key={year}>
                <line x1={x} y1={AXIS_H - 8} x2={x} y2={height} stroke="#1e293b" strokeWidth={1} />
                <text x={x + 5} y={20} fill="#64748b" fontSize={width < 480 ? 10 : 11} fontWeight={600}>{year}</text>
              </g>
            )
          })}
          {bands.map((band) => (
            <g key={band.family}>
              <rect x={0} y={band.top} width={width} height={band.height} fill={band.color} opacity={0.04} />
              <text x={TIMELINE_PADDING + 10} y={band.top + 16} fill={band.color} fontSize={11}
                fontWeight={700} letterSpacing="0.12em" opacity={0.8}>
                {band.label.toUpperCase()}
              </text>
            </g>
          ))}
          <TimelineLinks barById={barById} scale={scale} highlightedEdges={highlight?.edges ?? null} />
          {bars.map((bar) => (
            <TimelineBar key={bar.node.id} bar={bar} scale={scale}
              rowBars={barsByRow.get(bar.yCenter)}
              indicator={indicators.get(bar.node.id)}
              dimmed={highlight !== null && !highlight.nodes.has(bar.node.id)}
              onHover={setHoveredId} onSelect={select} />
          ))}
        </svg>
      )}
    </div>
  )
}
