'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowUpRight } from 'lucide-react'
import { useExplorer } from '../../ExplorerContext.ts'
import { datasetStats } from '../../graph/stats.ts'
import { graphLabels } from '../../i18n/graphLabels.ts'
import { LOCALES, localizePath } from '../../i18n/routing.ts'
import { openDataPath } from '../../openData.ts'
import { REPOSITORY_URL } from '../../projectLinks.ts'
import { NODE_TYPE_COLORS } from '../../theme.ts'
import { BarList, Metric, Section, StackedBar } from '../dataset/DatasetStatsCharts.tsx'

const confidenceColors = { high: '#4ade80', medium: '#facc15', low: '#f87171', unrated: '#475569' } as const
const percent = (part: number, total: number) => total ? `${Math.round((part / total) * 100)}%` : '–'
const cardClass = 'rounded-2xl border border-slate-800 bg-slate-900/30 p-5 sm:p-6'

export function OpenDataDataset() {
  const { index, locale } = useExplorer()
  const t = useTranslations('openData.dataset')
  const tStats = useTranslations('stats')
  const tTypes = useTranslations('stats.typeLabels')
  const tConfidence = useTranslations('stats.confidenceLabels')
  const stats = useMemo(() => datasetStats(index), [index])
  const labels = graphLabels(locale)
  const format = new Intl.NumberFormat(locale)
  const languageNames = new Intl.DisplayNames(locale, { type: 'language' })
  const nodeItems = stats.nodeTypes.map(({ type, count }) => ({
    key: type, label: tTypes(type), count, color: NODE_TYPE_COLORS[type],
  }))

  return (
    <section aria-labelledby="dataset-title" className="space-y-8 pb-8">
      <header>
        <h2 id="dataset-title" className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">{t('description')}</p>
        <Link href={localizePath(openDataPath('graph'), locale)}
          className="mt-3 inline-block text-sm text-cyan-300 underline underline-offset-4">
          {t('graphModelLink')}
        </Link>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label={tStats('entries')} value={format.format(stats.totalNodes)} />
        <Metric label={tStats('links')} value={format.format(stats.totalEdges)} />
        <Metric label={tStats('averageLinksPerEntry')} value={format.format(Number(stats.averageDegree.toFixed(1)))} />
        <Metric label={tStats('sourcedEntries')} value={percent(stats.sourcedNodes, stats.totalNodes)} />
      </div>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className={cardClass}>
            <Section title={tStats('entriesByType')}>
              <StackedBar items={nodeItems} />
              <div className="mt-6"><BarList items={nodeItems} /></div>
            </Section>
          </div>
          {stats.sourceDomains.length > 0 && (
            <div className={cardClass}>
              <Section title={tStats('topCitedSources')} subtitle={tStats('acrossEntriesAndLinks')}>
                <BarList items={stats.sourceDomains.map(({ domain, count }) => ({
                  key: domain, label: domain, count, color: '#94a3b8',
                }))} />
              </Section>
            </div>
          )}
        </div>
        <div className={cardClass}>
          <Section title={tStats('byRelationType')}>
            <p className="mb-5 text-sm text-slate-500">{format.format(stats.edgeTypes.length)} {tStats('relationTypes').toLocaleLowerCase(locale)}</p>
            <BarList items={stats.edgeTypes.map(({ type, count }) => ({
              key: type, label: labels.edges[type], count, color: '#38bdf8',
            }))} />
          </Section>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cardClass}>
          <h3 className="font-semibold">{t('sourceQuality')}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{t('sourceQualityText')}</p>
          <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_2fr] lg:grid-cols-1 xl:grid-cols-[1fr_2fr]">
            <Metric label={tStats('sourcedLinks')} value={percent(stats.sourcedEdges, stats.totalEdges)}
              hint={`${format.format(stats.sourcedEdges)} / ${format.format(stats.totalEdges)}`} />
            <Section title={tStats('confidence')}>
              <StackedBar items={(Object.keys(confidenceColors) as (keyof typeof confidenceColors)[]).map((confidence) => ({
                key: confidence, label: tConfidence(confidence), count: stats.confidence[confidence], color: confidenceColors[confidence],
              }))} />
            </Section>
          </div>
        </div>
        <section aria-labelledby="data-github-title" className={cardClass}>
          <h3 id="data-github-title" className="font-semibold">{t('github')}</h3>
          <a href={`${REPOSITORY_URL}/blob/main/src/data/graph.json`} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 font-semibold text-cyan-200 underline underline-offset-4 hover:text-cyan-100">
            {t('graphLink')}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <ul aria-label={t('translations')} className="mt-2 flex flex-wrap gap-1.5">
            {LOCALES.filter((target) => target !== 'en').map((target) => (
              <li key={target}>
                <a href={`${REPOSITORY_URL}/blob/main/src/data/graph.${target}.json`} target="_blank" rel="noopener noreferrer"
                  aria-label={languageNames.of(target)} title={languageNames.of(target)}
                  className="inline-flex min-h-6 min-w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-950/50 px-1.5 text-xs font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
                  {target.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
          <a className="mt-4 inline-block text-sm text-cyan-300 underline underline-offset-4"
            href={`${REPOSITORY_URL}/blob/main/docs/GRAPH.md`} target="_blank" rel="noopener noreferrer">
            {t('guide')} ↗
          </a>
        </section>
      </div>
      <section className={cardClass}>
        <h3 className="font-semibold">{t('license')}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{t('licenseText')}</p>
        <a className="mt-3 inline-block text-sm text-cyan-300 underline underline-offset-4"
          href={`${REPOSITORY_URL}/blob/main/README.md#license`} target="_blank" rel="noopener noreferrer">
          {t('notice')} ↗
        </a>
      </section>
    </section>
  )
}
