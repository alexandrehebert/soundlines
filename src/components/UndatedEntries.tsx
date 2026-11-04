import { useEffect, useRef } from 'react'
import type { GraphNode } from '../graph/types.ts'
import { FAMILY_COLORS, NODE_TYPE_COLORS } from '../theme.ts'

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
    <section aria-label={`Undated ${label}`} className="flex shrink-0 items-center gap-3 border-b border-slate-800/60 bg-slate-950/70 px-3 py-1 md:px-5">
      <span className="shrink-0 text-xs font-semibold text-slate-400">
        Undated <span className="text-slate-500">{nodes.length}</span>
      </span>
      <div ref={listRef} className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain">
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
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 md:min-h-8 ${
                selected ? 'border-slate-100 bg-slate-800' : 'border-slate-700 bg-slate-900 hover:border-slate-500'
              }`}
              style={{ opacity: highlightedIds && !highlightedIds.has(node.id) ? 0.2 : 1 }}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
              {node.name}
            </button>
          )
        })}
      </div>
    </section>
  )
}
