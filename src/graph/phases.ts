import type { ProminencePhase, GraphNode, Prominence } from './types.ts'

export const TIMELINE_BAR_HEIGHT = 22

/**
 * Default intensity (0–1) per prominence. Phases can override it with their
 * own `intensity` to express finer shades; 0 hides the bar (niche periods).
 */
export const PHASE_STYLE: Record<Prominence, { intensity: number }> = {
  emerging: { intensity: 0.35 },
  'golden-age': { intensity: 1 },
  established: { intensity: 0.45 },
  niche: { intensity: 0 },
}

export function phaseIntensity(phase: ProminencePhase): number {
  return phase.intensity ?? PHASE_STYLE[phase.prominence].intensity
}

/** Fill opacity for an intensity. */
export function intensityOpacity(level: number): number {
  return level <= 0 ? 0 : 0.14 + 0.7 * Math.min(level, 1)
}

/** Peak intensities are slightly brightened, not just more opaque. */
export function intensityColor(color: string, level: number): string {
  const glow = Math.max(0, level - 0.7) * 70
  return glow > 0 ? `color-mix(in srgb, ${color}, #fff ${glow.toFixed(1)}%)` : color
}

export function prominencePhases(node: GraphNode, now: number) {
  if (!node.period || !node.phases) return []
  const phases = node.phases
  const end = node.period.end ?? now
  return phases.map((phase, i) => ({
    ...phase,
    end: Math.min(phases[i + 1]?.start ?? end, end),
  })).filter((phase) => phase.end > phase.start)
}

export type Stop = { offset: number; level: number }

/** Each side of a phase boundary blends over this share of the shorter neighbouring phase. */
export const BLEND_RATIO = 0.15
export const BLEND_MIN_YEARS = 2

function genreStops(node: GraphNode, now: number, valueOf: (phase: ProminencePhase) => number): Stop[] {
  const phases = prominencePhases(node, now)
  if (phases.length === 0) return []
  const start = phases[0].start
  const duration = phases[phases.length - 1].end - start
  const stops = [{ offset: 0, level: valueOf(phases[0]) }]
  for (let i = 1; i < phases.length; i++) {
    const previous = phases[i - 1]
    const phase = phases[i]
    // Blend around the editorial boundary in proportion to the neighbouring phases, so
    // century-long eras shift over decades, without swallowing short phases.
    const shorter = Math.min(previous.end - previous.start, phase.end - phase.start)
    const halfWidth = Math.min(Math.max(BLEND_MIN_YEARS, shorter * BLEND_RATIO), shorter / 3)
    const from = valueOf(previous)
    const to = valueOf(phase)
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const eased = t * t * (3 - 2 * t)
      stops.push({
        offset: (phase.start - halfWidth + 2 * halfWidth * t - start) / duration,
        level: from + (to - from) * eased,
      })
    }
  }
  stops.push({ offset: 1, level: valueOf(phases[phases.length - 1]) })
  return stops
}

/** Smoothly interpolated intensity along the bar. */
export function intensityStops(node: GraphNode, now: number) {
  return genreStops(node, now, phaseIntensity)
}

/** Mask stops (1 = visible, 0 = hidden): the bar fades out of and back into niche periods. */
export function visibilityStops(node: GraphNode, now: number) {
  return genreStops(node, now, (phase) => (phaseIntensity(phase) > 0 ? 1 : 0))
}

/** Year ranges where the bar is visible; one per comeback. */
export function visibleSpans(node: GraphNode, now: number): [number, number][] {
  const spans: [number, number][] = []
  for (const phase of prominencePhases(node, now)) {
    if (phaseIntensity(phase) <= 0) continue
    const last = spans.at(-1)
    if (last && last[1] === phase.start) last[1] = phase.end
    else spans.push([phase.start, phase.end])
  }
  return spans
}

/** Year where the visible part of the bar ends, ignoring a trailing niche period. */
export function visibleEnd(node: GraphNode, now: number): number | undefined {
  return visibleSpans(node, now).at(-1)?.[1]
}
