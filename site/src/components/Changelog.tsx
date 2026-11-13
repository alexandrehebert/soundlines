import { useState } from 'react'
import historyUrl from '../../../docs/changelog.json?url'
import type { Locale } from '../content.ts'
import { repository } from '../content.ts'
import { changelogCopy } from '../copy/changelog.ts'
import { entitiesFor, paginateChanges, pageSize, statuses, type ChangeStatus } from '../changelog.ts'
import { routePath } from '../routes.ts'

const statusStyle: Record<ChangeStatus, { symbol: string; chip: string; mark: string }> = {
  added: { symbol: '+', chip: 'border-added/50 bg-added/10', mark: 'text-added' },
  updated: { symbol: '~', chip: 'border-updated/50 bg-updated/10', mark: 'text-updated' },
  removed: { symbol: '−', chip: 'border-removed/50 bg-removed/10 line-through decoration-removed/60', mark: 'text-removed' },
}

function EntityChip({ name, status, label, locale }: { name: string; status: ChangeStatus; label: string; locale: Locale }) {
  const style = statusStyle[status]
  return (
    <li data-status={status} title={label} className={`rounded-md border px-2 py-1 text-fg ${style.chip}`}>
      <span aria-hidden="true" className={`mr-1 inline-block font-bold ${style.mark}`}>{style.symbol}</span>
      {name}
      <span lang={locale} className="sr-only"> ({label})</span>
    </li>
  )
}

export function Changelog({ locale, initialPage = 1 }: { locale: Locale; initialPage?: number }) {
  const c = changelogCopy[locale]
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('assets')
  const [requestedPage, setPage] = useState(initialPage)
  const { items, page, pages, total } = paginateChanges(query, category, requestedPage)
  const format = new Intl.NumberFormat(locale)
  const staticPages = category === 'assets' && !query.trim()
  const pageLabel = (number: number) => `${c.page} ${format.format(number)}`
  return (
    <section aria-label={c.label} className="max-w-212 pb-8">
      <p className="leading-relaxed text-muted">{c.focus}</p>
      <div className="my-6 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <label className="text-sm font-semibold">
          {c.search}
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }}
            className="mt-2 block w-full rounded-lg border border-line bg-surface p-3 font-normal" />
        </label>
        <label className="text-sm font-semibold">
          {c.category}
          <select aria-label={c.category} value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}
            className="mt-2 block w-full rounded-lg border border-line bg-surface p-3 font-normal">
            <option value="assets">{c.assets}</option>
            <option value="">{c.all}</option>
            {Object.entries(c.categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
      </div>
      <p role="status" className="mb-4 text-sm text-muted">
        {total ? `${format.format((page - 1) * pageSize + 1)}–${format.format(Math.min(page * pageSize, total))} / ${format.format(total)}` : c.empty}
      </p>
      <ul aria-hidden="true" className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {statuses.map((status) => (
          <li key={status}><span className={`mr-1 font-bold ${statusStyle[status].mark}`}>{statusStyle[status].symbol}</span>{c.statuses[status]}</li>
        ))}
      </ul>
      <ol data-changelog="" className="space-y-4">
        {items.map((entry) => {
          const entities = entitiesFor(entry, category)
          return (
            <li key={entry.commit} id={`commit-${entry.commit}`} className="rounded-xl border border-line bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <time dateTime={entry.date}>{entry.date.slice(0, 10)}</time>
                {entry.merge && <span>{c.merge}</span>}
              </div>
              <h2 className="my-3 text-lg leading-snug font-semibold">
                {entities.length ? entities.map(({ category }) => c.categories[category]).join(' · ') : <span lang="en">{entry.subject}</span>}
              </h2>
              {entities.map((group) => (
                <section key={group.category} className="my-4" aria-label={`${c.categories[group.category]} — ${c.affected}`}>
                  <h3 className="text-sm font-semibold">
                    {entities.length > 1 ? `${c.categories[group.category]} · ` : ''}{c.affected} ({format.format(group.items.length)})
                  </h3>
                  <ul lang="en" className="mt-2 flex flex-wrap gap-2 text-sm text-muted">
                    {group.items.slice(0, 8).map(({ id, name, status }) => <EntityChip key={id} name={name} status={status} label={c.statuses[status]} locale={locale} />)}
                  </ul>
                  {group.items.length > 8 && (
                    <details className="mt-3 text-sm text-muted">
                      <summary className="cursor-pointer font-semibold">{c.moreEntities} ({format.format(group.items.length - 8)})</summary>
                      <ul lang="en" className="mt-2 flex flex-wrap gap-2">
                        {group.items.slice(8).map(({ id, name, status }) => <EntityChip key={id} name={name} status={status} label={c.statuses[status]} locale={locale} />)}
                      </ul>
                    </details>
                  )}
                </section>
              ))}
              <details className="mt-4 text-sm text-muted">
                <summary className="cursor-pointer font-semibold">{c.technical}</summary>
                <p lang="en" className="my-3">{entry.subject}</p>
                <p><code>{entry.commit.slice(0, 8)}</code> · {c.files}: {format.format(entry.groups.reduce((sum, group) => sum + group.count, 0))}</p>
                {entry.graph && (
                  <div className="mt-3">
                    <p className="text-xs">{c.changes}</p>
                    {Object.entries(entry.graph).map(([kind, change]) => (
                      <p key={kind}>
                        {kind === 'nodes' ? c.nodes : c.edges}: <span className="text-added">+{format.format(change.added)}</span>
                        {' / '}<span className="text-updated">~{format.format(change.updated)}</span>
                        {' / '}<span className="text-removed">−{format.format(change.removed)}</span>
                      </p>
                    ))}
                  </div>
                )}
                <a href={`${repository}/commit/${entry.commit}`} className="mt-3 inline-block underline underline-offset-4">{c.commit} ↗</a>
              </details>
            </li>
          )
        })}
      </ol>
      {pages > 1 && (
        <nav aria-label={c.pagination} className="my-8 flex flex-wrap gap-2">
          {Array.from({ length: pages }, (_, index) => {
            const number = index + 1
            const className = `grid min-h-11 min-w-11 place-items-center rounded-lg border px-3 text-sm ${number === page ? 'border-accent bg-accent text-bg' : 'border-line hover:bg-surface'}`
            return staticPages ? (
              <a key={number} href={`${import.meta.env.BASE_URL}${routePath({ locale, slug: 'changelog', page: number })}`}
                aria-label={pageLabel(number)} aria-current={number === page ? 'page' : undefined} className={className}>{format.format(number)}</a>
            ) : (
              <button key={number} type="button" onClick={() => setPage(number)}
                aria-label={pageLabel(number)} aria-current={number === page ? 'page' : undefined} className={className}>{format.format(number)}</button>
            )
          })}
        </nav>
      )}
      <details className="mt-8 border-t border-line pt-5 text-sm text-muted">
        <summary className="cursor-pointer font-semibold">{c.about}</summary>
        <p className="mt-3 leading-relaxed">{c.scope}</p>
        <a href={historyUrl} download="soundlines-changelog.json" className="mt-3 inline-block underline underline-offset-4">{c.download}</a>
      </details>
    </section>
  )
}
