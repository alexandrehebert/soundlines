import { describe, expect, it, vi } from 'vitest'
import App from '../App.tsx'
import { ExplorerContext } from '../ExplorerContext.ts'
import { buildIndex } from '../graph/graph.ts'
import { createTimelineModel } from '../graph/timeline.ts'
import type { MusicGraph } from '../graph/types.ts'
import { catalogueFor } from '../i18n/catalogue.ts'
import { LOCALES, type Locale } from '../i18n/routing.ts'
import { renderWithIntl } from '../i18n/test-utils.tsx'
import { OPEN_DATA_SECTIONS } from '../openData.ts'
import { REPOSITORY_URL } from '../projectLinks.ts'
import { OpenDataDataset } from './OpenDataDataset.tsx'
import { OpenDataNavigation } from './OpenDataNavigation.tsx'
import { OpenDataChangelog } from './OpenDataChangelog.tsx'
import { DiscoveryFooter, DiscoveryHeader } from './DiscoveryChrome.tsx'
import type { ReactNode } from 'react'

const route = vi.hoisted(() => ({ pathname: '/en/data/dataset' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))

const graph: MusicGraph = {
  version: 1,
  nodes: [
    { id: 'genre:jazz', type: 'genre', name: 'Jazz', family: 'jazz', period: { start: 1900 }, sources: ['https://example.org/jazz'] },
    { id: 'artist:miles', type: 'artist', name: 'Miles Davis' },
  ],
  edges: [{ id: 'key:miles-jazz', type: 'key_artist_of', from: 'artist:miles', to: 'genre:jazz', confidence: 'high' }],
}

function render(children: ReactNode, locale: Locale = 'en', isHome = false) {
  const index = buildIndex(graph)
  return renderWithIntl(
    <ExplorerContext.Provider value={{
      index, model: createTimelineModel(index, 'genre'), locale, view: 'genre',
      selectedId: null, selectNode: vi.fn(), changeView: vi.fn(),
      order: 'family', changeOrder: vi.fn(), genreDisplay: 'bars', changeGenreDisplay: vi.fn(), goHome: vi.fn(), isHome,
      historyFilters: { category: 'all', landmarksOnly: false }, changeHistoryFilters: vi.fn(),
      viewRange: [1900, 2000], setViewRange: vi.fn(),
    }}>{children}</ExplorerContext.Provider>,
    locale,
  )
}

describe('Open Data UI', () => {
  it.each(LOCALES)('uses source links, not downloads, in the %s dataset dashboard', (locale) => {
    const html = render(<OpenDataDataset />, locale)
    expect(html).toContain(catalogueFor(locale).openData.dataset.github)
    for (const file of ['graph.json', 'graph.fr.json', 'graph.de.json', 'graph.it.json', 'graph.es.json']) {
      expect(html).toContain(`href="${REPOSITORY_URL}/blob/main/src/data/${file}"`)
    }
    expect(html).not.toContain('download=')
    expect(html).not.toContain('raw.githubusercontent.com')
    expect(html).toContain('role="img"')
    expect(html).toContain('var(--chart-')
    expect(html).toContain('example.org')
    expect(html).toContain(catalogueFor(locale).stats.confidenceLabels.high)
    expect(html).not.toContain('query_graph')
  })

  it.each(OPEN_DATA_SECTIONS)('selects only the %s navigation link and hides both explorer shells', (section) => {
    route.pathname = `/fr/data/${section}`
    const html = render(<OpenDataNavigation locale="fr" />, 'fr')
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    expect(html.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0]).toContain(`href="/fr/data/${section}"`)
    expect(html).not.toContain('href="#')
    expect(render(<App />, 'fr', false)).toBe('')
    expect(render(<App />, 'fr', true)).toBe('')
  })

  it('shares the home header and footer, keeping the current data page across languages', () => {
    route.pathname = '/fr/data/query'
    const html = render(<><DiscoveryHeader current="data" /><DiscoveryFooter current="data" /></>, 'fr')
    expect(html).toContain('class="discovery-header"')
    expect(html).toContain('class="discovery-footer"')
    expect(html).toContain('data-soundlines-brand')
    expect(html.match(/<a[^>]*aria-current="page"[^>]*>/g)).toEqual([
      expect.stringContaining('href="/fr/data/query"'),
      expect.stringContaining('href="/fr/data"'),
    ])
    for (const locale of LOCALES) {
      expect(html).toContain(`href="/${locale}/data/query"`)
    }
  })

  it('links changelog records to GitHub while retaining internal data loading', () => {
    const html = renderWithIntl(<OpenDataChangelog locale="en" />)
    expect(html).toContain(`${REPOSITORY_URL}/blob/main/public/open-data-changelog.json`)
    expect(html).toContain(`${REPOSITORY_URL}/blob/main/docs/changelog.json`)
    expect(html).not.toContain('download=')
    expect(html).toContain('Loading data changes')
  })
})
