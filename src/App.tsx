import { Disc3, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo } from 'react'
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
  const { index, view, changeView, selectedId } = useExplorer()
  const stats = useMemo(() => {
    const count = (type: string) => index.graph.nodes.filter((node) => node.type === type).length
    return { genres: count('genre'), artists: count('artist'), links: index.graph.edges.length }
  }, [index])

  return (
    <div className="flex h-svh flex-col">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-800 bg-slate-950/90 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <Disc3 className="h-6 w-6 text-violet-400" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-white">Soundlines</h1>
            <p className="text-[11px] font-medium leading-tight text-slate-500">
              a chronological map of music lineages
            </p>
          </div>
        </div>
        <SearchBar />
        <div className="flex items-center gap-1.5" role="group" aria-label="Timeline view">
          {(['genre', 'artist'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => changeView(type)}
              aria-pressed={view === type}
              aria-label={`${type === 'artist' ? 'Artist' : 'Genre'} timeline`}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
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
        <div className="ml-auto hidden items-center gap-4 text-xs font-medium text-slate-500 md:flex">
          <span><strong className="text-slate-300">{stats.genres}</strong> genres</span>
          <span><strong className="text-slate-300">{stats.artists}</strong> artists</span>
          <span><strong className="text-slate-300">{stats.links}</strong> links</span>
        </div>
      </header>
      <div className="border-b border-slate-800/60 bg-slate-950/70 px-5 py-1.5"><Legend /></div>
      <main className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1"><Timeline key={view} /></div>
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
              <div className="h-full w-[360px]"><DetailPanel /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <footer className="border-t border-slate-800/60 bg-slate-950/90 px-5 py-1.5 text-[11px] font-medium text-slate-600">
        Drag or scroll to move · pinch or ⌘ scroll to zoom · click a bar for details
      </footer>
    </div>
  )
}

function App() {
  return <ExplorerProvider graph={graph}><Explorer /></ExplorerProvider>
}

export default App
