import { EDGE_TYPE_LABELS, PROMINENCE_LABELS, type EdgeType, type Prominence } from '../graph/types.ts'
import { PHASE_STYLE } from '../graph/phases.ts'
import { LINEAGE_EDGE_COLORS } from '../theme.ts'

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {(Object.keys(LINEAGE_EDGE_COLORS) as EdgeType[]).map((type) => (
        <span key={type} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <svg width="18" height="8" aria-hidden="true">
            <path
              d="M 1 7 C 7 7, 11 1, 17 1"
              fill="none"
              stroke={LINEAGE_EDGE_COLORS[type]}
              strokeWidth={1.8}
            />
          </svg>
          {EDGE_TYPE_LABELS[type]}
        </span>
      ))}
      <span className="h-3 border-l border-slate-700" aria-hidden="true" />
      {(Object.keys(PHASE_STYLE) as Prominence[]).map((phase) => (
        <span key={phase} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <svg width="20" height="12" aria-hidden="true">
            <line x1="0" x2="20" y1="6" y2="6" stroke="#94a3b8"
              strokeWidth={PHASE_STYLE[phase].height / 2} opacity={PHASE_STYLE[phase].opacity}
              strokeDasharray={PHASE_STYLE[phase].dashed ? '3 3' : undefined} />
          </svg>
          {PROMINENCE_LABELS[phase]}
        </span>
      ))}
      <span className="text-[10px] text-slate-500">Editorial phases, not popularity scores</span>
    </div>
  )
}
