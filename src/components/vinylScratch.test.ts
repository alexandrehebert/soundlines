import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_SCRATCH_RATE, NORMAL_SPEED_DEG_PER_SEC, angleDelta, createScratchDeck, renderScratchSample, scratchRate, spectrumBands } from './vinylScratch.ts'

class TestAudioContext {
  static instances: TestAudioContext[] = []
  state: 'suspended' | 'interrupted' | 'running' | 'closed' = 'suspended'
  sampleRate = 1000
  currentTime = 0
  destination = {}
  gain = this.createGainParameter()
  gains: ReturnType<TestAudioContext['createGain']>[] = []
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

  createGainParameter() {
    return { value: 0, setTargetAtTime: vi.fn(), cancelAndHoldAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }
  }

  createGain() {
    const node = {
      gain: this.gains.length ? this.createGainParameter() : this.gain,
      connect: vi.fn(() => node),
      disconnect: vi.fn(),
    }
    this.gains.push(node)
    return node
  }

  createBiquadFilter() {
    return { type: '', frequency: { value: 0 } }
  }

  createAnalyser() {
    return { fftSize: 0, smoothingTimeConstant: 0, frequencyBinCount: 512, getByteFrequencyData: vi.fn((bins: Uint8Array) => bins.fill(255)) }
  }

  createBufferSource() {
    const source = {
      buffer: null as ReturnType<TestAudioContext['createBuffer']> | null,
      loop: false,
      playbackRate: { value: 0, setTargetAtTime: vi.fn() },
      connect: vi.fn((node: ReturnType<TestAudioContext['createGain']>) => node),
      start: vi.fn((_when: number, _offset: number) => {}),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null as (() => void) | null,
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

  it('groups FFT bins into normalised log-spaced bands', () => {
    const bins = new Uint8Array(512)
    bins.fill(255, 0, 20)
    const levels = spectrumBands(bins, 44100, new Float32Array(8))
    expect(levels[0]).toBe(1)
    expect(levels[7]).toBe(0)
    expect(levels.every((level) => level >= 0 && level <= 1)).toBe(true)
  })

  it('exposes the output spectrum as levels', () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const deck = createScratchDeck()!
    const levels = new Float32Array(4)
    deck.readLevels(levels)
    expect([...levels]).toEqual([1, 1, 1, 1])
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
    expect(fetchAudio).toHaveBeenCalledWith('/loops/turntable-hip-hop.wav', expect.anything())
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

  it('selects the initial theme silently and loads its side only on play', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const fetchAudio = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchAudio)
    const deck = createScratchDeck(undefined, 'turntable-trap')!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    await deck.setLoop('turntable-hip-hop')
    await deck.setLoop('turntable-trap')
    expect(fetchAudio).not.toHaveBeenCalled()
    expect(context.sources).toHaveLength(0)
    await deck.play()
    expect(fetchAudio).toHaveBeenCalledWith('/loops/turntable-trap.wav', expect.anything())
    deck.dispose()
  })

  it('crossfades at the current position and speed, and caches both sides', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const fetchAudio = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchAudio)
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    await deck.play()
    const original = context.sources[0].buffer
    const trap = context.createBuffer(2, 4000, 1000)
    context.decodeAudioData.mockResolvedValueOnce(trap)
    context.currentTime = 1.25
    await deck.setLoop('turntable-trap')
    expect(context.sources[1].buffer).toBe(trap)
    expect(context.sources[1].start.mock.calls[0][0]).toBe(1.25)
    expect(context.sources[1].start.mock.calls[0][1]).toBeCloseTo(1.238, 8)
    expect(context.sources[1].playbackRate.value).toBeCloseTo(1, 8)
    expect(context.sources[0].stop).toHaveBeenCalledWith(1.33)
    expect(context.gains[1].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, 1.33)
    expect(context.gains[2].gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(1, 1.33)
    context.sources[0].onended?.()
    expect(context.gains[1].disconnect).toHaveBeenCalledOnce()
    context.currentTime = 1.5
    await deck.setLoop('turntable-hip-hop')
    expect(context.sources[2].buffer).toBe(original)
    expect(context.sources[2].start.mock.calls[0][1]).toBeCloseTo(1.488, 8)
    expect(fetchAudio).toHaveBeenCalledTimes(2)
    await deck.setLoop('turntable-hip-hop')
    expect(context.sources).toHaveLength(3)
    deck.dispose()
  })

  it('does not resume paused or held playback when switching sides', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    await deck.play()
    deck.pause()
    context.currentTime = 1
    context.state = 'suspended'
    await deck.setLoop('turntable-trap')
    expect(context.resume).not.toHaveBeenCalled()
    expect(context.sources[1].playbackRate.value).toBeCloseTo(0)
    expect(context.sources[1].playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(0, 1, 0.012)
    context.state = 'running'
    await deck.play()
    deck.hold()
    context.currentTime = 2
    await deck.setLoop('turntable-hip-hop')
    expect(context.sources[2].playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(0, 2, 0.012)
    deck.release()
    expect(context.sources[2].playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(1, 2, 0.012)
    deck.dispose()
  })

  it('preserves reverse scratching and stereo data when switching sides', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('AudioContext', TestAudioContext)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    await deck.play()
    const trap = context.createBuffer(2, 4000, 1000)
    trap.getChannelData(1)[0] = 0.75
    context.decodeAudioData.mockResolvedValueOnce(trap)
    deck.hold()
    deck.scratch(-NORMAL_SPEED_DEG_PER_SEC / 2)
    context.currentTime = 0.05
    await deck.setLoop('turntable-trap')
    const active = context.sources[2]
    expect(active.buffer!.getChannelData(1)[3999]).toBe(0.75)
    expect(active.start.mock.calls[0][1]).toBeCloseTo(0.0190930231, 8)
    expect(active.playbackRate.value).toBeCloseTo(0.4922480732, 8)
    expect(active.playbackRate.setTargetAtTime).toHaveBeenLastCalledWith(0.5, 0.05, 0.012)
    deck.release()
    expect(context.sources[3].buffer).toBe(trap)
    deck.dispose()
  })

  it('rejects mismatched loop lengths without replacing the playing side', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    await deck.play()
    context.decodeAudioData.mockResolvedValueOnce(context.createBuffer(2, 4100, 1000))
    await expect(deck.setLoop('turntable-trap')).rejects.toThrow('exact loop length')
    expect(context.sources).toHaveLength(1)
    expect(context.sources[0].stop).not.toHaveBeenCalled()
    deck.dispose()
  })

  it('reports a side download failure and retries without restarting the original', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const fetchAudio = vi.fn()
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })
    vi.stubGlobal('fetch', fetchAudio)
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    await deck.play()
    await expect(deck.setLoop('turntable-trap')).rejects.toThrow('HTTP 503')
    expect(context.sources).toHaveLength(1)
    await deck.setLoop('turntable-trap')
    expect(context.sources).toHaveLength(2)
    deck.dispose()
  })

  it('ignores a late download after toggling back to the current side', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const fetchAudio = vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    vi.stubGlobal('fetch', fetchAudio)
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    await deck.play()
    let finish!: (buffer: ReturnType<TestAudioContext['createBuffer']>) => void
    context.decodeAudioData.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const switchSide = deck.setLoop('turntable-trap')
    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledTimes(2))
    await deck.setLoop('turntable-hip-hop')
    finish(context.createBuffer(2, 4000, 1000))
    await switchSide
    expect(context.sources).toHaveLength(1)
    deck.dispose()
  })

  it('uses the latest theme when it changes during initial loading', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    let finish!: (buffer: ReturnType<TestAudioContext['createBuffer']>) => void
    context.decodeAudioData.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const play = deck.play()
    await vi.waitFor(() => expect(context.decodeAudioData).toHaveBeenCalledOnce())
    const side = deck.setLoop('turntable-trap')
    await side
    const selected = context.sources.length
    finish(context.createBuffer(2, 4000, 1000))
    await play
    expect(selected).toBe(0)
    expect(context.sources).toHaveLength(1)
    expect(context.decodeAudioData).toHaveBeenCalledTimes(2)
    deck.dispose()
  })

  it('does not resume a play request cancelled while downloading', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    const deck = createScratchDeck()!
    const context = TestAudioContext.instances[0]
    context.state = 'running'
    const play = deck.play()
    deck.pause()
    await play
    expect(context.sources).toHaveLength(0)
    deck.dispose()
  })

  it('aborts downloads and stops every crossfading voice on disposal', async () => {
    vi.stubGlobal('AudioContext', TestAudioContext)
    const fetchAudio = vi.fn(async (_url: string, _options: { signal: AbortSignal }) => ({
      ok: true, arrayBuffer: async () => new ArrayBuffer(8),
    }))
    vi.stubGlobal('fetch', fetchAudio)
    const deck = createScratchDeck()!
    TestAudioContext.instances[0].state = 'running'
    await deck.play()
    await deck.setLoop('turntable-trap')
    deck.dispose()
    const context = TestAudioContext.instances[0]
    expect(context.sources[0].disconnect).toHaveBeenCalled()
    expect(context.sources[1].stop).toHaveBeenCalled()
    const options = fetchAudio.mock.calls[0][1]
    expect(options.signal.aborted).toBe(true)
  })
})
