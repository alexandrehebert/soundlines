import { yearToX, type FamilyLane, type GenreOrder, type TimelineBar, type TimeScale } from '../../graph/layout.ts'
import { TIMELINE_BAR_HEIGHT, visibleSpans } from '../../graph/phases.ts'
import { FAMILY_LABELS, type GraphNode } from '../../graph/types.ts'
import { FAMILY_COLORS } from '../../theme.ts'

export const AXIS_H = 40
export const BAR_H = TIMELINE_BAR_HEIGHT
export const BAR_LABEL_FONT_SIZE = 11.5
export const ABOVE_BAR_LABEL_FONT_SIZE = 10.5
// Leave space between the first row's above-bar labels and the header or sticky axis.
const LANE_HEADER = 28
const ORDERED_TOP_INSET = 10
const ROW_H = 36
const LANE_GAP = 14

export function revealBarScrollTop(yCenter: number, scrollTop: number, viewportHeight: number): number {
  // Keep the hit area and focus outline clear of the sticky axis.
  const top = yCenter - ROW_H / 2
  if (top >= scrollTop + AXIS_H && top + ROW_H <= scrollTop + viewportHeight) return scrollTop
  return Math.max(0, top - Math.max(AXIS_H, viewportHeight / 3))
}

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
    const topInset = ordered.length ? ORDERED_TOP_INSET : 0
    for (const [row, bar] of ordered.entries()) {
      bars.push(positionBar(bar, scale, AXIS_H + topInset + row * ROW_H + ROW_H / 2))
    }
    return { bars, bands, height: AXIS_H + topInset + ordered.length * ROW_H + 16 }
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

export interface BarLabel {
  x: number
  maxWidth: number
  textAnchor: 'start' | 'end'
  outside: boolean
  above?: boolean
}

export function barLabel(
  bar: BarPosition,
  width: number,
  rowBars: BarPosition[] = [],
  labelWidth = estimatedLabelWidth(bar.node.name, BAR_LABEL_FONT_SIZE),
): BarLabel | null {
  const spans = bar.visibleSpans
    .map(([start, end]) => [Math.max(start, 0), Math.min(end, width)])
    .filter(([start, end]) => end > start)
  const requiredWidth = labelWidth + 2
  for (const [start, end] of spans) {
    const x = start + 10
    const maxWidth = Math.max(0, end - x - 6)
    if (end - start > 54 && maxWidth >= requiredWidth) {
      return { x, maxWidth, textAnchor: 'start', outside: false }
    }
  }
  if (!spans.length) return null

  const bounds = barBounds(bar)
  const neighbors = rowBars.filter((other) => other.node.id !== bar.node.id && other.yCenter === bar.yCenter)
  const spaces = spans.map(([start, end]) => {
    const right = end === bar.x2 ? Math.min(width, bounds.x + bounds.width) : end
    const rightEdge = Math.min(width, ...neighbors
      .filter((other) => other.x2 > right)
      .map((other) => Math.max(right, Math.min(other.x1 - 8, (right + other.x1) / 2))))
    const leftEdge = Math.max(0, ...neighbors
      .filter((other) => other.x1 < start)
      .map((other) => Math.min(start, Math.max(other.x2 + 8, (start + other.x2) / 2))))
    return { start, right, leftEdge, rightEdge }
  })
  const candidates = spaces.flatMap(({ start, right, leftEdge, rightEdge }) => {
    return [
      { x: right + 10, textAnchor: 'start' as const, space: rightEdge - right - 10 },
      { x: start - 10, textAnchor: 'end' as const, space: start - leftEdge - 10 },
    ]
  })
  const best = candidates.sort((a, b) => b.space - a.space)[0]
  if (best.space - 4 >= requiredWidth) {
    return { x: best.x, maxWidth: best.space - 4, textAnchor: best.textAnchor, outside: true }
  }

  const corridors = spaces.map(({ start, leftEdge, rightEdge }) => {
    const left = Math.min(width, Math.max(4, leftEdge + 4))
    const right = Math.max(left, Math.min(width - 4, rightEdge - 4))
    return { start, left, right, space: right - left }
  })
  const fitting = corridors.find((corridor) => corridor.space >= requiredWidth)
  if (fitting) {
    const x = Math.min(Math.max(fitting.start + 10, fitting.left), fitting.right - requiredWidth)
    return { x, maxWidth: fitting.right - x, textAnchor: 'start', outside: true }
  }

  const aboveWidth = labelWidth * ABOVE_BAR_LABEL_FONT_SIZE / BAR_LABEL_FONT_SIZE + 2
  const left = Math.min(4, width / 2)
  const right = Math.max(left, width - 4)
  if (neighbors.length || aboveWidth <= right - left) {
    const x = Math.min(Math.max(spans[0][0] + 10, left), Math.max(left, right - aboveWidth))
    return { x, maxWidth: right - x, textAnchor: 'start', outside: true, above: true }
  }

  const widest = corridors.sort((a, b) => b.space - a.space)[0]
  return { x: widest.left, maxWidth: widest.space, textAnchor: 'start', outside: true }
}

export function positionRowLabels(
  rowBars: BarPosition[],
  width: number,
  labelWidths: ReadonlyMap<string, number>,
): Map<string, BarLabel> {
  const positions = new Map<string, BarLabel>()
  const above: { bar: BarPosition; label: BarLabel; width: number; start: number }[] = []
  for (const bar of rowBars) {
    const labelWidth = labelWidths.get(bar.node.id) ?? estimatedLabelWidth(bar.node.name, BAR_LABEL_FONT_SIZE)
    const label = barLabel(bar, width, rowBars, labelWidth)
    if (!label) continue
    if (!label.above) {
      positions.set(bar.node.id, label)
      continue
    }
    const span = bar.visibleSpans.find(([start, end]) => Math.min(end, width) > Math.max(start, 0))
    if (span) above.push({ bar, label, width: labelWidth, start: Math.max(0, span[0]) })
  }
  if (!above.length) return positions

  above.sort((a, b) => a.start - b.start || a.bar.node.id.localeCompare(b.bar.node.id))
  const left = Math.min(4, width / 2)
  const right = Math.max(left, width - 4)
  const innerWidth = right - left
  const gap = above.length > 1 ? Math.min(4, innerWidth / (2 * above.length)) : 0
  const available = Math.max(0, innerWidth - gap * (above.length - 1))
  const desired = above.map((entry) =>
    Math.min(available, entry.width * ABOVE_BAR_LABEL_FONT_SIZE / BAR_LABEL_FONT_SIZE + 2))
  const minimum = Math.min(20, available / above.length)
  const slots = desired.map((value) => Math.min(value, minimum))
  let remaining = available - slots.reduce((sum, value) => sum + value, 0)
  const byExtraWidth = above.map((_, index) => index)
    .sort((a, b) => desired[a] - slots[a] - (desired[b] - slots[b]))
  for (const index of byExtraWidth) {
    const extra = Math.min(remaining, desired[index] - slots[index])
    slots[index] += extra
    remaining -= extra
  }

  const xs = above.map((entry, index) => Math.min(Math.max(entry.label.x, left), right - slots[index]))
  for (let i = 1; i < xs.length; i++) xs[i] = Math.max(xs[i], xs[i - 1] + slots[i - 1] + gap)
  if (xs.at(-1)! + slots.at(-1)! > right) {
    xs[xs.length - 1] = right - slots.at(-1)!
    for (let i = xs.length - 2; i >= 0; i--) {
      xs[i] = Math.min(xs[i], xs[i + 1] - gap - slots[i])
    }
  }
  for (const [index, entry] of above.entries()) {
    positions.set(entry.bar.node.id, { ...entry.label, x: xs[index], maxWidth: slots[index] })
  }
  return positions
}

function estimatedLabelWidth(text: string, fontSize: number): number {
  return [...text].reduce((width, character) => {
    const factor = /[ilI.,:;'!|]/u.test(character) ? 0.34
      : /[MW@%&]/u.test(character) ? 0.9
        : /[A-Z]/u.test(character) ? 0.7
          : /\s/u.test(character) ? 0.34
            : /[0-9]/u.test(character) ? 0.62
              : /[a-z]/u.test(character) ? 0.58
                : 0.78
    return width + factor * fontSize * 1.08
  }, 0)
}

export interface BarLabelMetrics {
  width: number
  ellipsisWidth: number
  prefixWidths?: number[]
}

export function fitBarLabel(text: string, maxWidth: number, fontSize: number, metrics?: BarLabelMetrics): string {
  const scale = fontSize / BAR_LABEL_FONT_SIZE
  const textWidth = metrics ? metrics.width * scale : estimatedLabelWidth(text, fontSize)
  if (textWidth + 1 <= maxWidth) return text
  const ellipsis = '…'
  const ellipsisWidth = metrics ? metrics.ellipsisWidth * scale : estimatedLabelWidth(ellipsis, fontSize)
  let result = ''
  for (const [index, character] of [...text].entries()) {
    const prefixWidth = metrics?.prefixWidths?.[index]
    const candidateWidth = prefixWidth === undefined
      ? estimatedLabelWidth(`${result}${character}${ellipsis}`, fontSize)
      : prefixWidth * scale + ellipsisWidth
    if (candidateWidth + 1 > maxWidth) break
    result += character
  }
  return result ? `${result.trimEnd()}${ellipsis}` : maxWidth >= ellipsisWidth + 1 ? ellipsis : ''
}

export interface OffscreenIndicator {
  x: number
  width: number
  direction: 'left' | 'right'
  targetX: number
}

export function offscreenIndicators(
  bars: BarPosition[],
  width: number,
  options: {
    indicatorLabelWidths?: ReadonlyMap<string, number>
    visibleLabels?: ReadonlyMap<string, BarLabel>
    visibleLabelWidths?: ReadonlyMap<string, number>
  } = {},
): Map<string, OffscreenIndicator> {
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
      if (bar.node.type === 'artist' || !bar.visibleSpans.length
        || bar.visibleSpans.some(([start, end]) => end > 0 && start < width)) return []
      const nearest = bar.visibleSpans.map(([start, end]) => ({
        direction: end <= 0 ? 'left' as const : 'right' as const,
        targetX: end <= 0 ? end : start,
        distance: end <= 0 ? -end : start - width,
      })).sort((a, b) => a.distance - b.distance)[0]
      return [{ bar, ...nearest }]
    }).sort((a, b) => a.distance - b.distance || a.bar.node.id.localeCompare(b.bar.node.id))
    const occupied: [number, number][] = []
    for (const bar of row) {
      if (!bar.visibleSpans.some(([start, end]) => end > 0 && start < width)) continue
      occupied.push([bar.x1, bar.x2])
      const label = options.visibleLabels?.get(bar.node.id)
      if (label && !label.above) {
        const labelWidth = Math.min(label.maxWidth, options.visibleLabelWidths?.get(bar.node.id)
          ?? estimatedLabelWidth(bar.node.name, BAR_LABEL_FONT_SIZE))
        occupied.push(label.textAnchor === 'start'
          ? [label.x, label.x + labelWidth]
          : [label.x - labelWidth, label.x])
      }
    }

    const chosen: (typeof candidates[number] & { limit: number; needed: number })[] = []
    const directions = new Set<OffscreenIndicator['direction']>()
    for (const candidate of candidates) {
      if (directions.has(candidate.direction)) continue
      let limit = width - 16
      for (const [start, end] of occupied) {
        if (candidate.direction === 'left' && end > 0) limit = Math.min(limit, start - 16)
        if (candidate.direction === 'right' && start < width) limit = Math.min(limit, width - 16 - end)
      }
      if (limit < indicatorWidth) continue
      const labelWidth = options.indicatorLabelWidths?.get(candidate.bar.node.id)
        ?? estimatedLabelWidth(candidate.bar.node.name, BAR_LABEL_FONT_SIZE)
      chosen.push({ ...candidate, limit, needed: Math.min(limit, Math.max(80, labelWidth + 44)) })
      directions.add(candidate.direction)
    }

    const sizes = chosen.map((candidate) => Math.min(candidate.limit, Math.max(indicatorWidth, candidate.needed)))
    if (chosen.length === 2) {
      sizes.fill(indicatorWidth)
      let remaining = Math.max(0, width - 24 - sizes[0] - sizes[1])
      const order = [0, 1].sort((a, b) => chosen[a].needed - chosen[b].needed)
      for (const index of order) {
        const extra = Math.min(remaining, Math.max(0, chosen[index].needed - sizes[index]))
        sizes[index] += extra
        remaining -= extra
      }
      for (const index of order) {
        const other = 1 - index
        const extra = Math.min(
          Math.max(0, chosen[index].needed - sizes[index]),
          Math.max(0, sizes[other] - chosen[other].needed),
        )
        sizes[index] += extra
        sizes[other] -= extra
      }
    }
    for (const [index, candidate] of chosen.entries()) {
      const x = candidate.direction === 'left' ? 8 : width - 8 - sizes[index]
      indicators.set(candidate.bar.node.id, {
        x, width: sizes[index], direction: candidate.direction, targetX: candidate.targetX,
      })
    }
  }
  return indicators
}

export function barBounds(bar: BarPosition) {
  return {
    x: bar.x1,
    y: bar.yCenter - BAR_H / 2,
    width: Math.max(bar.x2 - bar.x1, bar.ended ? BAR_H / 2 + 2 : BAR_H),
  }
}

export function barShape(bar: BarPosition): string {
  const { x, y: top, width } = barBounds(bar)
  const r = BAR_H / 2
  const left = x + r
  const right = x + width
  if (!bar.ended) {
    const capStart = right - r
    return `M ${left} ${top} H ${capStart} A ${r} ${r} 0 0 1 ${capStart} ${top + BAR_H} H ${left} A ${r} ${r} 0 0 1 ${left} ${top}`
  }

  return `M ${left} ${top} H ${right} V ${top + BAR_H} H ${left} A ${r} ${r} 0 0 1 ${left} ${top}`
}

export function tailFadeOffset(bar: BarPosition, scale: TimeScale): number {
  const bounds = barBounds(bar)
  const finalYearsWidth = bounds.x + bounds.width - yearToX(scale, Math.max(bar.start, bar.end - 2))
  return Math.max(0, 1 - Math.max(BAR_H, finalYearsWidth) / bounds.width)
}
