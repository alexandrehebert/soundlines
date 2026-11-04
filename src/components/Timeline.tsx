import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import { lineageHighlight } from '../graph/graph.ts'
import { ERA_SEGMENTS, MAX_YEAR, TIMELINE_PADDING, timeTicks, yearToX, type TimeScale } from '../graph/layout.ts'
import { VIEW_LABELS } from '../graph/timeline.ts'
import { formatYear } from '../theme.ts'
import { AXIS_H, offscreenIndicators, positionRowLabels, positionTimeline, revealBarScrollTop, type BarLabel } from './timeline/geometry.ts'
import { TimelineBar } from './timeline/TimelineBar.tsx'
import { TimelineLinks } from './timeline/TimelineLinks.tsx'
import { afterSvgLayout } from './timeline/svgLayout.ts'
import { useTimelineViewport } from './timeline/useTimelineViewport.ts'
import { UndatedEntries } from './UndatedEntries.tsx'

export function Timeline() {
  const { model, selectedId, selectNode, viewRange, order } = useExplorer()
  const view = model.view
  const { containerRef, width, verticalViewport, select, handlers } = useTimelineViewport()
  const [labelWidths, setLabelWidths] = useState<Map<string, { name: string; weight: string; width: number }>>(() => new Map())
  const lastRevealedId = useRef<string | null>(null)
  const plotRef = useRef<SVGSVGElement>(null)
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
  const measuredWidths = useMemo(() => {
    const normal = new Map<string, number>()
    const indicators = new Map<string, number>()
    for (const [id, value] of labelWidths) {
      const target = value.weight === '700' ? normal : indicators
      target.set(id, value.width)
    }
    return { normal, indicators }
  }, [labelWidths])
  const labelPositions = useMemo(() => {
    const positions = new Map<string, BarLabel>()
    for (const row of barsByRow.values()) {
      for (const [id, label] of positionRowLabels(row, width, measuredWidths.normal)) positions.set(id, label)
    }
    return positions
  }, [barsByRow, measuredWidths.normal, width])
  const indicators = useMemo(
    () => offscreenIndicators(bars, width, {
      includeArtists: view === 'artist' && order === 'oldest-first',
      indicatorLabelWidths: measuredWidths.indicators,
      visibleLabels: labelPositions,
      visibleLabelWidths: measuredWidths.normal,
    }),
    [bars, width, view, order, measuredWidths.indicators, measuredWidths.normal, labelPositions],
  )
  const highlight = useMemo(
    () => lineageHighlight(model.index, selectedId, model.orientation), [selectedId, model],
  )
  const ticks = timeTicks(scale, tickSpacing).map((year) => ({ year, x: yearToX(scale, year) }))
  const compressedSegments = ERA_SEGMENTS.flatMap((segment, i) => {
    if (segment.weight >= 1) return []
    const segmentEnd = ERA_SEGMENTS[i + 1]?.from ?? MAX_YEAR
    if (segmentEnd <= scale.start || segment.from >= scale.end) return []
    const x1 = segment.from <= scale.start ? 0 : Math.max(0, yearToX(scale, segment.from))
    const x2 = segmentEnd >= scale.end ? width : Math.min(width, yearToX(scale, segmentEnd))
    return [{ ...segment, x1, x2 }]
  })

  useLayoutEffect(() => {
    const plot = plotRef.current
    if (!plot) return
    return afterSvgLayout(plot, () => {
      let updated: Map<string, { name: string; weight: string; width: number }> | undefined
      for (const text of plot.querySelectorAll<SVGTextElement>('[data-label-measure]')) {
        const id = text.getAttribute('data-label-measure')
        const name = text.textContent?.slice(0, -1)
        const weight = text.getAttribute('data-label-weight')
        const previous = id ? labelWidths.get(id) : undefined
        if (!id || name === undefined || !weight || (previous?.name === name && previous.weight === weight)) continue
        updated ??= new Map(labelWidths)
        updated.set(id, { name, weight, width: name.length ? text.getSubStringLength(0, name.length) : 0 })
      }
      if (updated) {
        // SVG text widths are only available after the plot has rendered.
        // oxlint-disable-next-line react/set-state-in-effect
        setLabelWidths(updated)
      }
    })
  }, [bars, labelWidths, verticalViewport])

  useEffect(() => {
    if (!width || lastRevealedId.current === selectedId) return
    lastRevealedId.current = selectedId
    const element = containerRef.current
    const bar = selectedId ? barById.get(selectedId) : undefined
    if (!element || !bar) return
    element.scrollTop = revealBarScrollTop(bar.yCenter, element.scrollTop, element.clientHeight)
  }, [selectedId, barById, containerRef, width])

  const timelineSurface = (
    <div ref={containerRef} className="timeline-surface min-h-0 w-full flex-1 overflow-y-auto"
      role="region" aria-label={`${VIEW_LABELS[view]} timeline`}
      onFocusCapture={(event) => {
        if (!(event.target instanceof Element)) return
        const id = event.target.closest('[data-timeline-bar]')?.getAttribute('data-timeline-bar')
        const bar = id ? barById.get(id) : undefined
        if (bar) {
          event.currentTarget.scrollTop = revealBarScrollTop(
            bar.yCenter, event.currentTarget.scrollTop, event.currentTarget.clientHeight,
          )
        }
      }}
      data-timeline-view={view} data-timeline-order={order} style={{ scrollPaddingTop: AXIS_H }}>
      {width > 0 && (
        <>
          <div className="timeline-axis sticky top-0 z-10" data-timeline-axis="" style={{ marginBottom: -AXIS_H }}>
            <svg className="block" width={width} height={AXIS_H} {...handlers}>
              <rect width={width} height={AXIS_H} fill="transparent" />
              {compressedSegments.map((segment) => (
                <g key={segment.from} pointerEvents="none">
                  <rect x={segment.x1} y={0} width={segment.x2 - segment.x1} height={AXIS_H}
                    fill="#94a3b8" opacity={0.025 + (1 - segment.weight) * 0.03} />
                  <line x1={segment.x2} y1={0} x2={segment.x2} y2={AXIS_H}
                    stroke="#475569" strokeDasharray="2 4" />
                </g>
              ))}
              {ticks.map(({ year, x }) => (
                <g key={year} data-year-tick={year}>
                  <line x1={x} y1={AXIS_H - 8} x2={x} y2={AXIS_H} stroke="#1e293b" strokeWidth={1} />
                  <text x={x + 5} y={18} fill="#94a3b8" fontSize={width < 480 ? 10 : 11} fontWeight={600}>
                    {formatYear(year)}
                  </text>
                </g>
              ))}
              {compressedSegments.map((segment) => segment.x2 - segment.x1 > compressionLabelMinWidth && (
                <text key={segment.from} x={segment.x2 - 6} y={34} textAnchor="end" fill="#64748b"
                  fontSize={9} fontStyle="italic" pointerEvents="none">
                  time ×{Math.round(1 / segment.weight)} compressed
                </text>
              ))}
            </svg>
          </div>
          <svg ref={plotRef} width={width} height={height} data-timeline-plot="" {...handlers}>
            {compressedSegments.map((segment) => (
              <g key={segment.from} pointerEvents="none">
                <rect x={segment.x1} y={0} width={segment.x2 - segment.x1} height={height}
                  fill="#94a3b8" opacity={0.025 + (1 - segment.weight) * 0.03} />
                <line x1={segment.x2} y1={0} x2={segment.x2} y2={height} stroke="#475569" strokeDasharray="2 4" />
              </g>
            ))}
            {ticks.map(({ year, x }) => (
              <line key={year} data-year-grid={year} x1={x} y1={AXIS_H - 8}
                x2={x} y2={height} stroke="#1e293b" strokeWidth={1} />
            ))}
            {bands.map((band) => (
              <g key={band.family}>
                <rect x={0} y={band.top} width={width} height={band.height} fill={band.color} opacity={0.04} />
                <text x={TIMELINE_PADDING + 10} y={band.top + 16} fill={band.color} fontSize={11}
                  fontWeight={700} letterSpacing="0.12em" opacity={0.8}>
                  {band.label.toUpperCase()}
                </text>
              </g>
            ))}
            <TimelineLinks barById={barById} scale={scale} highlightedEdges={highlight?.edges ?? null}
              verticalViewport={verticalViewport} />
            {bars.map((bar) => (
              <TimelineBar key={bar.node.id} bar={bar} scale={scale}
                rowBars={barsByRow.get(bar.yCenter)}
                placement={labelPositions.get(bar.node.id) ?? null}
                indicator={indicators.get(bar.node.id)}
                renderDetails={!verticalViewport || bar.node.id === selectedId
                  || (bar.yCenter >= verticalViewport.top && bar.yCenter <= verticalViewport.bottom)}
                dimmed={highlight !== null && !highlight.nodes.has(bar.node.id)}
                onSelect={select} />
            ))}
          </svg>
        </>
      )}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <UndatedEntries label={`${view}s`} nodes={model.undated} selectedId={selectedId}
        highlightedIds={highlight?.nodes} onSelect={selectNode} />
      {timelineSurface}
    </div>
  )
}
