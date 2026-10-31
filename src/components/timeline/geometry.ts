import { yearToX, type FamilyLane, type GenreOrder, type TimelineBar, type TimeScale } from '../../graph/layout.ts'
import { TIMELINE_BAR_HEIGHT, visibleSpans } from '../../graph/phases.ts'
import { FAMILY_LABELS, type GraphNode } from '../../graph/types.ts'
import { FAMILY_COLORS } from '../../theme.ts'

export const AXIS_H = 34
export const BAR_H = TIMELINE_BAR_HEIGHT
const LANE_HEADER = 24
const ROW_H = 36
const LANE_GAP = 14

export interface BarPosition {
  node: GraphNode
  start: number
  end: number
  x1: number
  x2: number
  visibleSpans: [number, number][]
  yCenter: number
  color: string
  ended: boolean
}

function positionBar(bar: TimelineBar, scale: TimeScale, yCenter: number): BarPosition {
  const spans = bar.node.phases ? visibleSpans(bar.node, bar.end) : [[bar.start, bar.end]]
  return {
    node: bar.node,
    start: bar.start,
    end: bar.end,
    x1: yearToX(scale, bar.start),
    x2: yearToX(scale, bar.end),
    visibleSpans: spans.map(([start, end]) =>
      [yearToX(scale, start), yearToX(scale, Math.min(end, bar.end))]),
    yCenter,
    color: FAMILY_COLORS[bar.family],
    ended: !bar.ongoing,
  }
}

export function positionTimeline(lanes: FamilyLane[], scale: TimeScale, order: GenreOrder = 'family') {
  const bars: BarPosition[] = []
  const bands: { family: string; label: string; top: number; height: number; color: string }[] = []
  if (order === 'oldest-first') {
    const ordered = lanes.flatMap((lane) => lane.bars).sort((a, b) =>
      a.start - b.start || a.node.name.localeCompare(b.node.name) || a.node.id.localeCompare(b.node.id))
    for (const [row, bar] of ordered.entries()) {
      bars.push(positionBar(bar, scale, AXIS_H + row * ROW_H + ROW_H / 2))
    }
    return { bars, bands, height: AXIS_H + ordered.length * ROW_H + 16 }
  }
  let y = AXIS_H
  for (const lane of lanes) {
    const height = LANE_HEADER + lane.rowCount * ROW_H
    bands.push({
      family: lane.family, label: FAMILY_LABELS[lane.family],
      top: y, height, color: FAMILY_COLORS[lane.family],
    })
    for (const bar of lane.bars) {
      bars.push(positionBar(bar, scale, y + LANE_HEADER + bar.row * ROW_H + ROW_H / 2))
    }
    y += height + LANE_GAP
  }
  return { bars, bands, height: y - LANE_GAP + 16 }
}

export function snapToSpans(x: number, spans: [number, number][], pad: number): number {
  let best = x
  let bestDistance = Infinity
  for (const [x1, x2] of spans) {
    const lo = Math.min(x1 + pad, (x1 + x2) / 2)
    const hi = Math.max(x2 - pad, (x1 + x2) / 2)
    const candidate = Math.min(Math.max(x, lo), hi)
    const distance = Math.abs(candidate - x)
    if (distance < bestDistance) {
      best = candidate
      bestDistance = distance
    }
  }
  return best
}

export function labelX(bar: BarPosition, width: number): number | null {
  for (const [start, end] of bar.visibleSpans) {
    const x = Math.max(start, 0)
    if (Math.min(end, width) - x > 54) return x + 10
  }
  return null
}

export interface OffscreenIndicator {
  x: number
  width: number
  direction: 'left' | 'right'
  targetX: number
}

export function offscreenIndicators(bars: BarPosition[], width: number): Map<string, OffscreenIndicator> {
  const indicators = new Map<string, OffscreenIndicator>()
  const indicatorWidth = Math.min(220, (width - 24) / 2)
  if (indicatorWidth < 80) return indicators
  const rows = new Map<number, BarPosition[]>()
  for (const bar of bars) {
    const row = rows.get(bar.yCenter) ?? []
    row.push(bar)
    rows.set(bar.yCenter, row)
  }
  for (const row of rows.values()) {
    const candidates = row.flatMap((bar) => {
      if (bar.node.type !== 'genre' || !bar.visibleSpans.length
        || bar.visibleSpans.some(([start, end]) => end > 0 && start < width)) return []
      const nearest = bar.visibleSpans.map(([start, end]) => ({
        direction: end <= 0 ? 'left' as const : 'right' as const,
        targetX: end <= 0 ? end : start,
        distance: end <= 0 ? -end : start - width,
      })).sort((a, b) => a.distance - b.distance)[0]
      return [{ bar, ...nearest }]
    }).sort((a, b) => a.distance - b.distance || a.bar.node.id.localeCompare(b.bar.node.id))
    const occupied: [number, number][] = row
      .filter((bar) => bar.visibleSpans.some(([start, end]) => end > 0 && start < width))
      // Reserve the entire envelope, including phase fades and labels.
      .map((bar) => [bar.x1, bar.x2])
    for (const candidate of candidates) {
      const x = candidate.direction === 'left' ? 8 : width - 8 - indicatorWidth
      if (occupied.some(([start, end]) => end + 8 > x && start - 8 < x + indicatorWidth)) continue
      indicators.set(candidate.bar.node.id, {
        x, width: indicatorWidth, direction: candidate.direction, targetX: candidate.targetX,
      })
      occupied.push([x, x + indicatorWidth])
    }
  }
  return indicators
}

export function barShape(bar: BarPosition): string {
  const top = bar.yCenter - BAR_H / 2
  const r = BAR_H / 2
  const left = bar.x1 + r
  const right = Math.max(bar.x2, left + (bar.ended ? 2 : r))
  if (!bar.ended) {
    const capStart = right - r
    return `M ${left} ${top} H ${capStart} A ${r} ${r} 0 0 1 ${capStart} ${top + BAR_H} H ${left} A ${r} ${r} 0 0 1 ${left} ${top}`
  }

  return `M ${left} ${top} H ${right} V ${top + BAR_H} H ${left} A ${r} ${r} 0 0 1 ${left} ${top}`
}

export function tailFadeOffset(bar: BarPosition): number {
  return Math.max(0, 1 - 2 / (bar.end - bar.start))
}
