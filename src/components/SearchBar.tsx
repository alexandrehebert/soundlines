import { AnimatePresence, motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useExplorer } from '../ExplorerContext.ts'
import { searchNodes } from '../graph/graph.ts'
import { NODE_TYPE_LABELS } from '../graph/types.ts'
import { NODE_TYPE_COLORS } from '../theme.ts'
import { InstrumentIcon } from './InstrumentIcon.tsx'

const SEARCH_INSTRUCTIONS = 'Use the up and down arrow keys to navigate search results. Press Enter to open the highlighted result, or the first result if none is highlighted. Press Escape to close search.'

function isComposing(event: ReactKeyboardEvent) {
  // Some browsers report keyCode 229 before isComposing is set.
  return event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229
}

export function SearchBar() {
  const { index, selectNode } = useExplorer()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const searchId = useId()
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const mobileCloseRef = useRef<HTMLButtonElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(() => searchNodes(index.graph, query), [index.graph, query])
  const activeIndex = results.findIndex(({ node }) => node.id === activeId)
  const desktopListId = `${searchId}-desktop-results`
  const mobileListId = `${searchId}-mobile-results`
  const desktopInstructionsId = `${searchId}-desktop-instructions`
  const mobileInstructionsId = `${searchId}-mobile-instructions`
  const desktopExpanded = open && results.length > 0
  const mobileExpanded = mobileOpen && results.length > 0

  useEffect(() => {
    if (!mobileOpen) return
    const frame = requestAnimationFrame(() => mobileInputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [mobileOpen])

  useEffect(() => {
    if (activeIndex < 0) return
    const listId = document.activeElement === mobileInputRef.current
      ? mobileListId
      : document.activeElement === desktopInputRef.current ? desktopListId : null
    if (listId) document.getElementById(`${listId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, desktopListId, mobileListId, mobileOpen, open])

  const updateQuery = (value: string) => {
    setQuery(value)
    setActiveId(null)
  }

  const pick = (id: string) => {
    selectNode(id)
    updateQuery('')
    setOpen(false)
    setMobileOpen(false)
    desktopInputRef.current?.blur()
    mobileInputRef.current?.blur()
  }

  const handleEscape = (event: ReactKeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    if (isComposing(event)) return
    updateQuery('')
    setOpen(false)
    setMobileOpen(false)
    desktopInputRef.current?.blur()
    mobileInputRef.current?.blur()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleEscape(event)
      return
    }
    if (isComposing(event)) return
    if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault()
      pick(results[activeIndex < 0 ? 0 : activeIndex].node.id)
      return
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length > 0) {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveId((current) => {
        const currentIndex = results.findIndex(({ node }) => node.id === current)
        const nextIndex = currentIndex < 0
          ? direction === 1 ? 0 : results.length - 1
          : (currentIndex + direction + results.length) % results.length
        return results[nextIndex].node.id
      })
    }
  }

  const handleMobileDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      handleEscape(event)
      return
    }
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey || isComposing(event)) return
    if (event.shiftKey && document.activeElement === mobileCloseRef.current) {
      event.preventDefault()
      mobileInputRef.current?.focus()
    } else if (!event.shiftKey && document.activeElement === mobileInputRef.current) {
      event.preventDefault()
      mobileCloseRef.current?.focus()
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
        <span id={desktopInstructionsId} className="sr-only">{SEARCH_INSTRUCTIONS}</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={desktopInputRef}
          value={query}
          onChange={(event) => {
            updateQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setActiveId(null)
            setOpen(true)
          }}
          onBlur={() => {
            setActiveId(null)
            setOpen(false)
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-label="Search music"
          aria-autocomplete="list"
          aria-describedby={desktopInstructionsId}
          aria-expanded={desktopExpanded}
          aria-controls={desktopExpanded ? desktopListId : undefined}
          aria-activedescendant={desktopExpanded && activeIndex >= 0 ? `${desktopListId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder="Search genres, artists, instruments, events…"
          className="w-full min-w-0 rounded-full border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
        />
        {open && query.trim().length > 0 && (
          <div className="absolute z-20 mt-2 w-full">
            <SearchResults
              listId={desktopListId}
              results={results}
              activeId={activeId}
              onPick={pick}
              preventBlurOnPointerDown
            />
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
              onKeyDown={handleMobileDialogKeyDown}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Search</h2>
                <button
                  ref={mobileCloseRef}
                  type="button"
                  onClick={() => {
                    setActiveId(null)
                    setMobileOpen(false)
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 active:bg-slate-800"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative mt-2 shrink-0">
                <span id={mobileInstructionsId} className="sr-only">{SEARCH_INSTRUCTIONS}</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  ref={mobileInputRef}
                  value={query}
                  onChange={(event) => updateQuery(event.target.value)}
                  onKeyDown={handleKeyDown}
                  role="combobox"
                  aria-label="Search music"
                  aria-autocomplete="list"
                  aria-describedby={mobileInstructionsId}
                  aria-expanded={mobileExpanded}
                  aria-controls={mobileExpanded ? mobileListId : undefined}
                  aria-activedescendant={mobileExpanded && activeIndex >= 0 ? `${mobileListId}-option-${activeIndex}` : undefined}
                  autoComplete="off"
                  placeholder="Genres, artists, instruments, events…"
                  enterKeyHint="search"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {query.trim().length > 0 ? (
                  <SearchResults listId={mobileListId} results={results} activeId={activeId} onPick={pick} />
                ) : (
                  <p className="px-1 py-3 text-sm text-slate-500">
                    Search the timeline by genre, artist, instrument, event, or label.
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
  listId,
  results,
  activeId,
  onPick,
  preventBlurOnPointerDown = false,
}: {
  listId: string
  results: ReturnType<typeof searchNodes>
  activeId: string | null
  onPick: (id: string) => void
  preventBlurOnPointerDown?: boolean
}) {
  if (results.length === 0) {
    return (
      <div role="status" className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400 md:shadow-2xl md:shadow-black/50">
        No matches
      </div>
    )
  }

  return (
    <ul
      id={listId}
      role="listbox"
      aria-label="Search results"
      className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 md:max-h-[min(24rem,calc(100dvh-6rem))] md:overflow-y-auto md:shadow-2xl md:shadow-black/50"
    >
      {results.map(({ node }, index) => (
        <li
          key={node.id}
          id={`${listId}-option-${index}`}
          role="option"
          aria-selected={node.id === activeId}
          onPointerDown={(event) => {
            if (preventBlurOnPointerDown) event.preventDefault()
          }}
          onClick={() => onPick(node.id)}
          className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5 text-left last:border-b-0 active:bg-slate-800 md:border-0 ${
            node.id === activeId ? 'bg-violet-900/70 ring-1 ring-inset ring-violet-400' : 'md:hover:bg-slate-800'
          }`}
        >
          <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-200">
            {node.type === 'instrument' && (
              <InstrumentIcon
                id={node.id}
                className="size-6 shrink-0 bg-current"
                style={{ color: NODE_TYPE_COLORS.instrument }}
              />
            )}
            {node.name}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: NODE_TYPE_COLORS[node.type] }}
          >
            {NODE_TYPE_LABELS[node.type]}
          </span>
        </li>
      ))}
    </ul>
  )
}
