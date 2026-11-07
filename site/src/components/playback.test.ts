import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { followPlayback, followWaveformPlayback } from './playback.ts'

class AudioClock extends EventTarget {
  currentTime = 0
  duration = Number.NaN
  paused = true
  ended = false
}

describe('waveform playback cursor', () => {
  let audio: AudioClock
  let frames: Map<number, FrameRequestCallback>
  let cleanup: () => void
  const update = vi.fn<(progress: number) => void>()

  beforeEach(() => {
    audio = new AudioClock()
    frames = new Map()
    let id = 0
    update.mockClear()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++id, callback)
      return id
    })
    vi.stubGlobal('cancelAnimationFrame', (frame: number) => frames.delete(frame))
    cleanup = followPlayback(audio, update)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  const advanceFrame = () => {
    const scheduled = [...frames]
    frames.clear()
    for (const [, callback] of scheduled) callback(16)
  }

  it('starts at zero and aligns when metadata arrives', () => {
    expect(update).toHaveBeenLastCalledWith(0)
    expect(frames.size).toBe(0)
    audio.duration = 10
    audio.currentTime = 2
    audio.dispatchEvent(new Event('loadedmetadata'))
    expect(update).toHaveBeenLastCalledWith(0.2)
  })

  it('advances from the media clock on every frame without needing timeupdate events', () => {
    audio.duration = 10
    audio.paused = false
    audio.dispatchEvent(new Event('play'))
    audio.currentTime = 2.5
    advanceFrame()
    expect(update).toHaveBeenLastCalledWith(0.25)
    expect(frames.size).toBe(1)
    audio.currentTime = 7.5
    advanceFrame()
    expect(update).toHaveBeenLastCalledWith(0.75)
  })

  it('freezes on pause and resumes from the same position', () => {
    audio.duration = 10
    audio.paused = false
    audio.dispatchEvent(new Event('play'))
    audio.currentTime = 4
    audio.paused = true
    audio.dispatchEvent(new Event('pause'))
    expect(update).toHaveBeenLastCalledWith(0.4)
    expect(frames.size).toBe(0)
    audio.paused = false
    audio.dispatchEvent(new Event('play'))
    expect(update).toHaveBeenLastCalledWith(0.4)
    expect(frames.size).toBe(1)
  })

  it('follows seeking and duration changes while paused', () => {
    audio.duration = 10
    audio.currentTime = 8
    audio.dispatchEvent(new Event('seeking'))
    expect(update).toHaveBeenLastCalledWith(0.8)
    audio.currentTime = 2
    audio.dispatchEvent(new Event('seeked'))
    expect(update).toHaveBeenLastCalledWith(0.2)
    audio.duration = 20
    audio.dispatchEvent(new Event('durationchange'))
    expect(update).toHaveBeenLastCalledWith(0.1)
    expect(frames.size).toBe(0)
  })

  it('wraps with looping audio and stops at the end when not looping', () => {
    audio.duration = 10
    audio.paused = false
    audio.dispatchEvent(new Event('play'))
    audio.currentTime = 9.9
    advanceFrame()
    expect(update).toHaveBeenLastCalledWith(0.99)
    audio.currentTime = 0.1
    advanceFrame()
    expect(update).toHaveBeenLastCalledWith(0.01)
    audio.currentTime = 10
    audio.ended = true
    audio.dispatchEvent(new Event('ended'))
    expect(update).toHaveBeenLastCalledWith(1)
    expect(frames.size).toBe(0)
  })

  it('cancels pending frames and removes listeners when unmounted', () => {
    audio.duration = 10
    audio.paused = false
    audio.dispatchEvent(new Event('play'))
    audio.dispatchEvent(new Event('play'))
    expect(frames.size).toBe(1)
    cleanup()
    update.mockClear()
    audio.dispatchEvent(new Event('timeupdate'))
    audio.dispatchEvent(new Event('play'))
    advanceFrame()
    expect(update).not.toHaveBeenCalled()
    expect(frames.size).toBe(0)
  })

  it('attaches to audio that is already playing and resets when its source is emptied', () => {
    cleanup()
    audio.duration = 10
    audio.currentTime = 3
    audio.paused = false
    cleanup = followPlayback(audio, update)
    expect(update).toHaveBeenLastCalledWith(0.3)
    expect(frames.size).toBe(1)
    audio.duration = Number.NaN
    audio.currentTime = 0
    audio.paused = true
    audio.dispatchEvent(new Event('emptied'))
    expect(update).toHaveBeenLastCalledWith(0)
    expect(frames.size).toBe(0)
  })

  it('keeps the waveform color and cursor on the same playback progress', () => {
    cleanup()
    const style = { setProperty: vi.fn() }
    cleanup = followWaveformPlayback(audio, { style })
    expect(style.setProperty).toHaveBeenLastCalledWith('--progress', '0%')
    audio.duration = 10
    audio.currentTime = 2.5
    audio.dispatchEvent(new Event('seeked'))
    expect(style.setProperty).toHaveBeenLastCalledWith('--progress', '25%')
    audio.paused = false
    audio.dispatchEvent(new Event('play'))
    audio.currentTime = 7.5
    advanceFrame()
    expect(style.setProperty).toHaveBeenLastCalledWith('--progress', '75%')
    audio.currentTime = 0.1
    advanceFrame()
    expect(style.setProperty).toHaveBeenLastCalledWith('--progress', '1%')
    audio.paused = true
    audio.dispatchEvent(new Event('pause'))
    expect(frames.size).toBe(0)
  })
})
