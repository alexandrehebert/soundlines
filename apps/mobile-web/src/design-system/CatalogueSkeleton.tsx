import type { LibrarySelection } from '../nodeUrl.ts'

const panelTypes = new Set(['artist', 'genre', 'instrument', 'event'])

function ResultRows() {
  return (
    <ul className="catalogue-results">
      {[0, 1, 2, 3, 4].map((row) => (
        <li key={row}>
          <div className="catalogue-skeleton-result">
            <span className="skeleton-fill result-marker" />
            <span className="result-text">
              <span className="skeleton-fill skeleton-line" />
              <span className="skeleton-fill skeleton-line skeleton-line--short" />
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function SearchSkeleton({ hasQuery }: { hasQuery: boolean }) {
  return hasQuery ? (
    <div className="search-skeleton-results" aria-hidden="true"><ResultRows /></div>
  ) : (
    <div className="search-suggestions" aria-hidden="true">
      <span className="skeleton-fill skeleton-date" />
      <ul>{[0, 1, 2].map((chip) => <li key={chip} className="skeleton-fill skeleton-chip" />)}</ul>
    </div>
  )
}

export function LibrarySkeleton({ type, group }: LibrarySelection) {
  let content
  if (!type || (!group && panelTypes.has(type))) {
    content = (
      <ul className={type ? 'library-panels library-panels--groups' : 'library-panels'}>
        {Array.from({ length: type ? 5 : 9 }, (_, index) => (
          <li key={index} className="catalogue-skeleton-panel">
            {!type && <span className="skeleton-fill skeleton-icon" />}
            <span className="skeleton-fill skeleton-line" />
            <span className="skeleton-fill skeleton-line skeleton-line--short" />
          </li>
        ))}
      </ul>
    )
  } else if (type === 'place') {
    content = <ResultRows />
  } else {
    content = (
      <div className="chronology-results chronology-results--indexed">
        <div className="chronology-index skeleton-fill" />
        <div className="chronology-sections">
          {[0, 1, 2].map((date) => (
            <div key={date} className="chronology-date">
              <span className="skeleton-fill skeleton-date" />
              <ul className={type === 'instrument' ? 'instrument-album' : 'chronology-cards'}>
                {[0, 1, 2].map((card) => <li key={card} className="skeleton-fill skeleton-chronology-card" />)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div role="status" aria-label="Loading the catalogue">
      <div aria-hidden="true">{content}</div>
    </div>
  )
}

export function FeedSkeleton() {
  return (
    <div className="feed-skeleton" role="status" aria-label="Loading more cards">
      <div className="node-panel node-panel--text" aria-hidden="true">
        <span className="skeleton-fill skeleton-date" />
        <span className="skeleton-fill feed-skeleton-title" />
        <span className="skeleton-fill skeleton-line" />
        <span className="skeleton-fill skeleton-line skeleton-line--short" />
      </div>
    </div>
  )
}
