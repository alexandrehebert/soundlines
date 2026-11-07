import { publicAsset } from '../publicAsset.ts'

/** Degrees per second of a record spinning at 33⅓ rpm, i.e. normal playback speed. */
export const NORMAL_SPEED_DEG_PER_SEC = 200
export const MAX_SCRATCH_RATE = 4
const IDLE_RELEASE_MS = 60
const RATE_SMOOTHING_SECONDS = 0.012
const SAMPLE_SECONDS = 2.4
const SIDE_CROSSFADE_SECONDS = 0.08

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
  play: () => Promise<void>
  pause: () => void
  hold: () => void
  scratch: (degPerSec: number) => void
  release: () => void
  setLoop: (loop: string) => Promise<void>
  dispose: () => void
}

type LoopBuffers = { forward: AudioBuffer; reverse: AudioBuffer }
type DeckVoice = { source: AudioBufferSourceNode; gain: GainNode }

/** Public URL of a genre loop rendered by the loop pipeline (`public/loops/<slug>.wav`). */
export function loopUrl(slug: string) {
  return publicAsset(`/loops/${slug}.wav`)
}

/** Creates a Web Audio deck whose sample position is driven by the record's motion. */
export function createScratchDeck(onError?: (error: unknown) => void, loop = 'turntable-hip-hop'): ScratchDeck | null {
  const Context: AudioContextConstructor | undefined = globalThis.AudioContext
    ?? (globalThis as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  if (!Context) return null

  const context = new Context()
  const samples = renderScratchSample(context.sampleRate)
  let forward = context.createBuffer(1, samples.length, context.sampleRate)
  forward.getChannelData(0).set(samples)
  let reverse = context.createBuffer(1, samples.length, context.sampleRate)
  reverse.getChannelData(0).set(samples.slice().reverse())
  let duration = forward.duration
  let playing = false
  let held = false
  let disposed = false
  let selectedLoop = loop
  let currentLoop: string | undefined
  let playRequest = 0
  let loading = false
  const buffers = new Map<string, Promise<LoopBuffers>>()
  const download = new AbortController()

  const output = context.createGain()
  output.gain.value = 0
  const tone = context.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 3200
  output.connect(tone).connect(context.destination)

  let voice: DeckVoice | null = null
  const voices = new Set<DeckVoice>()
  let direction = 0
  let rate = 0
  let instantaneousRate = 0
  let position = 0
  let updatedAt = context.currentTime
  let idleTimer: ReturnType<typeof setTimeout> | undefined
  let pendingResumes = 0

  const activate = () => {
    if (context.state === 'running' || context.state === 'closed') return
    pendingResumes += 1
    void context.resume()
      .catch((error: unknown) => {
        console.warn('Unable to resume the vinyl scratch audio.', error)
        if (!disposed) onError?.(error)
      })
      .finally(() => { pendingResumes -= 1 })
  }

  const advance = () => {
    const now = context.currentTime
    const elapsed = now - updatedAt
    const decay = Math.exp(-elapsed / RATE_SMOOTHING_SECONDS)
    // Integrate the same exponential ramp used by playbackRate to avoid jumps when reversing.
    const distance = rate * elapsed + (instantaneousRate - rate) * RATE_SMOOTHING_SECONDS * (1 - decay)
    position = (((position + distance) % duration) + duration) % duration
    instantaneousRate = rate + (instantaneousRate - rate) * decay
    updatedAt = now
  }

  const stopVoices = () => {
    for (const active of voices) {
      active.source.stop()
      active.source.disconnect()
      active.gain.disconnect()
    }
    voices.clear()
    voice = null
  }

  const startSource = (nextDirection: number, crossfade = false) => {
    const now = context.currentTime
    if (crossfade && voice) {
      voice.gain.gain.cancelAndHoldAtTime(now)
      voice.gain.gain.linearRampToValueAtTime(0, now + SIDE_CROSSFADE_SECONDS)
      voice.source.stop(now + SIDE_CROSSFADE_SECONDS)
    } else {
      stopVoices()
    }
    const source = context.createBufferSource()
    const gain = context.createGain()
    const active = { source, gain }
    voices.add(active)
    voice = active
    source.buffer = nextDirection > 0 ? forward : reverse
    source.loop = true
    source.playbackRate.value = crossfade ? Math.abs(instantaneousRate) : 0
    gain.gain.value = crossfade ? 0 : 1
    source.connect(gain).connect(output)
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
      voices.delete(active)
    }
    source.start(now, nextDirection > 0 ? position : (duration - position) % duration)
    if (crossfade) {
      gain.gain.linearRampToValueAtTime(1, now + SIDE_CROSSFADE_SECONDS)
      source.playbackRate.setTargetAtTime(Math.abs(rate), now, RATE_SMOOTHING_SECONDS)
    } else {
      instantaneousRate = 0
    }
    direction = nextDirection
  }

  const setRate = (nextRate: number) => {
    advance()
    const speed = Math.abs(nextRate)
    const nextDirection = Math.sign(nextRate)
    if (nextDirection !== 0 && nextDirection !== direction) startSource(nextDirection)
    rate = nextRate
    const now = context.currentTime
    for (const active of voices) active.source.playbackRate.setTargetAtTime(speed, now, RATE_SMOOTHING_SECONDS)
    output.gain.setTargetAtTime(Math.min(1, speed * 1.4) * 0.8, now, speed > 0 ? 0.008 : 0.025)
  }

  const loadLoop = (slug: string) => {
    let pending = buffers.get(slug)
    if (!pending) {
      pending = (async () => {
        const response = await fetch(loopUrl(slug), { signal: download.signal })
        if (!response.ok) throw new Error(`Unable to load the turntable loop: HTTP ${response.status}`)
        const buffer = await context.decodeAudioData(await response.arrayBuffer())
        if (!buffer.length || buffer.duration <= 0) throw new Error('The turntable loop is empty.')
        const reversed = context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)
        for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
          reversed.getChannelData(channel).set(buffer.getChannelData(channel).slice().reverse())
        }
        return { forward: buffer, reverse: reversed }
      })().catch((error: unknown) => {
        buffers.delete(slug)
        throw error
      })
      buffers.set(slug, pending)
    }
    return pending
  }

  const selectLoop = async () => {
    while (!disposed && selectedLoop !== currentLoop) {
      const slug = selectedLoop
      let next: LoopBuffers
      try {
        next = await loadLoop(slug)
      } catch (error) {
        if (!disposed && selectedLoop !== slug) {
          console.warn('Unable to load a superseded turntable loop.', error)
          continue
        }
        throw error
      }
      if (disposed) return
      if (selectedLoop !== slug) continue
      if (currentLoop === slug) return
      if (currentLoop && (next.forward.length !== forward.length || next.forward.sampleRate !== forward.sampleRate)) {
        throw new Error('Turntable sides must have the same sample rate and exact loop length.')
      }
      advance()
      const switching = currentLoop !== undefined
      if (!switching) {
        stopVoices()
        direction = 0
        rate = 0
        instantaneousRate = 0
        position = 0
      }
      forward = next.forward
      reverse = next.reverse
      duration = forward.duration
      currentLoop = slug
      tone.frequency.value = context.sampleRate / 2
      if (switching && direction !== 0) startSource(direction, true)
    }
  }

  return {
    activate,
    async setLoop(slug) {
      selectedLoop = slug
      // Keep theme selection silent until the user has requested loop playback.
      if (!currentLoop && !loading) return
      await selectLoop()
    },
    async play() {
      // Resume synchronously within the activating click, before downloading.
      const resumed = context.state === 'running' ? Promise.resolve() : context.resume()
      const request = ++playRequest
      loading = true
      try {
        await Promise.all([resumed, selectLoop()])
      } finally {
        if (request === playRequest) loading = false
      }
      if (disposed || request !== playRequest) return
      playing = true
      clearTimeout(idleTimer)
      setRate(held ? 0 : 1)
    },
    pause() {
      playRequest += 1
      loading = false
      playing = false
      clearTimeout(idleTimer)
      setRate(0)
    },
    hold() {
      held = true
      clearTimeout(idleTimer)
      setRate(0)
    },
    scratch(degPerSec) {
      // A blocked resume can stay pending until a later activating gesture.
      if (pendingResumes === 0) activate()
      setRate(scratchRate(degPerSec))
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => setRate(0), IDLE_RELEASE_MS)
    },
    release() {
      held = false
      clearTimeout(idleTimer)
      setRate(playing ? 1 : 0)
    },
    dispose() {
      disposed = true
      download.abort()
      clearTimeout(idleTimer)
      stopVoices()
      buffers.clear()
      void context.close().catch((error: unknown) => console.warn('Unable to close the vinyl audio.', error))
    },
  }
}
