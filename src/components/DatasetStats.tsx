import { ArrowUpRight, BarChart3, BookCheck, Check, Disc3, Guitar, Link2, Users, X, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import reviewStatus from '../data/review-status.json'
import { useExplorer } from '../ExplorerContext.ts'
import {
  datasetStats,
  reviewStats,
  type EmergenceBin,
  type EntityStats,
  type RankedNode,
  type ReviewStats,
  type StatsTab,
} from '../graph/stats.ts'
import type { Confidence, NodeType } from '../graph/types.ts'
import { chartColor, FAMILY_COLORS, formatPeriod, NODE_TYPE_COLORS } from '../theme.ts'
import { graphLabels } from '../i18n/graphLabels.ts'
import { localizePath, type Locale } from '../i18n/routing.ts'
import { companionUrl, REPOSITORY_URL } from '../projectLinks.ts'
import { BarList, Metric, Section, StackedBar } from './DatasetStatsCharts.tsx'

const STATS_TABS: readonly StatsTab[] = ['overview', 'genre', 'artist', 'instrument', 'links', 'review']

const TAB_OPTIONS: Record<StatsTab, LucideIcon> = {
  overview: BarChart3,
  genre: Disc3,
  artist: Users,
  instrument: Guitar,
  links: Link2,
  review: BookCheck,
}

const CONFIDENCE_COLORS: Record<Confidence | 'unrated', string> = {
  high: '#4ade80',
  medium: '#facc15',
  low: '#f87171',
  unrated: '#475569',
}

const percent = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : '–')
const formatNumber = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale).format(value)

export function DatasetStats({
  initialTab = 'overview',
  onClose,
  review = reviewStatus,
}: {
  initialTab?: StatsTab
  onClose: () => void
  /** Ids reviewed against serious sources; defaults to the generated review-status.json. */
  review?: { reviewed: readonly string[]; lastReviewed?: string | null }
}) {
  const { index, locale, selectNode } = useExplorer()
  const t = useTranslations('stats')
  const tTabs = useTranslations('stats.tabs')
  const tOpenData = useTranslations('openData')
  const stats = useMemo(() => datasetStats(index), [index])
  const sourceReview = useMemo(() => reviewStats(index, review), [index, review])
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
            <h2 id={`${id}-title`} className="text-base font-bold text-white">{t('title')}</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {t('summary', {
                entries: formatNumber(stats.totalNodes, locale),
                links: formatNumber(stats.totalEdges, locale),
                span: stats.span ? t('summarySpan', stats.span) : '',
              })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a href={localizePath('/data', locale)}
              className="rounded-full border border-slate-700 px-3 py-2 text-xs font-semibold text-cyan-200 hover:border-cyan-400"
            >
              {tOpenData('title')}
            </a>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
              aria-label={t('close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div
          role="tablist"
          aria-label={t('sections')}
          onKeyDown={handleTabKeyDown}
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800 px-3 py-2"
        >
          {STATS_TABS.map((value) => {
            const selected = tab === value
            const Icon = TAB_OPTIONS[value]
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
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70${value === 'review' ? ' ml-auto' : ''} ${
                  selected ? 'bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-500/50' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {tTabs(value)}
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
          {tab === 'overview' && <OverviewPanel stats={stats} onOpen={open} locale={locale} />}
          {(tab === 'genre' || tab === 'artist' || tab === 'instrument') && (
            <EntityPanel
              type={tab}
              stats={stats.entities[tab]}
              artistKinds={tab === 'artist' ? stats.artistKinds : undefined}
              onOpen={open}
              locale={locale}
            />
          )}
          {tab === 'links' && <LinksPanel stats={stats} locale={locale} />}
          {tab === 'review' && <ReviewPanel stats={sourceReview} isolated={stats.isolated} locale={locale} />}
        </div>
      </motion.section>
    </motion.div>
  )
}

type Stats = ReturnType<typeof datasetStats>

function OverviewPanel({ stats, onOpen, locale }: { stats: Stats; onOpen: (id: string) => void; locale: Locale }) {
  const t = useTranslations('stats')
  const tTypeLabels = useTranslations('stats.typeLabels')
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label={t('entries')} value={formatNumber(stats.totalNodes, locale)} />
        <Metric label={t('links')} value={formatNumber(stats.totalEdges, locale)} />
        <Metric label={t('averageLinksPerEntry')} value={stats.averageDegree.toFixed(1)} />
        <Metric label={t('sourcedEntries')} value={percent(stats.sourcedNodes, stats.totalNodes)} />
      </div>
      <Section title={t('entriesByType')}>
        <BarList
          items={stats.nodeTypes.map(({ type, count }) => ({
            key: type, label: tTypeLabels(type), count, color: NODE_TYPE_COLORS[type],
          }))}
        />
      </Section>
      <Section title={t('mostConnectedEntries')}>
        <RankedList items={stats.mostConnected} onOpen={onOpen} showType locale={locale} />
      </Section>
    </div>
  )
}

function EntityPanel({
  type,
  stats,
  artistKinds,
  onOpen,
  locale,
}: {
  type: NodeType
  stats: EntityStats
  artistKinds?: Stats['artistKinds']
  onOpen: (id: string) => void
  locale: Locale
}) {
  const t = useTranslations('stats')
  const tTypeLabels = useTranslations('stats.typeLabels')
  const tArtistKindLabels = useTranslations('stats.artistKindLabels')
  const labels = graphLabels(locale)
  const plural = tTypeLabels(type).toLowerCase()
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label={tTypeLabels(type)} value={formatNumber(stats.total, locale)} />
        <Metric label={t('stillActive')} value={formatNumber(stats.active, locale)} hint={percent(stats.active, stats.total)} />
        <Metric label={t('timeSpan')} value={stats.span ? t('years', { count: stats.span.end - stats.span.start }) : '–'} hint={stats.span ? `${stats.span.start} – ${stats.span.end}` : undefined} />
        <Metric label={t('averageLinks')} value={stats.averageDegree.toFixed(1)} />
      </div>
      {stats.emergence.length > 0 && (
        <Section title={t('whenEmerged', { plural })} subtitle={t('emergenceSubtitle')}>
          <Histogram bins={stats.emergence} color={NODE_TYPE_COLORS[type]} unit={plural} />
        </Section>
      )}
      {artistKinds && artistKinds.length > 0 && (
        <Section title={t('artistKinds')}>
          <StackedBar
            items={artistKinds.map(({ kind, count }, i) => ({
              key: kind, label: tArtistKindLabels(kind), count, color: ['#67e8f9', '#a78bfa', '#f472b6'][i % 3],
            }))}
          />
        </Section>
      )}
      <Section title={t('byFamily')} subtitle={stats.unassigned ? t('withoutFamily', { count: stats.unassigned }) : undefined}>
        <BarList
          items={stats.families.map(({ family, count }) => ({
            key: family, label: labels.families[family], count, color: FAMILY_COLORS[family],
          }))}
        />
      </Section>
      <div className="grid gap-6 sm:grid-cols-2">
        <Section title={t('mostConnected')}>
          <RankedList items={stats.mostConnected} onOpen={onOpen} locale={locale} />
        </Section>
        <div className="space-y-6">
          <Section title={t('oldest')}>
            <PeriodList nodes={stats.oldest} onOpen={onOpen} locale={locale} />
          </Section>
          <Section title={t('mostRecent')}>
            <PeriodList nodes={stats.newest} onOpen={onOpen} locale={locale} />
          </Section>
        </div>
      </div>
    </div>
  )
}

function LinksPanel({ stats, locale }: { stats: Stats; locale: Locale }) {
  const t = useTranslations('stats')
  const labels = graphLabels(locale)
  const rated = stats.totalEdges - stats.confidence.unrated
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label={t('links')} value={formatNumber(stats.totalEdges, locale)} />
        <Metric label={t('relationTypes')} value={String(stats.edgeTypes.length)} />
        <Metric label={t('confidenceRated')} value={percent(rated, stats.totalEdges)} />
        <Metric label={t('sourcedLinks')} value={percent(stats.sourcedEdges, stats.totalEdges)} />
      </div>
      <Section title={t('byRelationType')}>
        <BarList
          items={stats.edgeTypes.map(({ type, count }) => ({
            key: type, label: capitalize(labels.edges[type]), count, color: '#38bdf8',
          }))}
        />
      </Section>
      {stats.sourceDomains.length > 0 && (
        <Section title={t('topCitedSources')} subtitle={t('acrossEntriesAndLinks')}>
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

function ReviewPanel({ stats, isolated, locale }: { stats: ReviewStats; isolated: number; locale: Locale }) {
  const t = useTranslations('stats')
  const tProject = useTranslations('projectLinks')
  const tConfidenceLabels = useTranslations('stats.confidenceLabels')
  const tTypeLabels = useTranslations('stats.typeLabels')
  const tLinkGroupLabels = useTranslations('stats.linkGroupLabels')
  const nodeTotal = stats.nodeTypes.reduce((sum, item) => sum + item.total, 0)
  const edgeTotal = stats.total - nodeTotal
  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed text-slate-400">
        {t('reviewDescription')}
        {stats.lastReviewed && <span className="text-slate-600">{t('lastReview', { date: stats.lastReviewed })}</span>}
      </p>
      <div className="-mt-3 flex flex-wrap gap-2">
        <ProjectLink href={companionUrl(locale, 'graph/')}>{t('reviewMethod')}</ProjectLink>
        <ProjectLink href={REPOSITORY_URL}>{tProject('repository')}</ProjectLink>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          label={t('reviewedOverall')}
          value={percent(stats.reviewed, stats.total)}
          hint={`${formatNumber(stats.reviewed, locale)} / ${formatNumber(stats.total, locale)}`}
        >
          {stats.total > 0 && stats.reviewed === stats.total ? (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-green-400">
              <Check aria-hidden="true" className="shrink-0" size={12} />
              {t('reviewFinished')}
            </div>
          ) : (
            <div className="mt-1 text-[10px] font-semibold text-slate-500">
              {t('inProgress')}
            </div>
          )}
        </Metric>
        <Metric label={t('entriesReviewed')} value={formatNumber(stats.reviewedNodes, locale)} hint={percent(stats.reviewedNodes, nodeTotal)} />
        <Metric label={t('linksReviewed')} value={formatNumber(stats.reviewedEdges, locale)} hint={percent(stats.reviewedEdges, edgeTotal)} />
        <Metric
          label={t('sourcesPerReviewedItem')}
          value={stats.averageSources.reviewed.toFixed(1)}
          hint={`${stats.averageSources.pending.toFixed(1)} ${t('pending')}`}
        />
      </div>
      {stats.reviewedEdges > 0 && (
        <Section title={t('confidenceAfterReview')} subtitle={t('reviewedLinksOnly')}>
          <StackedBar
            items={(['high', 'medium', 'low', 'unrated'] as const).map((level) => ({
              key: level,
              label: tConfidenceLabels(level),
              count: stats.confidence[level],
              color: CONFIDENCE_COLORS[level],
            }))}
          />
        </Section>
      )}
      <Section title={t('entriesByType')}>
        <ReviewLedger
          items={stats.nodeTypes.map((item) => ({
            ...item,
            label: tTypeLabels(item.key),
            color: NODE_TYPE_COLORS[item.key],
          }))}
          locale={locale}
        />
        {isolated > 0 && (
          <p className="mt-2 text-xs text-slate-500">{t('noLinksYet', { count: isolated })}</p>
        )}
      </Section>
      <Section title={t('linksByKind')}>
        <ReviewLedger
          items={stats.linkGroups.map((item) => ({ ...item, label: tLinkGroupLabels(item.key), color: '#38bdf8' }))}
          locale={locale}
        />
      </Section>
    </div>
  )
}

function ProjectLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-500 hover:bg-slate-800/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
    >
      {children}
      <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
    </a>
  )
}

function ReviewLedger({
  items,
  locale,
}: {
  items: { key: string; reviewed: number; total: number; label: string; color: string }[]
  locale: Locale
}) {
  const t = useTranslations('stats')
  return (
    <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40 px-3">
      {items.map((item) => (
        <li key={item.key} className="flex min-h-9 items-center justify-between gap-3 py-2 text-xs">
          <span className="flex min-w-0 items-center gap-2 text-slate-300" title={item.label}>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chartColor(item.color) }} aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="tabular-nums text-slate-400">
              <span className="font-medium text-slate-200">{formatNumber(item.reviewed, locale)}</span>
              <span className="text-slate-600"> / {formatNumber(item.total, locale)}</span>
            </span>
            {item.reviewed === item.total ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-green-400">
                <Check aria-hidden="true" size={12} />
                {t('complete')}
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">
                {t('pendingItems', { count: item.total - item.reviewed })}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  )
}

function capitalize(text: string) {
  return `${text[0].toUpperCase()}${text.slice(1)}`
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
              style={{ height: `${(bin.count / max) * 100}%`, minHeight: bin.count ? 2 : 0, backgroundColor: chartColor(color) }}
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

function RankedList({ items, onOpen, showType = false, locale }: {
  items: RankedNode[]
  onOpen: (id: string) => void
  showType?: boolean
  locale: Locale
}) {
  const t = useTranslations('stats')
  const labels = graphLabels(locale)
  return (
    <ol className="-mx-2">
      {items.map(({ node, degree }, i) => (
        <li key={node.id}>
          <EntryButton id={node.id} onOpen={onOpen}>
            <span className="w-4 text-right tabular-nums text-slate-600">{i + 1}</span>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chartColor(NODE_TYPE_COLORS[node.type]) }} />
            <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{node.name}</span>
            {showType && <span className="text-slate-600">{labels.nodeTypes[node.type]}</span>}
            <span className="tabular-nums text-slate-400">{t('linksCount', { count: degree })}</span>
          </EntryButton>
        </li>
      ))}
    </ol>
  )
}

function PeriodList({ nodes, onOpen, locale }: {
  nodes: EntityStats['oldest']
  onOpen: (id: string) => void
  locale: Locale
}) {
  return (
    <ul className="-mx-2">
      {nodes.map((node) => (
        <li key={node.id}>
          <EntryButton id={node.id} onOpen={onOpen}>
            <span className="min-w-0 flex-1 truncate font-medium text-slate-200">{node.name}</span>
            <span className="shrink-0 tabular-nums text-slate-500">{formatPeriod(node.period, locale)}</span>
          </EntryButton>
        </li>
      ))}
    </ul>
  )
}
