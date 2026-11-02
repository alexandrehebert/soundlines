import { BarChart3, Disc3, Guitar, Link2, Users, X, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useExplorer } from '../ExplorerContext.ts'
import { datasetStats, type EmergenceBin, type EntityStats, type RankedNode, type StatsTab } from '../graph/stats.ts'
import {
  EDGE_TYPE_LABELS,
  FAMILY_LABELS,
  NODE_TYPE_LABELS,
  type ArtistKind,
  type Confidence,
  type NodeType,
} from '../graph/types.ts'
import { FAMILY_COLORS, formatPeriod, NODE_TYPE_COLORS } from '../theme.ts'

const STATS_TABS: readonly StatsTab[] = ['overview', 'genre', 'artist', 'instrument', 'links']

const TAB_OPTIONS: Record<StatsTab, { label: string; Icon: LucideIcon }> = {
  overview: { label: 'Overview', Icon: BarChart3 },
  genre: { label: 'Genres', Icon: Disc3 },
  artist: { label: 'Artists', Icon: Users },
  instrument: { label: 'Instruments', Icon: Guitar },
  links: { label: 'Links', Icon: Link2 },
}

const CONFIDENCE_COLORS: Record<Confidence | 'unrated', string> = {
  high: '#4ade80',
  medium: '#facc15',
  low: '#f87171',
  unrated: '#475569',
}

const ARTIST_KIND_LABELS: Record<ArtistKind, string> = {
  person: 'Individuals',
  group: 'Groups',
  collective: 'Collectives',
}

const number = new Intl.NumberFormat('en')
const percent = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : '–')

export function DatasetStats({ initialTab = 'overview', onClose }: { initialTab?: StatsTab; onClose: () => void }) {
  const { index, selectNode } = useExplorer()
  const stats = useMemo(() => datasetStats(index), [index])
  const [tab, setTab] = useState<StatsTab>(initialTab)
  const tabRefs = useRef<Partial<Record<StatsTab, HTMLButtonElement | null>>>({})
  const dialogRef = useRef<HTMLElement>(null)
  const id = useId()

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    tabRefs.current[initialTab]?.focus()
    return () => previous?.focus()
  }, [initialTab])

  const open = (nodeId: string) => {
    onClose()
    selectNode(nodeId)
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const current = STATS_TABS.indexOf(tab)
    const next =
      event.key === 'Home' ? 0
      : event.key === 'End' ? STATS_TABS.length - 1
      : (current + (event.key === 'ArrowLeft' ? -1 : 1) + STATS_TABS.length) % STATS_TABS.length
    setTab(STATS_TABS[next])
    tabRefs.current[STATS_TABS[next]]?.focus()
  }

  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button:not([tabindex="-1"]), a[href]')
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        onKeyDown={trapFocus}
        className="flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/60 md:max-h-[85dvh] md:max-w-3xl md:rounded-2xl"
        initial={{ y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-800 px-5 pb-3 pt-4">
          <div>
            <h2 id={`${id}-title`} className="text-base font-bold text-white">Dataset statistics</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {number.format(stats.totalNodes)} entries and {number.format(stats.totalEdges)} links
              {stats.span && <> spanning {stats.span.start} – {stats.span.end}</>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
            aria-label="Close statistics"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div
          role="tablist"
          aria-label="Statistics sections"
          onKeyDown={handleTabKeyDown}
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800 px-3 py-2"
        >
          {STATS_TABS.map((value) => {
            const selected = tab === value
            const { label, Icon } = TAB_OPTIONS[value]
            return (
              <button
                key={value}
                ref={(element) => {
                  tabRefs.current[value] = element
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${value}`}
                aria-selected={selected}
                aria-controls={`${id}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(value)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 ${
                  selected ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/50' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </div>
        <div
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${tab}`}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
        >
          {tab === 'overview' && <OverviewPanel stats={stats} onOpen={open} />}
          {(tab === 'genre' || tab === 'artist' || tab === 'instrument') && (
            <EntityPanel
              type={tab}
              stats={stats.entities[tab]}
              artistKinds={tab === 'artist' ? stats.artistKinds : undefined}
              onOpen={open}
            />
          )}
          {tab === 'links' && <LinksPanel stats={stats} />}
        </div>
      </motion.section>
    </motion.div>
  )
}

type Stats = ReturnType<typeof datasetStats>

function OverviewPanel({ stats, onOpen }: { stats: Stats; onOpen: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Entries" value={number.format(stats.totalNodes)} />
        <Metric label="Links" value={number.format(stats.totalEdges)} />
        <Metric label="Avg. links / entry" value={stats.averageDegree.toFixed(1)} />
        <Metric label="Sourced entries" value={percent(stats.sourcedNodes, stats.totalNodes)} />
      </div>
      <Section title="Entries by type">
        <BarList
          items={stats.nodeTypes.map(({ type, count }) => ({
            key: type, label: pluralType(type), count, color: NODE_TYPE_COLORS[type],
          }))}
        />
      </Section>
      <Section title="Most connected entries">
        <RankedList items={stats.mostConnected} onOpen={onOpen} showType />
      </Section>
      {stats.isolated > 0 && (
        <p className="text-xs text-slate-500">{stats.isolated} entries have no links yet.</p>
      )}
    </div>
  )
}

function EntityPanel({
  type,
  stats,
  artistKinds,
  onOpen,
}: {
  type: NodeType
  stats: EntityStats
  artistKinds?: Stats['artistKinds']
  onOpen: (id: string) => void
}) {
  const plural = pluralType(type).toLowerCase()
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label={pluralType(type)} value={number.format(stats.total)} />
        <Metric label="Still active" value={number.format(stats.active)} hint={percent(stats.active, stats.total)} />
        <Metric label="Time span" value={stats.span ? `${stats.span.end - stats.span.start} yrs` : '–'} hint={stats.span ? `${stats.span.start} – ${stats.span.end}` : undefined} />
        <Metric label="Avg. links" value={stats.averageDegree.toFixed(1)} />
      </div>
      {stats.emergence.length > 0 && (
        <Section title={`When ${plural} emerged`} subtitle="centuries before 1900, decades after">
          <Histogram bins={stats.emergence} color={NODE_TYPE_COLORS[type]} unit={plural} />
        </Section>
      )}
      {artistKinds && artistKinds.length > 0 && (
        <Section title="Artist kinds">
          <StackedBar
            items={artistKinds.map(({ kind, count }, i) => ({
              key: kind, label: ARTIST_KIND_LABELS[kind], count, color: ['#67e8f9', '#a78bfa', '#f472b6'][i % 3],
            }))}
          />
        </Section>
      )}
      <Section title="By family" subtitle={stats.unassigned ? `${stats.unassigned} without a family lane` : undefined}>
        <BarList
          items={stats.families.map(({ family, count }) => ({
            key: family, label: FAMILY_LABELS[family], count, color: FAMILY_COLORS[family],
          }))}
        />
      </Section>
      <div className="grid gap-6 sm:grid-cols-2">
        <Section title="Most connected">
          <RankedList items={stats.mostConnected} onOpen={onOpen} />
        </Section>
        <div className="space-y-6">
          <Section title="Oldest">
            <PeriodList nodes={stats.oldest} onOpen={onOpen} />
          </Section>
          <Section title="Most recent">
            <PeriodList nodes={stats.newest} onOpen={onOpen} />
          </Section>
        </div>
      </div>
    </div>
  )
}

function LinksPanel({ stats }: { stats: Stats }) {
  const rated = stats.totalEdges - stats.confidence.unrated
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Links" value={number.format(stats.totalEdges)} />
        <Metric label="Relation types" value={String(stats.edgeTypes.length)} />
        <Metric label="Confidence rated" value={percent(rated, stats.totalEdges)} />
        <Metric label="Sourced links" value={percent(stats.sourcedEdges, stats.totalEdges)} />
      </div>
      <Section title="Confidence">
        <StackedBar
          items={(['high', 'medium', 'low', 'unrated'] as const).map((level) => ({
            key: level,
            label: level === 'unrated' ? 'Not rated' : capitalize(level),
            count: stats.confidence[level],
            color: CONFIDENCE_COLORS[level],
          }))}
        />
      </Section>
      <Section title="By relation type">
        <BarList
          items={stats.edgeTypes.map(({ type, count }) => ({
            key: type, label: capitalize(EDGE_TYPE_LABELS[type]), count, color: '#38bdf8',
          }))}
        />
      </Section>
      {stats.sourceDomains.length > 0 && (
        <Section title="Top cited sources" subtitle="across entries and links">
          <BarList
            items={stats.sourceDomains.map(({ domain, count }) => ({
              key: domain, label: domain, count, color: '#94a3b8',
            }))}
          />
        </Section>
      )}
    </div>
  )
}

function capitalize(text: string) {
  return `${text[0].toUpperCase()}${text.slice(1)}`
}

function pluralType(type: NodeType) {
  return `${NODE_TYPE_LABELS[type]}s`
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-baseline gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
        {subtitle && <span className="font-medium normal-case tracking-normal text-slate-600">{subtitle}</span>}
      </h3>
      {children}
    </section>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2.5">
      <div className="text-lg font-bold leading-tight text-white tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] font-medium text-slate-500">
        {label}
        {hint && <span className="text-slate-600"> · {hint}</span>}
      </div>
    </div>
  )
}

interface BarItem {
  key: string
  label: string
  count: number
  color: string
}

function BarList({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((item) => item.count))
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.key} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3 text-xs">
          <span className="truncate text-slate-300" title={item.label}>{item.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-slate-800/70">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color }}
            />
          </span>
          <span className="text-right font-medium tabular-nums text-slate-400">{item.count}</span>
        </li>
      ))}
    </ul>
  )
}

function StackedBar({ items }: { items: BarItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-800/70" role="img" aria-label={items.map((item) => `${item.label}: ${item.count}`).join(', ')}>
        {items.filter((item) => item.count > 0).map((item) => (
          <span key={item.key} style={{ width: `${(item.count / total) * 100}%`, backgroundColor: item.color }} />
        ))}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5 text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
            <span className="font-medium tabular-nums text-slate-300">{item.count}</span>
            <span className="text-slate-600">{percent(item.count, total)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Histogram({ bins, color, unit }: { bins: EmergenceBin[]; color: string; unit: string }) {
  const max = Math.max(1, ...bins.map((bin) => bin.count))
  const labelEvery = Math.ceil(bins.length / 12)
  return (
    <div>
      <div className="flex h-24 items-end gap-px">
        {bins.map((bin) => (
          <div
            key={bin.start}
            className="group relative flex h-full min-w-0 flex-1 items-end"
            title={`${bin.start}s: ${bin.count} ${unit}`}
          >
            <div
              className="w-full rounded-t-sm opacity-80 transition-opacity group-hover:opacity-100"
              style={{ height: `${(bin.count / max) * 100}%`, minHeight: bin.count ? 2 : 0, backgroundColor: color }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-px border-t border-slate-800 pt-1">
        {bins.map((bin, i) => (
          <span key={bin.start} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-[10px] tabular-nums text-slate-600">
            {i % labelEvery === 0 ? bin.label : ''}
          </span>
        ))}
      </div>
    </div>
  )
}

function EntryButton({ id, onOpen, children }: { id: string; onOpen: (id: string) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
    >
      {children}
    </button>
  )
}

function RankedList({ items, onOpen, showType = false }: { items: RankedNode[]; onOpen: (id: string) => void; showType?: boolean }) {
  return (
    <ol className="-mx-2">
      {items.map(({ node, degree }, i) => (
        <li key={node.id}>
          <EntryButton id={node.id} onOpen={onOpen}>
            <span className="w-4 text-right tabular-nums text-slate-600">{i + 1}</span>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: NODE_TYPE_COLORS[node.type] }} />
            <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{node.name}</span>
            {showType && <span className="text-slate-600">{NODE_TYPE_LABELS[node.type]}</span>}
            <span className="tabular-nums text-slate-400">{degree} links</span>
          </EntryButton>
        </li>
      ))}
    </ol>
  )
}

function PeriodList({ nodes, onOpen }: { nodes: EntityStats['oldest']; onOpen: (id: string) => void }) {
  return (
    <ul className="-mx-2">
      {nodes.map((node) => (
        <li key={node.id}>
          <EntryButton id={node.id} onOpen={onOpen}>
            <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{node.name}</span>
            <span className="shrink-0 tabular-nums text-slate-500">{formatPeriod(node.period)}</span>
          </EntryButton>
        </li>
      ))}
    </ul>
  )
}
