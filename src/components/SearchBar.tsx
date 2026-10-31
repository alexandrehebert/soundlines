import { Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import { searchNodes } from '../graph/graph.ts'
import { NODE_TYPE_LABELS } from '../graph/types.ts'
import { NODE_TYPE_COLORS } from '../theme.ts'

export function SearchBar() {
  const { index, selectNode } = useExplorer()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const results = searchNodes(index.graph, query)

  const pick = (id: string) => {
    selectNode(id)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && results.length > 0) pick(results[0].node.id)
          if (event.key === 'Escape') {
            setQuery('')
            setOpen(false)
            inputRef.current?.blur()
          }
        }}
        placeholder="Search genres, artists, labels…"
        className="w-full rounded-full border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
      />
      {open && query.trim().length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/50">
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">No matches</li>
          )}
          {results.map(({ node }) => (
            <li key={node.id}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  pick(node.id)
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-slate-800"
              >
                <span className="text-sm font-semibold text-slate-200">{node.name}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: NODE_TYPE_COLORS[node.type] }}
                >
                  {NODE_TYPE_LABELS[node.type]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
