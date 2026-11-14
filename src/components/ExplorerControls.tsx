import { ArrowDownWideNarrow, Bubbles, ChartGantt, Disc3, Guitar, History as HistoryIcon, Users, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useId, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../ExplorerContext.ts'
import type { TimelineOrder } from '../graph/layout.ts'
import { EXPLORER_VIEWS, type ExplorerView, type TimelineView } from '../graph/timeline.ts'

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
