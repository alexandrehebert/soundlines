import type { GraphNode, Prominence } from './types.ts'

export const GENRE_BAR_HEIGHT = 22

/** Niche periods are hidden entirely: the bar fades out into them. */
export const PHASE_STYLE: Record<Prominence, { opacity: number; visible: boolean }> = {
  emerging: { opacity: 0.3, visible: true },
  'golden-age': { opacity: 0.75, visible: true },
  established: { opacity: 0.4, visible: true },
  niche: { opacity: 0, visible: false },
}

export function genrePhases(node: GraphNode, now: number) {
  if (!node.period || !node.phases) return []
  const phases = node.phases
  const end = node.period.end ?? now
  return phases.map((phase, i) => ({
    ...phase,
    end: Math.min(phases[i + 1]?.start ?? end, end),
  })).filter((phase) => phase.end > phase.start)
}

type Stop = { offset: number; opacity: number }

function genreStops(node: GraphNode, now: number, valueOf: (prominence: Prominence) => number): Stop[] {
  const phases = genrePhases(node, now)
  if (phases.length === 0) return []
  const start = phases[0].start
  const duration = phases[phases.length - 1].end - start
  const stops = [{ offset: 0, opacity: valueOf(phases[0].prominence) }]
  for (let i = 1; i < phases.length; i++) {
    const previous = phases[i - 1]
    const phase = phases[i]
    // Blend around the editorial boundary, without swallowing short phases.
    const halfWidth = Math.min(2, (previous.end - previous.start) / 3, (phase.end - phase.start) / 3)
    const from = valueOf(previous.prominence)
    const to = valueOf(phase.prominence)
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const eased = t * t * (3 - 2 * t)
      stops.push({
        offset: (phase.start - halfWidth + 2 * halfWidth * t - start) / duration,
        opacity: from + (to - from) * eased,
      })
    }
  }
  stops.push({ offset: 1, opacity: valueOf(phases[phases.length - 1].prominence) })
  return stops
}

export function genreOpacityStops(node: GraphNode, now: number) {
  return genreStops(node, now, (prominence) => PHASE_STYLE[prominence].opacity)
}

/** Mask stops (1 = visible, 0 = hidden) that fade the whole bar out during niche periods. */
export function genreVisibilityStops(node: GraphNode, now: number) {
  return genreStops(node, now, (prominence) => (PHASE_STYLE[prominence].visible ? 1 : 0))
}

/** Year where the visible part of the bar ends, ignoring a trailing niche period. */
export function genreVisibleEnd(node: GraphNode, now: number): number | undefined {
  return genrePhases(node, now).findLast((phase) => PHASE_STYLE[phase.prominence].visible)?.end
}
