import { EDGE_TYPE_LABELS, type EdgeType } from '../graph/types.ts'
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
    </div>
  )
}
