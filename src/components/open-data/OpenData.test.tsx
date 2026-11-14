import { describe, expect, it, vi } from 'vitest'
import App from '../../App.tsx'
import { ExplorerContext } from '../../ExplorerContext.ts'
import { buildIndex } from '../../graph/graph.ts'
import { createTimelineModel } from '../../graph/timeline.ts'
import type { MusicGraph } from '../../graph/types.ts'
import { catalogueFor } from '../../i18n/catalogue.ts'
import { LOCALES, type Locale } from '../../i18n/routing.ts'
import { renderWithIntl } from '../../i18n/test-utils.tsx'
import { OPEN_DATA_SECTIONS } from '../../openData.ts'
import { REPOSITORY_URL } from '../../projectLinks.ts'
import { OpenDataGraph } from './OpenDataGraph.tsx'
import { OpenDataDataset } from './OpenDataDataset.tsx'
import { OpenDataNavigation } from './OpenDataNavigation.tsx'
import { OpenDataChangelog } from './OpenDataChangelog.tsx'
import { DiscoveryFooter, DiscoveryHeader } from '../navigation/DiscoveryChrome.tsx'
import { ContributionPage } from './ContributionPage.tsx'
import { OpenDataQuery } from './OpenDataQuery.tsx'
import { createTranslator } from 'next-intl'
import type { ReactNode } from 'react'

const route = vi.hoisted(() => ({ pathname: '/en/data/dataset' }))
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }))
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace }: { locale: Locale; namespace: 'openData.graph' | 'openData.contribute' | 'openData.query' | 'feedback' }) =>
    createTranslator({ locale, messages: catalogueFor(locale), namespace }),
}))

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
  it('uses the same title and subtitle styling across all sections', async () => {
    const sections = [
      render(<OpenDataDataset />),
      render(await OpenDataGraph({ locale: 'en' })),
      render(await OpenDataQuery({ locale: 'en' })),
      render(<OpenDataChangelog locale="en" />),
      render(await ContributionPage({ locale: 'en' })),
    ]
    for (const html of sections) {
      expect(html.match(/<h2[^>]*class="([^"]*)"/)?.[1]).toBe('text-2xl font-bold tracking-tight')
      expect(html.match(/<p class="([^"]*)"/)?.[1]).toBe('mt-3 max-w-3xl leading-relaxed text-slate-400')
    }
  })

  it.each(LOCALES)('uses source links, not downloads, in the %s dataset dashboard', (locale) => {
    const html = render(<OpenDataDataset />, locale)
    expect(html).toContain(catalogueFor(locale).openData.dataset.github)
    expect(html).toContain(`href="/${locale}/data/graph"`)
    expect(html).not.toContain('dataset-graph-title')
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
    expect(html).toContain('class="soundlines-page-header discovery-header"')
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

  it.each(LOCALES)('renders graph contribution options in %s', async (locale) => {
    const catalogue = catalogueFor(locale)
    const html = render(await ContributionPage({ locale }), locale)
    expect(html).toContain(catalogue.openData.contribute.editTitle)
    expect(html).toContain(catalogue.openData.contribute.addTitle)
    expect(html).toContain(catalogue.feedback.edit)
    expect(html).toContain(catalogue.openData.contribute.findEntry)
    expect(html).toContain(`href="/${locale}"`)
    expect(html).toContain(`${REPOSITORY_URL}/issues/new?template=graph-contribution.yml`)
    expect(html).toContain(`${REPOSITORY_URL}/blob/main/docs/DATA.md#graph-contribution-workflow`)
    expect(html).toContain(catalogue.openData.contribute.githubNote)
  })

  it('keeps the contribution section across footer language links', () => {
    route.pathname = '/fr/data/contribute'
    const html = render(<DiscoveryFooter current="data" />, 'fr')
    for (const locale of LOCALES) {
      expect(html).toContain(`href="/${locale}/data/contribute"`)
    }
    expect(html).toContain('href="/fr/data" aria-current="page"')
  })

  it('links changelog records to GitHub while retaining internal data loading', () => {
    const html = renderWithIntl(<OpenDataChangelog locale="en" />)
    expect(html).toContain(`${REPOSITORY_URL}/blob/main/public/open-data-changelog.json`)
    expect(html).toContain(`${REPOSITORY_URL}/blob/main/docs/changelog/changelog.json`)
    expect(html).not.toContain('download=')
    expect(html).toContain('Loading data changes')
  })
})
