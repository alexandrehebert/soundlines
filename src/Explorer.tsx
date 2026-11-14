'use client'

import { SlidersHorizontal } from 'lucide-react'
import { AnimatePresence, motion, useMotionValue } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, useCallback, type SetStateAction } from 'react'
import { useTranslations } from 'next-intl'
import { useExplorer } from './ExplorerContext.ts'
import { DatasetStats } from './components/dataset/DatasetStats.tsx'
import { DetailPanel } from './components/explorer/DetailPanel.tsx'
import { Legend } from './components/explorer/Legend.tsx'
import { SearchBar } from './components/navigation/SearchBar.tsx'
import { Timeline } from './components/timeline/Timeline.tsx'
import { GenreBubbles } from './components/bubbles/GenreBubbles.tsx'
import { History } from './components/timeline/History.tsx'
import { BrandLink } from './components/navigation/BrandLink.tsx'
import { MobileDetailSheet } from './components/explorer/MobileDetailSheet.tsx'
import { ViewToggle } from './components/explorer/ExplorerControls.tsx'
import { ExplorerOptions } from './components/explorer/ExplorerOptions.tsx'
import { usePanelHistory } from './components/ui/usePanelHistory.ts'
import { useIsDesktop } from './components/ui/useSheetDrag.ts'
import type { StatsTab } from './graph/stats.ts'
import { localizePath } from './i18n/routing.ts'

export function Explorer() {
  const { index, locale, view, changeView, selectedId, selectNode, order, genreDisplay, goHome } = useExplorer()
  const t = useTranslations()
  const tEntityStats = useTranslations('entityStats')
  const tTimelineFooter = useTranslations('timeline.footer')
  const showingBubbles = view === 'genre' && genreDisplay === 'bubbles'
  const showingHistory = view === 'history'
  const [desktopOptionsOpen, setDesktopOptionsOpen] = useState(false)
  const isDesktop = useIsDesktop()
  const { value: panel, open: openPanel, close: closePanel } = usePanelHistory<StatsTab | 'options'>('explorer')
  const optionsOpen = desktopOptionsOpen || panel === 'options'
  const statsTab = panel === 'options' ? null : panel
  const setOptionsOpen = useCallback((action: SetStateAction<boolean>) => {
    const open = typeof action === 'function' ? action(optionsOpen) : action
    if (open && !isDesktop) openPanel('options')
    else {
      setDesktopOptionsOpen(open)
      if (!open && panel === 'options') closePanel()
    }
  }, [optionsOpen, isDesktop, openPanel, panel, closePanel])
  const optionsId = useId()
  const layoutRef = useRef<HTMLDivElement>(null)
  const mobileNavigationRef = useRef<HTMLDivElement>(null)
  const explorerScrollDistance = useMotionValue(0)
  const scrollPositions = useRef(new WeakMap<HTMLElement, number>())
  const stats = useMemo(() => {
    const count = (type: string) => index.graph.nodes.filter((node) => node.type === type).length
    return { genre: count('genre'), artist: count('artist'), instrument: count('instrument') }
  }, [index])

  useEffect(() => {
    const layout = layoutRef.current
    const navigation = mobileNavigationRef.current
    if (!layout || !navigation) return
    const update = () => layout.style.setProperty('--mobile-navigation-height', `${navigation.offsetHeight}px`)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(navigation)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!optionsOpen && !selectedId && !statsTab) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (statsTab) closePanel()
      else if (optionsOpen) setOptionsOpen(false)
      else selectNode(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [optionsOpen, selectedId, selectNode, statsTab, closePanel, setOptionsOpen])

  return (
    // Keep the navigation pinned when mobile browser chrome changes the viewport.
    // Clip the exiting sheet so its translated bounds cannot enlarge the document.
    <div
      ref={layoutRef}
      className="fixed inset-0 flex flex-col overflow-clip"
      onClick={(event) => {
        const target = event.target
        if (!showingHistory || !selectedId || optionsOpen || statsTab || event.defaultPrevented
          || !(target instanceof Element) || !event.currentTarget.contains(target)
          || target.closest('[data-mobile-detail-sheet], [data-desktop-detail-panel], .history-event-card, button, a, input, select, textarea, label')) return
        selectNode(null)
      }}
    >
      <header data-explorer-transition-header className={`soundlines-page-header ${optionsOpen ? 'z-50' : 'z-20'} flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2 md:px-5 xl:gap-6`}>
        <BrandLink
          href={localizePath('/', locale)}
          scrollDistance={explorerScrollDistance}
          iconClassName="h-6 w-6 shrink-0 md:h-7 md:w-7"
          aria-label={t('home')}
          onClick={(event) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            event.preventDefault()
            setDesktopOptionsOpen(false)
            goHome()
          }}
          className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 md:gap-2.5"
        >
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-white">Soundlines</h1>
            <p className="hidden text-[11px] font-medium leading-tight text-slate-500 xl:block">
              {t('tagline')}
            </p>
          </div>
        </BrandLink>
        <div className="ml-auto shrink-0 md:ml-0 md:min-w-0 md:max-xl:flex-1 xl:w-80 xl:shrink">
          <SearchBar fillWidth />
        </div>
        <div className="contents md:relative md:flex md:shrink-0 md:items-center md:gap-2">
          <ViewToggle view={view} changeView={changeView} className="hidden md:flex" />
          <ExplorerOptions
            optionsId={optionsId}
            optionsOpen={optionsOpen}
            setOptionsOpen={setOptionsOpen}
            isDesktop={isDesktop}
            onShowStatistics={() => {
              setDesktopOptionsOpen(false)
              openPanel('overview', { replace: true })
            }}
          />
        </div>
        <div className="-mr-2 ml-auto hidden items-center gap-1 text-xs font-medium text-slate-500 xl:flex">
          {(['genre', 'artist', 'instrument'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => openPanel(tab)}
              className="whitespace-nowrap rounded-md px-2 py-1 transition-colors hover:bg-slate-800/70 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              aria-label={`${stats[tab]} ${tEntityStats(tab)} – ${t('showDatasetStatistics')}`}
            >
              <strong className="text-slate-300">{stats[tab]}</strong>{' '}
              {tEntityStats(tab)}
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
              data-desktop-detail-panel=""
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
      <div ref={mobileNavigationRef} data-explorer-transition-navigation className="relative z-40 flex shrink-0 items-center justify-between gap-2 border-t border-slate-800 bg-slate-950/95 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
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
        {statsTab && <DatasetStats key="dataset-stats" initialTab={statsTab} onClose={closePanel} />}
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
