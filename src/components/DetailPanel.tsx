import { X } from 'lucide-react'
import { useExplorer } from '../ExplorerContext.ts'
import { groupedRelations } from '../graph/graph.ts'
import { formatEventPeriod } from '../graph/history.ts'
import { isTimelineView, timelineFamily } from '../graph/timeline.ts'
import {
  EDGE_TYPE_INVERSE_LABELS,
  EDGE_TYPE_LABELS,
  EVENT_CATEGORY_LABELS,
  FAMILY_LABELS,
  NODE_TYPE_LABELS,
  prominenceLabels,
  type Confidence,
} from '../graph/types.ts'
import { formatPeriod, NODE_TYPE_COLORS } from '../theme.ts'
import { prominencePhases, intensityColor, intensityOpacity, phaseIntensity } from '../graph/phases.ts'
import { CURRENT_YEAR } from '../graph/layout.ts'

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  low: '#f87171',
  medium: '#fbbf24',
  high: '#4ade80',
}

function SourceLinks({ sources }: { sources?: string[] }) {
  if (!sources?.length) return null

  return (
    <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
      {sources.map((source) => {
        const url = new URL(source)
        const website = url.hostname.replace(/^www\./, '')
        const title = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? 'Website')
          .replaceAll('_', ' ')
        return (
          <li key={source}>
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-sky-400 hover:text-sky-300"
            >
              <span className="underline decoration-sky-800 underline-offset-2">{title}</span>
              <span className="text-slate-400">{` (${website})`}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export function DetailPanel({ onClose, showCloseButton = true }: {
  onClose?: () => void
  showCloseButton?: boolean
} = {}) {
  const { index, selectedId, selectNode } = useExplorer()
  const node = selectedId ? index.nodeById.get(selectedId) : undefined
  if (!node) return null

  const typeColor = NODE_TYPE_COLORS[node.type]
  const period = node.type === 'event' && node.period ? formatEventPeriod(node.period) : formatPeriod(node.period)
  const groups = groupedRelations(index, node.id)
  const phases = prominencePhases(node, CURRENT_YEAR)
  const labels = prominenceLabels(node.type)
  const family = timelineFamily(index, node)
  const instrumentArtwork = node.type === 'instrument'
    ? `${encodeURIComponent(node.id.slice('instrument:'.length))}.svg`
    : null

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-l-0 border-slate-800 bg-slate-950/95 backdrop-blur md:border-l">
      <div
        className={`sticky top-0 z-10 flex items-start border-b border-slate-800 bg-slate-950/95 bg-contain bg-right-bottom bg-no-repeat p-4 md:p-5 ${showCloseButton ? 'pr-14 md:pr-16' : ''}`}
        style={instrumentArtwork ? {
          backgroundImage: `url("${import.meta.env.BASE_URL}instrument-header-backgrounds/${instrumentArtwork}")`,
        } : undefined}
      >
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: `${typeColor}22`, color: typeColor }}
            >
              {NODE_TYPE_LABELS[node.type]}
              {node.kind ? ` · ${node.kind}` : ''}
            </span>
            {family && (
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                {FAMILY_LABELS[family]}
              </span>
            )}
            {node.type === 'event' && node.category && (
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                {EVENT_CATEGORY_LABELS[node.category]}
              </span>
            )}
            {node.type === 'event' && node.significance === 'landmark' && (
              <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
                Landmark
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">{node.name}</h2>
          {period
            ? <div className="mt-1 text-sm font-medium text-slate-400">{period}</div>
            : (isTimelineView(node.type) || node.type === 'event') && (
              <div className="mt-1 text-sm font-medium text-slate-400">No period specified</div>
            )}
        </div>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose ?? (() => selectNode(null))}
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 p-4 md:p-5">
        {node.period?.estimated && (
          <p className="text-xs leading-relaxed text-slate-400">
            Estimated period: {node.period.estimateNote ?? 'Dates are approximate and subject to revision.'}
          </p>
        )}
        {node.description && (
          <p className="text-sm leading-relaxed text-slate-300">{node.description}</p>
        )}

        {node.confidence && (
          <p className="text-xs text-slate-400"
            title="Overall editorial confidence in this entry; individual claims and phases may differ.">
            Entry confidence: <span style={{ color: CONFIDENCE_COLORS[node.confidence] }}>{node.confidence}</span>
          </p>
        )}

        {phases.length === 0 && node.phaseNote && (
          <p className="text-xs leading-relaxed text-slate-500">{node.phaseNote}</p>
        )}

        {phases.length > 0 && (
          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {node.type === 'artist'
                ? 'Career prominence · editorial'
                : node.type === 'instrument' ? 'Usage prominence · editorial' : 'Historical prominence · approximate'}
            </h3>
            <ul className="flex flex-col gap-2">
              {phases.map((phase) => (
                <li key={phase.start} className="text-xs text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <svg width="24" height="14" aria-hidden="true">
                        {phaseIntensity(phase) > 0 ? (
                          <rect x="0" y="2" width="24" height="10" rx="3"
                            fill={intensityColor(typeColor, phaseIntensity(phase))}
                            opacity={intensityOpacity(phaseIntensity(phase))} />
                        ) : (
                          <rect x="0.5" y="2.5" width="23" height="9" rx="3"
                            fill="none" stroke="#475569" strokeDasharray="2 2" />
                        )}
                      </svg>
                      {labels[phase.prominence]}
                    </span>
                    <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5">
                      {phase.confidence && (
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: CONFIDENCE_COLORS[phase.confidence] }}
                          title={`Phase confidence: ${phase.confidence}`}
                        >
                          Confidence: {phase.confidence}
                        </span>
                      )}
                      <span>c. {phase.start} – {phase.end === CURRENT_YEAR && node.period?.end == null ? 'now' : phase.end}</span>
                    </span>
                  </div>
                  {phase.note && (
                    <p className="mt-1 leading-relaxed text-slate-400">{phase.note}</p>
                  )}
                  <SourceLinks sources={phase.sources} />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">{node.phaseNote}</p>
          </section>
        )}

        {groups.map((group) => {
          const label =
            group.direction === 'out'
              ? EDGE_TYPE_LABELS[group.type]
              : EDGE_TYPE_INVERSE_LABELS[group.type]
          return (
            <section key={`${group.direction}:${group.type}`}>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {label}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {group.entries.map(({ edge, node: other }) => (
                  <li key={edge.id}>
                    <button
                      type="button"
                      onClick={() => selectNode(other.id)}
                      className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-left transition hover:border-slate-600 hover:bg-slate-800/80"
                    >
                      <span className="flex items-center gap-2">
                        {other.type === 'instrument' ? (
                          <span
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 bg-current"
                            style={{
                              color: NODE_TYPE_COLORS.instrument,
                              mask: `url("${import.meta.env.BASE_URL}instrument-icons/${encodeURIComponent(other.id.slice('instrument:'.length))}.svg") center / contain no-repeat`,
                              WebkitMask: `url("${import.meta.env.BASE_URL}instrument-icons/${encodeURIComponent(other.id.slice('instrument:'.length))}.svg") center / contain no-repeat`,
                            }}
                          />
                        ) : (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: NODE_TYPE_COLORS[other.type] }}
                          />
                        )}
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-white">
                          {other.name}
                        </span>
                      </span>
                      {edge.confidence && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: CONFIDENCE_COLORS[edge.confidence] }}
                          title={`Confidence: ${edge.confidence}`}
                        >
                          {edge.confidence}
                        </span>
                      )}
                    </button>
                    {edge.note && (
                      <p className="mt-1 pl-3 text-xs italic leading-snug text-slate-500">
                        {edge.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        {!!node.sources?.length && (
          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Sources
            </h3>
            <SourceLinks sources={node.sources} />
          </section>
        )}
      </div>
    </aside>
  )
}
