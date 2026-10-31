import { X } from 'lucide-react'
import { groupedRelations, type GraphIndex } from '../graph/graph.ts'
import {
  EDGE_TYPE_INVERSE_LABELS,
  EDGE_TYPE_LABELS,
  FAMILY_LABELS,
  NODE_TYPE_LABELS,
  PROMINENCE_LABELS,
  type Confidence,
} from '../graph/types.ts'
import { formatPeriod, NODE_TYPE_COLORS } from '../theme.ts'
import { genrePhases, intensityColor, intensityOpacity, phaseIntensity } from '../graph/phases.ts'
import { CURRENT_YEAR } from '../graph/layout.ts'

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  low: '#f87171',
  medium: '#fbbf24',
  high: '#4ade80',
}

interface DetailPanelProps {
  index: GraphIndex
  nodeId: string
  onSelect: (id: string | null) => void
}

export function DetailPanel({ index, nodeId, onSelect }: DetailPanelProps) {
  const node = index.nodeById.get(nodeId)
  if (!node) return null

  const typeColor = NODE_TYPE_COLORS[node.type]
  const period = formatPeriod(node.period)
  const groups = groupedRelations(index, nodeId)
  const phases = genrePhases(node, CURRENT_YEAR)

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-l border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-800 bg-slate-950/95 p-5">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: `${typeColor}22`, color: typeColor }}
            >
              {NODE_TYPE_LABELS[node.type]}
              {node.kind ? ` · ${node.kind}` : ''}
            </span>
            {node.family && (
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                {FAMILY_LABELS[node.family]}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">{node.name}</h2>
          {period && <div className="mt-1 text-sm font-medium text-slate-400">{period}</div>}
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-5 p-5">
        {node.description && (
          <p className="text-sm leading-relaxed text-slate-300">{node.description}</p>
        )}

        {phases.length > 0 && (
          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Historical prominence · approximate
            </h3>
            <ul className="flex flex-col gap-2">
              {phases.map((phase) => (
                <li key={phase.start} className="flex items-center justify-between gap-3 text-xs text-slate-300">
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
                    {PROMINENCE_LABELS[phase.prominence]}
                  </span>
                  <span>c. {phase.start} – {phase.end === CURRENT_YEAR && node.period?.end == null ? 'now' : phase.end}</span>
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
                      onClick={() => onSelect(other.id)}
                      className="group flex w-full items-baseline justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-left transition hover:border-slate-600 hover:bg-slate-800/80"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: NODE_TYPE_COLORS[other.type] }}
                        />
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
      </div>
    </aside>
  )
}
