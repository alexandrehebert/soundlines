'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { localizePath, type Locale } from '../../i18n/routing.ts'
import { publicAsset } from '../../publicAsset.ts'
import { REPOSITORY_URL } from '../../projectLinks.ts'

const statuses = ['added', 'updated', 'removed'] as const
const categories = ['graph', 'previews', 'loops', 'artwork'] as const
type ChangeStatus = (typeof statuses)[number]
type Category = (typeof categories)[number]
type Entity = { id: string; name: string; status: ChangeStatus }
type EntityGroup = { category: Category; items: Entity[] }
type Entry = {
  commit: string
  date: string
  subject: string
  merge: boolean
  entities: EntityGroup[]
}

function categoryFromValue(value: string): Category | '' {
  return categories.find((category) => category === value) ?? ''
}

type PackedSummary = {
  names: { id: string; name: string }[]
  entries: {
    commit: string
    date: string
    subject: string
    merge: boolean
    entities: { category: Category; items: number[] }[]
  }[]
}

function decodeSummary(value: unknown): Entry[] {
  if (!value || typeof value !== 'object') throw new Error('Invalid data changelog')
  const summary = value as PackedSummary
  if (!Array.isArray(summary.names) || !Array.isArray(summary.entries)) throw new Error('Invalid data changelog')
  return summary.entries.map((entry) => ({
    ...entry,
    entities: entry.entities.map(({ category, items }) => ({
      category,
      items: items.map((packed) => {
        const name = summary.names[Math.floor(packed / statuses.length)]
        const status = statuses[packed % statuses.length]
        if (!name || !status) throw new Error('Invalid data changelog entity')
        return { ...name, status }
      }),
    })),
  }))
}

export function OpenDataChangelog({ locale }: { locale: Locale }) {
  const t = useTranslations('openData.changelog')
  const [entries, setEntries] = useState<Entry[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()
    fetch(publicAsset('/open-data-changelog.json'), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Changelog request failed: ${response.status}`)
        return decodeSummary(await response.json())
      })
      .then(setEntries)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        console.error('Unable to load the Open Data changelog', error)
        setFailed(true)
      })
    return () => controller.abort()
  }, [])

  const matching = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale)
    return (entries ?? []).filter((entry) => {
      const groups = category ? entry.entities.filter((group) => group.category === category) : entry.entities
      if (category && groups.length === 0) return false
      const names = groups.flatMap(({ items }) => items.map(({ id, name }) => `${id} ${name}`)).join(' ')
      return !needle || `${entry.subject} ${entry.commit} ${names}`.toLocaleLowerCase(locale).includes(needle)
    })
  }, [category, entries, locale, query])
  const pages = Math.max(1, Math.ceil(matching.length / 10))
  const currentPage = Math.min(page, pages)
  const visible = matching.slice((currentPage - 1) * 10, currentPage * 10)
  const format = new Intl.NumberFormat(locale)

  return (
    <section aria-labelledby="open-data-changelog">
      <header className="mb-8">
        <h2 id="open-data-changelog" className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-slate-400">{t('description')}</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cyan-300">
          <a className="underline underline-offset-4" href={`${REPOSITORY_URL}/blob/main/public/open-data-changelog.json`} target="_blank" rel="noopener noreferrer">
            {t('source')} ↗
          </a>
          <a className="underline underline-offset-4" href={`${REPOSITORY_URL}/blob/main/docs/changelog/changelog.json`} target="_blank" rel="noopener noreferrer">
            {t('fullHistory')} ↗
          </a>
        </div>
      </header>
      <div className="mb-5 grid gap-3 sm:grid-cols-[2fr_1fr]">
        <label className="text-sm font-semibold text-slate-300">
          {t('search')}
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }}
            className="mt-2 block min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 font-normal text-white" />
        </label>
        <label className="text-sm font-semibold text-slate-300">
          {t('category')}
          <select value={category} onChange={(event) => { setCategory(categoryFromValue(event.target.value)); setPage(1) }}
            className="mt-2 block min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 p-3 font-normal text-white">
            <option value="">{t('all')}</option>
            {categories.map((value) => <option key={value} value={value}>{t(`categories.${value}`)}</option>)}
          </select>
        </label>
      </div>
      {entries === null
        ? <p role="status" className="text-sm text-slate-400">{failed ? t('loadError') : t('loading')}</p>
        : visible.length === 0
        ? <p role="status" className="text-sm text-slate-400">{t('empty')}</p>
        : (
          <ol className="space-y-4">
            {visible.map((entry) => {
              const groups = category ? entry.entities.filter((group) => group.category === category) : entry.entities
              return (
                <li key={entry.commit} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <time dateTime={entry.date}>{entry.date.slice(0, 10)}</time>
                    {entry.merge && <span>{t('merge')}</span>}
                  </div>
                  <h3 className="my-2 text-base font-semibold text-slate-100">
                    {groups.map(({ category: key }) => t(`categories.${key}`)).join(' · ')}
                  </h3>
                  {groups.map(({ category: key, items }) => (
                    <section key={key} className="mt-3" aria-label={`${t(`categories.${key}`)} (${format.format(items.length)})`}>
                      {(() => {
                        const renderItems = (visibleItems: Entity[]) => visibleItems.map(({ id, name, status }) => (
                          <li key={id}>
                            <a href={`${localizePath('/', locale)}?${new URLSearchParams({ focus: id })}`}
                              className={`inline-flex min-h-8 items-center rounded-md border px-2 py-1 hover:border-cyan-400 ${
                                status === 'added' ? 'border-emerald-500/40 text-emerald-300'
                                : status === 'removed' ? 'border-rose-500/40 text-rose-300 line-through'
                                : 'border-amber-500/40 text-amber-200'
                              }`}>
                              <span aria-hidden="true" className="mr-1">{status === 'added' ? '+' : status === 'removed' ? '−' : '~'}</span>
                              {name}
                              <span className="sr-only"> ({t(status)})</span>
                            </a>
                          </li>
                        ))
                        return (
                          <>
                            <ul lang="en" className="flex flex-wrap gap-2 text-sm">{renderItems(items.slice(0, 8))}</ul>
                            {items.length > 8 && (
                              <details className="mt-3 text-sm text-slate-400">
                                <summary className="cursor-pointer font-semibold">{t('moreEntities')} ({format.format(items.length - 8)})</summary>
                                <ul lang="en" className="mt-2 flex flex-wrap gap-2">{renderItems(items.slice(8))}</ul>
                              </details>
                            )}
                          </>
                        )
                      })()}
                    </section>
                  ))}
                  <details className="mt-4 text-sm text-slate-400">
                    <summary className="cursor-pointer font-semibold">{t('commit')}</summary>
                    <p lang="en" className="my-2">{entry.subject}</p>
                    <a className="text-cyan-300 underline underline-offset-4"
                      href={`${REPOSITORY_URL}/commit/${entry.commit}`} target="_blank" rel="noopener noreferrer">
                      {entry.commit.slice(0, 8)} ↗
                    </a>
                  </details>
                </li>
              )
            })}
          </ol>
        )}
      {entries && pages > 1 && (
        <nav aria-label={t('pagination')} className="mt-6 flex items-center justify-between gap-4">
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}
            className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm font-semibold disabled:opacity-40">{t('previous')}</button>
          <span aria-live="polite" className="text-sm text-slate-400">{t('page', { page: currentPage, pages })}</span>
          <button type="button" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}
            className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm font-semibold disabled:opacity-40">{t('next')}</button>
        </nav>
      )}
    </section>
  )
}
