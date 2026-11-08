import { Disc3, LoaderCircle, Pause, Play } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { claimPlayback, releasePlayback } from './exclusivePlayback.ts'

export function AudioPreviewPlayer({ url, label }: { url: string; label: string }) {
  const t = useTranslations('audio')
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused' | 'failed'>('idle')
  const audio = useRef<HTMLAudioElement>(null)
  const stopPlayback = useCallback(() => audio.current?.pause(), [])
  const attachAudio = useCallback((element: HTMLAudioElement | null) => {
    if (!element) return
    audio.current = element
    return () => {
      audio.current = null
      releasePlayback(stopPlayback)
      element.pause()
    }
  }, [stopPlayback])

  const togglePlayback = async () => {
    const element = audio.current
    if (!element) return
    if (!element.paused) {
      element.pause()
      return
    }
    setStatus('loading')
    try {
      await element.play()
    } catch (error) {
      if (audio.current === element && !(error instanceof DOMException && error.name === 'AbortError')) {
        setStatus('failed')
      }
    }
  }

  if (status === 'failed') {
    return <p role="status" className="text-xs text-slate-400">{t('failed')}</p>
  }

  const playing = status === 'playing'
  const loading = status === 'loading'
  const iconTransition = 'pointer-events-none absolute grid place-items-center motion-safe:transition-[opacity,scale] motion-safe:duration-200 motion-safe:ease-out'
  return (
    <>
      <audio
        ref={attachAudio}
        src={url}
        preload="none"
        onPlay={() => claimPlayback(stopPlayback)}
        onPlaying={(event) => { if (!event.currentTarget.paused) setStatus('playing') }}
        onWaiting={(event) => { if (!event.currentTarget.paused) setStatus('loading') }}
        onPause={() => setStatus('paused')}
        onEnded={() => setStatus('paused')}
        onError={() => setStatus('failed')}
      />
      <button
        type="button"
        aria-label={`${playing || loading ? t('pause') : t('play')} ${label}`}
        title={`${playing || loading ? t('pause') : t('play')} ${label}`}
        onClick={togglePlayback}
        className="group relative grid h-11 w-11 place-items-center rounded-full border border-slate-700 bg-slate-900 text-slate-100 hover:border-cyan-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 motion-safe:transition-colors motion-safe:duration-200"
      >
        <span
          className={`${iconTransition} text-cyan-300 ${playing
            ? 'opacity-100 group-hover:scale-90 group-hover:opacity-0 group-focus-visible:scale-90 group-focus-visible:opacity-0'
            : 'scale-90 opacity-0'}`}
          aria-hidden="true"
        >
          <span className="motion-safe:animate-spin" style={{ animationDuration: '2s', animationPlayState: playing ? 'running' : 'paused' }}>
            <Disc3 size={29} />
          </span>
        </span>
        <span
          className={`${iconTransition} scale-90 opacity-0 ${playing
            ? 'group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100'
            : ''}`}
          aria-hidden="true"
        >
          <Pause size={16} fill="currentColor" />
        </span>
        <span
          className={`${iconTransition} ${playing || loading ? 'scale-90 opacity-0' : 'opacity-100'}`}
          aria-hidden="true"
        >
          <Play size={15} fill="currentColor" />
        </span>
        <span className={`${iconTransition} ${loading ? 'opacity-100' : 'scale-90 opacity-0'}`} aria-hidden="true">
          <span className={loading ? 'motion-safe:animate-spin' : ''}><LoaderCircle size={21} /></span>
        </span>
      </button>
      <span role="status" className="sr-only">{loading ? t('buffering') : ''}</span>
    </>
  )
}
