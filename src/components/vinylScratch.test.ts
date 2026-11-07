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
  decodeAudioData = vi.fn(async () => this.createBuffer(2, 4000, 1000))

  constructor() {
    TestAudioContext.instances.push(this)
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    const channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length))
    return { duration: length / sampleRate, length, sampleRate, numberOfChannels, getChannelData: (channel: number) => channels[channel] }
  }

  createGain() {
    return { gain: this.gain, connect: () => ({ connect: () => {} }) }
  }

  createBiquadFilter() {
    return { type: '', frequency: { value: 0 } }
  }

  createBufferSource() {
    const source = {
      buffer: null as ReturnType<TestAudioContext['createBuffer']> | null,
      loop: false,
      playbackRate: { value: 0, setTargetAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn((_when: number, _offset: number) => {}),
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

  it('loads only on play, scratches the stereo loop in both directions, and resumes on release', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const fetchAudio = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchAudio)
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    const buffer = context.createBuffer(2, 4000, 1000)
    buffer.getChannelData(0).set([0.1, 0.2])
    buffer.getChannelData(1).set([0.3, 0.4])
    context.decodeAudioData.mockResolvedValueOnce(buffer)
    expect(fetchAudio).not.toHaveBeenCalled()

    await deck.play()
    expect(fetchAudio).toHaveBeenCalledOnce()
    expect(fetchAudio).toHaveBeenCalledWith('/loops/hip-hop.wav', expect.anything())
    expect(context.sources[0].buffer).toBe(buffer)
    expect(context.sources[0].loop).toBe(true)
    context.currentTime = 0.5
    deck.hold()
    expect(context.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0.5, 0.025)
    deck.scratch(-NORMAL_SPEED_DEG_PER_SEC)
    const reverse = context.sources[1].buffer!
    expect(reverse.numberOfChannels).toBe(2)
    expect(reverse.getChannelData(1)[3999]).toBeCloseTo(0.3)
    expect(context.sources[1].start).toHaveBeenCalledOnce()
    expect(context.sources[1].start.mock.calls[0][1]).toBeCloseTo(3.512, 8)
    deck.release()
    expect(context.sources[2].buffer).toBe(buffer)
    expect(context.sources[2].playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(1, 0.5, 0.012)
    deck.pause()
    expect(context.gain.setTargetAtTime).toHaveBeenLastCalledWith(0, 0.5, 0.025)
    await deck.play()
    expect(fetchAudio).toHaveBeenCalledOnce()
    deck.dispose()
  })

  it('uses a valid zero offset when reversing at the start of the loop', () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const deck = createScratchDeck()!
    deck.scratch(-NORMAL_SPEED_DEG_PER_SEC)
    expect(TestAudioContext.instances[0].sources[0].start).toHaveBeenCalledWith(0, 0)
    deck.dispose()
  })

  it('reports loading failures to the caller and allows retry', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const fetchAudio = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    vi.stubGlobal('fetch', fetchAudio)
    const deck = createScratchDeck()!
    TestAudioContext.instances[0].state = 'running'
    await expect(deck.play()).rejects.toThrow('HTTP 503')
    await expect(deck.play()).resolves.toBeUndefined()
    expect(fetchAudio).toHaveBeenCalledTimes(2)
    deck.dispose()
  })

  it('does not start playback if unmounted while decoding', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    const play = deck.play()
    deck.dispose()
    await play
    expect(context.sources).toHaveLength(0)
  })
})
