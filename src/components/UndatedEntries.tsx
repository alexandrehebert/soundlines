import { useEffect, useRef } from 'react'
import type { GraphNode } from '../graph/types.ts'
import { TIMELINE_BAR_HEIGHT } from '../graph/phases.ts'
import { FAMILY_COLORS, NODE_TYPE_COLORS, SELECTION_BORDER, SELECTION_OUTLINE, timelineBarOpacity } from '../theme.ts'
import { BAR_LABEL_FONT_SIZE } from './timeline/geometry.ts'

interface UndatedEntriesProps {
  label: string
  nodes: readonly GraphNode[]
  selectedId: string | null
  highlightedIds?: ReadonlySet<string> | null
  onSelect: (id: string) => void
}

export function UndatedEntries({ label, nodes, selectedId, highlightedIds, onSelect }: UndatedEntriesProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list || !selectedId) return
    const revealSelection = () => {
      const selected = list.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
      if (!selected) return
      const bounds = list.getBoundingClientRect()
      const rect = selected.getBoundingClientRect()
      if (rect.left < bounds.left) list.scrollLeft -= bounds.left - rect.left
      else if (rect.right > bounds.right) list.scrollLeft += rect.right - bounds.right
    }
    revealSelection()
    const observer = new ResizeObserver(revealSelection)
    observer.observe(list)
    return () => observer.disconnect()
  }, [nodes, selectedId])

  if (!nodes.length) return null

  return (
    <section aria-label={`Undated ${label}`} className="flex shrink-0 items-center gap-3 border-b border-slate-800/60 bg-slate-950/70 px-3 md:px-5">
      <span className="shrink-0 text-xs font-semibold text-slate-400">
        Undated <span className="text-slate-500">{nodes.length}</span>
      </span>
      <div ref={listRef} className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto overscroll-x-contain px-2.5 py-1">
        {nodes.map((node) => {
          const selected = node.id === selectedId
          const color = node.family ? FAMILY_COLORS[node.family] : NODE_TYPE_COLORS[node.type]
          return (
            <button
              key={node.id}
              type="button"
              data-undated-node={node.id}
              aria-pressed={selected}
              title={`${node.name}: no period specified`}
              onClick={() => onSelect(node.id)}
              className="visualization-item relative flex min-h-9 shrink-0 items-center px-3 font-bold focus-visible:outline-none"
              style={{ opacity: highlightedIds && !highlightedIds.has(node.id) ? 0.2 : 1 }}
            >
              <span
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full"
                style={{ height: TIMELINE_BAR_HEIGHT, backgroundColor: `color-mix(in srgb, ${color} 4%, #020617)` }}
                aria-hidden="true"
              >
                <span className="absolute inset-0 rounded-full" style={{
                  backgroundColor: color,
                  opacity: timelineBarOpacity(node.type, selected),
                }} />
                <span className="visualization-hover-border absolute inset-0 rounded-full border border-white/60" />
                <span data-bar-selection-outline="" className="absolute inset-0 rounded-full"
                  style={{ ...SELECTION_BORDER, ...SELECTION_OUTLINE }} />
              </span>
              <span className="relative" style={{
                fontSize: BAR_LABEL_FONT_SIZE,
                color: node.type === 'artist' ? '#f8fafc' : '#020617',
              }}>{node.name}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
