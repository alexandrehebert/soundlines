import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { changeStatuses } from '../../scripts/changelog/generate.ts'
import { APP_URL } from '../../src/projectLinks.ts'
import { changelogSummary } from '../scripts/changelog.ts'
import { App, Head } from './components/App.tsx'
import { Changelog } from './components/Changelog.tsx'
import { assetPageCount, entitiesFor, entries, filterChanges, paginateChanges, pageSize, statuses } from './changelog.ts'
import { copy, locales, repository } from './content.ts'
import { changelogCopy } from './copy/changelog.ts'
import { matchRoute, routePath, routes } from './routes.ts'

describe('public changelog', () => {
  it('ships a deduplicated entity dictionary, preserving every commit without full file lists', () => {
    const full = JSON.parse(readFileSync(new URL('../../docs/changelog.json', import.meta.url), 'utf8')) as {
      entries: { commit: string }[]
    }
    const summary = changelogSummary()
    expect(summary.entries.map(({ commit }) => commit)).toEqual(full.entries.map(({ commit }) => commit))
    expect(JSON.stringify(summary)).not.toContain('"files"')
    expect(summary.names.length).toBeLessThan(entries.flatMap(({ entities }) => entities.flatMap(({ items }) => items)).length)
    expect(JSON.stringify(summary).length).toBeLessThan(250_000)
    expect(summary).toEqual(__CHANGELOG__)
  })

  it('defaults to actual asset changes, while keeping all repository commits available', () => {
    const assets = filterChanges('')
    expect(assets.length).toBeGreaterThan(0)
    expect(assets.length).toBeLessThan(entries.length)
    expect(assets.every(({ entities }) => entities.length > 0)).toBe(true)
    expect(filterChanges(' ', '')).toEqual(entries)
    for (const category of ['graph', 'previews', 'loops', 'artwork']) {
      const filtered = filterChanges('', category)
      expect(filtered.length).toBeGreaterThan(0)
      expect(filtered.every(({ entities }) => entities.some((group) => group.category === category))).toBe(true)
    }
  })

  it('searches human-readable names, IDs, messages and hashes across the full filtered history', () => {
    const entry = filterChanges('', 'previews')[0]
    expect(filterChanges(entry.commit.slice(0, 10).toUpperCase(), 'previews')).toEqual([entry])
    expect(filterChanges(entry.subject.toUpperCase(), '').map(({ commit }) => commit)).toContain(entry.commit)
    expect(filterChanges('MACHEL MONTANO').some(({ entities }) =>
      entities.some(({ items }) => items.some(({ name }) => name === 'Machel Montano')),
    )).toBe(true)
    expect(filterChanges('genre:soca').length).toBeGreaterThan(0)
    expect(filterChanges('no-such-change-xyz', '')).toEqual([])
  })

  it('only shows the selected asset category within mixed-asset commits', () => {
    const mixed = entries.find(({ entities }) => entities.some(({ category }) => category === 'artwork') && entities.length > 1)!
    const artwork = entitiesFor(mixed, 'artwork')
    expect(artwork).toHaveLength(1)
    expect(artwork[0].category).toBe('artwork')
    expect(artwork[0].items.some(({ name }) => name === 'Saxophone')).toBe(true)
    expect(entitiesFor(mixed, 'assets')).toEqual(mixed.entities)
  })

  it('unpacks the generated added, updated and removed status of every entity', () => {
    const full = JSON.parse(readFileSync(new URL('../../docs/changelog.json', import.meta.url), 'utf8')) as {
      entries: { commit: string; entities: { category: string; items: { id: string; status: string }[] }[] }[]
    }
    expect(statuses).toEqual(changeStatuses)
    const statusesOf = (list: typeof full.entries) => list.map(({ commit, entities }) => [commit, entities.map(({ category, items }) =>
      [category, items.map(({ id, status }) => `${id}=${status}`).sort()])])
    expect(statusesOf(entries)).toEqual(statusesOf(full.entries))
    const shown = new Set(entries.flatMap(({ entities }) => entities.flatMap(({ items }) => items.map(({ status }) => status))))
    expect([...shown].sort()).toEqual([...statuses].sort())
  })

  it('labels entity statuses without relying on color and keeps graph counts in commit details', () => {
    const entry = paginateChanges('', 'assets', 1).items.find(({ graph }) => graph)!
    const c = changelogCopy.fr
    const html = renderToStaticMarkup(<Changelog locale="fr" />)
    const start = html.indexOf(`id="commit-${entry.commit}"`)
    const card = html.slice(start, html.indexOf('</ol>', start)).split('id="commit-')[1]
    const details = card.indexOf(`<summary class="cursor-pointer font-semibold">${c.technical}</summary>`)
    expect(details).toBeGreaterThan(0)
    expect(card.indexOf(c.changes)).toBeGreaterThan(details)
    expect(card.indexOf(c.nodes)).toBeGreaterThan(details)
    for (const status of statuses) {
      if (entry.entities.some(({ items }) => items.some((item) => item.status === status))) {
        expect(card).toContain(`data-status="${status}"`)
        expect(card).toContain(`<span lang="fr" class="sr-only"> (${c.statuses[status]})</span>`)
      }
    }
  })
  it('paginates without gaps or duplicates and clamps filtered page bounds', () => {
    const assets = filterChanges('')
    const pages = Array.from({ length: assetPageCount }, (_, index) => paginateChanges('', 'assets', index + 1))
    expect(pages.flatMap(({ items }) => items.map(({ commit }) => commit))).toEqual(assets.map(({ commit }) => commit))
    expect(pages.slice(0, -1).every(({ items }) => items.length === pageSize)).toBe(true)
    expect(pages.at(-1)?.items.length).toBeLessThanOrEqual(pageSize)
    expect(paginateChanges('', 'assets', 999).page).toBe(assetPageCount)
    expect(paginateChanges('', 'assets', 0).page).toBe(1)
    expect(paginateChanges('no-such-change-xyz', 'assets', 10)).toMatchObject({ items: [], total: 0, page: 1, pages: 1 })
  })

  it.each(locales)('prerenders every asset update once across static %s pages, without JavaScript', (locale) => {
    const shown: string[] = []
    for (let number = 1; number <= assetPageCount; number++) {
      const html = renderToStaticMarkup(<Changelog locale={locale} initialPage={number} />)
      const expected = paginateChanges('', 'assets', number).items
      expect(html.match(/id="commit-/g)).toHaveLength(expected.length)
      for (const entry of expected) {
        expect(html).toContain(`href="${repository}/commit/${entry.commit}"`)
        shown.push(entry.commit)
        for (const { items } of entry.entities) {
          for (const { name } of items) expect(html).toContain(renderToStaticMarkup(<>{name}</>))
        }
      }
      expect(html).toContain('download="soundlines-changelog.json"')
      expect(html).toContain('role="status"')
      expect(html).toContain(`aria-label="${changelogCopy[locale].pagination}"`)
      const path = routePath({ locale, slug: 'changelog', page: number })
      expect(html).toContain(`href="${import.meta.env.BASE_URL}${path}"`)
    }
    expect(shown).toEqual(filterChanges('').map(({ commit }) => commit))
  })

  it('provides canonical URLs and preserves page numbers through language switching', () => {
    const route = { locale: 'en', slug: 'changelog', page: 2 } as const
    expect(matchRoute('/soundlines/en/changelog/page/2/', '/soundlines/')).toEqual(route)
    expect(routes).toContainEqual(route)
    const html = renderToStaticMarkup(<App {...route} />)
    const head = renderToStaticMarkup(<Head {...route} />)
    for (const locale of locales) {
      expect(html).toContain(`value="${import.meta.env.BASE_URL}${locale}/changelog/page/2/"`)
      expect(head).toContain(`${locale}/changelog/page/2/`)
    }
    expect(head).toContain(`<title>${copy.en.openDataTitle} · 2 · Soundlines</title>`)
  })

  it.each(locales)('links to Open Data from the %s overview and navigation', (locale) => {
    const html = renderToStaticMarkup(<App locale={locale} slug="index" />)
    expect(html).toContain(`href="${new URL(`${locale}/data`, APP_URL).href}"`)
    expect(html).toContain(copy[locale].openDataTitle)
    expect(html).not.toContain(`href="${import.meta.env.BASE_URL}${locale}/changelog/"`)
  })
})
