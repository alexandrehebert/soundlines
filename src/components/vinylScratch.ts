/** Degrees per second of a record spinning at 33⅓ rpm, i.e. normal playback speed. */
export const NORMAL_SPEED_DEG_PER_SEC = 200
export const MAX_SCRATCH_RATE = 4
const IDLE_RELEASE_MS = 60
const SAMPLE_SECONDS = 2.4

/** Shortest signed angular difference in degrees, in (-180, 180]. */
export function angleDelta(from: number, to: number) {
  const delta = (((to - from) % 360) + 540) % 360 - 180
  return delta === -180 ? 180 : delta
}

/** Signed playback rate for a record moving at the given angular speed. */
export function scratchRate(degPerSec: number) {
  const rate = degPerSec / NORMAL_SPEED_DEG_PER_SEC
  return Math.max(-MAX_SCRATCH_RATE, Math.min(MAX_SCRATCH_RATE, rate))
}

const VOWELS = [
  [730, 1090, 2440],
  [570, 840, 2410],
  [300, 870, 2240],
  [660, 1720, 2410],
] as const

/** Renders a short "ahh-ohh" vocal phrase with crackle — a classic scratch sample. */
export function renderScratchSample(sampleRate: number, seconds = SAMPLE_SECONDS) {
  const length = Math.floor(sampleRate * seconds)
  const data = new Float32Array(length)
  const syllable = seconds / VOWELS.length
  let phase = 0
  let seed = 1
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }

  for (let i = 0; i < length; i += 1) {
    const t = i / sampleRate
    const index = Math.min(VOWELS.length - 1, Math.floor(t / syllable))
    const local = (t - index * syllable) / syllable
    const f0 = 150 * (1 + 0.18 * Math.sin(local * Math.PI)) * (1 + 0.012 * Math.sin(t * 2 * Math.PI * 5.5))
    phase += f0 / sampleRate
    const envelope = Math.min(1, local * 14) * Math.min(1, (1 - local) * 6)
    const formants = VOWELS[index]
    let voice = 0
    for (let harmonic = 1; harmonic * f0 < 4200; harmonic += 1) {
      const frequency = harmonic * f0
      let weight = 0
      for (let f = 0; f < formants.length; f += 1) {
        const width = 90 + f * 60
        weight += Math.exp(-(((frequency - formants[f]) / width) ** 2)) / (f + 1)
      }
      voice += (weight / Math.sqrt(harmonic)) * Math.sin(2 * Math.PI * harmonic * phase)
    }
    const crackle = random() > 0.9993 ? (random() - 0.5) * 0.9 : (random() - 0.5) * 0.02
    data[i] = voice * envelope * 0.32 + crackle
  }
  return data
}

type AudioContextConstructor = typeof AudioContext

export interface ScratchDeck {
  activate: () => void
  scratch: (degPerSec: number) => void
  release: () => void
  dispose: () => void
}

/** Creates a Web Audio deck whose sample position is driven by the record's motion. */
export function createScratchDeck(): ScratchDeck | null {
  const Context: AudioContextConstructor | undefined = globalThis.AudioContext
    ?? (globalThis as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  if (!Context) return null

  const context = new Context()
  const samples = renderScratchSample(context.sampleRate)
  const forward = context.createBuffer(1, samples.length, context.sampleRate)
  forward.getChannelData(0).set(samples)
  const reverse = context.createBuffer(1, samples.length, context.sampleRate)
  reverse.getChannelData(0).set(samples.slice().reverse())
  const duration = forward.duration

  const output = context.createGain()
  output.gain.value = 0
  const tone = context.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 3200
  output.connect(tone).connect(context.destination)

  let source: AudioBufferSourceNode | null = null
  let direction = 0
  let rate = 0
  let position = 0
  let updatedAt = context.currentTime
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let pendingResumes = 0

  const activate = () => {
    if (context.state === 'running' || context.state === 'closed') return
    pendingResumes += 1
    void context.resume()
      .catch((error: unknown) => console.warn('Unable to resume the vinyl scratch audio.', error))
      .finally(() => { pendingResumes -= 1 })
  }

  const advance = () => {
    const now = context.currentTime
    position = (((position + rate * (now - updatedAt)) % duration) + duration) % duration
    updatedAt = now
  }

  const startSource = (nextDirection: number) => {
    source?.stop()
    source?.disconnect()
    source = context.createBufferSource()
    source.buffer = nextDirection > 0 ? forward : reverse
    source.loop = true
    source.playbackRate.value = 0
    source.connect(output)
    source.start(0, nextDirection > 0 ? position : duration - position)
    direction = nextDirection
  }

  const setRate = (nextRate: number) => {
    advance()
    const speed = Math.abs(nextRate)
    const nextDirection = Math.sign(nextRate)
    if (nextDirection !== 0 && nextDirection !== direction) startSource(nextDirection)
    rate = nextRate
    const now = context.currentTime
    source?.playbackRate.setTargetAtTime(speed, now, 0.012)
    output.gain.setTargetAtTime(Math.min(1, speed * 1.4) * 0.8, now, speed > 0 ? 0.008 : 0.025)
  }

  return {
    activate,
    scratch(degPerSec) {
      // A blocked resume can stay pending until a later activating gesture.
      if (pendingResumes === 0) activate()
      setRate(scratchRate(degPerSec))
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => setRate(0), IDLE_RELEASE_MS)
    },
    release() {
      clearTimeout(idleTimer)
      setRate(0)
    },
    dispose() {
      clearTimeout(idleTimer)
      source?.stop()
      void context.close()
    },
  }
}
