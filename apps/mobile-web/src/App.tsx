import { ChevronLeft, ChevronRight, House, LibraryBig, Search } from 'lucide-react'
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type MouseEventHandler } from 'react'
import { FeedSkeleton } from './design-system/CatalogueSkeleton.tsx'
import { PreviewButton } from './design-system/audio/PreviewButton.tsx'
import { PreviewAvailability } from './design-system/audio/PreviewAvailability.tsx'
import { MobileCover } from './design-system/artwork/MobileCover.tsx'
import { MobileMasthead } from './design-system/navigation/MobileMasthead.tsx'
import { cardAt, type FeedCard, type FeedCatalogue, type FeedNode, type TrailStep } from './feed.ts'
import { assetUrl, useMedia } from './media.ts'
import { libraryHref, mobileBackLink, nodeUrl, pageHref, readRoute } from './nodeUrl.ts'
import { feedReturnCards, scrollToFeedStart } from './scrollToFeedStart.ts'
import { SearchPage } from './SearchPage.tsx'
import { AtlasDetail, LibraryPage } from './LibraryPage.tsx'
import { usePreview } from './usePreview.ts'

declare const __SOUNDLINES_INITIAL_FEED__: FeedCard[]
const initialFeed = __SOUNDLINES_INITIAL_FEED__
const covers = import.meta.glob<string>('#media/genre-artwork/*.webp', { eager: true, query: '?url', import: 'default' })
const bundledCovers = Object.fromEntries(Object.entries(covers).map(([path, url]) =>
  [`genre:${path.slice(path.lastIndexOf('/') + 1, -'.webp'.length)}`, url]))
const avatars = import.meta.glob<string>('#media/instrument-avatars/*.svg', { eager: true, query: '?url&no-inline', import: 'default' })
const bundledAvatars = Object.fromEntries(Object.entries(avatars).map(([path, url]) =>
  [`instrument:${path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)}`, url]))
const addedDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
const cardsBehind = 4
const cardsAhead = 5
type Media = ReturnType<typeof useMedia>
type Preview = ReturnType<typeof usePreview>['preview']
type DetailScroll = { top: number; disclosures: boolean[] }
type DetailHistory = {
  detailBack?: { href: string; label: string }
  detailScrollKey?: string
}

function readNavigation() {
  return {
    route: readRoute(window.location.search),
    detailHistory: window.history.state as DetailHistory | null,
  }
}

function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey
}

const destinations = [
  { page: 'home', label: 'Home', Icon: House },
  { page: 'search', label: 'Search', Icon: Search },
  { page: 'library', label: 'Library', Icon: LibraryBig },
] as const

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
}

function Cover({ node, media, eager }: { node: FeedNode; media: Media; eager: boolean }) {
  const cover = bundledCovers[node.id] || assetUrl(media.manifest?.genreArtwork?.[node.id])
  const artwork = media.manifest?.instrumentArtwork[node.id]
  const instrument = bundledAvatars[node.id] ?? assetUrl(artwork?.avatar ?? artwork?.header)
  return <MobileCover accent={node.accent} kind={node.type === 'instrument' ? 'instrument' : 'genre'} src={cover ?? instrument} eager={eager} />
}

function Listen({ node, active, media, preview }: {
  node: FeedNode; active: boolean; media: Media; preview: Preview
}) {
  if (node.type !== 'genre') return null
  const url = assetUrl(media.manifest?.genrePreviews[node.id])
  if (media.status === 'loading') return <PreviewAvailability checking />
  if (media.status === 'ready' && !url) return <PreviewAvailability checking={false} />
  const status = active ? preview.status : 'idle'
  const playing = status === 'playing'
  const loading = status === 'loading'
  const retry = media.status === 'unavailable' || status === 'error'
  return (
    <PreviewButton
      genre={node.name}
      state={loading ? 'loading' : retry ? 'error' : playing ? 'playing' : 'ready'}
      progress={active ? preview.progress : 0}
      onPress={() => {
        if (media.status === 'unavailable') media.retry()
        else if (url) void preview.toggle(url)
      }}
    />
  )
}

function NodePanel({ node, connection, spotlight, inTrail, active, media, preview, eager, onNavigate }: {
  node: FeedNode; connection?: string | null; spotlight?: boolean; inTrail?: boolean
  active: boolean; media: Media; preview: Preview; eager: boolean; onNavigate: MouseEventHandler<HTMLAnchorElement>
}) {
  const hasCover = node.type === 'genre' || node.type === 'instrument'
  return (
    <div className={hasCover ? 'node-panel' : 'node-panel node-panel--text'} style={{ '--accent': node.accent } as CSSProperties}>
      {hasCover && <Cover node={node} media={media} eager={eager} />}
      <div className="node-copy">
        <p className="node-meta">
          <span className="node-type">{node.type}</span>
          {node.era && <span className="node-era">{node.era}</span>}
          {spotlight && <span className="node-source">Spotlight</span>}
        </p>
        <h1><a className="node-link" href={nodeUrl(node, 'home')} onClick={onNavigate}>
          {node.name} <ChevronRight size={20} aria-hidden="true" />
        </a></h1>
        <p className="node-description">{connection ?? node.description}</p>
        {!inTrail && !spotlight && node.addedOn && (
          <p className="node-added">Added <time dateTime={node.addedOn}>{addedDate.format(new Date(node.addedOn))}</time></p>
        )}
      </div>
      <Listen node={node} active={active} media={media} preview={preview} />
    </div>
  )
}

function Soundtrail({ title, steps, step, active, onStepChange, media, preview, onNavigate }: {
  title: string; steps: TrailStep[]; step: number; active: boolean
  onStepChange: (step: number) => void; media: Media; preview: Preview; onNavigate: MouseEventHandler<HTMLAnchorElement>
}) {
  const track = useRef<HTMLDivElement>(null)
  const initialStep = useRef(step)

  useLayoutEffect(() => {
    if (track.current) track.current.scrollLeft = initialStep.current * track.current.clientWidth
  }, [])

  function goTo(position: number) {
    if (!track.current || position < 0 || position >= steps.length) return
    track.current.scrollTo({ left: position * track.current.clientWidth, behavior: scrollBehavior() })
  }

  return (
    <div className="soundtrail">
      <div className="trail-header">
        <div className="trail-title">
          <p>Soundtrail</p>
          <h2>{title}</h2>
        </div>
        <div className="trail-buttons">
          <button type="button" aria-label="Previous Soundtrail step" disabled={step === 0} onClick={() => goTo(step - 1)}><ChevronLeft size={21} /></button>
          <button type="button" aria-label="Next Soundtrail step" disabled={step === steps.length - 1} onClick={() => goTo(step + 1)}><ChevronRight size={21} /></button>
        </div>
      </div>
      <div className="trail-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map(({ node }, position) => (
          <button key={node.id} type="button" className={position <= step ? 'reached' : undefined}
            aria-label={`Step ${position + 1}: ${node.name}`} aria-current={position === step ? 'step' : undefined}
            onClick={() => goTo(position)} />
        ))}
      </div>
      <div className="trail-track" ref={track} aria-label={`${title} steps`}
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget
          const position = Math.min(steps.length - 1, Math.max(0, Math.round(scrollLeft / clientWidth)))
          if (position !== step) onStepChange(position)
        }}>
        {steps.map(({ node, connection }, position) => (
          <div className="trail-step" key={node.id} inert={position !== step}
            aria-label={`Step ${position + 1} of ${steps.length}`}>
            <NodePanel node={node} connection={connection} inTrail active={active && position === step}
              media={media} preview={preview} eager={active && position === step} onNavigate={onNavigate} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function App() {
  const surface = useRef<HTMLElement>(null)
  const cancelFeedReturn = useRef<() => void>(undefined)
  const searchHeading = useRef<HTMLHeadingElement>(null)
  const atlasHeading = useRef<HTMLHeadingElement>(null)
  const detailPage = useRef<HTMLElement>(null)
  const detailScrollPositions = useRef(new Map<string, DetailScroll>())
  const [{ route, detailHistory }, setNavigation] = useState(readNavigation)
  const detailScrollKey = detailHistory?.detailScrollKey
  const { page, nodeId, origin, libraryType, libraryGroup } = route
  const selection = { type: libraryType, group: libraryGroup }
  const routeKey = JSON.stringify(route)
  const previousRoute = useRef(routeKey)
  const currentIndex = useRef(0)
  const [cardIndex, setCardIndex] = useState(0)
  const [searchVersion, setSearchVersion] = useState(0)
  const [steps, setSteps] = useState<Record<number, number>>({})
  const [catalogue, setCatalogue] = useState<FeedCatalogue>()
  const [loadFailed, setLoadFailed] = useState(false)
  const media = useMedia()
  const { audio, events, preview } = usePreview()
  const { stop } = preview
  const atlasEntries = catalogue?.atlas
  const atlasById = useMemo(() => atlasEntries && new Map(atlasEntries.map((entry) => [entry.node.id, entry])), [atlasEntries])
  const groupLabel = libraryGroup && nodeId !== null ? atlasEntries?.find((entry) =>
    entry.node.type === libraryType && entry.timelineGroup?.id === libraryGroup)?.timelineGroup?.label : undefined
  const title = (nodeId && atlasById?.get(nodeId)?.node.name) || destinations.find((item) => item.page === page)?.label

  useEffect(() => {
    void import('virtual:mobile-catalogue').then(({ default: feed }) => setCatalogue(feed), () => setLoadFailed(true))
  }, [])

  useEffect(() => {
    const handlePopState = () => setNavigation(readNavigation())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useLayoutEffect(() => {
    document.title = `${title} · Soundlines`
  }, [title])

  useLayoutEffect(() => {
    if (previousRoute.current === routeKey) return
    previousRoute.current = routeKey
    stop()
    const target = page === 'home' ? surface : page === 'search' ? searchHeading : atlasHeading
    target.current?.focus({ preventScroll: true })
  }, [page, routeKey, stop])

  useLayoutEffect(() => () => cancelFeedReturn.current?.(), [routeKey])

  useLayoutEffect(() => {
    const panel = detailPage.current
    if (!panel || !atlasEntries) return
    const saved = detailScrollKey ? detailScrollPositions.current.get(detailScrollKey) : undefined
    panel.querySelectorAll<HTMLDetailsElement>('details').forEach((disclosure, index) => {
      const open = saved?.disclosures[index]
      if (open !== undefined) disclosure.open = open
    })
    panel.scrollTop = saved?.top ?? 0
  }, [atlasEntries, detailScrollKey, routeKey])

  const firstPosition = Math.max(feedReturnCards + 1, cardIndex - cardsBehind)
  const lastPosition = catalogue ? cardIndex + cardsAhead : Math.min(initialFeed.length, cardIndex + cardsAhead)
  // Keep the opening cards mounted so a long return can skip straight to them.
  const positions = [
    ...Array.from({ length: Math.min(lastPosition, feedReturnCards) + 1 }, (_, position) => position),
    ...Array.from({ length: lastPosition - firstPosition + 1 }, (_, offset) => firstPosition + offset),
  ]
  const visible = positions.map((position) => {
    const card = catalogue ? cardAt(catalogue, position) : initialFeed[position]
    return { position, card }
  })

  function saveDetailScroll() {
    const panel = detailPage.current
    if (!panel || !atlasEntries) return
    // History holds the lookup key. The positions disappear on a full reload.
    const key = detailScrollKey ?? crypto.getRandomValues(new Uint32Array(4)).join('-')
    detailScrollPositions.current.set(key, {
      top: panel.scrollTop,
      disclosures: Array.from(panel.querySelectorAll<HTMLDetailsElement>('details'), (disclosure) => disclosure.open),
    })
    if (!detailScrollKey) {
      window.history.replaceState({ ...window.history.state, detailScrollKey: key }, '')
    }
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>, resetFeed = false) {
    if (!isPlainClick(event)) return
    event.preventDefault()
    if (resetFeed) {
      cancelFeedReturn.current?.()
      if (surface.current) {
        cancelFeedReturn.current = scrollToFeedStart(surface.current, page === 'home' && scrollBehavior() === 'smooth')
      }
    }
    const url = new URL(event.currentTarget.href)
    const destination = readRoute(url.search)
    if (JSON.stringify(destination) === routeKey) {
      if (page === 'search') setSearchVersion((version) => version + 1)
      if (page === 'home' && window.location.href === `${url.href}?`) {
        window.history.replaceState(window.history.state, '', url.href)
      }
      return
    }
    saveDetailScroll()
    const detailBack = nodeId && destination.nodeId ? {
      href: window.location.href,
      label: title ?? 'Atlas entry',
    } : undefined
    window.history.pushState(detailBack ? { detailBack } : null, '', url.href)
    setNavigation(readNavigation())
  }

  function goTo(position: number) {
    if (!surface.current || position < 0 || position > lastPosition) return
    cancelFeedReturn.current?.()
    surface.current.scrollTo({ top: position * surface.current.clientHeight, behavior: scrollBehavior() })
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault()
      goTo(cardIndex + 1)
    } else if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault()
      goTo(cardIndex - 1)
    }
  }

  return (
    <div className="experience">
      <MobileMasthead back={detailHistory?.detailBack ?? mobileBackLink(route, groupLabel)} onNavigate={(event) => {
        if (!detailHistory?.detailBack) {
          navigate(event)
        } else if (isPlainClick(event)) {
          event.preventDefault()
          saveDetailScroll()
          window.history.back()
        }
      }} onBrandClick={(event) => navigate(event, true)} />
      <main className="screen">
        <section className="feed" ref={surface} tabIndex={0} inert={page !== 'home'} aria-label="Discover feed" onKeyDown={onKeyDown}
          onScroll={(event) => {
            const { scrollTop, clientHeight } = event.currentTarget
            if (!clientHeight) return
            const position = Math.min(lastPosition, Math.max(0, Math.round(scrollTop / clientHeight)))
            if (position !== currentIndex.current) {
              currentIndex.current = position
              preview.stop()
              setCardIndex(position)
            }
          }}>
          {visible.map(({ card: item, position }) => (
            <Fragment key={position}>
              {position === firstPosition && firstPosition > feedReturnCards + 1 && (
                <div className="feed-spacer" style={{ height: `${(firstPosition - feedReturnCards - 1) * 100}%` }} aria-hidden="true" />
              )}
              {!item ? (
                <div className="feed-card feed-card--node" inert={position !== cardIndex}>
                  {loadFailed ? (
                    <div className="feed-load-status">
                      <span role="status">Couldn’t load more cards.</span>
                      <button type="button" onClick={() => window.location.reload()}>Reload feed</button>
                    </div>
                  ) : <FeedSkeleton />}
                </div>
              ) : <article className={`feed-card feed-card--${item.kind}`} inert={position !== cardIndex}
                aria-label={item.kind === 'node' ? item.node.name : item.title}>
                {item.kind === 'node'
                  ? <NodePanel node={item.node} spotlight={item.spotlight} active={position === cardIndex} eager={position === cardIndex}
                      media={media} preview={preview} onNavigate={navigate} />
                  : <Soundtrail title={item.title} steps={item.steps} step={steps[position] ?? 0}
                      active={position === cardIndex} media={media} preview={preview} onNavigate={navigate}
                      onStepChange={(step) => {
                        if (position === cardIndex) preview.stop()
                        setSteps((previous) => ({
                          ...Object.fromEntries(Object.entries(previous).filter(([index]) => Math.abs(Number(index) - position) <= 24)),
                          [position]: step,
                        }))
                      }} />}
              </article>}
            </Fragment>
          ))}
        </section>
        <SearchPage key={searchVersion} catalogue={catalogue} loadFailed={loadFailed} hidden={page !== 'search'} headingRef={searchHeading} onNavigate={navigate} />
        <LibraryPage key={libraryHref(selection)} entries={atlasEntries} loadFailed={loadFailed} hidden={page !== 'library' || nodeId !== null}
          headingRef={page === 'library' && nodeId === null ? atlasHeading : null} onNavigate={navigate} selection={selection}
          renderArtwork={(entry) => <Cover node={entry} media={media} eager={false} />} />
        {nodeId !== null && (
          <AtlasDetail key={nodeId} entries={atlasById} nodeId={nodeId} loadFailed={loadFailed}
            pageRef={detailPage} headingRef={atlasHeading} onNavigate={navigate} selection={selection} origin={origin ?? undefined}
            renderArtwork={(entry) => (entry.type === 'genre' || entry.type === 'instrument') && (
              <Cover node={entry} media={media} eager />
            )}
            renderPreview={(entry) => entry.type === 'genre' && (
              <div style={{ '--accent': entry.accent } as CSSProperties}>
                <Listen node={entry} active media={media} preview={preview} />
              </div>
            )} />
        )}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {destinations.map(({ page: destination, label, Icon }) => (
          <a key={destination} href={pageHref(destination)} aria-current={(origin ?? page) === destination ? 'page' : undefined}
            onClick={(event) => navigate(event, page === 'home' && destination === 'home')}>
            <span className="nav-icon"><Icon size={21} aria-hidden="true" /></span>
            {label}
          </a>
        ))}
      </nav>
      <audio ref={audio} preload="none" {...events} />
    </div>
  )
}
