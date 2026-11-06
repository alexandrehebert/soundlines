import { ArrowDown, ArrowLeftRight, ArrowRight, ArrowUpRight, Bubbles, ChartGantt, Disc3, Guitar, Headphones, Heart, History, Landmark, Radio, Users, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useId, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import { formatEventPeriod } from '../graph/history.ts'
import { VIEW_PATHS, viewForNode, type ExplorerView } from '../graph/timeline.ts'
import { EDGE_TYPE_LABELS, NODE_TYPE_LABELS, type GraphNode } from '../graph/types.ts'
import { GenreSample } from './GenreSample.tsx'
import { SearchBar } from './SearchBar.tsx'
import './Home.css'

const DESTINATIONS = [
  { view: 'genre', title: 'Genres', detail: 'Trace styles and influences', icon: Bubbles },
  { view: 'artist', title: 'Artists', detail: 'Meet the people behind the sound', icon: Users },
  { view: 'instrument', title: 'Instruments', detail: 'Explore how sounds are made', icon: Guitar },
  { view: 'history', title: 'History', detail: 'Find turning points in music', icon: History },
] as const

const FEATURED_CONNECTIONS = [
  ['genre:funk', 'influences', 'genre:detroit-techno'],
  ['genre:alt-country', 'subgenre_of', 'genre:country'],
  ['genre:bossa-nova', 'cross_pollination', 'genre:jazz', 'Brazilian bossa nova and jazz shaped each other as musicians brought the styles together.'],
  ['genre:chicago-house', 'derived_from', 'genre:disco', 'Chicago DJs built on disco records and edits, adding influences from soul and experimenting with drum machines.'],
  ['genre:acid-jazz', 'fusion_of', 'genre:funk', 'Acid jazz blends funk grooves with jazz and dance music.'],
] as const

const LISTENING_PICKS = ['genre:bossa-nova', 'genre:acid-jazz', 'genre:detroit-techno'] as const
const ARTIST_PICKS = ['artist:fela-kuti', 'artist:celia-cruz', 'artist:kraftwerk'] as const
const INSTRUMENT_PICKS = ['instrument:tr-808', 'instrument:theremin', 'instrument:timbales'] as const
const HISTORY_PICKS = ['event:phonograph-invented', 'event:bronx-back-to-school-jam', 'event:napster-launch'] as const

const PAGE_SIZE = 5
const reveal = {
  initial: { opacity: 0.55, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const

function SpinningVinyl() {
  const { scrollY } = useScroll()
  const angle = useTransform(scrollY, [0, 480], [-16, 344])
  const rotate = useSpring(angle, { stiffness: 110, damping: 24 })

  return <motion.div className="discovery-vinyl" style={{ rotate }}><div className="discovery-label"><Disc3 size={28} /></div></motion.div>
}
const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })

function follow(event: MouseEvent<HTMLAnchorElement>, navigate: () => void) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigate()
}

function ViewLink({ view, className, children }: { view: ExplorerView; className: string; children: ReactNode }) {
  const { changeView } = useExplorer()
  return <a className={className} href={VIEW_PATHS[view]} onClick={(event) => follow(event, () => changeView(view))}>{children}</a>
}

function EntryLink({ node, className, children }: { node: GraphNode; className: string; children: ReactNode }) {
  const { selectNode } = useExplorer()
  const params = new URLSearchParams({ focus: node.id })
  const path = VIEW_PATHS[viewForNode(node.type, 'genre')]
  return <a className={className} href={`${path}?${params}`} onClick={(event) => follow(event, () => selectNode(node.id))}>{children}</a>
}

function SpotlightWidget({ title, icon: Icon, picks, relationship, nextLabel, scrollReveal }: {
  title: string
  icon: LucideIcon
  picks: readonly string[]
  relationship: 'key_artist_of' | 'featured_in'
  nextLabel: string
  scrollReveal: typeof reveal | undefined
}) {
  const { index } = useExplorer()
  const headingId = useId()
  const [position, setPosition] = useState(0)
  const entries = picks.map((id) => index.nodeById.get(id)).filter((node) => node !== undefined)
  const node = entries[position]
  if (!node) return null

  const genres = [...new Set(index.outEdges.get(node.id)
    ?.filter((edge) => edge.type === relationship)
    .map((edge) => edge.to))]
    .map((id) => index.nodeById.get(id))
    .filter((entry): entry is GraphNode => entry?.type === 'genre')
    .slice(0, 3)

  return (
    <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby={headingId}>
      <div className="discovery-widget-heading">
        <h3 id={headingId}><Icon size={19} aria-hidden="true" /> {title}</h3>
        {entries.length > 1 && <span className="discovery-counter">{position + 1} / {entries.length}</span>}
      </div>
      <div aria-live="polite">
        <EntryLink node={node} className="discovery-spotlight-title">
          {node.name} <ArrowUpRight size={16} aria-hidden="true" />
        </EntryLink>
        {node.description && <p className="discovery-note">{node.description}</p>}
        {genres.length > 0 && (
          <ul className="discovery-spotlight-genres" aria-label="Connected genres">
            {genres.map((genre) => (
              <li key={genre.id}>
                <EntryLink node={genre} className="discovery-genre-chip">{genre.name}</EntryLink>
              </li>
            ))}
          </ul>
        )}
      </div>
      {entries.length > 1 && (
        <button type="button" className="discovery-widget-action" onClick={() => setPosition((current) => (current + 1) % entries.length)}>
          {nextLabel} <ArrowRight size={16} aria-hidden="true" />
        </button>
      )}
    </motion.section>
  )
}

export function Home() {
  const { index } = useExplorer()
  const reduceMotion = useReducedMotion()
  const scrollReveal = reduceMotion ? undefined : reveal
  const [connectionIndex, setConnectionIndex] = useState(0)
  const [listeningIndex, setListeningIndex] = useState(0)
  const { connections, listeningPicks, historyPicks, recent } = useMemo(() => ({
    listeningPicks: LISTENING_PICKS.map((id) => index.nodeById.get(id)).filter((node) => node?.type === 'genre'),
    historyPicks: HISTORY_PICKS.map((id) => index.nodeById.get(id)).filter((node): node is GraphNode => node?.type === 'event'),
    connections: FEATURED_CONNECTIONS.flatMap(([fromId, type, toId, summary]) => {
      const from = index.nodeById.get(fromId)
      const to = index.nodeById.get(toId)
      const edge = index.outEdges.get(fromId)?.find((edge) => edge.to === toId && edge.type === type)
      return from && to && edge ? [{ from, to, edge, note: summary ?? edge.note }] : []
    }),
    recent: index.graph.nodes
      .flatMap((node) => node.addedOn ? [{ node, date: node.addedOn }] : [])
      .sort((a, b) => b.date.localeCompare(a.date) || a.node.name.localeCompare(b.node.name)),
  }), [index])
  const connection = connections[connectionIndex]
  const listeningPick = listeningPicks[listeningIndex]
  const RelationArrow = connection?.edge.type === 'cross_pollination' ? ArrowLeftRight : ArrowRight

  return (
    <div className="discovery">
      <header className="discovery-header">
        <div className="discovery-width discovery-header-inner">
          <a className="discovery-brand" href="/" aria-current="page"><Disc3 aria-hidden="true" /> Soundlines</a>
          <div className="discovery-search"><SearchBar /></div>
        </div>
      </header>

      <main className="discovery-width discovery-main">
        <section className="discovery-hero" aria-labelledby="discovery-heading">
          <motion.div
            className="discovery-hero-copy"
            initial={reduceMotion ? false : { opacity: 0.65, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: 'easeOut' }}
          >
            <p className="discovery-kicker"><span /> An atlas of music history</p>
            <h1 id="discovery-heading">Follow the<br /> <em>sound.</em></h1>
            <p className="discovery-intro">Trace the genres, artists and instruments that shaped the music we hear today.</p>
            <div className="discovery-actions">
              <ViewLink view="genre" className="discovery-primary"><ChartGantt size={17} aria-hidden="true" /> Open the timeline <ArrowRight size={17} aria-hidden="true" /></ViewLink>
              <a className="discovery-secondary" href="#discover">Discover <ArrowDown size={15} aria-hidden="true" /></a>
            </div>
          </motion.div>
          <div className="discovery-record" aria-hidden="true">
            {reduceMotion
              ? <div className="discovery-vinyl"><div className="discovery-label"><Disc3 size={28} /></div></div>
              : <SpinningVinyl />}
            <span className="discovery-record-caption">SOUNDLINES / SIDE A</span>
          </div>
        </section>

        <motion.nav {...scrollReveal} className="discovery-nav" aria-label="Explore the catalogue">
          {DESTINATIONS.map(({ view, title, detail, icon: Icon }) => (
            <ViewLink key={view} view={view} className="discovery-destination">
              <Icon size={21} className="discovery-destination-icon" aria-hidden="true" />
              <span><strong>{title}</strong><small>{detail}</small></span>
              <ArrowUpRight size={16} className="discovery-link-arrow" aria-hidden="true" />
            </ViewLink>
          ))}
        </motion.nav>

        <section id="discover" className="discovery-widgets" aria-labelledby="discovery-widgets-heading">
          <motion.h2 {...scrollReveal} id="discovery-widgets-heading">Discover the catalogue</motion.h2>
          <div className="discovery-grid">
            <div className="discovery-column">
              <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby="connection-heading">
                <div className="discovery-widget-heading">
                  <h3 id="connection-heading"><Radio size={19} aria-hidden="true" /> Genre connections</h3>
                  {connection && <span className="discovery-counter">{connectionIndex + 1} / {connections.length}</span>}
                </div>
                {connection ? (
                  <>
                    <div aria-live="polite">
                      <motion.div
                        key={connection.edge.id}
                        initial={reduceMotion ? false : { opacity: 0.55, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.25 }}
                      >
                        <div className="discovery-lineage">
                          <EntryLink node={connection.from} className="discovery-node">{connection.from.name}<ArrowUpRight size={15} aria-hidden="true" /></EntryLink>
                          <span className="discovery-relation"><RelationArrow size={19} aria-hidden="true" />{EDGE_TYPE_LABELS[connection.edge.type]}</span>
                          <EntryLink node={connection.to} className="discovery-node">{connection.to.name}<ArrowUpRight size={15} aria-hidden="true" /></EntryLink>
                        </div>
                        {connection.note && <p className="discovery-note">{connection.note}</p>}
                      </motion.div>
                    </div>
                    {connections.length > 1 && (
                      <button type="button" className="discovery-widget-action" onClick={() => setConnectionIndex((current) => (current + 1) % connections.length)}>
                        Next connection <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    )}
                  </>
                ) : <p className="discovery-note">Featured connections will appear here when available.</p>}
              </motion.section>

              {listeningPick && (
                <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby="listening-heading">
                  <div className="discovery-widget-heading">
                    <h3 id="listening-heading"><Headphones size={19} aria-hidden="true" /> Listening booth</h3>
                  </div>
                  <p className="discovery-note">Hear a 10-second generated example of each genre’s sound.</p>
                  <div className="discovery-listening">
                    <GenreSample key={listeningPick.id} id={listeningPick.id} name={listeningPick.name} />
                    <div aria-live="polite">
                      <EntryLink node={listeningPick} className="discovery-listening-link">
                        {listeningPick.name} <ArrowUpRight size={15} aria-hidden="true" />
                      </EntryLink>
                    </div>
                  </div>
                  {listeningPicks.length > 1 && (
                    <button type="button" className="discovery-widget-action" onClick={() => setListeningIndex((current) => (current + 1) % listeningPicks.length)}>
                      Next sound <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                </motion.section>
              )}

              <SpotlightWidget
                title="Artist spotlight"
                icon={Users}
                picks={ARTIST_PICKS}
                relationship="key_artist_of"
                nextLabel="Next artist"
                scrollReveal={scrollReveal}
              />
            </div>
            <div className="discovery-column">
              <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby="recent-heading">
                <div className="discovery-widget-heading">
                  <h3 id="recent-heading"><History size={19} aria-hidden="true" /> Recently added</h3>
                </div>
                {recent.length > 0 ? (
                  <ul className="discovery-recent">
                    {recent.slice(0, PAGE_SIZE).map(({ node, date }) => (
                      <li key={node.id}>
                        <EntryLink node={node} className="discovery-entry">
                          <span><strong>{node.name}</strong><small>{NODE_TYPE_LABELS[node.type]}</small></span>
                          <time dateTime={date}>{dateFormatter.format(new Date(date))}</time>
                          <ArrowUpRight size={15} className="discovery-link-arrow" aria-hidden="true" />
                        </EntryLink>
                      </li>
                    ))}
                  </ul>
                ) : <p className="discovery-note">New catalogue entries will appear here as they’re added.</p>}
                {recent.length > PAGE_SIZE && (
                  <p className="discovery-note">And many more</p>
                )}
              </motion.section>

              {historyPicks.length > 0 && (
                <motion.section {...scrollReveal} className="discovery-widget" aria-labelledby="landmarks-heading">
                  <div className="discovery-widget-heading">
                    <h3 id="landmarks-heading"><Landmark size={19} aria-hidden="true" /> Turning points</h3>
                  </div>
                  <ul className="discovery-recent">
                    {historyPicks.map((event) => (
                      <li key={event.id}>
                        <EntryLink node={event} className="discovery-entry">
                          <strong>{event.name}</strong>
                          {event.period && <span className="discovery-entry-date">{formatEventPeriod(event.period)}</span>}
                          <ArrowUpRight size={15} className="discovery-link-arrow" aria-hidden="true" />
                        </EntryLink>
                      </li>
                    ))}
                  </ul>
                  <ViewLink view="history" className="discovery-widget-action">
                    Explore music history <ArrowRight size={16} aria-hidden="true" />
                  </ViewLink>
                </motion.section>
              )}

              <SpotlightWidget
                title="Instrument spotlight"
                icon={Guitar}
                picks={INSTRUMENT_PICKS}
                relationship="featured_in"
                nextLabel="Next instrument"
                scrollReveal={scrollReveal}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="discovery-width discovery-footer">
        <p>
          Made with <Heart className="discovery-footer-heart" size={16} aria-hidden="true" />
          <span className="sr-only">love</span>{' '}by Alexandre <strong>“Axoune”</strong> Hebert
        </p>
        <p className="discovery-copyright">© 2026 Soundlines. All rights reserved.</p>
      </footer>
    </div>
  )
}
