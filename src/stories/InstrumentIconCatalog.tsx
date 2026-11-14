import { useState } from 'react'
import graph from '../data/graph.json'
import { InstrumentIcon } from '../design-system/explorer/InstrumentIcon.tsx'

const instruments = graph.nodes
  .filter((node) => node.type === 'instrument')
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))

function searchText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
}

export function InstrumentIconCatalog() {
  const [query, setQuery] = useState('')
  const term = searchText(query)
  const matches = instruments.filter(({ name }) => searchText(name).includes(term))

  return (
    <div className="space-y-4">
      <label className="block max-w-sm text-sm font-medium text-slate-200">
        Filter by instrument name
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-2 block min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
        />
      </label>
      <p role="status" className="text-sm text-slate-400">
        {matches.length === 0 ? 'No instruments match your search.' : `${matches.length} of ${instruments.length} icons`}
      </p>
      {matches.length > 0 && (
        <ul aria-label="Instrument icons" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-3">
          {matches.map(({ id, name }) => (
            <li key={id} className="flex flex-col items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-center text-sm text-slate-200">
              <InstrumentIcon id={id} className="size-10 bg-current text-cyan-300" />
              <span>{name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
