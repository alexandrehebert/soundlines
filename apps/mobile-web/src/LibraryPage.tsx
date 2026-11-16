import { ArrowUpRight, Building2, CalendarDays, ChevronDown, ChevronRight, Disc3, DiscAlbum, Guitar, MapPin, Mic2, Music2, Ticket } from 'lucide-react'
import { useMemo, type CSSProperties, type MouseEvent, type MouseEventHandler, type ReactNode, type Ref } from 'react'
import { NODE_TYPE_COLORS } from '@soundlines/design-tokens'
import type { NodeType } from '@soundlines/catalogue/types'
import type { AtlasEntry, FeedNode } from './feed.ts'
import { nodeUrl, libraryCategories, libraryHref, type EntryOrigin, type LibrarySelection } from './nodeUrl.ts'
import { LibrarySkeleton } from './design-system/CatalogueSkeleton.tsx'
import { MobileChronology } from './design-system/timeline/MobileChronology.tsx'

function EntryList({ nodes, onNavigate, relationLabels, selection, origin }: {
  nodes: FeedNode[]
  relationLabels?: Map<string, string[]>
  onNavigate: MouseEventHandler<HTMLAnchorElement>
  selection?: LibrarySelection
  origin?: EntryOrigin
}) {
  return (
    <ul className="catalogue-results">
      {nodes.map((node) => (
        <li key={node.id}>
          <a href={nodeUrl(node, origin, selection)} onClick={onNavigate}>
            <span className="result-marker" style={{ color: node.accent }} aria-hidden="true" />
            <span className="result-text">
              <strong>{node.name}</strong>
              {relationLabels && (
                <span className="result-relation">{relationLabels.get(node.id)?.join(' · ')}{node.era && ` · ${node.era}`}</span>
              )}
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  )
}

const categoryIcons = {
  artist: Mic2, instrument: Guitar, genre: Music2, track: Disc3, event: CalendarDays,
  festival: Ticket, scene: Building2, label: DiscAlbum, place: MapPin,
} satisfies Record<NodeType, typeof Mic2>

const allEntriesGroup = 'all'
const otherGroup = { id: 'other', label: 'Other', accent: undefined }

export function LibraryPage({ entries, loadFailed, hidden, headingRef, onNavigate, selection, renderArtwork }: {
  entries?: AtlasEntry[]
  loadFailed: boolean
  hidden: boolean
  headingRef: Ref<HTMLHeadingElement>
  onNavigate: MouseEventHandler<HTMLAnchorElement>
  selection?: LibrarySelection
  renderArtwork?: (node: FeedNode) => ReactNode
}) {
  const { type, group } = selection ?? { type: null, group: null }
  const categories = useMemo(() => {
    const categories = new Map<NodeType, AtlasEntry[]>()
    for (const entry of entries ?? []) {
      const current = categories.get(entry.node.type)
      if (current) current.push(entry)
      else categories.set(entry.node.type, [entry])
    }
    return categories
  }, [entries])
  const category = type ? libraryCategories[type] : null
  const categoryEntries = type ? categories.get(type) : undefined
  const groups = useMemo(() => {
    const groups = new Map<string, { label: string; accent?: string; members: AtlasEntry[] }>()
    for (const entry of categoryEntries ?? []) {
      const { id, label, accent } = entry.timelineGroup ?? otherGroup
      const existing = groups.get(id)
      if (existing) existing.members.push(entry)
      else groups.set(id, { label, accent, members: [entry] })
    }
    return groups
  }, [categoryEntries])
  const hasGroups = groups.size > 1 || (groups.size === 1 && !groups.has(otherGroup.id))
  const selected = group ? groups.get(group) : undefined
  const results = group === allEntriesGroup || !hasGroups ? categoryEntries : selected?.members
  const title = selected?.label ?? (group === allEntriesGroup && category ? `All ${category.toLowerCase()}` : category) ?? 'Library'

  return (
    <section className="catalogue-page library-page" aria-labelledby="library-title" hidden={hidden}>
      <h1 id="library-title" ref={headingRef} tabIndex={-1}>{title}</h1>
      {!entries ? (loadFailed ? <CatalogueError /> : <LibrarySkeleton type={type} group={group} />) : type === null ? (
        <ul className="library-panels">
          {(Object.keys(libraryCategories) as NodeType[]).map((type) => {
            const items = categories.get(type)
            if (!items?.length) return null
            const Icon = categoryIcons[type]
            return (
              <li key={type}>
                <a href={libraryHref({ type, group: null })} onClick={onNavigate}
                  style={{ '--panel-accent': NODE_TYPE_COLORS[type] } as CSSProperties}>
                  <Icon size={24} aria-hidden="true" />
                  <span><strong>{libraryCategories[type]}</strong>{' '}<small>{items.length.toLocaleString('en')}</small></span>
                  <ChevronRight size={17} aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ul>
      ) : results ? (
        type === 'place'
          ? <EntryList nodes={results.map(({ node }) => node).sort((a, b) => a.name.localeCompare(b.name))}
              selection={{ type, group }} onNavigate={onNavigate} />
          : <MobileChronology key={`${type}:${group ?? ''}`} entries={results} selection={{ type, group }}
              onNavigate={onNavigate} renderArtwork={renderArtwork} />
      ) : categoryEntries ? (
        <ul className="library-panels library-panels--groups">
          {[[allEntriesGroup, { label: `All ${category!.toLowerCase()}`, accent: undefined, members: categoryEntries }] as const,
            ...[...groups].sort(([, a], [, b]) => a.label.localeCompare(b.label))
          ].map(([id, { label, accent, members }]) => (
            <li key={id}>
              <a href={libraryHref({ type, group: id })} onClick={onNavigate}
                style={{ '--panel-accent': accent ?? NODE_TYPE_COLORS[type] } as CSSProperties}>
                <span><strong>{label}</strong>{' '}<small>{members.length.toLocaleString('en')}</small></span>
                <ChevronRight size={17} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : <p>No library entries yet.</p>}
    </section>
  )
}

function CatalogueError() {
  return (
    <>
      <p role="status">Couldn’t load the catalogue.</p>
      <button className="catalogue-action" type="button" onClick={() => window.location.reload()}>
        Reload catalogue
      </button>
    </>
  )
}

function revealAccordion(event: MouseEvent<HTMLElement>) {
  const accordion = event.currentTarget.closest('details')
  if (!accordion || accordion.open) return

  // The browser opens the disclosure after the click handler runs.
  requestAnimationFrame(() => {
    if (!accordion.open || !accordion.isConnected) return
    const page = accordion.closest('.atlas-detail')
    const visibleHeight = page && page.clientHeight - parseFloat(getComputedStyle(page).scrollPaddingBlockEnd)
    const target = visibleHeight != null && accordion.offsetHeight <= visibleHeight
      ? accordion
      : accordion.querySelector('li')
    target?.scrollIntoView?.({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  })
}

function RelatedEntries({ entry, entries, onNavigate, selection, origin }: {
  entry: AtlasEntry
  entries: Map<string, AtlasEntry>
  onNavigate: MouseEventHandler<HTMLAnchorElement>
  selection?: LibrarySelection
  origin?: EntryOrigin
}) {
  const groups = new Map<NodeType, FeedNode[]>()
  const relationLabels = new Map<string, string[]>()
  for (const { id, labels } of entry.relations) {
    const neighbor = entries.get(id)?.node
    if (!neighbor) continue
    const group = groups.get(neighbor.type)
    if (group) group.push(neighbor)
    else groups.set(neighbor.type, [neighbor])
    relationLabels.set(id, labels)
  }
  if (!groups.size) return null

  return (
    <section className="atlas-connections" aria-labelledby="explore-more-title">
      <h2 id="explore-more-title">Explore more</h2>
      {Object.entries(libraryCategories).map(([type, title]) => {
        const nodes = groups.get(type as NodeType)
        if (!nodes) return null
        return (
          <details className="atlas-disclosure" key={type} open>
            <summary onClick={revealAccordion}>
              {title} <span className="atlas-count">{nodes.length}</span>
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <EntryList nodes={nodes} onNavigate={onNavigate} relationLabels={relationLabels} selection={selection} origin={origin} />
          </details>
        )
      })}
    </section>
  )
}

function Sources({ links }: { links: string[] }) {
  if (!links.length) return null
  return (
    <details className="atlas-disclosure atlas-sources">
      <summary onClick={revealAccordion}>
        Sources <span className="atlas-count">{links.length}</span><ChevronDown size={18} aria-hidden="true" />
      </summary>
      <ul className="catalogue-results">
        {links.map((link) => {
          const url = new URL(link)
          const site = url.hostname.replace(/^www\./, '')
          const slug = url.pathname.split('/').filter(Boolean).at(-1)
          let title = slug
          try {
            if (slug) title = decodeURIComponent(slug)
          } catch {
            // Keep the original path segment when it contains invalid escapes.
          }
          return (
            <li key={link}>
              <a href={link} target="_blank" rel="noreferrer">
                <span className="result-text">
                  <strong>{site}</strong>
                  {title && <span className="result-relation">{title.replace(/[-_]+/g, ' ')}</span>}
                </span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </li>
          )
        })}
      </ul>
    </details>
  )
}

export function AtlasDetail({ entries, nodeId, loadFailed, pageRef, headingRef, onNavigate, renderPreview, renderArtwork, selection, origin }: {
  entries?: Map<string, AtlasEntry>
  nodeId: string
  loadFailed: boolean
  pageRef?: Ref<HTMLElement>
  headingRef: Ref<HTMLHeadingElement>
  onNavigate: MouseEventHandler<HTMLAnchorElement>
  renderPreview?: (node: FeedNode) => ReactNode
  renderArtwork?: (node: FeedNode) => ReactNode
  selection?: LibrarySelection
  origin?: EntryOrigin
}) {
  const entry = entries?.get(nodeId)
  const loading = !entries && !loadFailed
  const nodeType = nodeId.split(':', 1)[0]
  const hasArtwork = nodeType === 'genre' || nodeType === 'instrument'
  const artwork = entry && renderArtwork?.(entry.node)

  return (
    <section ref={pageRef} className="catalogue-page atlas-detail" aria-labelledby="atlas-entry-title">
      <header className="atlas-entry-header">
        <div className="atlas-entry-heading">
          {loading ? (
            <div className="skeleton-fill atlas-skeleton-meta" aria-hidden="true" />
          ) : entry && (
            <p className="atlas-entry-meta">
              <span style={{ color: entry.node.accent }}>{entry.node.type}</span>
              {entry.classification && <span>{entry.classification}</span>}
            </p>
          )}
          <h1 id="atlas-entry-title" ref={headingRef} tabIndex={-1} aria-label={loading ? 'Atlas entry' : undefined}>
            {loading ? <span className="skeleton-fill atlas-skeleton-title" aria-hidden="true" /> : entry?.node.name ?? 'Atlas entry'}
          </h1>
          {loading ? (
            <div className="skeleton-fill atlas-skeleton-period" aria-hidden="true" />
          ) : entry?.period && (
            <p className="atlas-period">{entry.period}{entry.estimateNote && ' (estimated)'}</p>
          )}
        </div>
        {loading ? hasArtwork && <div className="atlas-artwork skeleton-fill atlas-skeleton-artwork" aria-hidden="true" />
          : artwork && <div className="atlas-artwork">{artwork}</div>}
      </header>
      {entry && entries ? (
        <>
          {entry.estimateNote && <p className="atlas-estimate">{entry.estimateNote}</p>}
          {entry.description && <p className="atlas-description">{entry.description}</p>}
          {renderPreview?.(entry.node)}
          <RelatedEntries entry={entry} entries={entries} onNavigate={onNavigate} selection={selection} origin={origin} />
          {(entry.confidence || entry.sources.length > 0) && (
            <footer className="atlas-references" aria-label="Entry references">
              {entry.confidence && <p className="atlas-confidence">Entry confidence: <strong>{entry.confidence}</strong></p>}
              <Sources links={entry.sources} />
            </footer>
          )}
        </>
      ) : loading ? (
        <div role="status" aria-label="Loading atlas entry">
          <div className="atlas-skeleton-body" aria-hidden="true">
            <span className="skeleton-fill" />
            <span className="skeleton-fill" />
            <span className="skeleton-fill" />
            {nodeType === 'genre' && <div className="listen skeleton-fill" />}
            <div className="skeleton-fill atlas-skeleton-group" />
          </div>
        </div>
      ) : entries ? <p>This entry couldn’t be found.</p> : <CatalogueError />}
    </section>
  )
}
