import type { GraphNode, Prominence } from './types.ts'

export const GENRE_BAR_HEIGHT = 22

export const PHASE_STYLE: Record<Prominence, { opacity: number }> = {
  emerging: { opacity: 0.3 },
  'golden-age': { opacity: 0.75 },
  established: { opacity: 0.4 },
  niche: { opacity: 0.16 },
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

export function genreOpacityStops(node: GraphNode, now: number) {
  const phases = genrePhases(node, now)
  if (phases.length === 0) return []
  const start = phases[0].start
  const duration = phases[phases.length - 1].end - start
  const stops = [{ offset: 0, opacity: PHASE_STYLE[phases[0].prominence].opacity }]
  for (let i = 1; i < phases.length; i++) {
    const previous = phases[i - 1]
    const phase = phases[i]
    // Blend around the editorial boundary, without swallowing short phases.
    const halfWidth = Math.min(2, (previous.end - previous.start) / 3, (phase.end - phase.start) / 3)
    const from = PHASE_STYLE[previous.prominence].opacity
    const to = PHASE_STYLE[phase.prominence].opacity
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const eased = t * t * (3 - 2 * t)
      stops.push({
        offset: (phase.start - halfWidth + 2 * halfWidth * t - start) / duration,
        opacity: from + (to - from) * eased,
      })
    }
  }
  stops.push({ offset: 1, opacity: PHASE_STYLE[phases[phases.length - 1].prominence].opacity })
  return stops
}
