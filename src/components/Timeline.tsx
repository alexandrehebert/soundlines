import { useEffect, useMemo, useRef, useState } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import { lineage } from '../graph/graph.ts'
import { ERA_SEGMENTS, MAX_YEAR, timeTicks, yearToX, type TimeScale } from '../graph/layout.ts'
import { AXIS_H, BAR_H, positionTimeline } from './timeline/geometry.ts'
import { TimelineBar } from './timeline/TimelineBar.tsx'
import { TimelineLinks } from './timeline/TimelineLinks.tsx'
import { useTimelineViewport } from './timeline/useTimelineViewport.ts'

export function Timeline() {
  const { model, view, selectedId, viewRange } = useExplorer()
  const { containerRef, width, select, handlers } = useTimelineViewport()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const lastRevealedId = useRef<string | null>(null)
  const scale = useMemo<TimeScale>(() => ({
    start: viewRange[0], end: viewRange[1], width,
  }), [viewRange, width])
  const { bars, bands, height } = useMemo(() => positionTimeline(model.lanes, scale), [model, scale])
  const barById = useMemo(() => new Map(bars.map((bar) => [bar.node.id, bar])), [bars])
  const focusId = hoveredId ?? selectedId
  const highlight = useMemo(() => {
    if (!focusId || !model.index.nodeById.has(focusId)) return null
    const result = lineage(model.index, focusId, model.orientation)
    return {
      nodes: new Set([focusId, ...result.ancestors, ...result.descendants]),
      edges: result.edges,
    }
  }, [focusId, model])

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
      data-timeline-view={view}>
      {width > 0 && (
        <svg width={width} height={height} {...handlers}>
          {ERA_SEGMENTS.map((segment, i) => {
            if (segment.weight >= 1) return null
            const segmentEnd = ERA_SEGMENTS[i + 1]?.from ?? MAX_YEAR
            if (segmentEnd <= scale.start || segment.from >= scale.end) return null
            const x1 = Math.max(0, yearToX(scale, segment.from))
            const x2 = Math.min(width, yearToX(scale, segmentEnd))
            return (
              <g key={segment.from} pointerEvents="none">
                <rect x={x1} y={0} width={x2 - x1} height={height} fill="#94a3b8" opacity={0.025 + (1 - segment.weight) * 0.03} />
                <line x1={x2} y1={0} x2={x2} y2={height} stroke="#475569" strokeDasharray="2 4" />
                {x2 - x1 > 90 && (
                  <text x={x2 - 6} y={34} textAnchor="end" fill="#64748b" fontSize={9} fontStyle="italic">
                    time ×{Math.round(1 / segment.weight)} compressed
                  </text>
                )}
              </g>
            )
          })}
          {timeTicks(scale).map((year) => {
            const x = yearToX(scale, year)
            return (
              <g key={year}>
                <line x1={x} y1={AXIS_H - 8} x2={x} y2={height} stroke="#1e293b" strokeWidth={1} />
                <text x={x + 5} y={20} fill="#64748b" fontSize={11} fontWeight={600}>{year}</text>
              </g>
            )
          })}
          {bands.map((band) => (
            <g key={band.family}>
              <rect x={0} y={band.top} width={width} height={band.height} fill={band.color} opacity={0.04} />
              <text x={10} y={band.top + 16} fill={band.color} fontSize={11}
                fontWeight={700} letterSpacing="0.12em" opacity={0.8}>
                {band.label.toUpperCase()}
              </text>
            </g>
          ))}
          <TimelineLinks barById={barById} scale={scale} highlightedEdges={highlight?.edges ?? null} />
          {bars.map((bar) => (
            <TimelineBar key={bar.node.id} bar={bar} scale={scale}
              dimmed={highlight !== null && !highlight.nodes.has(bar.node.id)}
              onHover={setHoveredId} onSelect={select} />
          ))}
        </svg>
      )}
    </div>
  )
}
