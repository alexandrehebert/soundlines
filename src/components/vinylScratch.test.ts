import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_SCRATCH_RATE, NORMAL_SPEED_DEG_PER_SEC, angleDelta, createScratchDeck, renderScratchSample, scratchRate } from './vinylScratch.ts'

class TestAudioContext {
  static instances: TestAudioContext[] = []
  state: 'suspended' | 'interrupted' | 'running' | 'closed' = 'suspended'
  sampleRate = 1000
  currentTime = 0
  destination = {}
  gain = { value: 0, setTargetAtTime: vi.fn() }
  sources: ReturnType<TestAudioContext['createBufferSource']>[] = []
  resume = vi.fn(() => new Promise<void>(() => {}))
  close = vi.fn(() => Promise.resolve())

  constructor() {
    TestAudioContext.instances.push(this)
  }

  createBuffer(_channels: number, length: number, sampleRate: number) {
    const data = new Float32Array(length)
    return { duration: length / sampleRate, getChannelData: () => data }
  }

  createGain() {
    return { gain: this.gain, connect: () => ({ connect: () => {} }) }
  }

  createBiquadFilter() {
    return { type: '', frequency: { value: 0 } }
  }

  createBufferSource() {
    const source = {
      buffer: null,
      loop: false,
      playbackRate: { value: 0, setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    }
    this.sources.push(source)
    return source
  }
}

describe('vinyl scratch', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    TestAudioContext.instances.length = 0
  })

  it('measures the shortest signed rotation across the ±180° seam', () => {
    expect(angleDelta(10, 30)).toBe(20)
    expect(angleDelta(30, 10)).toBe(-20)
    expect(angleDelta(170, -170)).toBe(20)
    expect(angleDelta(-170, 170)).toBe(-20)
  })

  it('maps record speed to a signed, clamped playback rate', () => {
    expect(scratchRate(NORMAL_SPEED_DEG_PER_SEC)).toBe(1)
    expect(scratchRate(-NORMAL_SPEED_DEG_PER_SEC / 2)).toBe(-0.5)
    expect(scratchRate(1e6)).toBe(MAX_SCRATCH_RATE)
    expect(scratchRate(-1e6)).toBe(-MAX_SCRATCH_RATE)
  })

  it('renders an audible, unclipped sample', () => {
    const sample = renderScratchSample(8000, 0.5)
    expect(sample).toHaveLength(4000)
    const peak = sample.reduce((max, value) => Math.max(max, Math.abs(value)), 0)
    expect(peak).toBeGreaterThan(0.1)
    expect(peak).toBeLessThanOrEqual(1)
  })

  it('degrades gracefully without Web Audio', () => {
    expect(createScratchDeck()).toBeNull()
  })

  it('resumes suspended and interrupted audio on a gesture, including a retry while pending', () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]

    deck.activate()
    deck.activate()
    expect(context.resume).toHaveBeenCalledTimes(2)
    context.state = 'interrupted'
    deck.activate()
    expect(context.resume).toHaveBeenCalledTimes(3)
    context.state = 'running'
    deck.activate()
    context.state = 'closed'
    deck.activate()
    expect(context.resume).toHaveBeenCalledTimes(3)
    deck.dispose()
  })

  it('avoids repeated resume requests during a drag and releases the scratch sound', () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', TestAudioContext)
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]

    deck.activate()
    deck.scratch(NORMAL_SPEED_DEG_PER_SEC)
    deck.scratch(-NORMAL_SPEED_DEG_PER_SEC)
    expect(context.resume).toHaveBeenCalledOnce()
    expect(context.sources).toHaveLength(2)
    expect(context.sources[0].stop).toHaveBeenCalledOnce()
    expect(context.gain.setTargetAtTime).toHaveBeenLastCalledWith(0.8, 0, 0.008)

    deck.release()
    expect(context.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.025)
    expect(vi.getTimerCount()).toBe(0)
    deck.dispose()
    expect(context.close).toHaveBeenCalledOnce()
  })

  it('reports an audio resume failure', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    const error = new Error('Audio unavailable')
    context.resume.mockRejectedValueOnce(error)

    deck.activate()
    await vi.waitFor(() => expect(warn).toHaveBeenCalledWith('Unable to resume the vinyl scratch audio.', error))
    deck.dispose()
  })
})
