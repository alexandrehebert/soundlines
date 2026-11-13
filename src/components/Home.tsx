import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, Bubbles, ChartGantt, Guitar, Headphones, History, Landmark, Radio, Route, Users, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from 'react'
import { useNow, useTranslations } from 'next-intl'
import { useExplorer } from '../ExplorerContext.ts'
import { hasGenrePreview } from '../data/genrePreviews.ts'
import { featureFlags } from '../featureFlags.ts'
import { formatEventPeriod } from '../graph/history.ts'
import { availableSoundtrails, type AvailableSoundtrail } from '../graph/soundtrails.ts'
import type { GraphNode, NodeType } from '../graph/types.ts'
import { DiscoveryFooter, DiscoveryHeader } from './DiscoveryChrome.tsx'
import { ChronologyPreview } from './ChronologyPreview.tsx'
import { currentUtcDay, dailySpotlights, subscribeToUtcDay, utcDay } from './dailySpotlights.ts'
import { GenreSample } from './GenreSample.tsx'
import { EntryLink, ViewLink } from './HomeLinks.tsx'
import { Soundtrails } from './Soundtrails.tsx'
import { Turntable } from './Turntable.tsx'
import './Home.css'
import { graphLabels } from '../i18n/graphLabels.ts'
import { publicAsset } from '../publicAsset.ts'
import { chartColor, FAMILY_COLORS } from '../theme.ts'
import { useColorTheme } from '../useColorTheme.ts'

const TIMELINE_DESTINATIONS = [
  { view: 'genre', icon: Bubbles },
  { view: 'artist', icon: Users },
  { view: 'instrument', icon: Guitar },
] as const
const HISTORY_DESTINATION = { view: 'history', icon: History } as const
const { view: HISTORY_VIEW, icon: HistoryIcon } = HISTORY_DESTINATION
const DESTINATIONS = [...TIMELINE_DESTINATIONS, HISTORY_DESTINATION]

const FEATURED_CONNECTIONS = [
  ['genre:funk', 'influences', 'genre:detroit-techno', 'funk-detroit'],
  ['genre:alt-country', 'subgenre_of', 'genre:country', 'altcountry-country'],
  ['genre:bossa-nova', 'cross_pollination', 'genre:jazz', 'bossa-jazz'],
  ['genre:chicago-house', 'derived_from', 'genre:disco', 'house-disco'],
  ['genre:acid-jazz', 'fusion_of', 'genre:funk', 'acid-funk'],
] as const

const LISTENING_PICKS = ['genre:bossa-nova', 'genre:acid-jazz', 'genre:detroit-techno'] as const
const HISTORY_PICKS = ['event:phonograph-invented', 'event:bronx-back-to-school-jam', 'event:napster-launch'] as const

const PAGE_SIZE = 5
const reveal = {
  initial: { opacity: 0.55 },
  whileInView: { opacity: 1 },
  viewport: { once: true, amount: 0 },
  transition: { duration: 0.55, ease: 'easeOut' },
} as const

function ConnectionNode({ node }: { node: GraphNode }) {
  const color = node.family ? chartColor(FAMILY_COLORS[node.family]) : undefined
  return (
    <EntryLink node={node} className="discovery-node">
      <span className="discovery-node-name">
        <span className="discovery-node-dot" style={{ backgroundColor: color }} aria-hidden="true" />
        {node.name}
      </span>
      <ArrowUpRight size={15} aria-hidden="true" />
    </EntryLink>
  )
}

function WidgetNav({ nextLabel, onPrevious, onNext, previousDisabled = false }: {
  nextLabel: string
  onPrevious: () => void
  onNext: () => void
  previousDisabled?: boolean
}) {
  const tHome = useTranslations('homeCopy')
  return (
    <div className="discovery-widget-nav">
      <button type="button" className="discovery-widget-action" onClick={onPrevious} disabled={previousDisabled}>
        <ArrowLeft size={16} aria-hidden="true" /> {tHome('previous')}
      </button>
      <button type="button" className="discovery-widget-action" onClick={onNext}>
        {nextLabel} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

function SpotlightWidget({ title, icon: Icon, picks, day, relationship, nextLabel, scrollReveal }: {
  title: string
  icon: LucideIcon
  picks: readonly GraphNode[]
  day: number
  relationship: 'key_artist_of' | 'featured_in'
  nextLabel: string
  scrollReveal: typeof reveal | undefined
}) {
  const { index } = useExplorer()
  const tHome = useTranslations('homeCopy')
  const headingId = useId()
  const [selection, setSelection] = useState({ day, position: 0 })
  const position = selection.day === day && picks.length > 0 ? selection.position % picks.length : 0
  const node = picks[position]
  if (!node) return null

  const genres = [...new Set(index.outEdges.get(node.id)
    ?.filter((edge) => edge.type === relationship)
    .map((edge) => edge.to))]
    .map((id) => index.nodeById.get(id))
    .filter((entry): entry is GraphNode => entry?.type === 'genre')
    .slice(0, 3)

  return (
    <motion.section {...scrollReveal} className="discovery-widget discovery-spotlight" aria-labelledby={headingId}>
      <div className="discovery-widget-heading">
        <h3 id={headingId}><Icon size={19} aria-hidden="true" /> {title}</h3>
        {picks.length > 1 && <span className="discovery-counter">{position + 1} / {picks.length}</span>}
      </div>
      <div aria-live="polite">
        <div className="discovery-spotlight-title-row">
          <EntryLink node={node} className="discovery-spotlight-title">
            {node.name} <ArrowUpRight size={16} aria-hidden="true" />
          </EntryLink>
          {node.type === 'instrument' && (
            <img
              className="discovery-spotlight-art"
              src={publicAsset(`/instrument-avatars/${encodeURIComponent(node.id.slice('instrument:'.length))}.svg`)}
              width={80}
              height={80}
              loading="lazy"
              alt=""
            />
          )}
        </div>
        {node.description && <p className="discovery-note">{node.description}</p>}
        {genres.length > 0 && (
          <ul className="discovery-spotlight-genres" aria-label={tHome('connectedGenres')}>
            {genres.map((genre) => (
              <li key={genre.id}>
                <EntryLink node={genre} className="discovery-genre-chip">{genre.name}</EntryLink>
              </li>
            ))}
          </ul>
        )}
      </div>
      {picks.length > 1 && (
        <WidgetNav
          nextLabel={nextLabel}
          onPrevious={() => setSelection({ day, position: (position - 1 + picks.length) % picks.length })}
          onNext={() => setSelection({ day, position: (position + 1) % picks.length })}
        />
      )}
    </motion.section>
  )
}

type ScrollReveal = typeof reveal | undefined
type SpotlightProps = { picks: readonly GraphNode[]; day: number; scrollReveal: ScrollReveal }
type SpotlightSelections = { artists: GraphNode[]; instruments: GraphNode[]; day: number }

function ConnectionWidget({ scrollReveal }: { scrollReveal: ScrollReveal }) {
  const { index, locale } = useExplorer()
  const tHome = useTranslations('homeCopy')
  const tConnectionNotes = useTranslations('connectionNotes')
  const labels = graphLabels(locale)
  const reduceMotion = useReducedMotion()
  const [position, setPosition] = useState(0)
  const connections = useMemo(() => FEATURED_CONNECTIONS.flatMap(([fromId, type, toId, summaryId]) => {
    const from = index.nodeById.get(fromId)
    const to = index.nodeById.get(toId)
    const edge = index.outEdges.get(fromId)?.find((edge) => edge.to === toId && edge.type === type)
    return from && to && edge ? [{ from, to, edge, note: tConnectionNotes(summaryId) }] : []
  }), [index, tConnectionNotes])
  const connection = connections[position]
  const RelationArrow = connection?.edge.type === 'cross_pollination' ? ArrowLeftRight : ArrowRight

  return (
    <motion.section {...scrollReveal} className="discovery-widget discovery-connection" aria-labelledby="connection-heading">
      <div className="discovery-widget-heading">
        <h3 id="connection-heading"><Radio size={19} aria-hidden="true" /> {tHome('genreConnections')}</h3>
        {connection && <span className="discovery-counter">{position + 1} / {connections.length}</span>}
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
                <ConnectionNode node={connection.from} />
                <span className="discovery-relation"><RelationArrow size={19} aria-hidden="true" />{labels.edges[connection.edge.type]}</span>
                <ConnectionNode node={connection.to} />
              </div>
              {connection.note && <p className="discovery-note">{connection.note}</p>}
            </motion.div>
          </div>
          {connections.length > 1 && (
            <WidgetNav
              nextLabel={tHome('nextConnection')}
              onPrevious={() => setPosition((current) => (current - 1 + connections.length) % connections.length)}
              onNext={() => setPosition((current) => (current + 1) % connections.length)}
            />
          )}
        </>
      ) : <p className="discovery-note">{tHome('noFeaturedConnections')}</p>}
    </motion.section>
  )
}

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function ListeningWidget({ scrollReveal }: { scrollReveal: ScrollReveal }) {
  const { index } = useExplorer()
  const tHome = useTranslations('homeCopy')
  const genres = useMemo(() => {
    const all = [...index.nodeById.values()].filter((node) => node.type === 'genre' && hasGenrePreview(node.id))
    const curated = LISTENING_PICKS.map((id) => index.nodeById.get(id)).filter((node): node is GraphNode => node?.type === 'genre')
    return { all, curated }
  }, [index])
  // `played` keeps every heard genre so “previous” can walk back; `upcoming` is refilled with a fresh shuffle.
  const [booth, setBooth] = useState(() => {
    const [first, ...rest] = genres.curated
    return { played: first ? [first] : [], position: 0, upcoming: rest }
  })
  const pick = booth.played[booth.position]
  if (!pick) return null

  const previous = () => setBooth((current) => ({ ...current, position: Math.max(0, current.position - 1) }))
  const next = () => setBooth((current) => {
    if (current.position + 1 < current.played.length) return { ...current, position: current.position + 1 }
    let upcoming = current.upcoming
    if (upcoming.length === 0) {
      const recent = new Set(current.played.slice(-LISTENING_PICKS.length).map((node) => node.id))
      const round = shuffled(genres.all)
      upcoming = [...round.filter((node) => !recent.has(node.id)), ...round.filter((node) => recent.has(node.id))]
    }
    const [following, ...rest] = upcoming
    return { played: [...current.played, following], position: current.played.length, upcoming: rest }
  })

  return (
    <motion.section {...scrollReveal} className="discovery-widget discovery-listening-card" aria-labelledby="listening-heading">
      <div className="discovery-widget-heading">
        <h3 id="listening-heading"><Headphones size={19} aria-hidden="true" /> {tHome('listeningBooth')}</h3>
      </div>
      <div className="discovery-listening">
        <GenreSample key={pick.id} id={pick.id} name={pick.name} />
        <div aria-live="polite">
          <EntryLink node={pick} className="discovery-listening-link">
            {pick.name} <ArrowUpRight size={15} aria-hidden="true" />
          </EntryLink>
        </div>
      </div>
      <p className="discovery-note">{tHome('listeningDescription')}</p>
      {genres.all.length > 1 && (
        <WidgetNav nextLabel={tHome('nextSound')} onPrevious={previous} onNext={next} previousDisabled={booth.position === 0} />
      )}
    </motion.section>
  )
}

function useHistoryPicks() {
  const { index } = useExplorer()
  return useMemo(() => HISTORY_PICKS.map((id) => index.nodeById.get(id)).filter((node): node is GraphNode => node?.type === 'event'), [index])
}

function MomentDetails({ event }: { event: GraphNode }) {
  const { locale } = useExplorer()
  const labels = graphLabels(locale)

  return (
    <>
      {event.category && <span className="discovery-moment-category">{labels.eventCategories[event.category]}</span>}
      {event.description && <p className="discovery-note discovery-moment-note">{event.description}</p>}
    </>
  )
}

function MomentsWidget({ events, wide = false, scrollReveal }: { events: GraphNode[]; wide?: boolean; scrollReveal: ScrollReveal }) {
  const { locale } = useExplorer()
  const tHome = useTranslations('homeCopy')
  if (events.length === 0) return null

  return (
    <motion.section {...scrollReveal} className={`discovery-widget discovery-history${wide ? ' discovery-history-wide' : ''}`} aria-labelledby="landmarks-heading">
      <div className="discovery-widget-heading">
        <h3 id="landmarks-heading"><Landmark size={19} aria-hidden="true" /> {tHome('turningPoints')}</h3>
      </div>
      <ul className="discovery-recent">
        {events.map((event) => (
          <li key={event.id} className={wide ? 'discovery-moment' : undefined}>
            <EntryLink node={event} className="discovery-entry">
              <strong>{event.name}</strong>
              {event.period && <span className="discovery-entry-date">{formatEventPeriod(event.period, locale)}</span>}
              <ArrowUpRight size={15} className="discovery-link-arrow" aria-hidden="true" />
            </EntryLink>
            {wide && <MomentDetails event={event} />}
          </li>
        ))}
      </ul>
      {!wide && (
        <ViewLink view="history" className="discovery-widget-action">
          {tHome('exploreMusicHistory')} <ArrowRight size={16} aria-hidden="true" />
        </ViewLink>
      )}
    </motion.section>
  )
}

function RecentWidget({ types, headingId = 'recent-heading', scrollReveal }: {
  types?: readonly NodeType[]
  headingId?: string
  scrollReveal: ScrollReveal
}) {
  const { index, locale } = useExplorer()
  const tHome = useTranslations('homeCopy')
  const labels = graphLabels(locale)
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }), [locale])
  const typeKey = types?.join(',')
  const recent = useMemo(() => {
    const allowed = typeKey ? new Set(typeKey.split(',')) : undefined
    return index.graph.nodes
      .flatMap((node) => node.addedOn && (!allowed || allowed.has(node.type)) ? [{ node, date: node.addedOn }] : [])
      .sort((a, b) => b.date.localeCompare(a.date) || a.node.name.localeCompare(b.node.name))
  }, [index, typeKey])
  if (types && recent.length === 0) return null
  const scoped = types !== undefined

  return (
    <motion.section {...scrollReveal} className={`discovery-widget discovery-updates${scoped ? ' discovery-updates-scoped' : ''}`} aria-labelledby={headingId}>
      <div className="discovery-widget-heading">
        <h3 id={headingId}><History size={19} aria-hidden="true" /> {tHome('recentlyAdded')}</h3>
      </div>
      {recent.length > 0 ? (
        <ul className="discovery-recent discovery-updates-list">
          {recent.slice(0, PAGE_SIZE).map(({ node, date }) => (
            <li key={node.id}>
              <EntryLink node={node} className="discovery-entry">
                <span><strong>{node.name}</strong>{!scoped && <small>{labels.nodeTypes[node.type]}</small>}</span>
                <time dateTime={date}>{dateFormatter.format(new Date(date))}</time>
                <ArrowUpRight size={15} className="discovery-link-arrow" aria-hidden="true" />
              </EntryLink>
            </li>
          ))}
        </ul>
      ) : <p className="discovery-note">{tHome('newEntries')}</p>}
      {!scoped && recent.length > PAGE_SIZE && (
        <p className="discovery-note">{tHome('andMore')}</p>
      )}
    </motion.section>
  )
}

function ArtistSpotlight({ picks, day, scrollReveal }: SpotlightProps) {
  const tHome = useTranslations('homeCopy')
  return <SpotlightWidget title={tHome('artistSpotlight')} icon={Users} picks={picks} day={day} relationship="key_artist_of" nextLabel={tHome('nextArtist')} scrollReveal={scrollReveal} />
}

function InstrumentSpotlight({ picks, day, scrollReveal }: SpotlightProps) {
  const tHome = useTranslations('homeCopy')
  return <SpotlightWidget title={tHome('instrumentSpotlight')} icon={Guitar} picks={picks} day={day} relationship="featured_in" nextLabel={tHome('nextInstrument')} scrollReveal={scrollReveal} />
}

function ChronologiesSection({ scrollReveal }: { scrollReveal: ScrollReveal }) {
  const tHome = useTranslations('homeCopy')
  const tViews = useTranslations('views')
  const tDestinations = useTranslations('homeCopy.destinations')
  const [timelinePreviewView, setTimelinePreviewView] = useState<(typeof TIMELINE_DESTINATIONS)[number]['view']>('genre')

  return (
    <motion.section {...scrollReveal} id="chronologies" className="discovery-chronologies" aria-labelledby="chronologies-heading">
      <h2 id="chronologies-heading">{tHome('chronologies.title')}</h2>
      <p className="discovery-section-intro">{tHome('chronologies.intro')}</p>
      {featureFlags.chronologyPreviews ? (
        <nav className="discovery-nav" aria-label={tHome('chronologies.title')}>
          <div className="discovery-destination discovery-timelines-card">
            <div className="discovery-timeline-tabs" role="group" aria-label={tHome('chronologies.title')}>
              {TIMELINE_DESTINATIONS.map(({ view, icon: Icon }) => (
                <button
                  key={view}
                  type="button"
                  className="discovery-timeline-tab"
                  aria-pressed={timelinePreviewView === view}
                  data-chronology-view={view}
                  onClick={() => setTimelinePreviewView(view)}
                >
                  <Icon size={17} aria-hidden="true" />
                  {tViews(view)}
                </button>
              ))}
            </div>
            <div className="discovery-timeline-current">
              <ViewLink view={timelinePreviewView} className="discovery-destination-heading">
                <strong>{tViews(timelinePreviewView)}</strong>
                <ArrowUpRight size={16} className="discovery-link-arrow" aria-hidden="true" />
              </ViewLink>
              <small className="discovery-destination-description">{tDestinations(timelinePreviewView)}</small>
              <div className="discovery-chronology-preview">
                <span className="discovery-chronology-preview-label">{tHome('chronologies.preview')}</span>
                <ChronologyPreview view={timelinePreviewView} />
              </div>
            </div>
          </div>
          <div className="discovery-destination">
            <ViewLink view={HISTORY_VIEW} className="discovery-destination-heading">
              <HistoryIcon size={21} className="discovery-destination-icon" aria-hidden="true" />
              <strong>{tViews(HISTORY_VIEW)}</strong>
              <ArrowUpRight size={16} className="discovery-link-arrow" aria-hidden="true" />
            </ViewLink>
            <small className="discovery-destination-description">{tDestinations(HISTORY_VIEW)}</small>
            <div className="discovery-chronology-preview">
              <span className="discovery-chronology-preview-label">{tHome('chronologies.preview')}</span>
              <ChronologyPreview view={HISTORY_VIEW} />
            </div>
          </div>
        </nav>
      ) : (
        <nav className="discovery-nav discovery-nav-basic" aria-label={tHome('chronologies.title')}>
          {DESTINATIONS.map(({ view, icon: Icon }) => (
            <ViewLink key={view} view={view} className="discovery-destination">
              <Icon size={21} className="discovery-destination-icon" aria-hidden="true" />
              <span><strong>{tViews(view)}</strong><small>{tDestinations(view)}</small></span>
              <ArrowUpRight size={16} className="discovery-link-arrow" aria-hidden="true" />
            </ViewLink>
          ))}
        </nav>
      )}
    </motion.section>
  )
}

function CatalogueSection({ ref, scrollReveal, spotlights }: {
  ref: Ref<HTMLElement>
  scrollReveal: ScrollReveal
  spotlights: SpotlightSelections
}) {
  const tHome = useTranslations('homeCopy')
  const historyPicks = useHistoryPicks()
  const hasSpotlights = spotlights.artists.length > 0 || spotlights.instruments.length > 0

  return (
    <section ref={ref} id="discover" className="discovery-widgets" aria-labelledby="discovery-widgets-heading">
      <motion.h2 {...scrollReveal} id="discovery-widgets-heading">{tHome('exploreCatalogue')}</motion.h2>
      <p className="discovery-section-intro">{tHome('catalogueIntro')}</p>

      <div className="discovery-featured">
        <ConnectionWidget scrollReveal={scrollReveal} />
        <ListeningWidget scrollReveal={scrollReveal} />
      </div>

      {(hasSpotlights || historyPicks.length > 0) && (
        <div className="discovery-picks">
          <ArtistSpotlight picks={spotlights.artists} day={spotlights.day} scrollReveal={scrollReveal} />
          <InstrumentSpotlight picks={spotlights.instruments} day={spotlights.day} scrollReveal={scrollReveal} />
          <MomentsWidget events={historyPicks} scrollReveal={scrollReveal} />
        </div>
      )}

      <RecentWidget scrollReveal={scrollReveal} />
    </section>
  )
}

function TopicSection({ id, title, intro, views, scrollReveal, children, ref }: {
  id: 'genres' | 'artists' | 'instruments' | 'history'
  title: string
  intro: string
  views: readonly (typeof DESTINATIONS)[number][]
  scrollReveal: ScrollReveal
  children: ReactNode
  ref?: Ref<HTMLElement>
}) {
  const tTopics = useTranslations('homeCopy.topics.timelines')
  return (
    <section ref={ref} id={id} className="discovery-topic" aria-labelledby={`${id}-heading`}>
      <motion.div {...scrollReveal} className="discovery-topic-header">
        <div>
          <h2 id={`${id}-heading`}>{title}</h2>
          <p className="discovery-section-intro">{intro}</p>
        </div>
        <nav className="discovery-topic-timelines" aria-label={tTopics('label', { topic: title })}>
          {views.map(({ view, icon: Icon }) => (
            <ViewLink key={view} view={view} className="discovery-topic-timeline">
              <Icon size={16} aria-hidden="true" /> {tTopics(view)} <ArrowUpRight size={15} aria-hidden="true" />
            </ViewLink>
          ))}
        </nav>
      </motion.div>
      {children}
    </section>
  )
}

function TopicSections({ ref, soundtrails, soundtrailsRef, scrollReveal, spotlights }: {
  ref: Ref<HTMLElement>
  soundtrails: AvailableSoundtrail[]
  soundtrailsRef: Ref<HTMLElement>
  scrollReveal: ScrollReveal
  spotlights: SpotlightSelections
}) {
  const tTopics = useTranslations('homeCopy.topics')
  const historyPicks = useHistoryPicks()

  return (
    <>
      <TopicSection ref={ref} id="genres" title={tTopics('genres.title')} intro={tTopics('genres.intro')} views={[DESTINATIONS[0]]} scrollReveal={scrollReveal}>
        <div className="discovery-featured">
          <ConnectionWidget scrollReveal={scrollReveal} />
          <ListeningWidget scrollReveal={scrollReveal} />
        </div>
        {soundtrails.length > 0 && <Soundtrails ref={soundtrailsRef} trails={soundtrails} headingLevel={3} />}
      </TopicSection>

      <TopicSection id="artists" title={tTopics('artists.title')} intro={tTopics('artists.intro')} views={[DESTINATIONS[1]]} scrollReveal={scrollReveal}>
        <div className="discovery-topic-body">
          {spotlights.artists.length > 0 && <ArtistSpotlight picks={spotlights.artists} day={spotlights.day} scrollReveal={scrollReveal} />}
          <RecentWidget types={['artist']} headingId="artists-recent-heading" scrollReveal={scrollReveal} />
        </div>
      </TopicSection>

      <TopicSection id="instruments" title={tTopics('instruments.title')} intro={tTopics('instruments.intro')} views={[DESTINATIONS[2]]} scrollReveal={scrollReveal}>
        <div className="discovery-topic-body">
          {spotlights.instruments.length > 0 && <InstrumentSpotlight picks={spotlights.instruments} day={spotlights.day} scrollReveal={scrollReveal} />}
          <RecentWidget types={['instrument']} headingId="instruments-recent-heading" scrollReveal={scrollReveal} />
        </div>
      </TopicSection>

      <TopicSection id="history" title={tTopics('history.title')} intro={tTopics('history.intro')} views={[HISTORY_DESTINATION]} scrollReveal={scrollReveal}>
        <div className="discovery-topic-body">
          <MomentsWidget events={historyPicks} wide scrollReveal={scrollReveal} />
          <RecentWidget types={['event']} headingId="history-recent-heading" scrollReveal={scrollReveal} />
        </div>
      </TopicSection>
    </>
  )
}

export function Home() {
  const { theme, toggleTheme } = useColorTheme()
  const { index } = useExplorer()
  const initialDay = utcDay(useNow().getTime())
  const day = useSyncExternalStore(subscribeToUtcDay, currentUtcDay, () => initialDay)
  const tHome = useTranslations('homeCopy')
  const reduceMotion = useReducedMotion()
  const widgetsRef = useRef<HTMLElement>(null)
  const soundtrailsRef = useRef<HTMLElement>(null)
  const soundtrails = useMemo(() => featureFlags.soundtrails ? availableSoundtrails(index) : [], [index])
  const spotlights = useMemo(() => ({
    day,
    artists: dailySpotlights(index.graph.nodes, 'artist', day),
    instruments: dailySpotlights(index.graph.nodes, 'instrument', day),
  }), [index, day])
  const showSoundtrails = soundtrails.length > 0
  const scrollReveal = reduceMotion ? undefined : reveal

  return (
    <div className="discovery">
      <DiscoveryHeader current="home" />

      <main className="discovery-width discovery-main">
        <Turntable theme={theme} toggleTheme={toggleTheme}>
          <p className="discovery-intro">{tHome('intro')}</p>
          <div className="discovery-actions">
            {showSoundtrails ? (
              <>
                <button
                  type="button"
                  className="discovery-primary"
                  onClick={() => {
                    const section = soundtrailsRef.current
                    section?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth' })
                    section?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
                  }}
                >
                  <Route size={17} aria-hidden="true" /> {tHome('soundtrails.startJourney')} <ArrowDown size={17} aria-hidden="true" />
                </button>
                <ViewLink view="genre" className="discovery-secondary">
                  <ChartGantt size={15} aria-hidden="true" /> {tHome('soundtrails.openFullTimeline')}
                </ViewLink>
              </>
            ) : (
              <>
                <ViewLink view="genre" className="discovery-primary"><ChartGantt size={17} aria-hidden="true" /> {tHome('openTimeline')} <ArrowRight size={17} aria-hidden="true" /></ViewLink>
                <button
                  type="button"
                  className="discovery-secondary"
                  onClick={() => widgetsRef.current?.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth' })}
                >
                  {tHome('discover')} <ArrowDown size={15} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </Turntable>

        {featureFlags.landingV3 ? (
          <TopicSections ref={widgetsRef} soundtrails={soundtrails} soundtrailsRef={soundtrailsRef} scrollReveal={scrollReveal} spotlights={spotlights} />
        ) : (
          <>
            <ChronologiesSection scrollReveal={scrollReveal} />
            {showSoundtrails && <Soundtrails ref={soundtrailsRef} trails={soundtrails} />}
            <CatalogueSection ref={widgetsRef} scrollReveal={scrollReveal} spotlights={spotlights} />
          </>
        )}
      </main>

      <DiscoveryFooter current="home" />
    </div>
  )
}
