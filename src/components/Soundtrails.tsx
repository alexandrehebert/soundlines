import { ArrowLeft, ArrowRight, ArrowUpRight, ChartGantt, Disc3, LoaderCircle, Pause, Play, Route, X } from 'lucide-react'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from 'react'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../ExplorerContext.ts'
import type { AvailableSoundtrail, Soundtrail } from '../graph/soundtrails.ts'
import { graphLabels } from '../i18n/graphLabels.ts'
import { publicAsset } from '../publicAsset.ts'
import { formatYear } from '../theme.ts'
import { EntryLink } from './HomeLinks.tsx'
import { InfoBadge } from './InfoBadge.tsx'
import { claimPlayback, releasePlayback } from './exclusivePlayback.ts'

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'failed'

function previewUrl(id: string) {
  return publicAsset(`/genre-previews/${encodeURIComponent(id.slice('genre:'.length))}.m4a`)
}

const MOBILE_QUERY = '(width < 48rem)'

function subscribeMobile(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false)
}

function TrailSheet({ variant, title, closeLabel, resetKey, onClose, onStep, onRemoved, footer, children }: {
  variant: 'sheet' | 'modal'
  title: string
  closeLabel: string
  resetKey: string
  onClose: () => void
  onStep: (delta: -1 | 1) => void
  onRemoved: () => void
  footer: ReactNode
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const dragControls = useDragControls()
  const body = useRef<HTMLDivElement>(null)
  const sheet = variant === 'sheet'
  const panelMotion = reduceMotion
    ? { initial: false as const, transition: { duration: 0 } }
    : sheet
      ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' }, transition: { type: 'spring', stiffness: 360, damping: 36 } as const }
      : { initial: { opacity: 0, y: 16, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 16, scale: 0.98 }, transition: { duration: 0.2, ease: 'easeOut' } as const }

  const openDialog = useCallback((element: HTMLDialogElement | null) => {
    if (!element || element.open) return
    element.showModal()
    element.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })
  }, [])

  const callbacks = useRef({ onStep, onRemoved })
  useEffect(() => { callbacks.current = { onStep, onRemoved } })

  useEffect(() => {
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    const handleKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      callbacks.current.onStep(event.key === 'ArrowLeft' ? -1 : 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      root.style.overflow = previous
      // The dialog must be out of the DOM (no longer modal) before focus can return to the page.
      requestAnimationFrame(() => callbacks.current.onRemoved())
    }
  }, [])

  useEffect(() => {
    body.current?.scrollTo({ top: 0 })
  }, [resetKey])

  return (
    <dialog
      ref={openDialog}
      className="soundtrails-sheet"
      data-variant={variant}
      aria-labelledby="soundtrails-sheet-title"
      aria-keyshortcuts="ArrowLeft ArrowRight"
      onCancel={(event) => { event.preventDefault(); onClose() }}
    >
      <motion.div
        className="soundtrails-sheet-backdrop"
        aria-hidden="true"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
      />
      <motion.div
        className="soundtrails-sheet-panel"
        drag={sheet ? 'y' : false}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 600) onClose() }}
        {...panelMotion}
      >
        <div className="soundtrails-sheet-header" onPointerDown={sheet ? (event) => dragControls.start(event) : undefined}>
          {sheet && <span className="soundtrails-sheet-handle" aria-hidden="true" />}
          <p id="soundtrails-sheet-title" className="soundtrails-sheet-title">
            <Route size={17} aria-hidden="true" /> {title}
          </p>
          <button
            type="button"
            className="soundtrails-sheet-close"
            aria-label={closeLabel}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onClose}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div ref={body} className="soundtrails-sheet-body">{children}</div>
        <div className="soundtrails-sheet-footer">{footer}</div>
      </motion.div>
    </dialog>
  )
}

export function Soundtrails({ trails, ref, headingLevel = 2 }: { trails: AvailableSoundtrail[]; ref?: Ref<HTMLElement>; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const StopHeading = headingLevel === 3 ? 'h4' : 'h3'
  const { locale } = useExplorer()
  const t = useTranslations('homeCopy.soundtrails')
  const tAudio = useTranslations('audio')
  const tRoot = useTranslations()
  const isMobile = useIsMobile()
  const labels = graphLabels(locale)
  const reduceMotion = useReducedMotion()
  const [trailId, setTrailId] = useState<Soundtrail['id'] | null>(null)
  const [position, setPosition] = useState(0)
  const [status, setStatus] = useState<PlayerStatus>('idle')
  const audio = useRef<HTMLAudioElement>(null)
  const keepPlaying = useRef(false)
  const focusStop = useRef(false)
  const opener = useRef<HTMLElement | null>(null)
  const active = trails.find(({ trail }) => trail.id === trailId)
  const stop = active?.stops[position]
  const last = active ? position === active.stops.length - 1 : false

  useEffect(() => {
    const element = audio.current
    if (!element || !stop) return
    if (!keepPlaying.current) return
    setStatus('loading')
    element.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus('failed')
    })
  }, [stop])

  const stopPlayback = useCallback(() => {
    keepPlaying.current = false
    audio.current?.pause()
  }, [])

  const attachAudio = useCallback((element: HTMLAudioElement | null) => {
    if (!element) return
    audio.current = element
    return () => {
      audio.current = null
      releasePlayback(stopPlayback)
      element.pause()
    }
  }, [stopPlayback])

  const restoreOpenerFocus = () => {
    const focused = document.activeElement
    if (!focused || focused === document.body) opener.current?.focus({ preventScroll: true })
  }

  const attachStopHeading = useCallback((element: HTMLHeadingElement | null) => {
    if (!element || !focusStop.current) return
    focusStop.current = false
    element.focus({ preventScroll: true })
  }, [])

  const goTo = (nextTrail: Soundtrail['id'] | null, nextPosition: number) => {
    focusStop.current = nextTrail !== null
    keepPlaying.current = nextTrail !== null && (status === 'playing' || status === 'loading')
    if (!nextTrail) audio.current?.pause()
    setStatus('idle')
    setTrailId(nextTrail)
    setPosition(nextPosition)
  }

  const closeTrail = () => goTo(null, 0)

  const togglePlayback = () => {
    const element = audio.current
    if (!element) return
    if (!element.paused) {
      keepPlaying.current = false
      element.pause()
      return
    }
    keepPlaying.current = true
    setStatus('loading')
    element.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setStatus('failed')
    })
  }

  const playing = status === 'playing'
  const loading = status === 'loading'
  const previous = active && position > 0 ? active.stops[position - 1] : null
  const next = active && !last ? active.stops[position + 1] : null
  const fade = reduceMotion
    ? { initial: false as const }
    : { initial: { opacity: 0, x: 18 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -18 }, transition: { duration: 0.22, ease: 'easeOut' } as const }

  const journeyBody = active && stop ? (
    <>
      <ol className="soundtrails-progress" aria-label={t('progress')}>
        {active.stops.map(({ node }, stopIndex) => (
          <li
            key={node.id}
            data-current={stopIndex === position ? '' : undefined}
            data-visited={stopIndex < position ? '' : undefined}
          >
            {stopIndex > 0 && (
              <span
                className="soundtrails-progress-line"
                data-active={stopIndex <= position ? '' : undefined}
                aria-hidden="true"
              />
            )}
            <button
              type="button"
              aria-current={stopIndex === position ? 'step' : undefined}
              onClick={() => goTo(active.trail.id, stopIndex)}
            >
              <span className="soundtrails-progress-dot" aria-hidden="true" />
              <span className="soundtrails-progress-name">{node.name}</span>
            </button>
          </li>
        ))}
      </ol>

      <audio
        ref={attachAudio}
        src={previewUrl(stop.node.id)}
        preload="none"
        onPlay={() => claimPlayback(stopPlayback)}
        onPlaying={(event) => { if (!event.currentTarget.paused) setStatus('playing') }}
        onWaiting={(event) => { if (!event.currentTarget.paused) setStatus('loading') }}
        onPause={() => setStatus((current) => current === 'failed' ? current : 'idle')}
        onEnded={() => { keepPlaying.current = false; setStatus('idle') }}
        onError={() => setStatus('failed')}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.article key={stop.node.id} className="soundtrails-stop" {...fade}>
          {stop.link && previous && (
            <p className="soundtrails-link">
              <span>{previous.node.name}</span>
              <span className="soundtrails-link-relation">
                {stop.link.forward ? labels.edges[stop.link.edge.type] : labels.inverseEdges[stop.link.edge.type]}
                <ArrowRight size={15} aria-hidden="true" />
              </span>
              <span>{stop.node.name}</span>
            </p>
          )}
          <div className="soundtrails-stop-header">
            <div className="soundtrails-player">
              <button
                type="button"
                className="soundtrails-play"
                data-playing={playing ? '' : undefined}
                aria-label={playing || loading ? t('pause', { name: stop.node.name }) : t('listen', { name: stop.node.name })}
                onClick={togglePlayback}
              >
                {loading
                  ? <LoaderCircle size={22} className="motion-safe:animate-spin" aria-hidden="true" />
                  : playing
                    ? <><Disc3 size={26} className="soundtrails-play-disc motion-safe:animate-spin" aria-hidden="true" /><Pause size={16} fill="currentColor" className="soundtrails-play-pause" aria-hidden="true" /></>
                    : <Play size={18} fill="currentColor" aria-hidden="true" />}
              </button>
              <InfoBadge label={tAudio('aboutPreview')}>
                <a href="https://ace-step.github.io/ACE-Step-1.5/" target="_blank" rel="noreferrer" className="soundtrails-attribution">ACE-Step</a>
                {` ${tAudio('previewAttribution')}`}
              </InfoBadge>
            </div>
            <div className="soundtrails-stop-title">
              <span className="soundtrails-stop-meta">
                {t('stopProgress', { position: position + 1, total: active.stops.length })}
                {stop.node.period && <> · {formatYear(stop.node.period.start, locale)}</>}
              </span>
              <StopHeading ref={attachStopHeading} tabIndex={-1} data-autofocus="">{stop.node.name}</StopHeading>
            </div>
          </div>
          <span role="status" className="sr-only">{status === 'failed' ? t('previewFailed') : loading ? tAudio('buffering') : ''}</span>
          {status === 'failed' && <p className="soundtrails-note" aria-hidden="true">{t('previewFailed')}</p>}
          {stop.node.description && <p className="soundtrails-description">{stop.node.description}</p>}

          {(stop.keyArtists.length > 0 || stop.anthem) && (
            <dl className="soundtrails-listen-for">
              {stop.keyArtists.length > 0 && (
                <div>
                  <dt>{t('keyArtists')}</dt>
                  <dd>
                    {stop.keyArtists.map((artist) => (
                      <EntryLink key={artist.id} node={artist} className="discovery-genre-chip">{artist.name}</EntryLink>
                    ))}
                  </dd>
                </div>
              )}
              {stop.anthem && (
                <div>
                  <dt>{t('anthem')}</dt>
                  <dd>
                    <EntryLink node={stop.anthem.track} className="discovery-genre-chip">
                      {stop.anthem.artist
                        ? t('anthemBy', { track: stop.anthem.track.name, artist: stop.anthem.artist.name })
                        : stop.anthem.track.name}
                    </EntryLink>
                  </dd>
                </div>
              )}
            </dl>
          )}

          {last && <p className="soundtrails-finish">{t('finished', { name: stop.node.name })}</p>}
        </motion.article>
      </AnimatePresence>

    </>
  ) : null

  const journeyControls = active && stop ? (
    <div className="soundtrails-controls">
      {previous ? (
        <button type="button" className="discovery-secondary soundtrails-previous" onClick={() => goTo(active.trail.id, position - 1)}>
          <ArrowLeft size={15} aria-hidden="true" /> <span className="soundtrails-previous-label">{t('previous')}</span>
        </button>
      ) : <span />}
      {next ? (
        <button type="button" className="discovery-primary" onClick={() => goTo(active.trail.id, position + 1)}>
          {t('next', { name: next.node.name })} <ArrowRight size={17} aria-hidden="true" />
        </button>
      ) : (
        <div className="soundtrails-finish-actions">
          {!isMobile && <button type="button" className="discovery-secondary" onClick={closeTrail}>{t('anotherTrail')}</button>}
          <EntryLink node={stop.node} className="discovery-primary">
            <ChartGantt size={17} aria-hidden="true" /> {t('seeOnTimeline')} <ArrowUpRight size={17} aria-hidden="true" />
          </EntryLink>
        </div>
      )}
    </div>
  ) : null

  return (
    <section ref={ref} id="soundtrails" className={`soundtrails${headingLevel === 3 ? ' soundtrails-nested' : ''}`} aria-labelledby="soundtrails-heading">
      <div className="soundtrails-heading">
        <Heading id="soundtrails-heading"><Route size={21} aria-hidden="true" /> {t('title')}</Heading>
      </div>

      <p className="soundtrails-intro">{t('intro')}</p>
      <ul className="soundtrails-picker" aria-label={t('chooseTrail')}>
        {trails.map(({ trail, stops }) => {
          const first = stops[0].node.period?.start
          const end = stops.at(-1)?.node.period?.start
          return (
            <li key={trail.id}>
              <button type="button" className="soundtrails-card" onClick={(event) => { opener.current = event.currentTarget; goTo(trail.id, 0) }}>
                <span className="soundtrails-card-era">
                  {first !== undefined && end !== undefined && `${formatYear(first, locale)} → ${formatYear(end, locale)}`}
                </span>
                <strong>{t(`trails.${trail.id}.title`)}</strong>
                <span className="soundtrails-card-description">{t(`trails.${trail.id}.description`)}</span>
                <span className="soundtrails-card-path">
                  {stops.map(({ node }) => node.name).join(' · ')}
                </span>
                <span className="soundtrails-card-start">
                  {t('stops', { count: stops.length })} <ArrowRight size={15} aria-hidden="true" />
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <AnimatePresence>
        {active && stop && (
          <TrailSheet
            key="soundtrail-sheet"
            variant={isMobile ? 'sheet' : 'modal'}
            title={t(`trails.${active.trail.id}.title`)}
            closeLabel={tRoot('closePanel')}
            resetKey={stop.node.id}
            onClose={closeTrail}
            onRemoved={restoreOpenerFocus}
            onStep={(delta) => {
              const target = position + delta
              if (target >= 0 && target < active.stops.length) goTo(active.trail.id, target)
            }}
            footer={journeyControls}
          >
            {journeyBody}
          </TrailSheet>
        )}
      </AnimatePresence>
    </section>
  )
}
