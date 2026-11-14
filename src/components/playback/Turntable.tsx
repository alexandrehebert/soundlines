import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useCallback, useEffect, useId, useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { useTranslations } from 'next-intl'
import type { ColorTheme } from '../../useColorTheme.ts'
import { angleDelta, createScratchDeck, NORMAL_SPEED_DEG_PER_SEC, type ScratchDeck } from './vinylScratch.ts'
import { scheduleTurntableHints, turntableHintFrame, turntableHintPosition, type TurntableHintScenario, type TurntableHintTargets } from './turntableHint.ts'
import { VinylRecord } from './VinylRecord.tsx'
import { claimPlayback, releasePlayback } from './exclusivePlayback.ts'
import { TurntablePlayButton } from './TurntablePlayButton.tsx'
import { TurntableSideKnob } from './TurntableSideKnob.tsx'
import { TurntableLcd } from './TurntableLcd.tsx'
import { TurntableTonearm } from './TurntableTonearm.tsx'
import { featureFlags } from '../../featureFlags.ts'
import '../home/Home.css'

function pointerAngle(element: HTMLElement, event: PointerEvent<HTMLElement>) {
  const box = element.getBoundingClientRect()
  const x = event.clientX - (box.left + box.width / 2)
  const y = event.clientY - (box.top + box.height / 2)
  return { angle: Math.atan2(y, x) * 180 / Math.PI, distance: Math.hypot(x, y), radius: box.width / 2 }
}

function TurntableHint({ record, play, progress, scenario, dismissed }: {
  record: RefObject<HTMLDivElement | null>
  play: RefObject<HTMLButtonElement | null>
  progress: MotionValue<number>
  scenario: MotionValue<TurntableHintScenario>
  dismissed: boolean
}) {
  const overlay = useRef<HTMLDivElement>(null)
  const [targets, setTargets] = useState<TurntableHintTargets | null>(null)
  const ready = targets !== null
  const frame = useTransform(() => turntableHintFrame(progress.get(), scenario.get()))
  const x = useTransform(() => targets ? turntableHintPosition(frame.get(), targets).x : 0)
  const y = useTransform(() => targets ? turntableHintPosition(frame.get(), targets).y : 0)
  const opacity = useTransform(frame, (value) => value.opacity)
  const scale = useTransform(frame, (value) => value.scale)
  const gripOpacity = useTransform(frame, (value) => value.grip)
  const pointOpacity = useTransform(frame, (value) => 1 - value.grip)
  const gripRotate = useTransform(frame, (value) => value.angle)

  useEffect(() => {
    if (!ready || dismissed) return
    const schedule = scheduleTurntableHints((next) => {
      scenario.set(next)
      progress.set(0)
      const animation = animate(progress, 1, { duration: 7, ease: 'linear' })
      return () => {
        animation.stop()
      }
    })
    let visible = false
    const eligible = () => visible && document.visibilityState === 'visible'
    const update = () => {
      if (eligible()) schedule.resume()
      else {
        schedule.pause()
        progress.set(0)
      }
    }
    const observer = new IntersectionObserver(([entry]) => {
      const nextVisible = entry.isIntersecting && entry.intersectionRatio >= .5
      if (nextVisible === visible) return
      visible = nextVisible
      update()
    }, { threshold: .5 })
    if (record.current) observer.observe(record.current)
    document.addEventListener('visibilitychange', update)
    return () => {
      schedule.dispose()
      observer.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [progress, scenario, ready, record, dismissed])

  useEffect(() => {
    const layer = overlay.current
    const vinyl = record.current
    const button = play.current
    if (!layer || !vinyl || !button) return
    const measure = () => {
      const bounds = layer.getBoundingClientRect()
      const disc = vinyl.getBoundingClientRect()
      const control = button.getBoundingClientRect()
      setTargets({
        centerX: disc.left - bounds.left + disc.width / 2,
        centerY: disc.top - bounds.top + disc.height / 2,
        diameter: disc.width,
        playX: control.left - bounds.left + control.width / 2,
        playY: control.top - bounds.top + control.height / 2,
      })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(layer)
    observer.observe(vinyl)
    observer.observe(button)
    return () => observer.disconnect()
  }, [record, play])

  return (
    <motion.div
      ref={overlay}
      className="discovery-turntable-hint"
      aria-hidden="true"
      animate={{ opacity: dismissed ? 0 : 1 }}
      transition={{ duration: .25, ease: 'easeOut' }}
    >
      {targets && (
        <motion.div
          className="discovery-turntable-hand"
          style={{ x, y, opacity, scale }}
        >
          <motion.span className="discovery-turntable-point" style={{ opacity: pointOpacity }}>
            <svg width="36" height="36" viewBox="0 0 36 36" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M13 20V5a3 3 0 0 1 6 0v10a3 3 0 0 1 5 2 3 3 0 0 1 5 2 3 3 0 0 1 4 3v4c0 4-2 6-4 8H16l-8-12a3 3 0 0 1 5-3Z" />
            </svg>
          </motion.span>
          <motion.span className="discovery-turntable-grip" style={{ opacity: gripOpacity, rotate: gripRotate }}>
            <svg width="36" height="36" viewBox="0 0 36 36" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
              <path d="M8 19v-8a3 3 0 0 1 6 0V9a3 3 0 0 1 6 0v2a3 3 0 0 1 6 0v3a3 3 0 0 1 6 0v10c0 4-1 7-3 10H16L5 23a3 3 0 0 1 3-4Z" />
              <path d="M14 11v6m6-6v6m6-3v4" fill="none" />
            </svg>
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  )
}

export function Turntable({ theme, toggleTheme, children }: { theme: ColorTheme; toggleTheme: () => void; children?: ReactNode }) {
  const t = useTranslations()
  const tHome = useTranslations('homeContent')
  const reduceMotion = useReducedMotion()
  const showTonearm = featureFlags.turntableTonearm
  const { scrollY } = useScroll()
  const angle = useTransform(scrollY, [0, 480], [-16, 344])
  const spin = useSpring(angle, { stiffness: 110, damping: 24 })
  const scratchOffset = useMotionValue(0)
  const hintProgress = useMotionValue(0)
  const hintScenario = useMotionValue<TurntableHintScenario>('scratch-play')
  const hintActive = useMotionValue(true)
  const hintFrame = useTransform(() => turntableHintFrame(hintProgress.get(), hintScenario.get()))
  const hintRotation = useTransform(() => hintActive.get() ? hintFrame.get().angle : 0)
  const hintPulse = useTransform(() => hintActive.get() ? hintFrame.get().playPulse : 0)
  const hintPulseScale = useTransform(hintPulse, [0, 1], [1, 1.18])
  const spinning = useTransform([spin, scratchOffset, hintRotation], ([base, offset, demo]: number[]) => base + offset + demo)
  const still = useTransform(scratchOffset, (offset) => offset - 16)
  const rotate = reduceMotion ? still : spinning
  const deck = useRef<ScratchDeck | null>(null)
  const gesture = useRef<{ pointerId: number; angle: number; time: number; velocity: number } | null>(null)
  const [scratching, setScratching] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(false)
  const record = useRef<HTMLDivElement>(null)
  const playButton = useRef<HTMLButtonElement>(null)
  const mounted = useRef(true)
  const pendingPlay = useRef(false)
  const errorId = useId()

  const dismissHint = () => {
    scratchOffset.set(scratchOffset.get() + hintRotation.get())
    hintActive.set(false)
    setHintDismissed(true)
  }

  const stopPlayback = useCallback(() => {
    deck.current?.pause()
    pendingPlay.current = false
    if (mounted.current) setPlaying(false)
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      releasePlayback(stopPlayback)
      deck.current?.dispose()
      deck.current = null
    }
  }, [stopPlayback])

  useAnimationFrame((_time, delta) => {
    if (playing && !scratching && !reduceMotion) {
      scratchOffset.set(scratchOffset.get() + NORMAL_SPEED_DEG_PER_SEC * delta / 1000)
    }
  })

  const reportAudioError = useCallback((error: unknown) => {
    if (!mounted.current) return
    console.warn('Unable to play the turntable audio.', error)
    deck.current?.pause()
    pendingPlay.current = false
    setPlaying(false)
    setAudioError(true)
  }, [])

  const loop = theme === 'dark' ? 'turntable-hip-hop' : 'turntable-trap'
  useEffect(() => {
    let cancelled = false
    void deck.current?.setLoop(loop).catch((error: unknown) => {
      if (!cancelled) reportAudioError(error)
      else if (mounted.current) console.warn('Unable to load a superseded turntable side.', error)
    })
    return () => { cancelled = true }
  }, [loop, reportAudioError])

  const togglePlayback = async () => {
    dismissHint()
    if (pendingPlay.current) return
    setAudioError(false)
    if (playing) {
      deck.current?.pause()
      setPlaying(false)
      releasePlayback(stopPlayback)
      return
    }
    claimPlayback(stopPlayback)
    pendingPlay.current = true
    setLoading(true)
    try {
      deck.current ??= createScratchDeck(reportAudioError, loop)
      if (!deck.current) throw new Error('Web Audio is not supported by this browser.')
      await deck.current.play()
      if (mounted.current && pendingPlay.current) setPlaying(true)
    } catch (error) {
      reportAudioError(error)
    } finally {
      pendingPlay.current = false
      if (mounted.current) setLoading(false)
    }
  }

  const startScratch = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || gesture.current) return
    const { angle: start, distance, radius } = pointerAngle(event.currentTarget, event)
    if (distance > radius) return
    dismissHint()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    deck.current ??= createScratchDeck(reportAudioError, loop)
    if (!deck.current) {
      reportAudioError(new Error('Web Audio is not supported by this browser.'))
      return
    }
    claimPlayback(stopPlayback)
    deck.current?.activate()
    deck.current?.hold()
    gesture.current = { pointerId: event.pointerId, angle: start, time: event.timeStamp, velocity: 0 }
    setScratching(true)
  }

  const moveScratch = (event: PointerEvent<HTMLDivElement>) => {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    const { angle: next } = pointerAngle(event.currentTarget, event)
    const delta = angleDelta(current.angle, next)
    const elapsed = Math.max(1, event.timeStamp - current.time) / 1000
    current.velocity = current.velocity * 0.35 + (delta / elapsed) * 0.65
    current.angle = next
    current.time = event.timeStamp
    scratchOffset.set(scratchOffset.get() + delta)
    deck.current?.scratch(current.velocity)
  }

  const endScratch = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return
    gesture.current = null
    if (event.type === 'pointerup') deck.current?.activate()
    deck.current?.release()
    setScratching(false)
  }

  const scratchHandlers = {
    onPointerDown: startScratch,
    onPointerMove: moveScratch,
    onPointerUp: endScratch,
    onPointerCancel: endScratch,
    onLostPointerCapture: endScratch,
    // Some mobile browsers unlock Web Audio only on touchend.
    onTouchEnd: () => deck.current?.activate(),
  }

  return (
    <section className="discovery-hero" aria-label="Soundlines turntable">
      <div className="discovery-hero-text">
        <p className="discovery-kicker"><span /> {t('tagline')}</p>
        <div className="discovery-hero-title">
          <h1 id="discovery-heading">{tHome('headline.first')}<br /> <em>{tHome('headline.second')}</em></h1>
        </div>
        {children}
      </div>
      <div className="discovery-turntable-deck">
        <div className="discovery-record" aria-hidden="true" data-tonearm={showTonearm || undefined}>
          <div
            ref={record}
            className="discovery-record-perspective"
            data-side={theme === 'light' ? 'B' : 'A'}
            data-scratching={scratching || undefined}
            title={tHome('scratchRecord')}
            {...scratchHandlers}
          >
            <VinylRecord rotate={rotate} />
          </div>
          {showTonearm && <TurntableTonearm active={playing || scratching} />}
        </div>
        <div className="discovery-turntable-controls">
          <TurntableLcd source={deck} active={playing || scratching} playing={playing} loading={loading} theme={theme} />
          <TurntablePlayButton
            ref={playButton}
            playing={playing}
            loading={loading}
            label={tHome(theme === 'light'
              ? playing ? 'pauseTrapLoop' : 'playTrapLoop'
              : playing ? 'pauseLoop' : 'playLoop')}
            aria-describedby={audioError ? errorId : undefined}
            onClick={() => { void togglePlayback() }}
            hint={<motion.span className="discovery-turntable-play-hint" aria-hidden="true" style={{ opacity: hintPulse, scale: hintPulseScale }} />}
          />
          <TurntableSideKnob theme={theme} onClick={toggleTheme} />
          {audioError && <p id={errorId} className="discovery-turntable-error" role="alert">{tHome('loopError')}</p>}
        </div>
      </div>
      <div
        className="discovery-record-touch-target"
        data-scratching={scratching || undefined}
        aria-hidden="true"
        {...scratchHandlers}
      />
      {!reduceMotion && <TurntableHint record={record} play={playButton} progress={hintProgress} scenario={hintScenario} dismissed={hintDismissed} />}
    </section>
  )
}
