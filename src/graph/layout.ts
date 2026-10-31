import {
  FAMILY_ORDER,
  type GenreFamily,
  type GraphNode,
  type MusicGraph,
} from './types.ts'
import { visibleEnd } from './phases.ts'

/**
 * Horizontal timeline layout: nodes are interval bars grouped into family
 * lanes; within a family, overlapping bars are stacked onto separate rows.
 */

export const CURRENT_YEAR = new Date().getFullYear()
export const MIN_YEAR = 500
export const DEFAULT_START_YEAR = 1948
export const MAX_YEAR = CURRENT_YEAR + 2

export interface TimeScale {
  /** First visible year. */
  start: number
  /** Last visible year. */
  end: number
  /** Pixel width the scale maps onto. */
  width: number
}

/**
 * Era-weighted time: older centuries get fewer pixels per year so the
 * modern era stays readable when zoomed out. Each segment starts at `from`
 * and maps one year to `weight` units of "era time".
 */
export const ERA_SEGMENTS: readonly { from: number; weight: number; label: string }[] = [
  { from: MIN_YEAR, weight: 0.08, label: 'Medieval' },
  { from: 1400, weight: 0.2, label: 'Renaissance – Baroque' },
  { from: 1750, weight: 0.5, label: 'Classical – Romantic' },
  { from: 1900, weight: 1, label: 'Modern' },
]

export function eraWeight(year: number): number {
  let weight = ERA_SEGMENTS[0].weight
  for (const segment of ERA_SEGMENTS) {
    if (year >= segment.from) weight = segment.weight
  }
  return weight
}

/** Convert a calendar year to era time (MIN_YEAR maps to 0). */
export function toEraTime(year: number): number {
  let t = 0
  for (let i = 0; i < ERA_SEGMENTS.length; i++) {
    const { from, weight } = ERA_SEGMENTS[i]
    const next = ERA_SEGMENTS[i + 1]?.from ?? Infinity
    if (year <= from) break
    t += (Math.min(year, next) - from) * weight
  }
  return t
}

export function fromEraTime(t: number): number {
  let remaining = t
  for (let i = 0; i < ERA_SEGMENTS.length; i++) {
    const { from, weight } = ERA_SEGMENTS[i]
    const next = ERA_SEGMENTS[i + 1]?.from ?? Infinity
    const length = (next - from) * weight
    if (remaining <= length) return from + remaining / weight
    remaining -= length
  }
  return Infinity
}

export function yearToX(scale: TimeScale, year: number): number {
  const start = toEraTime(scale.start)
  return ((toEraTime(year) - start) / (toEraTime(scale.end) - start)) * scale.width
}

export function xToYear(scale: TimeScale, x: number): number {
  const start = toEraTime(scale.start)
  return fromEraTime(start + (x / scale.width) * (toEraTime(scale.end) - start))
}

const TICK_STEPS = [10, 20, 25, 50, 100, 200, 250, 500]

/**
 * Tick years covering the visible range. The step adapts to the local
 * pixels-per-year so compressed eras get sparser ticks (decades when space allows).
 */
export function timeTicks(scale: TimeScale, minSpacing = 56): number[] {
  const span = toEraTime(scale.end) - toEraTime(scale.start)
  if (span <= 0 || scale.width <= 0) return []
  const ticks: number[] = []
  let year = scale.start
  while (year <= scale.end) {
    const pxPerYear = (eraWeight(year) / span) * scale.width
    const step = TICK_STEPS.find((s) => s * pxPerYear >= minSpacing) ?? TICK_STEPS.at(-1)!
    const tick = Math.ceil(year / step) * step
    if (tick > scale.end) break
    const last = ticks.at(-1)
    if (last === undefined || yearToX(scale, tick) - yearToX(scale, last) >= minSpacing * 0.75) {
      ticks.push(tick)
    }
    year = tick + 1
  }
  return ticks
}

type YearRange = [number, number]

const ERA_MIN = () => toEraTime(MIN_YEAR)
const ERA_MAX = () => toEraTime(MAX_YEAR)

function inEraTime(range: YearRange, fn: (start: number, end: number) => YearRange): YearRange {
  const [start, end] = fn(toEraTime(range[0]), toEraTime(range[1]))
  return [fromEraTime(start), fromEraTime(end)]
}

/** Zoom a year range around a focal year, operating in era time. */
export function zoomYearRange(range: YearRange, focusYear: number, factor: number): YearRange {
  return inEraTime(range, (start, end) =>
    zoomRange(start, end, toEraTime(focusYear), factor, ERA_MIN(), ERA_MAX()))
}

/** Pan a year range by a fraction of its visible width. */
export function panYearRange(range: YearRange, fraction: number): YearRange {
  return inEraTime(range, (start, end) =>
    panRange(start, end, fraction * (end - start), ERA_MIN(), ERA_MAX()))
}

/** Reveal a year while keeping the current on-screen zoom level. */
export function revealEraRange(range: YearRange, year: number): YearRange {
  if (year >= range[0] && year <= range[1]) return range
  return inEraTime(range, (start, end) =>
    revealYearRange(start, end, toEraTime(year), ERA_MIN(), ERA_MAX()))
}

export interface TimelineBar {
  node: GraphNode
  family: GenreFamily
  /** Row within the family lane (0-based). */
  row: number
  start: number
  /** Resolved end year (ongoing careers or genres end "now"). */
  end: number
  ongoing: boolean
}

export interface FamilyLane {
  family: GenreFamily
  rowCount: number
  bars: TimelineBar[]
}

/**
 * Greedy interval stacking: bars sorted by start year take the first row
 * whose last bar ends before they start (with padding so labels fit).
 */
export function layoutFamilies(
  graph: MusicGraph,
  now = CURRENT_YEAR,
  nodeType: 'genre' | 'artist' = 'genre',
): FamilyLane[] {
  const nodes = graph.nodes.filter(
    (node): node is GraphNode & { family: GenreFamily } =>
      node.type === nodeType && node.family !== undefined && node.period !== undefined,
  )

  const lanes: FamilyLane[] = []
  for (const family of FAMILY_ORDER) {
    const members = nodes
      .filter((node) => node.family === family)
      .sort((a, b) => a.period!.start - b.period!.start || a.name.localeCompare(b.name))
    if (members.length === 0) continue

    const rowEnds: number[] = []
    const bars: TimelineBar[] = []
    for (const node of members) {
      const start = node.period!.start
      const end = node.period!.end ?? now
      // A hidden trailing niche period doesn't occupy the row; +2 covers the fade-out.
      const lastVisibleYear = visibleEnd(node, now)
      const occupiedUntil = lastVisibleYear === undefined ? end : Math.min(lastVisibleYear + 2, end)
      let row = rowEnds.findIndex((rowEnd) => rowEnd < start)
      if (row === -1) {
        row = rowEnds.length
        rowEnds.push(occupiedUntil)
      } else {
        rowEnds[row] = occupiedUntil
      }
      bars.push({ node, family, row, start, end, ongoing: node.period!.end == null })
    }
    lanes.push({ family, rowCount: rowEnds.length, bars })
  }
  return lanes
}

/** Clamp and zoom a [start, end] year range around a focal year. */
export function zoomRange(
  start: number,
  end: number,
  focusYear: number,
  factor: number,
  min: number,
  max: number,
): [number, number] {
  const span = (end - start) * factor
  const clampedSpan = Math.min(Math.max(span, 10), max - min)
  const ratio = (focusYear - start) / (end - start)
  let nextStart = focusYear - clampedSpan * ratio
  let nextEnd = nextStart + clampedSpan
  if (nextStart < min) {
    nextStart = min
    nextEnd = min + clampedSpan
  }
  if (nextEnd > max) {
    nextEnd = max
    nextStart = max - clampedSpan
  }
  return [nextStart, nextEnd]
}

/** Shift a [start, end] year range by delta years, clamped to [min, max]. */
export function panRange(
  start: number,
  end: number,
  delta: number,
  min: number,
  max: number,
): [number, number] {
  const span = end - start
  let nextStart = start + delta
  if (nextStart < min) nextStart = min
  if (nextStart + span > max) nextStart = max - span
  return [nextStart, nextStart + span]
}

/** Reveal a selected start year while preserving the current zoom level. */
export function revealYearRange(
  start: number,
  end: number,
  year: number,
  min: number,
  max: number,
): [number, number] {
  if (year >= start && year <= end) return [start, end]
  const span = end - start
  const nextStart = Math.max(min, Math.min(year - span * 0.25, max - span))
  return [nextStart, nextStart + span]
}
