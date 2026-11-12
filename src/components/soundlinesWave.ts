export interface WavePoint {
  x: number
  y: number
}

export interface WaveModel {
  points: readonly WavePoint[]
  amplitudes: number[]
}

const SAMPLE_INTERVALS = 24

export function sampleWave(path: SVGPathElement): WavePoint[] {
  const length = path.getTotalLength()
  const start = path.getPointAtLength(0)
  const end = path.getPointAtLength(length)
  if (!Number.isFinite(length) || length <= 0 || end.x <= start.x) {
    throw new Error('Favicon wave paths must run from left to right.')
  }

  let previousX = start.x
  for (let i = 1; i <= 96; i++) {
    const x = path.getPointAtLength(length * i / 96).x
    if (x < previousX - 0.001) throw new Error('Favicon wave paths must not loop back horizontally.')
    previousX = x
  }

  return Array.from({ length: SAMPLE_INTERVALS + 1 }, (_, index) => {
    if (index === 0) return { x: start.x, y: start.y }
    if (index === SAMPLE_INTERVALS) return { x: end.x, y: end.y }

    const x = start.x + (end.x - start.x) * index / SAMPLE_INTERVALS
    let low = 0
    let high = length
    for (let i = 0; i < 20; i++) {
      const middle = (low + high) / 2
      if (path.getPointAtLength(middle).x < x) low = middle
      else high = middle
    }
    return { x, y: path.getPointAtLength((low + high) / 2).y }
  })
}

type CubicSegment = readonly [WavePoint, WavePoint, WavePoint, WavePoint]

function cubicAt([p0, p1, p2, p3]: CubicSegment, t: number): WavePoint {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y }
}

/** Samples an absolute `M x y C …` path without a DOM, at evenly spaced x positions. */
export function sampleCubicPath(d: string): WavePoint[] {
  const tokens = d.trim().match(/[MC]|-?\d*\.?\d+/g) ?? []
  if (tokens[0] !== 'M') throw new Error('Favicon wave paths must start with an absolute move.')
  const numbers = tokens.filter((token) => token !== 'M' && token !== 'C').map(Number)
  if (numbers.length < 8 || (numbers.length - 2) % 6 !== 0 || tokens.slice(3).some((token, index) => index % 7 === 0 ? token !== 'C' : token === 'M' || token === 'C')) {
    throw new Error('Favicon wave paths must contain only absolute cubic segments.')
  }

  const segments: CubicSegment[] = []
  let current = { x: numbers[0], y: numbers[1] }
  for (let index = 2; index < numbers.length; index += 6) {
    const [x1, y1, x2, y2, x, y] = numbers.slice(index, index + 6)
    const end = { x, y }
    segments.push([current, { x: x1, y: y1 }, { x: x2, y: y2 }, end])
    if (end.x <= current.x || x1 < current.x || x2 > end.x) throw new Error('Favicon wave paths must run from left to right.')
    current = end
  }

  const start = segments[0][0]
  const end = current
  return Array.from({ length: SAMPLE_INTERVALS + 1 }, (_, index) => {
    if (index === 0) return { ...start }
    if (index === SAMPLE_INTERVALS) return { ...end }
    const x = start.x + (end.x - start.x) * index / SAMPLE_INTERVALS
    const segment = segments.find((candidate) => x <= candidate[3].x) ?? segments[segments.length - 1]
    let low = 0
    let high = 1
    for (let i = 0; i < 30; i++) {
      const middle = (low + high) / 2
      if (cubicAt(segment, middle).x < x) low = middle
      else high = middle
    }
    return { x, y: cubicAt(segment, (low + high) / 2).y }
  })
}

export function createWaveModel(points: readonly WavePoint[]): WaveModel {
  const intervals = points.length - 1
  if (intervals < 2) throw new Error('A favicon wave needs at least three points.')
  const start = points[0]
  const end = points[intervals]
  if (end.x <= start.x) throw new Error('Favicon wave points must run from left to right.')

  const amplitudes = points.map((point, index) => {
    const expectedX = start.x + (end.x - start.x) * index / intervals
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || Math.abs(point.x - expectedX) > 0.001) {
      throw new Error('Favicon wave points must be finite and evenly spaced.')
    }
    if (index === 0 || index === intervals) return 0
    const baseline = start.y + (end.y - start.y) * index / intervals
    return (point.y - baseline) / Math.sin(Math.PI * index / intervals)
  })

  amplitudes[0] = (amplitudes[1] + amplitudes[intervals - 1]) / 2
  amplitudes.pop()
  return { points, amplitudes }
}

function samplePeriodic(values: readonly number[], phase: number): number {
  const count = values.length
  const position = ((phase % 1 + 1) % 1) * count
  const index = Math.floor(position)
  const fraction = position - index
  const before = values[(index + count - 1) % count]
  const current = values[index]
  const next = values[(index + 1) % count]
  const after = values[(index + 2) % count]
  return current + fraction / 2 * (
    next - before + fraction * (2 * before - 5 * current + 4 * next - after
      + fraction * (3 * (current - next) + after - before))
  )
}

export function wavePointsAt(model: WaveModel, phase: number): WavePoint[] {
  if (!Number.isFinite(phase)) throw new Error('Favicon wave phase must be finite.')
  const { points, amplitudes } = model
  const intervals = points.length - 1
  const start = points[0]
  const end = points[intervals]

  // Translate the waveform to the right inside an envelope anchored at both endpoints.
  return points.map((point, index) => {
    if (index === 0 || index === intervals) return point
    const position = index / intervals
    const baseline = start.y + (end.y - start.y) * position
    const y = baseline + Math.sin(Math.PI * position) * samplePeriodic(amplitudes, position - phase)
    return { x: point.x, y }
  })
}

export function wavePathAt(model: WaveModel, phase: number): string {
  return wavePath(wavePointsAt(model, phase))
}

export function wavePath(points: readonly WavePoint[]): string {
  const coordinate = (value: number) => Number(value.toFixed(2))
  let path = `M${coordinate(points[0].x)} ${coordinate(points[0].y)}`

  for (let index = 0; index < points.length - 1; index++) {
    const before = points[Math.max(0, index - 1)]
    const current = points[index]
    const next = points[index + 1]
    const after = points[Math.min(points.length - 1, index + 2)]
    const control1X = current.x + (next.x - before.x) / 6
    const control1Y = current.y + (next.y - before.y) / 6
    const control2X = next.x - (after.x - current.x) / 6
    const control2Y = next.y - (after.y - current.y) / 6
    path += ` C${coordinate(control1X)} ${coordinate(control1Y)} ${coordinate(control2X)} ${coordinate(control2Y)} ${coordinate(next.x)} ${coordinate(next.y)}`
  }
  return path
}

interface Knot {
  m: number
  value: number
  slope: number
}

type TapePiece =
  | { kind: 'curve', from: Knot, to: Knot }
  | { kind: 'samples', start: number, values: number[] }

const PEAK_GAP = [4, 8.5] as const
const PEAK_SIZE = [0.55, 1] as const
const FLAT_SLOPE = 0.25

function hermite(from: Knot, to: Knot, m: number): number {
  const span = to.m - from.m
  const t = (m - from.m) / span
  const t2 = t * t
  const t3 = t2 * t
  return (2 * t3 - 3 * t2 + 1) * from.value + (t3 - 2 * t2 + t) * span * from.slope
    + (3 * t2 - 2 * t3) * to.value + (t3 - t2) * span * to.slope
}

function pieceStart(piece: TapePiece): number {
  return piece.kind === 'curve' ? Math.floor(piece.from.m) + 1 : piece.start
}

function pieceLast(piece: TapePiece): number {
  return piece.kind === 'curve' ? Math.floor(piece.to.m) : piece.start + piece.values.length - 1
}

function pieceEnd(piece: TapePiece): Knot {
  if (piece.kind === 'curve') return piece.to
  const { start, values } = piece
  const last = values.length - 1
  return { m: start + last, value: values[last], slope: last > 0 ? values[last] - values[last - 1] : 0 }
}

/**
 * An endless, randomly generated carrier that scrolls through the anchored envelope.
 * Offsets are measured in samples; at offset 0 (and at every planned rest) it shows the resting frame.
 * Tape position `m` is displayed at sample `i` when `m = offset + intervals - i`, so new content enters on the left.
 */
export class WaveTape {
  readonly intervals: number
  private readonly points: readonly WavePoint[]
  private readonly rest: number[]
  private readonly scale: number
  private readonly random: () => number
  private base = 0
  private values: number[] = []
  private queue: TapePiece[] = []
  private consumed!: Knot
  private tail!: Knot
  private anchor: Knot | null = null
  private restSize = 0

  constructor(model: WaveModel, random: () => number = Math.random) {
    this.points = model.points
    this.intervals = model.points.length - 1
    this.random = random
    // rest[i] is the carrier at display sample i (1..intervals-1).
    this.rest = model.amplitudes.slice()
    const middle = this.rest.slice(Math.round(this.intervals / 4), Math.round(this.intervals * 3 / 4) + 1)
    this.scale = Math.max(1, ...middle.map(Math.abs))
    this.reset()
  }

  reset(): void {
    const n = this.intervals
    const restTape = Array.from({ length: n - 1 }, (_, index) => this.rest[n - 1 - index])
    this.base = 0
    this.values = [2 * restTape[0] - restTape[1], ...restTape]
    this.queue = []
    this.consumed = this.restEnd(n - 1)
    this.tail = this.consumed
    this.anchor = null
  }

  pointsAt(offset: number): WavePoint[] {
    if (!Number.isFinite(offset) || offset < 0) throw new Error('Favicon wave offsets must be finite and non-negative.')
    const n = this.intervals
    this.fill(Math.floor(offset) + n + 1)
    this.trim(Math.floor(offset) - 1)
    const start = this.points[0]
    const end = this.points[n]
    return this.points.map((point, index) => {
      if (index === 0 || index === n) return point
      const position = index / n
      const baseline = start.y + (end.y - start.y) * position
      return { x: point.x, y: baseline + Math.sin(Math.PI * position) * this.sample(offset + n - index) }
    })
  }

  pathAt(offset: number): string {
    return wavePath(this.pointsAt(offset))
  }

  /** Freezes everything already shown at `offset` and finishes the current stroke on a peak or trough. */
  prepareRest(offset: number): void {
    this.fill(Math.floor(offset) + this.intervals + 1)
    const head = this.queue[0]
    const last = this.base + this.values.length - 1
    this.queue = head && pieceStart(head) <= last ? [head] : []
    let anchor = this.queue.length ? pieceEnd(this.queue[0]) : this.consumed
    if (Math.abs(anchor.slope) > FLAT_SLOPE) {
      const peak = this.nextKnot(anchor)
      this.queue.push({ kind: 'curve', from: anchor, to: peak })
      anchor = peak
    }
    this.tail = anchor
    this.anchor = anchor
    this.restSize = this.size()
  }

  /** Earliest whole-sample offset this tape can come to rest on after `prepareRest`. */
  earliestRest(): number {
    const anchor = this.requireAnchor()
    for (let offset = Math.ceil(anchor.m); ; offset++) if (this.restPlan(offset)) return offset
  }

  canRestAt(offset: number): boolean {
    return this.restPlan(offset) !== null
  }

  /** Queues random peaks, then the resting frame, so the wave settles on it at `offset`. */
  restAt(offset: number): void {
    const plan = this.restPlan(offset)
    if (!plan) throw new Error('Favicon wave cannot rest at this offset.')
    const n = this.intervals
    let from = this.requireAnchor()
    plan.peaks.forEach((m, index) => {
      const sign = -Math.sign(from.value) || 1
      const to = { m, value: sign * (index === plan.peaks.length - 1 ? this.restSize : this.size()), slope: 0 }
      this.queue.push({ kind: 'curve', from, to })
      from = to
    })
    this.queue.push({ kind: 'curve', from, to: { m: offset + 1, value: this.rest[n - 1], slope: this.rest[n - 2] - this.rest[n - 1] } })
    this.queue.push({ kind: 'samples', start: offset + 2, values: Array.from({ length: n - 2 }, (_, index) => this.rest[n - 2 - index]) })
    this.tail = this.restEnd(offset + n - 1)
    this.anchor = null
  }

  private restPlan(offset: number): { peaks: number[] } | null {
    const anchor = this.requireAnchor()
    const n = this.intervals
    const entry = this.rest[n - 1]
    const entrySlope = this.rest[n - 2] - entry
    const troughSign = -Math.sign(entrySlope || entry) || 1
    const rise = Math.abs(entry - troughSign * this.restSize)
    const steepness = Math.max(Math.abs(entrySlope), 0.1)
    const leadMin = Math.min(9, Math.max(2, 1.2 * rise / steepness))
    const leadMax = Math.min(11, Math.max(leadMin, 2.6 * rise / steepness))
    const available = offset + 1 - anchor.m
    const anchorSign = Math.sign(anchor.value) || 1
    for (let count = anchorSign === troughSign ? 0 : 1; count <= 12; count += 2) {
      const low = Math.max(count * PEAK_GAP[0], available - leadMax)
      const high = Math.min(count * PEAK_GAP[1], available - leadMin)
      if (low > high + 1e-9) continue
      const span = Math.min(high, Math.max(low, count * (PEAK_GAP[0] + PEAK_GAP[1]) / 2))
      return { peaks: Array.from({ length: count }, (_, index) => anchor.m + span * (index + 1) / count) }
    }
    return null
  }

  private requireAnchor(): Knot {
    if (!this.anchor) throw new Error('Call prepareRest before planning a favicon wave rest.')
    return this.anchor
  }

  private restEnd(m: number): Knot {
    return { m, value: this.rest[1], slope: this.rest[1] - this.rest[2] }
  }

  private between([low, high]: readonly [number, number]): number {
    return low + (high - low) * this.random()
  }

  private size(): number {
    return this.scale * this.between(PEAK_SIZE)
  }

  private nextKnot(from: Knot): Knot {
    if (Math.abs(from.slope) <= FLAT_SLOPE) {
      const sign = -Math.sign(from.value) || (this.random() < 0.5 ? -1 : 1)
      return { m: from.m + this.between(PEAK_GAP), value: sign * this.size(), slope: 0 }
    }
    const direction = Math.sign(from.slope)
    const value = direction * Math.max(this.size(), direction * from.value + 1)
    const lead = 1.5 * Math.abs(value - from.value) / Math.abs(from.slope)
    return { m: from.m + Math.min(PEAK_GAP[1], Math.max(1.5, lead)), value, slope: 0 }
  }

  private fill(index: number): void {
    while (this.base + this.values.length - 1 < index) {
      const m = this.base + this.values.length
      let head = this.queue[0]
      while (head && pieceLast(head) < m) {
        this.consumed = pieceEnd(head)
        this.queue.shift()
        head = this.queue[0]
      }
      if (!head) {
        const to = this.nextKnot(this.tail)
        this.queue.push({ kind: 'curve', from: this.tail, to })
        this.tail = to
        continue
      }
      this.values.push(head.kind === 'curve' ? hermite(head.from, head.to, m) : head.values[m - head.start])
    }
  }

  private trim(index: number): void {
    const drop = Math.min(index - this.base, this.values.length - 4)
    if (drop > 4 * this.intervals) {
      this.values.splice(0, drop)
      this.base += drop
    }
  }

  private sample(position: number): number {
    const index = Math.floor(position)
    const fraction = position - index
    const at = (m: number) => this.values[Math.min(this.values.length - 1, Math.max(0, m - this.base))]
    const before = at(index - 1)
    const current = at(index)
    const next = at(index + 1)
    const after = at(index + 2)
    return current + fraction / 2 * (
      next - before + fraction * (2 * before - 5 * current + 4 * next - after
        + fraction * (3 * (current - next) + after - before))
    )
  }
}

/** Plans a shared rest offset for several tapes and queues it on each of them. */
export function planWaveRest(tapes: readonly WaveTape[], offset: number): number {
  for (const tape of tapes) tape.prepareRest(offset)
  let target = Math.max(Math.ceil(offset) + 1, ...tapes.map((tape) => tape.earliestRest()))
  while (!tapes.every((tape) => tape.canRestAt(target))) target++
  for (const tape of tapes) tape.restAt(target)
  return target
}
