import { EDGE_TYPE_LABELS, prominenceLabels, type EdgeType, type Prominence } from '../graph/types.ts'
import { intensityOpacity, PHASE_STYLE } from '../graph/phases.ts'

export function Legend() {
  const { model } = useExplorer()
  const view = model.view
  const labels = prominenceLabels(view)
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {(Object.keys(model.edgeColors) as EdgeType[]).map((type) => (
        <span key={type} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <svg width="18" height="8" aria-hidden="true">
            <path
              d="M 1 7 C 7 7, 11 1, 17 1"
              fill="none"
              stroke={model.edgeColors[type]}
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
            {PHASE_STYLE[phase].intensity > 0 ? (
              <rect x="0" y="1" width="20" height="10" rx="3"
                fill="#94a3b8" opacity={intensityOpacity(PHASE_STYLE[phase].intensity)} />
            ) : (
              <rect x="0.5" y="1.5" width="19" height="9" rx="3"
                fill="none" stroke="#475569" strokeDasharray="2 2" />
            )}
          </svg>
          {labels[phase]}
        </span>
      ))}
      <span className="text-[10px] text-slate-500">Editorial phases, not popularity scores</span>
      {view === 'artist' && <span className="text-[10px] text-slate-500">Unresearched artists stay neutral</span>}
      {view === 'instrument' && (
        <span className="text-[10px] text-slate-500">Bars start at first documented appearance · unannotated instruments stay neutral</span>
      )}
    </div>
  )
}
import { useExplorer } from '../ExplorerContext.ts'
