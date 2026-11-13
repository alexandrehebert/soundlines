'use client'

import { ArrowDownWideNarrow, BarChart3, Bubbles, ChartGantt, Disc3, Guitar, History as HistoryIcon, SlidersHorizontal, Users, X, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useExplorer } from './ExplorerContext.ts'
import { DatasetStats } from './components/DatasetStats.tsx'
import { DetailPanel } from './components/DetailPanel.tsx'
import { Legend } from './components/Legend.tsx'
import { SearchBar } from './components/SearchBar.tsx'
import { Timeline } from './components/Timeline.tsx'
import { GenreBubbles } from './components/GenreBubbles.tsx'
import { History } from './components/History.tsx'
import { BrandLink } from './components/BrandLink.tsx'
import { Home } from './components/Home.tsx'
import { MOBILE_DETAIL_COLLAPSED_OFFSET, MOBILE_DETAIL_HEIGHT } from './components/mobileDetailSheet.ts'
import type { TimelineOrder } from './graph/layout.ts'
import type { StatsTab } from './graph/stats.ts'
import { EXPLORER_VIEWS, isTimelineView, type ExplorerView, type TimelineView } from './graph/timeline.ts'
import { localizePath } from './i18n/routing.ts'
import { isJukeboxPath } from './explorerLocation.ts'
import { isOpenDataPath } from './openData.ts'

export function Explorer() {
  const { index, locale, view, changeView, selectedId, selectNode, order, changeOrder, genreDisplay, goHome } = useExplorer()
  const t = useTranslations()
  const tEntityStats = useTranslations('entityStats')
  const tTimelineFooter = useTranslations('timeline.footer')
  const showingBubbles = view === 'genre' && genreDisplay === 'bubbles'
  const showingHistory = view === 'history'
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [statsTab, setStatsTab] = useState<StatsTab | null>(null)
  const optionsRef = useRef<HTMLElement>(null)
  const optionsTriggerRef = useRef<HTMLButtonElement>(null)
  const restoreOptionsFocusRef = useRef(true)
  const optionsId = useId()
  const explorerScrollDistance = useMotionValue(0)
  const scrollPositions = useRef(new WeakMap<HTMLElement, number>())
  const stats = useMemo(() => {
    const count = (type: string) => index.graph.nodes.filter((node) => node.type === type).length
    return { genre: count('genre'), artist: count('artist'), instrument: count('instrument') }
  }, [index])

  useEffect(() => {
    if (!optionsOpen) return
    restoreOptionsFocusRef.current = true
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = optionsRef.current
    panel?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => {
      if (restoreOptionsFocusRef.current
        && (document.activeElement === document.body || panel?.contains(document.activeElement))) previous?.focus()
    }
  }, [optionsOpen])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 48rem)')
    const syncLayout = () => {
      setIsDesktop(desktop.matches)
      if (!optionsOpen) return
      if (desktop.matches && showingHistory) setOptionsOpen(false)
      else if (!desktop.matches && !optionsRef.current?.contains(document.activeElement)) {
        optionsRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
      }
    }
    desktop.addEventListener('change', syncLayout)
    syncLayout()
    return () => desktop.removeEventListener('change', syncLayout)
  }, [optionsOpen, showingHistory])

  useEffect(() => {
    if (!optionsOpen || !isDesktop) return
    const dismissOutside = (event: Event) => {
      if (event.target instanceof Node
        && !optionsRef.current?.contains(event.target)
        && !optionsTriggerRef.current?.contains(event.target)) {
        restoreOptionsFocusRef.current = false
        setOptionsOpen(false)
      }
    }
    document.addEventListener('pointerdown', dismissOutside)
    return () => document.removeEventListener('pointerdown', dismissOutside)
  }, [optionsOpen, isDesktop])

  const trapOptionsFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (isDesktop || event.key !== 'Tab' || !optionsRef.current) return
    const focusable = [...optionsRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]):not([tabindex="-1"]), a[href]',
    )].filter((element) => element.getClientRects().length > 0)
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  useEffect(() => {
    if (!optionsOpen && !selectedId && !statsTab) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (statsTab) setStatsTab(null)
      else if (optionsOpen) setOptionsOpen(false)
      else selectNode(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [optionsOpen, selectedId, selectNode, statsTab])

  return (
    // Keep the navigation pinned when mobile browser chrome changes the viewport.
    // Clip the exiting sheet so its translated bounds cannot enlarge the document.
    <div className="fixed inset-0 flex flex-col overflow-clip">
      <header data-explorer-transition-header className={`${optionsOpen ? 'z-50' : 'z-20'} flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2 md:flex-wrap md:gap-x-6 md:gap-y-3 md:px-5 md:py-3`}>
        <BrandLink
          href={localizePath('/', locale)}
          scrollDistance={explorerScrollDistance}
          iconClassName="h-6 w-6 shrink-0 md:h-7 md:w-7"
          aria-label={t('home')}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            event.preventDefault()
            setStatsTab(null)
            setOptionsOpen(false)
            goHome()
          }}
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 md:gap-2.5"
        >
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-white">Soundlines</h1>
            <p className="hidden text-[11px] font-medium leading-tight text-slate-500 md:block">
              {t('tagline')}
            </p>
          </div>
        </BrandLink>
        <div className="ml-auto shrink-0 md:ml-0 md:w-80">
          <SearchBar />
        </div>
        <div className="contents md:relative md:flex md:shrink-0 md:items-center md:gap-2">
          <ViewToggle view={view} changeView={changeView} className="hidden md:flex" />
          {!showingHistory && (
            <button
              ref={optionsTriggerRef}
              type="button"
              onClick={() => setOptionsOpen((open) => !open)}
              className="hidden min-h-9 shrink-0 items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-300 hover:bg-(--control-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 md:flex"
              aria-label={t('timelineOptions')}
              aria-haspopup="dialog"
              aria-expanded={optionsOpen}
              aria-controls={optionsId}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('options')}
            </button>
          )}
          <AnimatePresence>
            {optionsOpen && (
              <motion.div
                className="fixed inset-0 z-40 flex items-end md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:block md:w-[min(28rem,calc(100vw-2.5rem))]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOptionsOpen(false)}
              >
                <div className="absolute inset-0 bg-black/60 md:hidden" aria-hidden="true" />
                <motion.section
                  ref={optionsRef}
                  id={optionsId}
                  role="dialog"
                  aria-modal={!isDesktop}
                  aria-label={t(showingHistory ? 'historyOptions' : 'timelineOptions')}
                  className="relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border-t border-slate-700 bg-slate-950 px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3 md:max-h-[calc(100dvh-10rem)] md:rounded-2xl md:border md:p-5 md:shadow-2xl md:shadow-black/60"
                  initial={{ y: 12 }}
                  animate={{ y: 0 }}
                  exit={{ y: 12 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={trapOptionsFocus}
                  onBlur={(event) => {
                    if (isDesktop && !event.currentTarget.contains(event.relatedTarget)
                      && !optionsTriggerRef.current?.contains(event.relatedTarget)) {
                      restoreOptionsFocusRef.current = false
                      setOptionsOpen(false)
                    }
                  }}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="text-base font-bold text-white">{t(showingHistory ? 'historyOptions' : 'timelineOptions')}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {showingHistory ? t('exploreStatistics') : (
                          <>
                            <span className="md:hidden">{t('adjustViewAndLegend')}</span>
                            <span className="hidden md:inline">{t('adjustView')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOptionsOpen(false)}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 active:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
                      aria-label={t('closeOptions')}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  {!showingHistory && (
                    <div className="mb-6 space-y-6 md:mb-0">
                      {view === 'genre' && <GenreDisplaySelect className="flex" onDisplayChange={() => setOptionsOpen(false)} />}
                      {!showingBubbles && isTimelineView(view) && (
                        <TimelineOrderSelect view={view} order={order} changeOrder={changeOrder} className="flex" />
                      )}
                    </div>
                  )}
                  {!showingBubbles && !showingHistory && (
                    <div className="border-t border-slate-800 pt-4 md:hidden"><Legend /></div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOptionsOpen(false)
                      setStatsTab('overview')
                    }}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 active:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 md:hidden"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {t('datasetStatistics')}
                  </button>
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="-mr-2 ml-auto hidden items-center gap-1 text-xs font-medium text-slate-500 md:flex">
          {(['genre', 'artist', 'instrument'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatsTab(tab)}
              className="rounded-md px-2 py-1 transition-colors hover:bg-slate-800/70 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              aria-label={`${stats[tab]} ${tEntityStats(tab)} – ${t('showDatasetStatistics')}`}
            >
              <strong className="text-slate-300">{stats[tab]}</strong> {tEntityStats(tab)}
            </button>
          ))}
        </div>
      </header>
      {!showingBubbles && !showingHistory && (
        <div role="region" aria-label={t('legend.region')}
          className="hidden shrink-0 border-b border-slate-800/60 bg-slate-950/70 px-5 py-1.5 md:block">
          <Legend />
        </div>
      )}
      <main data-explorer-transition-content className="relative flex min-h-0 flex-1">
        <div
          data-explorer-transition-view
          className="min-w-0 flex-1 bg-slate-950"
          onScrollCapture={(event) => {
            const surface = event.target
            if (!(surface instanceof HTMLElement)) return
            const position = surface.scrollTop + surface.scrollLeft
            const previous = scrollPositions.current.get(surface) ?? 0
            scrollPositions.current.set(surface, position)
            explorerScrollDistance.set(explorerScrollDistance.get() + position - previous)
          }}
          onWheelCapture={(event) => {
            // Timeline panning changes the visible year range instead of scrollLeft.
            if (event.ctrlKey || event.metaKey || Math.abs(event.deltaX) <= Math.abs(event.deltaY)
              || !(event.target instanceof Element) || !event.target.closest('[data-timeline-view]')) return
            const pixelsPerUnit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? event.currentTarget.clientWidth : 1
            explorerScrollDistance.set(explorerScrollDistance.get() + event.deltaX * pixelsPerUnit)
          }}
        >
          {showingHistory ? <History /> : showingBubbles ? <GenreBubbles /> : <Timeline key={`${view}-${order}`} />}
        </div>
        <AnimatePresence>
          {selectedId && (
            <motion.div
              key="desktop-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="hidden shrink-0 overflow-hidden md:block"
            >
              <div className="h-full w-[360px]"><DetailPanel showGenreSample={isDesktop} /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <div data-explorer-transition-navigation className="relative z-40 flex shrink-0 items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/95 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
        <ViewToggle view={view} changeView={changeView} className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={() => setOptionsOpen(true)}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-300 active:bg-(--control-hover)"
          aria-label={t(showingHistory ? 'historyOptions' : 'timelineOptionsAndLegend')}
          aria-haspopup="dialog"
          aria-expanded={optionsOpen}
          aria-controls={optionsId}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{t('options')}</span>
        </button>
      </div>
      <AnimatePresence>
        {statsTab && <DatasetStats key="dataset-stats" initialTab={statsTab} onClose={() => setStatsTab(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedId && (
          <MobileDetailSheet key="mobile-panel" onClose={() => selectNode(null)} showGenreSample={!isDesktop} />
        )}
      </AnimatePresence>
      <footer className="hidden border-t border-slate-800/60 bg-slate-950/90 px-5 py-1.5 text-[11px] font-medium text-slate-600 md:block">
        {showingHistory
          ? tTimelineFooter('history')
          : showingBubbles
          ? tTimelineFooter('bubbles')
          : tTimelineFooter('timeline')}
      </footer>
    </div>
  )
}

function MobileDetailSheet({ onClose, showGenreSample }: { onClose: () => void; showGenreSample: boolean }) {
  const t = useTranslations()
  const [expanded, setExpanded] = useState(false)
  const dragStart = useRef<{ pointerId: number; x: number; y: number } | null>(null)
  const suppressClick = useRef(false)

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('audio')) return
    if (expanded && (!(event.target instanceof Element)
      || !event.target.closest('[data-detail-drag-region]'))) return
    dragStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    if (Math.abs(event.clientY - start.y) > 40
      && Math.abs(event.clientY - start.y) > Math.abs(event.clientX - start.x)) {
      suppressClick.current = true
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current
    if (!start || start.pointerId !== event.pointerId) return
    dragStart.current = null
    const delta = event.clientY - start.y
    if (Math.abs(delta) <= 40 || Math.abs(delta) <= Math.abs(event.clientX - start.x)) return
    suppressClick.current = true
    if (delta < -40) setExpanded(true)
    if (delta > 40) {
      if (expanded) setExpanded(false)
      else onClose()
    }
  }

  return (
    <motion.div
      data-mobile-detail-sheet=""
      className={`absolute inset-x-0 bottom-0 z-30 flex flex-col overflow-hidden rounded-t-3xl border-t border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 md:hidden ${expanded ? '' : 'touch-none'}`}
      onPointerDownCapture={() => { suppressClick.current = false }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { dragStart.current = null }}
      onLostPointerCapture={(event) => {
        if (event.target === event.currentTarget) dragStart.current = null
      }}
      onClickCapture={(event) => {
        const suppress = suppressClick.current
        suppressClick.current = false
        if (!suppress || event.detail === 0) return
        event.preventDefault()
        event.stopPropagation()
      }}
      initial={{ y: '100%' }}
      animate={{ y: expanded ? 0 : `${MOBILE_DETAIL_COLLAPSED_OFFSET * 100}%` }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      style={{ height: `${MOBILE_DETAIL_HEIGHT * 100}%`, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div data-detail-drag-region="" className="relative flex shrink-0 touch-none items-center justify-center py-1">
        <button
          type="button"
          className="flex h-11 w-16 touch-none items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          aria-label={t(expanded ? 'collapseDetails' : 'expandDetails')}
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="h-1 w-10 rounded-full bg-slate-600" />
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClose}
          className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
          aria-label={t('closePanel')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <DetailPanel onClose={onClose} showCloseButton={false} scrollable={expanded} showGenreSample={showGenreSample} />
      </div>
    </motion.div>
  )
}

const toggleContainerClass = 'relative flex items-center rounded-full border border-slate-700 bg-slate-900 p-1'

function toggleButtonClass(selected: boolean) {
  return `relative flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 md:min-h-0 md:px-3 md:py-1 md:text-xs ${
    selected ? 'text-cyan-200' : 'text-slate-500 hover:text-slate-300'
  }`
}

function ToggleIndicator({ layoutId }: { layoutId: string }) {
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-0 rounded-full border border-cyan-500/50 bg-cyan-500/15 shadow-sm shadow-cyan-500/20"
      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
    />
  )
}

function useToggleNavigation<T extends string>(
  selected: T,
  options: readonly T[],
  onChange: (value: T) => void,
) {
  const buttonRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({})

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const current = options.indexOf(selected)
    const next =
      event.key === 'Home' ? 0
      : event.key === 'End' ? options.length - 1
      : (current + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) + options.length) % options.length
    onChange(options[next])
    buttonRefs.current[options[next]]?.focus()
  }

  return { buttonRefs, handleKeyDown }
}

const VIEW_OPTIONS: Record<ExplorerView, { Icon: LucideIcon }> = {
  genre: { Icon: Disc3 },
  artist: { Icon: Users },
  instrument: { Icon: Guitar },
  history: { Icon: HistoryIcon },
}

export function ViewToggle({
  view,
  changeView,
  className = '',
}: {
  view: ExplorerView
  changeView: (view: ExplorerView) => void
  className?: string
}) {
  const t = useTranslations()
  const tViews = useTranslations('views')
  const indicatorId = useId()
  const options = EXPLORER_VIEWS
  const { buttonRefs, handleKeyDown } = useToggleNavigation(view, options, changeView)

  return (
    <div
      className={`${toggleContainerClass} ${className}`}
      role="radiogroup"
      aria-label={t('timelineView')}
      onKeyDown={handleKeyDown}
    >
      {options.map((type) => {
        const selected = view === type
        const { Icon } = VIEW_OPTIONS[type]
        return (
          <button
            key={type}
            ref={(element) => {
              buttonRefs.current[type] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => changeView(type)}
            className={`relative flex min-h-9 min-w-0 flex-auto items-center justify-center gap-1 rounded-full px-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:text-sm md:min-h-0 md:flex-none md:px-3 md:py-1.5 md:text-xs ${
              selected ? 'text-cyan-200' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {selected && <ToggleIndicator layoutId={`view-toggle-indicator-${indicatorId}`} />}
            <span className="relative flex items-center gap-1.5">
              <Icon className="hidden h-3.5 w-3.5 min-[380px]:block" aria-hidden="true" />
              {tViews(type)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function GenreDisplaySelect({ className = '', onDisplayChange }: {
  className?: string
  onDisplayChange?: () => void
}) {
  const { genreDisplay, changeGenreDisplay } = useExplorer()
  const t = useTranslations()
  const indicatorId = useId()
  return (
    <div className={`${toggleContainerClass} ${className}`} role="group" aria-label={t('genreDisplay')}>
      {(['bars', 'bubbles'] as const).map((display) => {
        const selected = genreDisplay === display
        return (
          <button
            key={display}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              if (selected) return
              changeGenreDisplay(display)
              onDisplayChange?.()
            }}
            className={`${toggleButtonClass(selected)} min-w-0 flex-1 justify-center`}
          >
            {selected && <ToggleIndicator layoutId={`genre-display-indicator-${indicatorId}`} />}
            <span className="relative flex items-center gap-1.5">
              {display === 'bars'
                ? <ChartGantt className="h-3.5 w-3.5" aria-hidden="true" />
                : <Bubbles className="h-3.5 w-3.5" aria-hidden="true" />}
              {t(display)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function TimelineOrderSelect({
  view,
  order,
  changeOrder,
  className = '',
}: {
  view: TimelineView
  order: TimelineOrder
  changeOrder: (order: TimelineOrder) => void
  className?: string
}) {
  const tOrder = useTranslations('order')
  const t = useTranslations()
  const indicatorId = useId()
  const options = ['family', 'oldest-first'] as const
  const { buttonRefs, handleKeyDown } = useToggleNavigation(order, options, changeOrder)

  return (
    <div
      className={`${toggleContainerClass} ${className}`}
      role="radiogroup"
      aria-label={tOrder(view)}
      onKeyDown={handleKeyDown}
    >
      <ArrowDownWideNarrow className="mx-2 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      {options.map((option) => {
        const selected = order === option
        return (
          <button
            key={option}
            ref={(element) => {
              buttonRefs.current[option] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => changeOrder(option)}
            className={`${toggleButtonClass(selected)} min-w-0 flex-1 justify-center whitespace-nowrap`}
          >
            {selected && <ToggleIndicator layoutId={`timeline-order-indicator-${indicatorId}`} />}
            <span className="relative">{t(option === 'family' ? 'familyGroups' : 'oldestFirst')}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function App() {
  const { isHome } = useExplorer()
  const pathname = usePathname()
  if (isOpenDataPath(pathname) || isJukeboxPath(pathname)) return null
  return isHome ? <Home /> : <Explorer />
}
