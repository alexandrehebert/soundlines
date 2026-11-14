import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { BodyPortal } from '../ui/BodyPortal.tsx'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../../ExplorerContext.ts'
import { searchNodes } from '../../graph/graph.ts'
import { chartColor, chartTextColor, NODE_TYPE_COLORS } from '../../theme.ts'
import { DEFAULT_LOCALE, type Locale } from '../../i18n/routing.ts'
import { graphLabels } from '../../i18n/graphLabels.ts'
import { englishGraph } from '../../data/translateGraph.ts'
import { InstrumentIcon } from '../explorer/InstrumentIcon.tsx'
import { sheetMotion } from '../ui/sheetMotion.ts'
import { SheetHeader } from '../ui/SheetHeader.tsx'
import { afterClosingHistoryPanel, usePanelHistory } from '../ui/usePanelHistory.ts'
import { useSheetDrag } from '../ui/useSheetDrag.ts'

function isComposing(event: ReactKeyboardEvent) {
  // Some browsers report keyCode 229 before isComposing is set.
  return event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229
}

function searchResultTypeStyle(type: keyof typeof NODE_TYPE_COLORS): CSSProperties & { '--search-result-type-color': string } {
  return { '--search-result-type-color': chartColor(NODE_TYPE_COLORS[type]) }
}

export function SearchBar() {
  const { index, locale, selectNode } = useExplorer()
  const t = useTranslations('search')
  // Let users also find entries by their default-locale names.
  const alternateNames = useMemo(() => locale === DEFAULT_LOCALE
    ? undefined
    : new Map(englishGraph.nodes.map((node) => [node.id, node.name])), [locale])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const mobilePanel = usePanelHistory('search', () => setActiveId(null))
  const mobileOpen = mobilePanel.value !== null
  const searchId = useId()
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const mobileCloseRef = useRef<HTMLButtonElement>(null)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const results = useMemo(
    () => searchNodes(index.graph, query, 8, alternateNames),
    [index.graph, query, alternateNames],
  )
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
    afterClosingHistoryPanel(() => selectNode(id))
    updateQuery('')
    setOpen(false)
    desktopInputRef.current?.blur()
    mobileInputRef.current?.blur()
  }

  const closeMobileSearch = () => {
    setActiveId(null)
    mobilePanel.close()
  }
  const reduceMotion = useReducedMotion()
  const drag = useSheetDrag(mobileOpen, closeMobileSearch)

  const handleEscape = (event: ReactKeyboardEvent) => {
    if (event.key !== 'Escape') return
    event.stopPropagation()
    if (isComposing(event)) return
    updateQuery('')
    setOpen(false)
    mobilePanel.close()
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
        onClick={() => mobilePanel.open('open')}
        className="soundlines-search-transition flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 active:bg-slate-800 md:hidden"
        aria-label={t('trigger')}
        aria-haspopup="dialog"
        aria-expanded={mobileOpen}
      >
        <Search className="h-4 w-4" />
      </button>
      <div className="soundlines-search-transition relative hidden w-full max-w-xs md:block">
        <span id={desktopInstructionsId} className="sr-only">{t('instructions')}</span>
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
          aria-label={t('trigger')}
          aria-autocomplete="list"
          aria-describedby={desktopInstructionsId}
          aria-expanded={desktopExpanded}
          aria-controls={desktopExpanded ? desktopListId : undefined}
          aria-activedescendant={desktopExpanded && activeIndex >= 0 ? `${desktopListId}-option-${activeIndex}` : undefined}
          autoComplete="off"
          placeholder={t('desktopPlaceholder')}
          className="w-full min-w-0 rounded-full border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
        />
        {open && query.trim().length > 0 && (
          <div className="absolute z-20 mt-2 w-full">
            <SearchResults
              listId={desktopListId}
              results={results}
              activeId={activeId}
              onPick={pick}
              noMatches={t('noMatches')}
              resultLabel={t('results')}
              locale={locale}
              preventBlurOnPointerDown
            />
          </div>
        )}
      </div>
      <BodyPortal>
        <AnimatePresence onExitComplete={() => searchButtonRef.current?.focus()}>
          {mobileOpen && (
            <motion.div
              className="fixed inset-0 z-50 flex h-dvh flex-col bg-slate-950 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[env(safe-area-inset-top)] md:hidden"
              {...drag.panel}
              role="dialog"
              aria-modal="true"
              aria-label={t('trigger')}
              onKeyDown={handleMobileDialogKeyDown}
              {...sheetMotion(reduceMotion)}
            >
              <SheetHeader {...drag.handle} closeLabel={t('close')} onClose={closeMobileSearch} closeRef={mobileCloseRef}>
                <h2 className="text-lg font-bold text-white">{t('title')}</h2>
              </SheetHeader>
              <div className="mx-4 flex min-h-0 flex-1 flex-col">
                <div className="relative mt-2 shrink-0">
                  <span id={mobileInstructionsId} className="sr-only">{t('instructions')}</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    ref={mobileInputRef}
                    value={query}
                    onChange={(event) => updateQuery(event.target.value)}
                    onKeyDown={handleKeyDown}
                    role="combobox"
                    aria-label={t('trigger')}
                    aria-autocomplete="list"
                    aria-describedby={mobileInstructionsId}
                    aria-expanded={mobileExpanded}
                    aria-controls={mobileExpanded ? mobileListId : undefined}
                    aria-activedescendant={mobileExpanded && activeIndex >= 0 ? `${mobileListId}-option-${activeIndex}` : undefined}
                    autoComplete="off"
                    placeholder={t('mobilePlaceholder')}
                    enterKeyHint="search"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {query.trim().length > 0 ? (
                    <SearchResults
                      listId={mobileListId}
                      results={results}
                      activeId={activeId}
                      onPick={pick}
                      noMatches={t('noMatches')}
                      resultLabel={t('results')}
                      locale={locale}
                    />
                  ) : (
                    <p className="px-1 py-3 text-sm text-slate-500">
                      {t('emptyQuery')}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BodyPortal>
    </>
  )
}

function SearchResults({
  listId,
  results,
  activeId,
  onPick,
  noMatches,
  resultLabel,
  locale,
  preventBlurOnPointerDown = false,
}: {
  listId: string
  results: ReturnType<typeof searchNodes>
  activeId: string | null
  onPick: (id: string) => void
  noMatches: string
  resultLabel: string
  locale: Locale
  preventBlurOnPointerDown?: boolean
}) {
  if (results.length === 0) {
    return (
      <div role="status" className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400 md:shadow-2xl md:shadow-black/50">
        {noMatches}
      </div>
    )
  }

  return (
    <ul
      id={listId}
      role="listbox"
      aria-label={resultLabel}
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
                style={{ color: chartTextColor(NODE_TYPE_COLORS.instrument) }}
              />
            )}
            {node.name}
          </span>
          <span
            className="search-result-type text-[10px] font-bold uppercase tracking-widest"
            style={searchResultTypeStyle(node.type)}
          >
            {graphLabels(locale).nodeTypes[node.type]}
          </span>
        </li>
      ))}
    </ul>
  )
}
