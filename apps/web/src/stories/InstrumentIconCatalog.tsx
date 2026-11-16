import { useState } from 'react'
import graph from '@soundlines/catalogue/data/graph.json'
import { InstrumentIcon } from '../design-system/explorer/InstrumentIcon.tsx'
import { FAMILY_LABELS, INSTRUMENT_FAMILY_ORDER } from '../graph/types.ts'

const instruments = graph.nodes
  .filter((node) => node.type === 'instrument')
  .sort((a, b) => a.name.localeCompare(b.name, 'en'))

const filterClassName = 'mt-2 block min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400'

function searchText(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
}

export function InstrumentIconCatalog() {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('')
  const term = searchText(query)
  const matches = instruments.filter((instrument) =>
    (!family || instrument.family === family) && searchText(instrument.name).includes(term),
  )

  return (
    <div className="space-y-4">
      <div className="grid max-w-2xl gap-3 text-sm font-medium text-slate-200 sm:grid-cols-2">
        <label>
          Filter by instrument name
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={filterClassName}
          />
        </label>
        <label>
          Instrument family
          <select value={family} onChange={(event) => setFamily(event.target.value)} className={filterClassName}>
            <option value="">All families</option>
            {INSTRUMENT_FAMILY_ORDER.map((family) => (
              <option key={family} value={family}>{FAMILY_LABELS[family]}</option>
            ))}
          </select>
        </label>
      </div>
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
