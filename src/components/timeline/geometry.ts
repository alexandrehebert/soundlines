import { yearToX, type FamilyLane, type TimeScale } from '../../graph/layout.ts'
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

export function positionTimeline(lanes: FamilyLane[], scale: TimeScale) {
  const bars: BarPosition[] = []
  const bands: { family: string; label: string; top: number; height: number; color: string }[] = []
  let y = AXIS_H
  for (const lane of lanes) {
    const height = LANE_HEADER + lane.rowCount * ROW_H
    bands.push({
      family: lane.family, label: FAMILY_LABELS[lane.family],
      top: y, height, color: FAMILY_COLORS[lane.family],
    })
    for (const bar of lane.bars) {
      const spans = bar.node.phases ? visibleSpans(bar.node, bar.end) : [[bar.start, bar.end]]
      bars.push({
        node: bar.node,
        start: bar.start,
        end: bar.end,
        x1: yearToX(scale, bar.start),
        x2: yearToX(scale, bar.end),
        visibleSpans: spans.map(([start, end]) =>
          [yearToX(scale, start), yearToX(scale, Math.min(end, bar.end))]),
        yCenter: y + LANE_HEADER + bar.row * ROW_H + ROW_H / 2,
        color: FAMILY_COLORS[lane.family],
        ended: !bar.ongoing,
      })
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
