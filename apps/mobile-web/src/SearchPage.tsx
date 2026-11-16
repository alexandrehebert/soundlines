import { searchNodes } from '@soundlines/catalogue/graph'
import { NODE_TYPE_COLORS } from '@soundlines/design-tokens'
import { ChevronRight, Search, X } from 'lucide-react'
import { useMemo, useRef, useState, type MouseEventHandler, type Ref } from 'react'
import { SearchSkeleton } from './design-system/CatalogueSkeleton.tsx'
import type { FeedCatalogue } from './feed.ts'
import { nodeUrl } from './nodeUrl.ts'

const resultLimit = 30

export function SearchPage({ catalogue, loadFailed, hidden, headingRef, onNavigate }: {
  catalogue?: FeedCatalogue
  loadFailed: boolean
  hidden: boolean
  headingRef: Ref<HTMLHeadingElement>
  onNavigate?: MouseEventHandler<HTMLAnchorElement>
}) {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const nodes = useMemo(() => catalogue && {
    nodes: [...catalogue.entries, ...catalogue.spotlights].map(({ node }) => node),
  }, [catalogue])
  const hasQuery = query.trim().length > 0
  const results = useMemo(() => nodes && searchNodes(nodes, query, resultLimit + 1), [nodes, query])
  const loading = !nodes && !loadFailed
  const status = loadFailed ? 'Couldn’t load the catalogue.'
    : loading ? ''
    : !hasQuery ? ''
    : !results?.length ? 'No matches found.'
    : results.length > resultLimit ? `Top ${resultLimit} results`
    : `${results.length} ${results.length === 1 ? 'result' : 'results'}`

  return (
    <section className="catalogue-page" aria-labelledby="search-title" hidden={hidden}>
      <h1 id="search-title" ref={headingRef} tabIndex={-1}>Search</h1>
      <div className="search-field" role="search" aria-label="Catalogue">
        <Search size={20} aria-hidden="true" />
        <input ref={input} type="search" aria-label="Search the catalogue" placeholder="Genres, artists, tracks…"
          autoComplete="off" enterKeyHint="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        {query && <button type="button" aria-label="Clear search" onClick={() => {
          setQuery('')
          input.current?.focus()
        }}><X size={18} aria-hidden="true" /></button>}
      </div>
      <p className="search-status" role="status" aria-label={loading ? 'Loading the catalogue' : undefined}>{status}</p>
      {loading && <SearchSkeleton hasQuery={hasQuery} />}
      {loadFailed && <button className="search-reload" type="button" onClick={() => window.location.reload()}>Reload search</button>}
      {!hasQuery && catalogue && (
        <section className="search-suggestions" aria-labelledby="search-suggestions-title">
          <h2 id="search-suggestions-title">Try a search</h2>
          <ul>
            {catalogue.spotlights.slice(0, 3).map(({ node }) => (
              <li key={node.id}><button type="button" onClick={() => {
                setQuery(node.name)
                input.current?.focus({ preventScroll: true })
              }}>{node.name}</button></li>
            ))}
          </ul>
        </section>
      )}
      {!!results?.length && (
        <ul className="catalogue-results" aria-label="Search results">
          {results.slice(0, resultLimit).map(({ node }) => (
            <li key={node.id}>
              <a href={nodeUrl(node, 'search')} onClick={onNavigate}>
                <span className="result-marker" style={{ color: NODE_TYPE_COLORS[node.type] }} aria-hidden="true" />
                <span className="result-text"><strong>{node.name}</strong>{' '}<span>{node.type}</span></span>
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
