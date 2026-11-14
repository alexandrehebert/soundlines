import { useCallback, useEffect, useMemo, useRef, type Ref } from 'react'
import { createWaveModel, planWaveRest, sampleCubicPath, WaveTape } from './soundlinesWave.ts'

// Resting frame shared with public/favicon.svg.
export const SOUNDLINES_WAVES = [
  { color: '#22d3ee', d: 'M3 12 C4.5 12 4.9 7.8 6.8 7.8 C8.7 7.8 8.7 17.5 10.6 17.5 C12.5 17.5 12.8 6.4 14.8 6.4 C16.5 6.4 16.9 15.5 18.4 15.5 C19.7 15.5 20.1 12 21 12' },
  { color: '#f472b6', d: 'M3 12 C4.6 12 5 15 6.8 15 C8.6 15 8.8 8.2 10.6 8.2 C12.5 8.2 12.9 15.9 14.8 15.9 C16.5 15.9 16.9 9.5 18.4 9.5 C19.7 9.5 20.1 12 21 12' },
] as const
export const SOUNDLINES_ENDPOINT_COLOR = '#a684ff'
export const SOUNDLINES_BACKGROUND = '#020617'

const waveModels = SOUNDLINES_WAVES.map(({ d }) => createWaveModel(sampleCubicPath(d)))

export const HOVER_CYCLES_PER_SECOND = 0.55
export const SCROLL_CYCLES_PER_SECOND = 0.8
const SETTLE_CYCLES_PER_SECOND = 0.7
const SCROLL_IDLE_MS = 180
const SPEED_RESPONSE = 6

interface Settle {
  from: number
  distance: number
  velocity: number
  duration: number
  elapsed: number
}

/** Quintic ease from (0, velocity, no acceleration) to (distance, at rest, no acceleration). */
function settleCurve({ distance, velocity, duration }: Settle, time: number) {
  const t = Math.min(time, duration)
  const c3 = (20 * distance - 12 * velocity * duration) / (2 * duration ** 3)
  const c4 = (-30 * distance + 16 * velocity * duration) / (2 * duration ** 4)
  const c5 = (12 * distance - 6 * velocity * duration) / (2 * duration ** 5)
  return {
    position: velocity * t + c3 * t ** 3 + c4 * t ** 4 + c5 * t ** 5,
    speed: velocity + 3 * c3 * t ** 2 + 4 * c4 * t ** 3 + 5 * c5 * t ** 4,
  }
}

/**
 * Scrolls randomly generated waves while cruising, then eases the resting logo frame back in.
 * Offsets and speeds are in wave samples; cruise speeds are in favicon widths per second.
 */
export class SoundlinesWaveMotion {
  readonly tapes: WaveTape[]
  offset = 0
  speed = 0
  private settle: Settle | null = null

  constructor(tapes: WaveTape[]) {
    this.tapes = tapes
  }

  get atRest(): boolean {
    return this.offset === 0 && this.speed === 0 && this.settle === null
  }

  /** Advances the motion; returns true once it is back on the resting frame. */
  step(seconds: number, cruise: number | null): boolean {
    const samples = this.tapes[0].intervals
    if (cruise !== null) {
      this.settle = null
      this.speed += (cruise * samples - this.speed) * (1 - Math.exp(-seconds * SPEED_RESPONSE))
      this.offset += this.speed * seconds
      return false
    }
    if (this.atRest) return true
    if (!this.settle) {
      const target = planWaveRest(this.tapes, this.offset)
      const distance = target - this.offset
      const velocity = Math.max(0, this.speed)
      const average = Math.max(velocity * 0.75, SETTLE_CYCLES_PER_SECOND * samples)
      this.settle = { from: this.offset, distance, velocity, duration: distance / average, elapsed: 0 }
    }
    const settle = this.settle
    settle.elapsed += seconds
    if (settle.elapsed >= settle.duration) {
      this.offset = 0
      this.speed = 0
      this.settle = null
      for (const tape of this.tapes) tape.reset()
      return true
    }
    const { position, speed } = settleCurve(settle, settle.elapsed)
    this.offset = settle.from + position
    this.speed = speed
    return false
  }

  paths(): string[] {
    return this.tapes.map((tape) => tape.pathAt(this.offset))
  }
}

export interface SoundlinesWaveControls {
  pathRefs: Ref<SVGPathElement>[]
  setHovered: (hovered: boolean) => void
  nudge: () => void
}

export function useSoundlinesWaves(enabled: boolean): SoundlinesWaveControls {
  const paths = useRef<(SVGPathElement | null)[]>([])
  const pathRefs = useMemo(() => SOUNDLINES_WAVES.map((_, index) => (path: SVGPathElement | null) => { paths.current[index] = path }), [])
  const motion = useRef<SoundlinesWaveMotion | null>(null)
  const loop = useRef({ hovered: false, scrollUntil: 0, frame: null as number | null, last: 0 })

  const render = useCallback((waves: string[] | null) => {
    paths.current.forEach((path, index) => {
      path?.setAttribute('d', waves?.[index] ?? SOUNDLINES_WAVES[index].d)
    })
  }, [])

  const stop = useCallback(() => {
    const state = loop.current
    if (state.frame !== null) cancelAnimationFrame(state.frame)
    state.frame = null
    motion.current = null
    render(null)
  }, [render])

  const start = useCallback(() => {
    const state = loop.current
    if (!enabled || state.frame !== null) return
    motion.current ??= new SoundlinesWaveMotion(waveModels.map((model) => new WaveTape(model)))
    const waves = motion.current
    state.last = performance.now()
    const tick = (now: number) => {
      const elapsed = Math.max(0, Math.min(now - state.last, 100))
      state.last = now
      const cruise = state.hovered
        ? HOVER_CYCLES_PER_SECOND
        : now < state.scrollUntil ? SCROLL_CYCLES_PER_SECOND : null
      if (waves.step(elapsed / 1000, cruise)) {
        state.frame = null
        render(null)
        return
      }
      render(waves.paths())
      state.frame = requestAnimationFrame(tick)
    }
    state.frame = requestAnimationFrame(tick)
  }, [enabled, render])

  useEffect(() => {
    if (!enabled) stop()
    return stop
  }, [enabled, stop])

  const setHovered = useCallback((hovered: boolean) => {
    loop.current.hovered = hovered
    if (hovered) start()
  }, [start])

  const nudge = useCallback(() => {
    loop.current.scrollUntil = performance.now() + SCROLL_IDLE_MS
    start()
  }, [start])

  return { pathRefs, setHovered, nudge }
}
