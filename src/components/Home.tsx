import { ArrowDown, ArrowLeftRight, ArrowRight, ArrowUpRight, Bubbles, ChartGantt, Disc3, Guitar, Headphones, Heart, History, Landmark, Moon, Pause, Play, Radio, Sun, Users, type LucideIcon } from 'lucide-react'
import { animate, motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../ExplorerContext.ts'
import { formatEventPeriod } from '../graph/history.ts'
import { VIEW_PATHS, viewForNode, type ExplorerView } from '../graph/timeline.ts'
import type { GraphNode } from '../graph/types.ts'
import { BrandLink } from './BrandLink.tsx'
import { GenreSample } from './GenreSample.tsx'
import { SearchBar } from './SearchBar.tsx'
import { angleDelta, createScratchDeck, NORMAL_SPEED_DEG_PER_SEC, type ScratchDeck } from './vinylScratch.ts'
import './Home.css'
import { localizePath } from '../i18n/routing.ts'
import { graphLabels } from '../i18n/graphLabels.ts'
import { useColorTheme, type ColorTheme } from '../useColorTheme.ts'
import { turntableHintFrame, turntableHintPosition, type TurntableHintTargets } from './turntableHint.ts'

const DESTINATIONS = [
  { view: 'genre', icon: Bubbles },
  { view: 'artist', icon: Users },
  { view: 'instrument', icon: Guitar },
  { view: 'history', icon: History },
] as const

const LANGUAGES = [
  { locale: 'en', label: 'english' },
  { locale: 'fr', label: 'french' },
] as const

const FEATURED_CONNECTIONS = [
  ['genre:funk', 'influences', 'genre:detroit-techno', 'funk-detroit'],
  ['genre:alt-country', 'subgenre_of', 'genre:country', 'altcountry-country'],
  ['genre:bossa-nova', 'cross_pollination', 'genre:jazz', 'bossa-jazz'],
  ['genre:chicago-house', 'derived_from', 'genre:disco', 'house-disco'],
  ['genre:acid-jazz', 'fusion_of', 'genre:funk', 'acid-funk'],
] as const

const LISTENING_PICKS = ['genre:bossa-nova', 'genre:acid-jazz', 'genre:detroit-techno'] as const
const ARTIST_PICKS = ['artist:fela-kuti', 'artist:celia-cruz', 'artist:kraftwerk'] as const
const INSTRUMENT_PICKS = ['instrument:tr-808', 'instrument:theremin', 'instrument:timbales'] as const
const HISTORY_PICKS = ['event:phonograph-invented', 'event:bronx-back-to-school-jam', 'event:napster-launch'] as const

const PAGE_SIZE = 5
const reveal = {
  initial: { opacity: 0.55 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const

function pointerAngle(element: HTMLElement, event: PointerEvent<HTMLElement>) {
  const box = element.getBoundingClientRect()
  const x = event.clientX - (box.left + box.width / 2)
  const y = event.clientY - (box.top + box.height / 2)
  return { angle: Math.atan2(y, x) * 180 / Math.PI, distance: Math.hypot(x, y), radius: box.width / 2 }
}

function TurntableHint({ record, play, progress }: {
  record: RefObject<HTMLDivElement | null>
  play: RefObject<HTMLButtonElement | null>
  progress: MotionValue<number>
}) {
  const overlay = useRef<HTMLDivElement>(null)
  const [targets, setTargets] = useState<TurntableHintTargets | null>(null)
  const [finished, setFinished] = useState(false)
  const ready = targets !== null
  const frame = useTransform(progress, turntableHintFrame)
  const x = useTransform(() => targets ? turntableHintPosition(frame.get(), targets).x : 0)
  const y = useTransform(() => targets ? turntableHintPosition(frame.get(), targets).y : 0)
  const opacity = useTransform(frame, (value) => value.opacity)
  const scale = useTransform(frame, (value) => value.scale)
  const gripOpacity = useTransform(frame, (value) => value.grip)
  const pointOpacity = useTransform(frame, (value) => 1 - value.grip)
  const gripRotate = useTransform(frame, (value) => value.angle)

  useEffect(() => {
    if (!ready) return
    progress.set(0)
    const animation = animate(progress, 1, {
      duration: 7,
      delay: 2,
      ease: 'linear',
      onComplete: () => setFinished(true),
    })
    return () => {
      animation.stop()
      progress.set(0)
    }
  }, [progress, ready])

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
    <div ref={overlay} className="discovery-turntable-hint" aria-hidden="true">
      {targets && !finished && (
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
    </div>
  )
}

function HeroTurntable({ theme, children }: { theme: ColorTheme; children: ReactNode }) {
  const t = useTranslations()
  const tHome = useTranslations('homeCopy')
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  const angle = useTransform(scrollY, [0, 480], [-16, 344])
  const spin = useSpring(angle, { stiffness: 110, damping: 24 })
  const scratchOffset = useMotionValue(0)
  const hintProgress = useMotionValue(0)
  const hintRotation = useTransform(hintProgress, (progress) => turntableHintFrame(progress).angle)
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
    hintProgress.set(0)
    setHintDismissed(true)
  }

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      deck.current?.dispose()
      deck.current = null
    }
  }, [])

  useAnimationFrame((_time, delta) => {
    if (playing && !scratching && !reduceMotion) {
      scratchOffset.set(scratchOffset.get() + NORMAL_SPEED_DEG_PER_SEC * delta / 1000)
    }
  })

  const reportAudioError = (error: unknown) => {
    if (!mounted.current) return
    console.warn('Unable to play the turntable audio.', error)
    deck.current?.pause()
    setPlaying(false)
    setAudioError(true)
  }

  const togglePlayback = async () => {
    dismissHint()
    if (pendingPlay.current) return
    setAudioError(false)
    if (playing) {
      deck.current?.pause()
      setPlaying(false)
      return
    }
    pendingPlay.current = true
    setLoading(true)
    try {
      deck.current ??= createScratchDeck(reportAudioError)
      if (!deck.current) throw new Error('Web Audio is not supported by this browser.')
      await deck.current.play()
      if (mounted.current) setPlaying(true)
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
    deck.current ??= createScratchDeck(reportAudioError)
    if (!deck.current) {
      reportAudioError(new Error('Web Audio is not supported by this browser.'))
      return
    }
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
    <>
      <div className="discovery-hero-copy">
        <p className="discovery-kicker"><span /> {t('tagline')}</p>
        <div className="discovery-hero-title">
          <h1 id="discovery-heading">{tHome('headline.first')}<br /> <em>{tHome('headline.second')}</em></h1>
          <div className="discovery-turntable-controls">
            <button
              ref={playButton}
              type="button"
              className="discovery-turntable-play"
              aria-label={tHome(playing ? 'pauseLoop' : 'playLoop')}
              aria-pressed={playing}
              aria-busy={loading}
              aria-describedby={audioError ? errorId : undefined}
              disabled={loading}
              onFocus={dismissHint}
              onClick={() => { void togglePlayback() }}
            >
              <span className="discovery-turntable-led" aria-hidden="true" />
              {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              <span>{tHome(loading ? 'loadingLoop' : playing ? 'pause' : 'play')}</span>
            </button>
            {audioError && <p id={errorId} className="discovery-turntable-error" role="alert">{tHome('loopError')}</p>}
          </div>
        </div>
        {children}
      </div>
      <div className="discovery-record" aria-hidden="true">
        <div
          ref={record}
          className="discovery-record-perspective"
          data-side={theme === 'light' ? 'B' : 'A'}
          data-scratching={scratching || undefined}
          title={tHome('scratchRecord')}
          {...scratchHandlers}
        >
          <div className="discovery-record-flip">
            {(['A', 'B'] as const).map((side) => (
              <div key={side} className={`discovery-record-face discovery-record-face-${side.toLowerCase()}`}>
                <motion.div className="discovery-vinyl" style={{ rotate }}>
                  <div className="discovery-label"><Disc3 size={28} /></div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
        <span className="discovery-record-caption">SOUNDLINES / {tHome(theme === 'dark' ? 'sideA' : 'sideB')}</span>
      </div>
      <div
        className="discovery-record-touch-target"
        data-scratching={scratching || undefined}
        aria-hidden="true"
        {...scratchHandlers}
      />
      {!reduceMotion && !hintDismissed && <TurntableHint record={record} play={playButton} progress={hintProgress} />}
    </>
  )
}
function follow(event: MouseEvent<HTMLAnchorElement>, navigate?: () => void) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigate?.()
}

function ViewLink({ view, className, children }: { view: ExplorerView; className: string; children: ReactNode }) {
  const { changeView, locale } = useExplorer()
  return <a className={className} href={localizePath(VIEW_PATHS[view], locale)} onClick={(event) => follow(event, () => changeView(view))}>{children}</a>
}

function EntryLink({ node, className, children }: { node: GraphNode; className: string; children: ReactNode }) {
  const { selectNode, locale } = useExplorer()
  const params = new URLSearchParams({ focus: node.id })
  const path = VIEW_PATHS[viewForNode(node.type, 'genre')]
  return <a className={className} href={`${localizePath(path, locale)}?${params}`} onClick={(event) => follow(event, () => selectNode(node.id))}>{children}</a>
}

function SpotlightWidget({ title, icon: Icon, picks, relationship, nextLabel, scrollReveal }: {
  title: string
  icon: LucideIcon
  picks: readonly string[]
  relationship: 'key_artist_of' | 'featured_in'
  nextLabel: string
  scrollReveal: typeof reveal | undefined
}) {
  const { index } = useExplorer()
  const tHome = useTranslations('homeCopy')
  const headingId = useId()
  const [position, setPosition] = useState(0)
  const entries = picks.map((id) => index.nodeById.get(id)).filter((node) => node !== undefined)
  const node = entries[position]
  if (!node) return null

  const genres = [...new Set(index.outEdges.get(node.id)
    ?.filter((edge) => edge.type === relationship)
    .map((edge) => edge.to))]
    .map((id) => index.nodeById.get(id))
    .filter((entry): entry is GraphNode => entry?.type === 'genre')
    .slice(0, 3)

  return (
    <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby={headingId}>
      <div className="discovery-widget-heading">
        <h3 id={headingId}><Icon size={19} aria-hidden="true" /> {title}</h3>
        {entries.length > 1 && <span className="discovery-counter">{position + 1} / {entries.length}</span>}
      </div>
      <div aria-live="polite">
        <EntryLink node={node} className="discovery-spotlight-title">
          {node.name} <ArrowUpRight size={16} aria-hidden="true" />
        </EntryLink>
        {node.description && <p className="discovery-note">{node.description}</p>}
        {genres.length > 0 && (
          <ul className="discovery-spotlight-genres" aria-label={tHome('connectedGenres')}>
            {genres.map((genre) => (
              <li key={genre.id}>
                <EntryLink node={genre} className="discovery-genre-chip">{genre.name}</EntryLink>
              </li>
            ))}
          </ul>
        )}
      </div>
      {entries.length > 1 && (
        <button type="button" className="discovery-widget-action" onClick={() => setPosition((current) => (current + 1) % entries.length)}>
          {nextLabel} <ArrowRight size={16} aria-hidden="true" />
        </button>
      )}
    </motion.section>
  )
}

export function Home() {
  const { theme, toggleTheme } = useColorTheme()
  const { index, locale } = useExplorer()
  const t = useTranslations()
  const tHome = useTranslations('homeCopy')
  const tViews = useTranslations('views')
  const tDestinations = useTranslations('homeCopy.destinations')
  const tConnectionNotes = useTranslations('connectionNotes')
  const labels = graphLabels(locale)
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }), [locale])
  const reduceMotion = useReducedMotion()
  const widgetsRef = useRef<HTMLElement>(null)
  const scrollReveal = reduceMotion ? undefined : reveal
  const [connectionIndex, setConnectionIndex] = useState(0)
  const [listeningIndex, setListeningIndex] = useState(0)
  const { connections, listeningPicks, historyPicks, recent } = useMemo(() => ({
    listeningPicks: LISTENING_PICKS.map((id) => index.nodeById.get(id)).filter((node) => node?.type === 'genre'),
    historyPicks: HISTORY_PICKS.map((id) => index.nodeById.get(id)).filter((node): node is GraphNode => node?.type === 'event'),
    connections: FEATURED_CONNECTIONS.flatMap(([fromId, type, toId, summaryId]) => {
      const from = index.nodeById.get(fromId)
      const to = index.nodeById.get(toId)
      const edge = index.outEdges.get(fromId)?.find((edge) => edge.to === toId && edge.type === type)
      return from && to && edge ? [{ from, to, edge, note: tConnectionNotes(summaryId) }] : []
    }),
    recent: index.graph.nodes
      .flatMap((node) => node.addedOn ? [{ node, date: node.addedOn }] : [])
      .sort((a, b) => b.date.localeCompare(a.date) || a.node.name.localeCompare(b.node.name)),
  }), [index, tConnectionNotes])
  const connection = connections[connectionIndex]
  const listeningPick = listeningPicks[listeningIndex]
  const RelationArrow = connection?.edge.type === 'cross_pollination' ? ArrowLeftRight : ArrowRight

  return (
    <div className="discovery">
      <header className="discovery-header">
        <div className="discovery-width discovery-header-inner">
          <BrandLink className="discovery-brand" href={localizePath('/', locale)} aria-current="page" onClick={(event) => follow(event)}>Soundlines</BrandLink>
          <div className="discovery-search"><SearchBar /></div>
          <button
            type="button"
            className="discovery-theme-toggle"
            onClick={toggleTheme}
            aria-pressed={theme === 'light'}
            aria-label={tHome('lightTheme')}
            title={tHome(theme === 'dark' ? 'switchToLight' : 'switchToDark')}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            <span>{tHome(theme === 'dark' ? 'sideA' : 'sideB')}</span>
          </button>
        </div>
      </header>

      <main className="discovery-width discovery-main">
        <section className="discovery-hero" aria-labelledby="discovery-heading">
          <HeroTurntable theme={theme}>
            <p className="discovery-intro">{tHome('intro')}</p>
            <div className="discovery-actions">
              <ViewLink view="genre" className="discovery-primary"><ChartGantt size={17} aria-hidden="true" /> {tHome('openTimeline')} <ArrowRight size={17} aria-hidden="true" /></ViewLink>
              <button
                type="button"
                className="discovery-secondary"
                onClick={() => widgetsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth' })}
              >
                {tHome('discover')} <ArrowDown size={15} aria-hidden="true" />
              </button>
            </div>
          </HeroTurntable>
        </section>

        <motion.nav {...scrollReveal} className="discovery-nav" aria-label={tHome('exploreCatalogue')}>
          {DESTINATIONS.map(({ view, icon: Icon }) => (
            <ViewLink key={view} view={view} className="discovery-destination">
              <Icon size={21} className="discovery-destination-icon" aria-hidden="true" />
              <span><strong>{tViews(view)}</strong><small>{tDestinations(view)}</small></span>
              <ArrowUpRight size={16} className="discovery-link-arrow" aria-hidden="true" />
            </ViewLink>
          ))}
        </motion.nav>

        <section ref={widgetsRef} id="discover" className="discovery-widgets" aria-labelledby="discovery-widgets-heading">
          <motion.h2 {...scrollReveal} id="discovery-widgets-heading">{tHome('exploreCatalogue')}</motion.h2>
          <div className="discovery-grid">
            <div className="discovery-column">
              <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby="connection-heading">
                <div className="discovery-widget-heading">
                  <h3 id="connection-heading"><Radio size={19} aria-hidden="true" /> {tHome('genreConnections')}</h3>
                  {connection && <span className="discovery-counter">{connectionIndex + 1} / {connections.length}</span>}
                </div>
                {connection ? (
                  <>
                    <div aria-live="polite">
                      <motion.div
                        key={connection.edge.id}
                        initial={reduceMotion ? false : { opacity: 0.55, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.25 }}
                      >
                        <div className="discovery-lineage">
                          <EntryLink node={connection.from} className="discovery-node">{connection.from.name}<ArrowUpRight size={15} aria-hidden="true" /></EntryLink>
                          <span className="discovery-relation"><RelationArrow size={19} aria-hidden="true" />{labels.edges[connection.edge.type]}</span>
                          <EntryLink node={connection.to} className="discovery-node">{connection.to.name}<ArrowUpRight size={15} aria-hidden="true" /></EntryLink>
                        </div>
                        {connection.note && <p className="discovery-note">{connection.note}</p>}
                      </motion.div>
                    </div>
                    {connections.length > 1 && (
                      <button type="button" className="discovery-widget-action" onClick={() => setConnectionIndex((current) => (current + 1) % connections.length)}>
                        {tHome('nextConnection')} <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    )}
                  </>
                ) : <p className="discovery-note">{tHome('noFeaturedConnections')}</p>}
              </motion.section>

              {listeningPick && (
                <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby="listening-heading">
                  <div className="discovery-widget-heading">
                    <h3 id="listening-heading"><Headphones size={19} aria-hidden="true" /> {tHome('listeningBooth')}</h3>
                  </div>
                  <p className="discovery-note">{tHome('listeningDescription')}</p>
                  <div className="discovery-listening">
                    <GenreSample key={listeningPick.id} id={listeningPick.id} name={listeningPick.name} />
                    <div aria-live="polite">
                      <EntryLink node={listeningPick} className="discovery-listening-link">
                        {listeningPick.name} <ArrowUpRight size={15} aria-hidden="true" />
                      </EntryLink>
                    </div>
                  </div>
                  {listeningPicks.length > 1 && (
                    <button type="button" className="discovery-widget-action" onClick={() => setListeningIndex((current) => (current + 1) % listeningPicks.length)}>
                      {tHome('nextSound')} <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                </motion.section>
              )}

              <SpotlightWidget
                title={tHome('artistSpotlight')}
                icon={Users}
                picks={ARTIST_PICKS}
                relationship="key_artist_of"
                nextLabel={tHome('nextArtist')}
                scrollReveal={scrollReveal}
              />
            </div>
            <div className="discovery-column">
              <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby="recent-heading">
                <div className="discovery-widget-heading">
                  <h3 id="recent-heading"><History size={19} aria-hidden="true" /> {tHome('recentlyAdded')}</h3>
                </div>
                {recent.length > 0 ? (
                  <ul className="discovery-recent">
                    {recent.slice(0, PAGE_SIZE).map(({ node, date }) => (
                      <li key={node.id}>
                        <EntryLink node={node} className="discovery-entry">
                          <span><strong>{node.name}</strong><small>{labels.nodeTypes[node.type]}</small></span>
                          <time dateTime={date}>{dateFormatter.format(new Date(date))}</time>
                          <ArrowUpRight size={15} className="discovery-link-arrow" aria-hidden="true" />
                        </EntryLink>
                      </li>
                    ))}
                  </ul>
                ) : <p className="discovery-note">{tHome('newEntries')}</p>}
                {recent.length > PAGE_SIZE && (
                  <p className="discovery-note">{tHome('andMore')}</p>
                )}
              </motion.section>

              {historyPicks.length > 0 && (
                <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby="landmarks-heading">
                  <div className="discovery-widget-heading">
                    <h3 id="landmarks-heading"><Landmark size={19} aria-hidden="true" /> {tHome('turningPoints')}</h3>
                  </div>
                  <ul className="discovery-recent">
                    {historyPicks.map((event) => (
                      <li key={event.id}>
                        <EntryLink node={event} className="discovery-entry">
                          <strong>{event.name}</strong>
                          {event.period && <span className="discovery-entry-date">{formatEventPeriod(event.period, locale)}</span>}
                          <ArrowUpRight size={15} className="discovery-link-arrow" aria-hidden="true" />
                        </EntryLink>
                      </li>
                    ))}
                  </ul>
                  <ViewLink view="history" className="discovery-widget-action">
                    {tHome('exploreMusicHistory')} <ArrowRight size={16} aria-hidden="true" />
                  </ViewLink>
                </motion.section>
              )}

              <SpotlightWidget
                title={tHome('instrumentSpotlight')}
                icon={Guitar}
                picks={INSTRUMENT_PICKS}
                relationship="featured_in"
                nextLabel={tHome('nextInstrument')}
                scrollReveal={scrollReveal}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="discovery-footer">
        <div className="discovery-width">
          <nav className="discovery-footer-links discovery-footer-languages" aria-label={tHome('footer.languages')}>
            {LANGUAGES.map(({ locale: targetLocale, label }) => (
              <a
                key={targetLocale}
                href={localizePath('/', targetLocale)}
                lang={targetLocale}
                hrefLang={targetLocale}
                aria-current={locale === targetLocale ? 'page' : undefined}
              >
                {tHome(`footer.${label}`)}
              </a>
            ))}
          </nav>
          <nav className="discovery-footer-links discovery-footer-pages" aria-label={tHome('footer.pages')}>
            <a href={localizePath('/', locale)} aria-current="page">{tHome('footer.home')}</a>
            {DESTINATIONS.map(({ view }) => (
              <ViewLink key={view} view={view} className="discovery-footer-link">{tViews(view)}</ViewLink>
            ))}
          </nav>
          <div className="discovery-footer-meta">
            <p>
              {tHome('madeWith')} <Heart className="discovery-footer-heart" size={16} aria-hidden="true" />
              <span className="sr-only">{tHome('madeWithLove')}</span>{' '}{tHome('by')} Alexandre <strong>“Axoune”</strong> Hebert
            </p>
            <p className="discovery-copyright">© 2026 Soundlines. {t('copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
