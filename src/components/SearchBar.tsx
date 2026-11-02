import { AnimatePresence, motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useExplorer } from '../ExplorerContext.ts'
import { searchNodes } from '../graph/graph.ts'
import { NODE_TYPE_LABELS } from '../graph/types.ts'
import { NODE_TYPE_COLORS } from '../theme.ts'

export function SearchBar() {
  const { index, selectNode } = useExplorer()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const results = searchNodes(index.graph, query)

  useEffect(() => {
    if (!mobileOpen) return
    const frame = requestAnimationFrame(() => mobileInputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [mobileOpen])

  const pick = (id: string) => {
    selectNode(id)
    setQuery('')
    setOpen(false)
    setMobileOpen(false)
    desktopInputRef.current?.blur()
    mobileInputRef.current?.blur()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && results.length > 0) pick(results[0].node.id)
    if (event.key === 'Escape') {
      event.stopPropagation()
      setQuery('')
      setOpen(false)
      setMobileOpen(false)
      desktopInputRef.current?.blur()
      mobileInputRef.current?.blur()
    }
  }

  return (
    <>
      <button
        ref={searchButtonRef}
        type="button"
        onClick={() => setMobileOpen(true)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 active:bg-slate-800 md:hidden"
        aria-label="Search music"
        aria-haspopup="dialog"
        aria-expanded={mobileOpen}
      >
        <Search className="h-4 w-4" />
      </button>
      <div className="relative hidden w-full max-w-xs md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={desktopInputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search genres, artists, instruments…"
          className="w-full min-w-0 rounded-full border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
        />
        {open && query.trim().length > 0 && (
          <div className="absolute z-20 mt-2 w-full">
            <SearchResults results={results} onPick={pick} preventBlurOnPointerDown />
          </div>
        )}
      </div>
      {createPortal(
        <AnimatePresence onExitComplete={() => searchButtonRef.current?.focus()}>
          {mobileOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex h-dvh flex-col bg-slate-950 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Search music"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Search</h2>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 active:bg-slate-800"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative mt-2 shrink-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  ref={mobileInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Genres, artists, instruments…"
                  enterKeyHint="search"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {query.trim().length > 0 ? (
                  <SearchResults results={results} onPick={pick} />
                ) : (
                  <p className="px-1 py-3 text-sm text-slate-500">
                    Search the timeline by genre, artist, instrument, or label.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

function SearchResults({
  results,
  onPick,
  preventBlurOnPointerDown = false,
}: {
  results: ReturnType<typeof searchNodes>
  onPick: (id: string) => void
  preventBlurOnPointerDown?: boolean
}) {
  if (results.length === 0) {
    return (
      <ul className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 md:shadow-2xl md:shadow-black/50">
        <li role="status" className="px-4 py-3 text-sm text-slate-500">No matches</li>
      </ul>
    )
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 md:shadow-2xl md:shadow-black/50">
      {results.map(({ node }) => (
        <li key={node.id}>
          <button
            type="button"
            onPointerDown={(event) => {
              if (preventBlurOnPointerDown) event.preventDefault()
            }}
            onClick={() => onPick(node.id)}
            className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5 text-left last:border-b-0 active:bg-slate-800 md:border-0 md:hover:bg-slate-800"
          >
            <span className="text-sm font-semibold text-slate-200">{node.name}</span>
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: NODE_TYPE_COLORS[node.type] }}
            >
              {NODE_TYPE_LABELS[node.type]}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
