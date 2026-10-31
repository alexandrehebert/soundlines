import { useEffect, useMemo, useRef, useState } from 'react'
import {
  lineage,
  lineageSource,
  lineageTarget,
  type GraphIndex,
} from '../graph/graph.ts'
import {
  CURRENT_YEAR,
  decadeTicks,
  layoutFamilies,
  panRange,
  xToYear,
  yearToX,
  zoomRange,
  type TimeScale,
} from '../graph/layout.ts'
import { FAMILY_LABELS, type GraphNode, type MusicGraph } from '../graph/types.ts'
import { FAMILY_COLORS, LINEAGE_EDGE_COLORS } from '../theme.ts'

const AXIS_H = 34
const LANE_HEADER = 24
const ROW_H = 36
const BAR_H = 22
const LANE_GAP = 14
const PAD_BOTTOM = 16

export const MIN_YEAR = 1948
export const MAX_YEAR = CURRENT_YEAR + 2

interface BarPosition {
  node: GraphNode
  x1: number
  x2: number
  yCenter: number
  color: string
}

interface TimelineProps {
  graph: MusicGraph
  index: GraphIndex
  selectedId: string | null
  onSelect: (id: string | null) => void
  showArtists: boolean
  viewRange: [number, number]
  onViewRangeChange: (range: [number, number]) => void
}

export function Timeline({
  graph,
  index,
  selectedId,
  onSelect,
  showArtists,
  viewRange,
  onViewRangeChange,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const scale: TimeScale = { start: viewRange[0], end: viewRange[1], width }

  const lanes = useMemo(() => layoutFamilies(graph), [graph])

  const { bars, laneBands, totalHeight } = useMemo(() => {
    const barList: BarPosition[] = []
    const bands: { family: string; label: string; top: number; height: number; color: string }[] = []
    let y = AXIS_H
    for (const lane of lanes) {
      const laneHeight = LANE_HEADER + lane.rowCount * ROW_H
      bands.push({
        family: lane.family,
        label: FAMILY_LABELS[lane.family],
        top: y,
        height: laneHeight,
        color: FAMILY_COLORS[lane.family],
      })
      for (const bar of lane.bars) {
        const rowTop = y + LANE_HEADER + bar.row * ROW_H
        barList.push({
          node: bar.node,
          x1: yearToX(scale, bar.start),
          x2: yearToX(scale, bar.end),
          yCenter: rowTop + ROW_H / 2,
          color: FAMILY_COLORS[lane.family],
        })
      }
      y += laneHeight + LANE_GAP
    }
    return { bars: barList, laneBands: bands, totalHeight: y - LANE_GAP + PAD_BOTTOM }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lanes, viewRange, width])

  const barById = useMemo(() => {
    const map = new Map<string, BarPosition>()
    for (const bar of bars) map.set(bar.node.id, bar)
    return map
  }, [bars])

  const focusId = hoveredId ?? selectedId
  const highlight = useMemo(() => {
    if (!focusId || !index.nodeById.has(focusId)) return null
    const result = lineage(index, focusId)
    const nodes = new Set([focusId, ...result.ancestors, ...result.descendants])
    return { nodes, edges: result.edges }
  }, [focusId, index])

  // Zoom with a non-passive wheel listener so preventDefault works.
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const focusYear = xToYear(
        { start: viewRange[0], end: viewRange[1], width: rect.width },
        event.clientX - rect.left,
      )
      const factor = event.deltaY > 0 ? 1.12 : 0.89
      onViewRangeChange(
        zoomRange(viewRange[0], viewRange[1], focusYear, factor, MIN_YEAR, MAX_YEAR),
      )
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [viewRange, onViewRangeChange])

  const drag = useRef<{ startX: number; range: [number, number]; moved: boolean } | null>(null)

  const onPointerDown = (event: React.PointerEvent) => {
    drag.current = { startX: event.clientX, range: viewRange, moved: false }
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current || width === 0) return
    const dx = event.clientX - drag.current.startX
    if (Math.abs(dx) > 3) drag.current.moved = true
    if (!drag.current.moved) return
    const [start, end] = drag.current.range
    const deltaYears = (-dx / width) * (end - start)
    onViewRangeChange(panRange(start, end, deltaYears, MIN_YEAR, MAX_YEAR))
  }

  const onPointerUp = () => {
    const moved = drag.current?.moved ?? false
    drag.current = null
    if (!moved) setHoveredId(null)
  }

  const onBackgroundClick = () => {
    if (!drag.current?.moved) onSelect(null)
  }

  const artistMarkers = useMemo(() => {
    if (!showArtists) return []
    const markers: { id: string; name: string; x: number; y: number; color: string }[] = []
    const lastXByGenre = new Map<string, number>()
    const keyArtistEdges = graph.edges
      .filter((edge) => edge.type === 'key_artist_of')
      .sort((a, b) => {
        const nodeA = index.nodeById.get(a.from)
        const nodeB = index.nodeById.get(b.from)
        return (nodeA?.period?.start ?? 0) - (nodeB?.period?.start ?? 0)
      })
    for (const edge of keyArtistEdges) {
      const bar = barById.get(edge.to)
      const artist = index.nodeById.get(edge.from)
      if (!bar || !artist) continue
      const rawX = yearToX(scale, artist.period?.start ?? scale.start)
      let x = Math.min(Math.max(rawX, bar.x1 + 8), bar.x2 - 8)
      const lastX = lastXByGenre.get(edge.to)
      if (lastX !== undefined && x < lastX + 12) x = lastX + 12
      lastXByGenre.set(edge.to, x)
      markers.push({ id: artist.id, name: artist.name, x, y: bar.yCenter + BAR_H / 2 - 2, color: bar.color })
    }
    return markers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArtists, graph, index, barById, viewRange, width])

  const dimmed = (id: string) => highlight !== null && !highlight.nodes.has(id)

  return (
    <div ref={containerRef} className="timeline-surface h-full w-full overflow-y-auto">
      {width > 0 && (
        <svg
          width={width}
          height={totalHeight}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={onBackgroundClick}
        >
          {/* decade grid */}
          {decadeTicks(scale).map((year) => {
            const x = yearToX(scale, year)
            return (
              <g key={year}>
                <line x1={x} y1={AXIS_H - 8} x2={x} y2={totalHeight} stroke="#1e293b" strokeWidth={1} />
                <text x={x + 5} y={20} fill="#64748b" fontSize={11} fontWeight={600}>
                  {year}
                </text>
              </g>
            )
          })}

          {/* family lane bands */}
          {laneBands.map((band) => (
            <g key={band.family}>
              <rect x={0} y={band.top} width={width} height={band.height} fill={band.color} opacity={0.04} />
              <text
                x={10}
                y={band.top + 16}
                fill={band.color}
                fontSize={11}
                fontWeight={700}
                letterSpacing="0.12em"
                opacity={0.8}
              >
                {band.label.toUpperCase()}
              </text>
            </g>
          ))}

          {/* lineage edges between genre bars */}
          {graph.edges.map((edge) => {
            const sourceId = lineageSource(edge)
            const targetId = lineageTarget(edge)
            if (!sourceId || !targetId) return null
            const parent = barById.get(sourceId)
            const child = barById.get(targetId)
            if (!parent || !child) return null
            // Leave the parent bar's edge a bit before the child's start year
            // so the curve has horizontal room instead of dropping straight down.
            const goingDown = child.yCenter >= parent.yCenter
            const y0 = parent.yCenter + (goingDown ? BAR_H / 2 : -BAR_H / 2)
            const y1 = child.yCenter
            const lead = Math.min(Math.max(Math.abs(y1 - y0) * 0.35, 30), 90)
            const minX = parent.x1 + 14
            const maxX = parent.x2 - 6
            const anchorX =
              maxX < minX
                ? (parent.x1 + parent.x2) / 2
                : Math.min(Math.max(child.x1 - lead, minX), maxX)
            const endX = child.x1 + 1
            const isLit = highlight?.edges.has(edge.id) ?? false
            const opacity = highlight ? (isLit ? 0.9 : 0.08) : 0.3
            return (
              <path
                key={edge.id}
                d={`M ${anchorX} ${y0} C ${anchorX} ${(y0 + y1) / 2}, ${(anchorX + endX) / 2} ${y1}, ${endX} ${y1}`}
                fill="none"
                stroke={LINEAGE_EDGE_COLORS[edge.type] ?? '#64748b'}
                strokeWidth={isLit ? 2 : 1.2}
                opacity={opacity}
                pointerEvents="none"
              />
            )
          })}

          {/* genre bars */}
          {bars.map((bar) => {
            const barWidth = Math.max(bar.x2 - bar.x1, 6)
            const isSelected = bar.node.id === selectedId
            return (
              <g
                key={bar.node.id}
                opacity={dimmed(bar.node.id) ? 0.2 : 1}
                style={{ cursor: 'pointer', transition: 'opacity 150ms' }}
                onPointerEnter={() => setHoveredId(bar.node.id)}
                onPointerLeave={() => setHoveredId(null)}
                onClick={(event) => {
                  event.stopPropagation()
                  if (!drag.current?.moved) onSelect(bar.node.id)
                }}
              >
                {/* opaque base so lines never bleed through the translucent fill */}
                <rect
                  x={bar.x1}
                  y={bar.yCenter - BAR_H / 2}
                  width={barWidth}
                  height={BAR_H}
                  rx={BAR_H / 2}
                  fill="#020617"
                />
                <rect
                  x={bar.x1}
                  y={bar.yCenter - BAR_H / 2}
                  width={barWidth}
                  height={BAR_H}
                  rx={BAR_H / 2}
                  fill={bar.color}
                  opacity={isSelected ? 0.95 : 0.55}
                  stroke={isSelected ? '#f8fafc' : bar.color}
                  strokeWidth={isSelected ? 1.5 : 0}
                />
                {barWidth > 54 && (
                  <text
                    x={Math.max(bar.x1, 0) + 10}
                    y={bar.yCenter + 4}
                    fill="#020617"
                    fontSize={11.5}
                    fontWeight={700}
                    pointerEvents="none"
                  >
                    {bar.node.name}
                  </text>
                )}
                <title>{bar.node.name}</title>
              </g>
            )
          })}

          {/* key-artist markers */}
          {artistMarkers.map((marker) => (
            <g
              key={`${marker.id}-${marker.x}`}
              opacity={dimmed(marker.id) && marker.id !== selectedId ? 0.25 : 1}
              style={{ cursor: 'pointer' }}
              onClick={(event) => {
                event.stopPropagation()
                if (!drag.current?.moved) onSelect(marker.id)
              }}
            >
              <circle
                cx={marker.x}
                cy={marker.y}
                r={4}
                fill="#020617"
                stroke={marker.id === selectedId ? '#f8fafc' : marker.color}
                strokeWidth={1.8}
              />
              <title>{marker.name}</title>
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}
