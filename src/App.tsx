import { ArrowDownWideNarrow, BarChart3, Bubbles, ChartGantt, Disc3, Guitar, SlidersHorizontal, Users, X, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from 'react'
import { useExplorer } from './ExplorerContext.ts'
import { ExplorerProvider } from './ExplorerProvider.tsx'
import { DatasetStats } from './components/DatasetStats.tsx'
import { DetailPanel } from './components/DetailPanel.tsx'
import { Legend } from './components/Legend.tsx'
import { SearchBar } from './components/SearchBar.tsx'
import { Timeline } from './components/Timeline.tsx'
import { GenreBubbles } from './components/GenreBubbles.tsx'
import { MOBILE_DETAIL_COLLAPSED_OFFSET, MOBILE_DETAIL_HEIGHT } from './components/mobileDetailSheet.ts'
import rawGraph from './data/graph.json'
import type { GenreOrder } from './graph/layout.ts'
import type { StatsTab } from './graph/stats.ts'
import { TIMELINE_VIEWS, type TimelineView } from './graph/timeline.ts'
import type { MusicGraph } from './graph/types.ts'

const graph = rawGraph as MusicGraph

const STAT_LABELS = { genre: 'genres', artist: 'artists', instrument: 'instruments', links: 'links' } as const

export function Explorer() {
  const { index, view, changeView, selectedId, selectNode, genreOrder, changeGenreOrder, genreDisplay } = useExplorer()
  const showingBubbles = view === 'genre' && genreDisplay === 'bubbles'
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [statsTab, setStatsTab] = useState<StatsTab | null>(null)
  const stats = useMemo(() => {
    const count = (type: string) => index.graph.nodes.filter((node) => node.type === type).length
    return {
      genre: count('genre'), artist: count('artist'), instrument: count('instrument'),
      links: index.graph.edges.length,
    }
  }, [index])

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
    <div className="flex h-dvh flex-col">
      <header className="z-20 flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2 md:flex-wrap md:gap-x-6 md:gap-y-3 md:px-5 md:py-3">
        <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <Disc3 className="h-5 w-5 text-violet-400 md:h-6 md:w-6" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-white">Soundlines</h1>
            <p className="hidden text-[11px] font-medium leading-tight text-slate-500 md:block">
              a chronological map of music lineages
            </p>
          </div>
        </div>
        <div className="ml-auto shrink-0 md:ml-0 md:w-80">
          <SearchBar />
        </div>
        <ViewToggle view={view} changeView={changeView} className="hidden md:flex" />
        {view === 'genre' && <GenreDisplaySelect className="hidden md:flex" />}
        {view === 'genre' && !showingBubbles && (
          <GenreOrderSelect genreOrder={genreOrder} changeGenreOrder={changeGenreOrder} className="hidden md:flex" />
        )}
        <div className="-mr-2 ml-auto hidden items-center gap-1 text-xs font-medium text-slate-500 md:flex">
          {(['genre', 'artist', 'instrument', 'links'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatsTab(tab)}
              className="rounded-md px-2 py-1 transition-colors hover:bg-slate-800/70 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              aria-label={`${stats[tab]} ${STAT_LABELS[tab]} – show dataset statistics`}
            >
              <strong className="text-slate-300">{stats[tab]}</strong> {STAT_LABELS[tab]}
            </button>
          ))}
        </div>
      </header>
      {!showingBubbles && <div className="hidden border-b border-slate-800/60 bg-slate-950/70 px-5 py-1.5 lg:block"><Legend /></div>}
      <main className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {showingBubbles ? <GenreBubbles /> : <Timeline key={view === 'genre' ? `${view}-${genreOrder}` : view} />}
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
              <div className="h-full w-[360px]"><DetailPanel /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <div className="relative z-40 flex shrink-0 items-center justify-between border-t border-slate-800 bg-slate-950/95 px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] md:hidden">
        <ViewToggle view={view} changeView={changeView} />
        <button
          type="button"
          onClick={() => setOptionsOpen(true)}
          className="flex min-h-11 items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-300 active:bg-slate-800"
          aria-label="Timeline options and legend"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Options
        </button>
      </div>
      <AnimatePresence>
        {optionsOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end bg-black/60 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOptionsOpen(false)}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Timeline options"
              className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border-t border-slate-700 bg-slate-950 px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-white">Timeline options</div>
                  <div className="mt-1 text-xs text-slate-500">Adjust the view and explore the legend</div>
                </div>
                <button
                  type="button"
                  onClick={() => setOptionsOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 active:bg-slate-800"
                  aria-label="Close options"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {view === 'genre' && (
                <GenreDisplaySelect className="mb-6 flex" />
              )}
              {view === 'genre' && !showingBubbles && (
                <GenreOrderSelect genreOrder={genreOrder} changeGenreOrder={changeGenreOrder} className="mb-6 flex" />
              )}
              {!showingBubbles && <div className="border-t border-slate-800 pt-4"><Legend /></div>}
              <button
                type="button"
                onClick={() => {
                  setOptionsOpen(false)
                  setStatsTab('overview')
                }}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-300 active:bg-slate-800"
              >
                <BarChart3 className="h-4 w-4" />
                Dataset statistics
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {statsTab && <DatasetStats key="dataset-stats" initialTab={statsTab} onClose={() => setStatsTab(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {selectedId && (
          <MobileDetailSheet key={selectedId} onClose={() => selectNode(null)} />
        )}
      </AnimatePresence>
      <footer className="hidden border-t border-slate-800/60 bg-slate-950/90 px-5 py-1.5 text-[11px] font-medium text-slate-600 md:block">
        {showingBubbles
          ? 'Size and brightness show catalogue influence · drag or scroll to move · pinch or ⌘ scroll to zoom · click a bubble for details'
          : 'Drag or scroll to move · pinch or ⌘ scroll to zoom · click a bar for details'}
      </footer>
    </div>
  )
}

function MobileDetailSheet({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const dragStart = useRef<number | null>(null)
  const suppressClick = useRef(false)

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    dragStart.current = event.clientY
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current === null) return
    const delta = event.clientY - dragStart.current
    dragStart.current = null
    suppressClick.current = Math.abs(delta) > 40
    if (delta < -40) setExpanded(true)
    if (delta > 40) {
      if (expanded) setExpanded(false)
      else onClose()
    }
  }

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-30 overflow-hidden rounded-t-3xl border-t border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 md:hidden"
      initial={{ y: '100%' }}
      animate={{ y: expanded ? 0 : `${MOBILE_DETAIL_COLLAPSED_OFFSET * 100}%` }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      style={{ height: `${MOBILE_DETAIL_HEIGHT * 100}dvh`, paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-8 items-center justify-center">
        <button
          type="button"
          className="flex h-8 w-16 touch-none items-center justify-center"
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
          onClick={() => {
            if (suppressClick.current) {
              suppressClick.current = false
              return
            }
            setExpanded((current) => !current)
          }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            dragStart.current = null
          }}
        >
          <span className="h-1 w-10 rounded-full bg-slate-600" />
        </button>
      </div>
      <div className="h-[calc(100%-2rem)] overflow-y-auto overscroll-contain">
        <DetailPanel onClose={onClose} />
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

const VIEW_OPTIONS: Record<TimelineView, { label: string; Icon: LucideIcon }> = {
  genre: { label: 'Genres', Icon: Disc3 },
  artist: { label: 'Artists', Icon: Users },
  instrument: { label: 'Instruments', Icon: Guitar },
}

export function ViewToggle({
  view,
  changeView,
  className = '',
}: {
  view: TimelineView
  changeView: (view: TimelineView) => void
  className?: string
}) {
  const indicatorId = useId()
  const options = TIMELINE_VIEWS
  const { buttonRefs, handleKeyDown } = useToggleNavigation(view, options, changeView)

  return (
    <div
      className={`${toggleContainerClass} ${className}`}
      role="radiogroup"
      aria-label="Timeline view"
      onKeyDown={handleKeyDown}
    >
      {options.map((type) => {
        const selected = view === type
        const { label, Icon } = VIEW_OPTIONS[type]
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
            className={toggleButtonClass(selected)}
          >
            {selected && <ToggleIndicator layoutId={`view-toggle-indicator-${indicatorId}`} />}
            <span className="relative flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function GenreDisplaySelect({ className = '' }: { className?: string }) {
  const { genreDisplay, changeGenreDisplay } = useExplorer()
  const indicatorId = useId()
  return (
    <div className={`${toggleContainerClass} ${className}`} role="group" aria-label="Genre display">
      {(['bars', 'bubbles'] as const).map((display) => {
        const selected = genreDisplay === display
        return (
          <button
            key={display}
            type="button"
            aria-pressed={selected}
            onClick={() => changeGenreDisplay(display)}
            className={`${toggleButtonClass(selected)} min-w-0 flex-1 justify-center md:flex-none`}
          >
            {selected && <ToggleIndicator layoutId={`genre-display-indicator-${indicatorId}`} />}
            <span className="relative flex items-center gap-1.5">
              {display === 'bars'
                ? <ChartGantt className="h-3.5 w-3.5" aria-hidden="true" />
                : <Bubbles className="h-3.5 w-3.5" aria-hidden="true" />}
              {display === 'bars' ? 'Bars' : 'Bubbles'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function GenreOrderSelect({
  genreOrder,
  changeGenreOrder,
  className = '',
}: {
  genreOrder: GenreOrder
  changeGenreOrder: (order: GenreOrder) => void
  className?: string
}) {
  const indicatorId = useId()
  const options = ['family', 'oldest-first'] as const
  const { buttonRefs, handleKeyDown } = useToggleNavigation(genreOrder, options, changeGenreOrder)

  return (
    <div
      className={`${toggleContainerClass} ${className}`}
      role="radiogroup"
      aria-label="Genre order"
      onKeyDown={handleKeyDown}
    >
      <ArrowDownWideNarrow className="mx-2 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      {options.map((order) => {
        const selected = genreOrder === order
        return (
          <button
            key={order}
            ref={(element) => {
              buttonRefs.current[order] = element
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => changeGenreOrder(order)}
            className={`${toggleButtonClass(selected)} min-w-0 flex-1 justify-center whitespace-nowrap md:flex-none`}
          >
            {selected && <ToggleIndicator layoutId={`genre-order-indicator-${indicatorId}`} />}
            <span className="relative">{order === 'family' ? 'Family groups' : 'Oldest first'}</span>
          </button>
        )
      })}
    </div>
  )
}

function App() {
  return (
    <ExplorerProvider graph={graph}>
      <MotionConfig reducedMotion="user">
        <Explorer />
      </MotionConfig>
    </ExplorerProvider>
  )
}

export default App
