import type { GraphNode, Prominence } from './types.ts'

export const PHASE_STYLE: Record<Prominence, { height: number; opacity: number; dashed: boolean }> = {
  emerging: { height: 10, opacity: 0.3, dashed: false },
  'golden-age': { height: 22, opacity: 0.75, dashed: false },
  established: { height: 12, opacity: 0.45, dashed: false },
  niche: { height: 5, opacity: 0.6, dashed: true },
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

export function genreHeightAt(node: GraphNode, year: number): number {
  const phase = node.phases?.findLast((candidate) => candidate.start <= year)
  return phase ? PHASE_STYLE[phase.prominence].height : 22
}
