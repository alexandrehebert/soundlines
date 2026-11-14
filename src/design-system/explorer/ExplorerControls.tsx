import { ArrowDownWideNarrow, Bubbles, ChartGantt, Disc3, Guitar, History as HistoryIcon, Users, type LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { useTranslations } from 'next-intl'
import { useExplorer } from '../../ExplorerContext.ts'
import type { TimelineOrder } from '../../graph/layout.ts'
import { EXPLORER_VIEWS, type ExplorerView, type TimelineView } from '../../graph/timeline.ts'
import { SegmentedControl, ToggleIndicator } from '../ui/SegmentedControl.tsx'
import { toggleButtonClass, toggleContainerClass } from '../ui/segmentedControlStyles.ts'

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
  return (
    <SegmentedControl
      label={t('timelineView')}
      value={view}
      onChange={changeView}
      className={className}
      buttonClassName="relative flex min-h-9 min-w-0 flex-auto items-center justify-center gap-1 rounded-full px-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 sm:text-sm md:min-h-0 md:flex-none md:px-3 md:py-1.5 md:text-xs"
      options={EXPLORER_VIEWS.map((value) => {
        const { Icon } = VIEW_OPTIONS[value]
        return {
          value,
          content: <><Icon className="hidden h-3.5 w-3.5 min-[380px]:block" aria-hidden="true" />{tViews(value)}</>,
        }
      })}
    />
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
  return (
    <SegmentedControl
      label={tOrder(view)}
      value={order}
      onChange={changeOrder}
      className={className}
      leading={<ArrowDownWideNarrow className="mx-2 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />}
      options={[
        { value: 'family', content: t('familyGroups') },
        { value: 'oldest-first', content: t('oldestFirst') },
      ]}
    />
  )
}
