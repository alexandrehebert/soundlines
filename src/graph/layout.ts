import {
  FAMILY_ORDER,
  type GenreFamily,
  type GraphNode,
  type MusicGraph,
} from './types.ts'
import { genreVisibleEnd } from './phases.ts'

/**
 * Horizontal timeline layout: genres are interval bars grouped into family
 * lanes; within a family, overlapping bars are stacked onto separate rows.
 */

export const CURRENT_YEAR = new Date().getFullYear()

export interface TimeScale {
  /** First visible year. */
  start: number
  /** Last visible year. */
  end: number
  /** Pixel width the scale maps onto. */
  width: number
}

export function yearToX(scale: TimeScale, year: number): number {
  return ((year - scale.start) / (scale.end - scale.start)) * scale.width
}

export function xToYear(scale: TimeScale, x: number): number {
  return scale.start + (x / scale.width) * (scale.end - scale.start)
}

/** Decade tick years covering the visible range. */
export function decadeTicks(scale: TimeScale): number[] {
  const ticks: number[] = []
  const first = Math.ceil(scale.start / 10) * 10
  for (let year = first; year <= scale.end; year += 10) {
    ticks.push(year)
  }
  return ticks
}

export interface GenreBar {
  node: GraphNode
  family: GenreFamily
  /** Row within the family lane (0-based). */
  row: number
  start: number
  /** Resolved end year (ongoing genres end "now"). */
  end: number
  ongoing: boolean
}

export interface FamilyLane {
  family: GenreFamily
  rowCount: number
  bars: GenreBar[]
}

/**
 * Greedy interval stacking: bars sorted by start year take the first row
 * whose last bar ends before they start (with padding so labels fit).
 */
export function layoutFamilies(graph: MusicGraph, now = CURRENT_YEAR): FamilyLane[] {
  const genres = graph.nodes.filter(
    (node): node is GraphNode & { family: GenreFamily } =>
      node.type === 'genre' && node.family !== undefined && node.period !== undefined,
  )

  const lanes: FamilyLane[] = []
  for (const family of FAMILY_ORDER) {
    const members = genres
      .filter((node) => node.family === family)
      .sort((a, b) => a.period!.start - b.period!.start || a.name.localeCompare(b.name))
    if (members.length === 0) continue

    const rowEnds: number[] = []
    const bars: GenreBar[] = []
    for (const node of members) {
      const start = node.period!.start
      const end = node.period!.end ?? now
      // A hidden trailing niche period doesn't occupy the row; +2 covers the fade-out.
      const visibleEnd = genreVisibleEnd(node, now)
      const occupiedUntil = visibleEnd === undefined ? end : Math.min(visibleEnd + 2, end)
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
