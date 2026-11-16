import { useCallback, useRef, useState } from 'react'

export function usePreview() {
  const audio = useRef<HTMLAudioElement>(null)
  const request = useRef(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'error'>('idle')
  const [progress, setProgress] = useState(0)

  const stop = useCallback(() => {
    request.current += 1
    const player = audio.current
    if (player?.hasAttribute('src')) {
      player.pause()
      player.removeAttribute('src')
      player.load()
    }
    setStatus('idle')
    setProgress(0)
  }, [])

  async function toggle(url: string) {
    const player = audio.current
    if (!player) return
    if (!player.paused && player.getAttribute('src') === url) {
      player.pause()
      setStatus('paused')
      return
    }
    const sequence = ++request.current
    if (player.getAttribute('src') !== url || status === 'error') {
      player.src = url
      setProgress(0)
    }
    setStatus('loading')
    try {
      await player.play()
      if (request.current === sequence) setStatus('playing')
    } catch {
      if (request.current === sequence) setStatus('error')
    }
  }

  return {
    audio,
    preview: { status, progress, stop, toggle },
    events: {
      onTimeUpdate() {
        const player = audio.current
        if (player && Number.isFinite(player.duration) && player.duration > 0) {
          setProgress(player.currentTime / player.duration)
        }
      },
      onPause() {
        if (audio.current?.paused) setStatus((previous) => previous === 'playing' ? 'paused' : previous)
      },
      onEnded() {
        setStatus('idle')
        setProgress(0)
      },
      onError() {
        if (audio.current?.hasAttribute('src')) setStatus('error')
      },
    },
  }
}
