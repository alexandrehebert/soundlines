import { Disc3, SlidersHorizontal, Users, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useExplorer } from './ExplorerContext.ts'
import { ExplorerProvider } from './ExplorerProvider.tsx'
import { DetailPanel } from './components/DetailPanel.tsx'
import { Legend } from './components/Legend.tsx'
import { SearchBar } from './components/SearchBar.tsx'
import { Timeline } from './components/Timeline.tsx'
import rawGraph from './data/graph.json'
import type { MusicGraph } from './graph/types.ts'

const graph = rawGraph as MusicGraph

function Explorer() {
  const { index, view, changeView, selectedId, selectNode, genreOrder, changeGenreOrder } = useExplorer()
  const [optionsOpen, setOptionsOpen] = useState(false)
  const stats = useMemo(() => {
    const count = (type: string) => index.graph.nodes.filter((node) => node.type === type).length
    return { genres: count('genre'), artists: count('artist'), links: index.graph.edges.length }
  }, [index])

  useEffect(() => {
    if (!optionsOpen && !selectedId) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (optionsOpen) setOptionsOpen(false)
      else selectNode(null)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [optionsOpen, selectedId, selectNode])

  return (
    <div className="flex h-dvh flex-col">
      <header className="z-10 flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950/90 px-3 py-2 md:flex-wrap md:gap-x-6 md:gap-y-3 md:px-5 md:py-3">
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
        {view === 'genre' && (
          <GenreOrderSelect genreOrder={genreOrder} changeGenreOrder={changeGenreOrder} className="hidden md:flex" />
        )}
        <div className="ml-auto hidden items-center gap-4 text-xs font-medium text-slate-500 md:flex">
          <span><strong className="text-slate-300">{stats.genres}</strong> genres</span>
          <span><strong className="text-slate-300">{stats.artists}</strong> artists</span>
          <span><strong className="text-slate-300">{stats.links}</strong> links</span>
        </div>
      </header>
      <div className="hidden border-b border-slate-800/60 bg-slate-950/70 px-5 py-1.5 lg:block"><Legend /></div>
      <main className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <Timeline key={view === 'genre' ? `${view}-${genreOrder}` : view} />
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
                <GenreOrderSelect genreOrder={genreOrder} changeGenreOrder={changeGenreOrder} className="mb-6 flex" />
              )}
              <div className="border-t border-slate-800 pt-4"><Legend /></div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedId && (
          <MobileDetailSheet key={selectedId} onClose={() => selectNode(null)} />
        )}
      </AnimatePresence>
      <footer className="hidden border-t border-slate-800/60 bg-slate-950/90 px-5 py-1.5 text-[11px] font-medium text-slate-600 md:block">
        Drag or scroll to move · pinch or ⌘ scroll to zoom · click a bar for details
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
      className="fixed inset-x-0 bottom-0 z-30 h-[85dvh] overflow-hidden rounded-t-3xl border-t border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 md:hidden"
      initial={{ y: '100%' }}
      animate={{ y: expanded ? 0 : '65%' }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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

function ViewToggle({
  view,
  changeView,
  className = '',
}: {
  view: 'genre' | 'artist'
  changeView: (view: 'genre' | 'artist') => void
  className?: string
}) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="group" aria-label="Timeline view">
      {(['genre', 'artist'] as const).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => changeView(type)}
          aria-pressed={view === type}
          aria-label={`${type === 'artist' ? 'Artist' : 'Genre'} timeline`}
          className={`flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition md:min-h-0 md:px-3 md:py-1.5 md:text-xs ${
            view === type
              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
              : 'border-slate-700 bg-slate-900 text-slate-500'
          }`}
        >
          {type === 'artist' ? <Users className="h-3.5 w-3.5" /> : <Disc3 className="h-3.5 w-3.5" />}
          {type === 'artist' ? 'Artists' : 'Genres'}
        </button>
      ))}
    </div>
  )
}

function GenreOrderSelect({
  genreOrder,
  changeGenreOrder,
  className = '',
}: {
  genreOrder: string
  changeGenreOrder: (order: string) => void
  className?: string
}) {
  return (
    <label className={`items-center gap-2 text-sm font-medium text-slate-400 ${className}`}>
      Order
      <select
        aria-label="Genre order"
        value={genreOrder}
        onChange={(event) => changeGenreOrder(event.currentTarget.value)}
        className="min-h-11 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none md:min-h-0 md:flex-none md:rounded-lg md:px-2 md:py-1.5 md:text-xs"
      >
        <option value="family">Family groups</option>
        <option value="oldest-first">First appearance (oldest first)</option>
      </select>
    </label>
  )
}

function App() {
  return <ExplorerProvider graph={graph}><Explorer /></ExplorerProvider>
}

export default App
