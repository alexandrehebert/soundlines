import { useReducedMotion } from 'motion/react'
import { useEffect, useRef, type RefObject } from 'react'

export interface LevelSource {
  readLevels: (levels: Float32Array) => void
}

const BANDS = 16
const SEGMENTS = 8
const WIDTH = 132
const HEIGHT = 46
const PADDING = 5
const GAP = 1.5
const PEAK_HOLD_MS = 420
const PEAK_FALL_PER_SEC = 1.6
const LEVEL_FALL_PER_SEC = 3

/** A small segmented spectrum display that dances to whatever the deck plays. */
export function TurntableLcd({ source, active, playing = false, loading = false, theme }: {
  source: RefObject<LevelSource | null>
  active: boolean
  playing?: boolean
  loading?: boolean
  theme?: string
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const element = canvas.current
    const context = element?.getContext('2d')
    if (!element || !context) return
    const ratio = Math.max(1, Math.min(3, globalThis.devicePixelRatio || 1))
    element.width = WIDTH * ratio
    element.height = HEIGHT * ratio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)

    const raw = new Float32Array(BANDS)
    const levels = new Float32Array(BANDS)
    const peaks = new Float32Array(BANDS)
    const peakAt = new Float64Array(BANDS)
    const barWidth = (WIDTH - PADDING * 2 - GAP * (BANDS - 1)) / BANDS
    const segmentHeight = (HEIGHT - PADDING * 2 - GAP * (SEGMENTS - 1)) / SEGMENTS
    let frame = 0
    let last = performance.now()

    const draw = () => {
      const lit = getComputedStyle(element).color
      context.clearRect(0, 0, WIDTH, HEIGHT)
      context.fillStyle = lit
      for (let band = 0; band < BANDS; band += 1) {
        const x = PADDING + band * (barWidth + GAP)
        const height = Math.round(levels[band] * SEGMENTS)
        const peak = Math.min(SEGMENTS - 1, Math.round(peaks[band] * SEGMENTS) - 1)
        for (let segment = 0; segment < SEGMENTS; segment += 1) {
          const y = HEIGHT - PADDING - (segment + 1) * segmentHeight - segment * GAP
          context.globalAlpha = segment < height || (segment === peak && peak > 0) ? 1 : 0.12
          context.fillRect(x, y, barWidth, segmentHeight)
        }
      }
      context.globalAlpha = 1
    }

    const tick = (now: number) => {
      const elapsed = Math.min(0.1, (now - last) / 1000)
      last = now
      if (active && source.current) source.current.readLevels(raw)
      else raw.fill(0)
      let moving = active
      for (let band = 0; band < BANDS; band += 1) {
        // Lift highs a little, since music spectra fall off with frequency.
        const target = Math.min(1, raw[band] ** 1.6 * (1 + band / BANDS * 0.6))
        levels[band] = Math.max(target, levels[band] - LEVEL_FALL_PER_SEC * elapsed)
        if (levels[band] >= peaks[band]) {
          peaks[band] = levels[band]
          peakAt[band] = now
        } else if (now - peakAt[band] > PEAK_HOLD_MS) {
          peaks[band] = Math.max(0, peaks[band] - PEAK_FALL_PER_SEC * elapsed)
        }
        if (levels[band] > 0 || peaks[band] > 0) moving = true
      }
      draw()
      frame = moving ? requestAnimationFrame(tick) : 0
    }

    frame = requestAnimationFrame(reduceMotion ? draw : tick)
    return () => cancelAnimationFrame(frame)
  }, [active, source, reduceMotion, theme])

  return (
    <div className="discovery-turntable-lcd" data-active={active || undefined} aria-hidden="true">
      <canvas ref={canvas} className="discovery-turntable-lcd-screen" style={{ width: WIDTH, height: HEIGHT }} />
      <span className="discovery-turntable-led" data-on={playing || undefined} data-loading={loading || undefined} />
    </div>
  )
}
