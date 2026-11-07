type PlaybackSource = EventTarget & Pick<HTMLMediaElement, 'currentTime' | 'duration' | 'paused' | 'ended'>

/** Follow the media clock rather than elapsed wall time, including seeks and loop restarts. */
export function followPlayback(audio: PlaybackSource, update: (progress: number) => void) {
  let frame: number | undefined
  const sync = () => {
    const progress = Number.isFinite(audio.duration) && audio.duration > 0
      ? Math.max(0, Math.min(1, audio.currentTime / audio.duration))
      : 0
    update(progress)
  }
  const cancel = () => {
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
  }
  const tick = () => {
    frame = undefined
    sync()
    if (!audio.paused && !audio.ended) frame = requestAnimationFrame(tick)
  }
  const start = () => {
    cancel()
    tick()
  }
  const stop = () => {
    cancel()
    sync()
  }
  const syncEvents = ['loadedmetadata', 'durationchange', 'timeupdate', 'seeking', 'seeked'] as const
  const stopEvents = ['pause', 'ended', 'emptied'] as const

  audio.addEventListener('play', start)
  for (const event of syncEvents) audio.addEventListener(event, sync)
  for (const event of stopEvents) audio.addEventListener(event, stop)
  start()

  return () => {
    cancel()
    audio.removeEventListener('play', start)
    for (const event of syncEvents) audio.removeEventListener(event, sync)
    for (const event of stopEvents) audio.removeEventListener(event, stop)
  }
}

/** Drive the played waveform and cursor from the same media progress. */
export function followWaveformPlayback(audio: PlaybackSource, waveform: { style: Pick<CSSStyleDeclaration, 'setProperty'> }) {
  return followPlayback(audio, (progress) => {
    waveform.style.setProperty('--progress', `${progress * 100}%`)
  })
}
