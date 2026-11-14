import { BarChart3, SlidersHorizontal } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../../ExplorerContext.ts'
import { isTimelineView } from '../../graph/timeline.ts'
import { GenreDisplaySelect, TimelineOrderSelect } from './ExplorerControls.tsx'
import { Legend } from './Legend.tsx'
import { SheetHeader, sheetSurface } from '../ui/SheetHeader.tsx'
import { useSheetDrag } from '../ui/useSheetDrag.ts'
import { sheetMotion } from '../ui/sheetMotion.ts'
import { trapTabFocus } from '../ui/trapTabFocus.ts'

export function ExplorerOptions({ optionsId, optionsOpen, setOptionsOpen, isDesktop, onShowStatistics }: {
  optionsId: string
  optionsOpen: boolean
  setOptionsOpen: Dispatch<SetStateAction<boolean>>
  isDesktop: boolean
  onShowStatistics: () => void
}) {
  const t = useTranslations()
  const { view, order, changeOrder, genreDisplay } = useExplorer()
  const showingHistory = view === 'history'
  const showingBubbles = view === 'genre' && genreDisplay === 'bubbles'
  const optionsRef = useRef<HTMLElement>(null)
  const optionsTriggerRef = useRef<HTMLButtonElement>(null)
  const restoreOptionsFocusRef = useRef(true)
  const reduceMotion = useReducedMotion()
  const drag = useSheetDrag(!isDesktop, () => setOptionsOpen(false))

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
    if (!optionsOpen) return
    if (!isDesktop && !optionsRef.current?.contains(document.activeElement)) {
      optionsRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    }
  }, [isDesktop, optionsOpen])

  useEffect(() => {
    if (!optionsOpen || !showingHistory) return
    const wideHeader = window.matchMedia('(min-width: 80rem)')
    const closeWhenStatsAreInHeader = () => {
      if (wideHeader.matches) setOptionsOpen(false)
    }
    closeWhenStatsAreInHeader()
    wideHeader.addEventListener('change', closeWhenStatsAreInHeader)
    return () => wideHeader.removeEventListener('change', closeWhenStatsAreInHeader)
  }, [optionsOpen, setOptionsOpen, showingHistory])

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
  }, [optionsOpen, isDesktop, setOptionsOpen])

  return (
    <>
      <button
        ref={optionsTriggerRef}
        type="button"
        onClick={() => setOptionsOpen((open) => !open)}
        className={`hidden min-h-9 shrink-0 items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 text-xs font-semibold text-slate-300 hover:bg-(--control-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 md:flex ${showingHistory ? 'xl:hidden' : ''}`}
        aria-label={t(showingHistory ? 'historyOptions' : 'timelineOptions')}
        aria-haspopup="dialog"
        aria-expanded={optionsOpen}
        aria-controls={optionsId}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span className="hidden lg:inline">{t('options')}</span>
      </button>
      <AnimatePresence>
        {optionsOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-end overflow-hidden md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:block md:w-[min(28rem,calc(100vw-2.5rem))]"
            initial={isDesktop && !reduceMotion ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: isDesktop && !reduceMotion ? 0 : 1 }}
            onClick={() => setOptionsOpen(false)}
          >
            <motion.div
              className="absolute inset-0 bg-[rgb(3_4_12_/_0.6)] md:hidden"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.2 }}
            />
            <motion.section
              {...drag.panel}
              ref={optionsRef}
              id={optionsId}
              role="dialog"
              aria-modal={!isDesktop}
              aria-label={t(showingHistory ? 'historyOptions' : 'timelineOptions')}
              className={`relative max-h-[85dvh] flex w-full flex-col overflow-hidden md:border-slate-700 md:bg-slate-950 md:max-h-[calc(100dvh-10rem)] md:rounded-2xl md:border md:p-5 md:shadow-2xl md:shadow-black/60 ${sheetSurface}`}
              {...(isDesktop ? {
                initial: reduceMotion ? false : { y: 12 },
                animate: { y: 0 },
                exit: { y: 12 },
              } : sheetMotion(reduceMotion))}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={isDesktop ? undefined : trapTabFocus}
              onBlur={(event) => {
                if (isDesktop && !event.currentTarget.contains(event.relatedTarget)
                  && !optionsTriggerRef.current?.contains(event.relatedTarget)) {
                  restoreOptionsFocusRef.current = false
                  setOptionsOpen(false)
                }
              }}
            >
              <SheetHeader
                {...drag.handle}
                closeLabel={t('closeOptions')}
                onClose={() => setOptionsOpen(false)}
                desktopClass="md:touch-auto md:select-auto md:p-0"
              >
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
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2 md:p-0 md:pt-3">
                {!showingHistory && (
                  <div className="mb-6 space-y-6 md:mb-0">
                    {view === 'genre' && <GenreDisplaySelect className="flex" onDisplayChange={isDesktop ? () => setOptionsOpen(false) : undefined} />}
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
                  onClick={onShowStatistics}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 active:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 xl:hidden"
                >
                  <BarChart3 className="h-4 w-4" />
                  {t('datasetStatistics')}
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
