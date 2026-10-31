import { Disc3, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DetailPanel } from './components/DetailPanel.tsx'
import { Legend } from './components/Legend.tsx'
import { SearchBar } from './components/SearchBar.tsx'
import { MAX_YEAR, MIN_YEAR, Timeline } from './components/Timeline.tsx'
import rawGraph from './data/graph.json'
import { buildIndex } from './graph/graph.ts'
import type { MusicGraph } from './graph/types.ts'

const graph = rawGraph as MusicGraph

function readFocusFromUrl(validIds: Set<string>): string | null {
  const focus = new URLSearchParams(window.location.search).get('focus')
  return focus !== null && validIds.has(focus) ? focus : null
}

function writeFocusToUrl(id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('focus', id)
  else url.searchParams.delete('focus')
  window.history.replaceState(null, '', url)
}

function App() {
  const index = useMemo(() => buildIndex(graph), [])
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    readFocusFromUrl(new Set(graph.nodes.map((node) => node.id))),
  )
  const [viewRange, setViewRange] = useState<[number, number]>([MIN_YEAR, MAX_YEAR])
  const [showArtists, setShowArtists] = useState(true)

  useEffect(() => {
    writeFocusToUrl(selectedId)
  }, [selectedId])

  const handleSelect = useCallback(
    (id: string | null) => {
      setSelectedId(id)
      if (!id) return
      // Bring the node's era into view if its start year is off-screen.
      const period = index.nodeById.get(id)?.period
      if (!period) return
      setViewRange(([start, end]) => {
        if (period.start >= start && period.start <= end) return [start, end]
        const span = end - start
        let nextStart = period.start - span * 0.25
        if (nextStart < MIN_YEAR) nextStart = MIN_YEAR
        if (nextStart + span > MAX_YEAR) nextStart = MAX_YEAR - span
        return [nextStart, nextStart + span]
      })
    },
    [index],
  )

  const stats = useMemo(() => {
    const count = (type: string) => graph.nodes.filter((node) => node.type === type).length
    return { genres: count('genre'), artists: count('artist'), links: graph.edges.length }
  }, [])

  return (
    <div className="flex h-svh flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-800 bg-slate-950/90 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Disc3 className="h-6 w-6 text-violet-400" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-white">
              Soundlines
            </h1>
            <p className="text-[11px] font-medium leading-tight text-slate-500">
              a chronological map of music lineages
            </p>
          </div>
        </div>

        <SearchBar graph={graph} onSelect={handleSelect} />

        <button
          type="button"
          onClick={() => setShowArtists((value) => !value)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            showArtists
              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
              : 'border-slate-700 bg-slate-900 text-slate-500'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Artists
        </button>

        <div className="ml-auto hidden items-center gap-4 text-xs font-medium text-slate-500 md:flex">
          <span>
            <strong className="text-slate-300">{stats.genres}</strong> genres
          </span>
          <span>
            <strong className="text-slate-300">{stats.artists}</strong> artists
          </span>
          <span>
            <strong className="text-slate-300">{stats.links}</strong> links
          </span>
        </div>
      </header>

      <div className="border-b border-slate-800/60 bg-slate-950/70 px-5 py-1.5">
        <Legend />
      </div>

      <main className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          <Timeline
            graph={graph}
            index={index}
            selectedId={selectedId}
            onSelect={handleSelect}
            showArtists={showArtists}
            viewRange={viewRange}
            onViewRangeChange={setViewRange}
          />
        </div>
        <AnimatePresence>
          {selectedId && (
            <motion.div
              key="panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="shrink-0 overflow-hidden"
            >
              <div className="h-full w-[360px]">
                <DetailPanel index={index} nodeId={selectedId} onSelect={handleSelect} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-slate-800/60 bg-slate-950/90 px-5 py-1.5 text-[11px] font-medium text-slate-600">
        Scroll to zoom · drag to pan · click a bar or marker for details
      </footer>
    </div>
  )
}

export default App
