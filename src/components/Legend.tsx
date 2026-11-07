import type { EdgeType, Prominence } from '../graph/types.ts'
import { useTranslations } from 'next-intl'
import { intensityOpacity, PHASE_STYLE } from '../graph/phases.ts'
import { graphLabels } from '../i18n/graphLabels.ts'
import { chartColor } from '../theme.ts'

export function Legend() {
  const { model, locale } = useExplorer()
  const view = model.view
  const t = useTranslations('legend')
  const tProminence = useTranslations('legend.prominence')
  const edges = graphLabels(locale).edges
  const hasEstimatedPeriods = model.lanes.some((lane) =>
    lane.bars.some((bar) => bar.node.period?.estimated),
  )
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {(Object.keys(model.edgeColors) as EdgeType[]).map((type) => (
        <span key={type} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <svg width="18" height="8" aria-hidden="true">
            <path
              d="M 1 7 C 7 7, 11 1, 17 1"
              fill="none"
              stroke={model.edgeColors[type] ? chartColor(model.edgeColors[type]) : undefined}
              strokeWidth={1.8}
            />
          </svg>
          {edges[type]}
        </span>
      ))}
      <span className="h-3 border-l border-slate-700" aria-hidden="true" />
      {(Object.keys(PHASE_STYLE) as Prominence[]).map((phase) => (
        <span key={phase} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <svg width="20" height="12" aria-hidden="true">
            {PHASE_STYLE[phase].intensity > 0 ? (
              <rect x="0" y="1" width="20" height="10" rx="3"
                fill="#94a3b8" opacity={intensityOpacity(PHASE_STYLE[phase].intensity)} />
            ) : (
              <rect x="0.5" y="1.5" width="19" height="9" rx="3"
                fill="none" stroke="#475569" strokeDasharray="2 2" />
            )}
          </svg>
          {tProminence(phase)}
        </span>
      ))}
      <span className="text-[10px] text-slate-500">{t('editorialPhases')}</span>
      {hasEstimatedPeriods && (
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span
            aria-hidden="true"
            className="h-2 w-8 shrink-0 rounded-full"
            style={{ background: 'linear-gradient(to right, transparent, #94a3b8 25%, #94a3b8 75%, transparent)' }}
          />
          {t('estimatedDates')}
        </span>
      )}
      {view === 'artist' && <span className="text-[10px] text-slate-500">{t('unresearchedArtists')}</span>}
      {view === 'instrument' && (
        <span className="text-[10px] text-slate-500">{t('instrumentBars')}</span>
      )}
    </div>
  )
}
import { useExplorer } from '../ExplorerContext.ts'
